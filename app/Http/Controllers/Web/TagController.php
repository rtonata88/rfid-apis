<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\RfidTag;
use App\Models\TagTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TagController extends Controller
{
    public function index(Request $request)
    {
        \Log::info('TagController@index called', ['user' => $request->user()->id]);

        $query = RfidTag::with(['attendee.user', 'transactions']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('tag_uid', 'like', "%{$search}%")
                  ->orWhere('short_code', 'like', "%{$search}%")
                  ->orWhere('embedded_number', 'like', "%{$search}%")
                  ->orWhereHas('attendee', function($attendeeQuery) use ($search) {
                      $attendeeQuery->where('attendee_name', 'like', "%{$search}%")
                                   ->orWhere('attendee_email', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Issued filter
        if ($request->has('issued') && $request->issued !== '') {
            $query->where('is_issued', $request->issued);
        }

        $tags = $query->orderBy('created_at', 'desc')
                     ->paginate($request->get('per_page', 15))
                     ->withQueryString();

        return Inertia::render('Tags/Index', [
            'tags' => $tags,
            'filters' => $request->only(['search', 'status', 'issued']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Tags/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'tag_uid' => 'nullable|string|unique:rfid_tags,tag_uid',
            'short_code' => 'required|string|unique:rfid_tags,short_code|max:255',
            'embedded_number' => 'nullable|string|max:255',
            'initial_balance' => 'nullable|numeric|min:0',
            'status' => 'in:active,inactive,blocked',
        ]);

        DB::beginTransaction();
        try {
            $tag = RfidTag::create([
                'tag_uid' => $request->tag_uid,
                'short_code' => $request->short_code,
                'embedded_number' => $request->embedded_number,
                'is_issued' => false,
                'balance' => $request->initial_balance ?? 0,
                'status' => $request->status ?? 'active',
                'created_by' => $request->user()->id,
            ]);

            // Create initial balance transaction if there's an initial balance
            if ($request->initial_balance > 0) {
                TagTransaction::create([
                    'rfid_tag_id' => $tag->id,
                    'user_id' => $request->user()->id,
                    'type' => 'load',
                    'amount' => $request->initial_balance,
                    'balance_before' => 0,
                    'balance_after' => $request->initial_balance,
                    'description' => 'Initial balance load',
                ]);
            }

            DB::commit();

            return redirect()->route('tags.index')->with('success', 'RFID tag created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create tag: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $tag = RfidTag::with(['attendee.user', 'transactions.user', 'transactions.vendor', 'transactions.product'])
                     ->findOrFail($id);

        // Get transaction summary
        $transactionSummary = [
            'total_loaded' => $tag->transactions()->where('type', 'load')->sum('amount'),
            'total_spent' => $tag->transactions()->where('type', 'spend')->sum('amount'),
            'total_refunded' => $tag->transactions()->where('type', 'refund')->sum('amount'),
            'transaction_count' => $tag->transactions()->count(),
        ];

        return Inertia::render('Tags/Show', [
            'tag' => $tag,
            'transactionSummary' => $transactionSummary,
        ]);
    }

    public function edit($id)
    {
        $tag = RfidTag::with(['attendee.user'])->findOrFail($id);

        return Inertia::render('Tags/Edit', [
            'tag' => $tag,
        ]);
    }

    public function update(Request $request, $id)
    {
        $tag = RfidTag::findOrFail($id);

        $request->validate([
            'tag_uid' => 'nullable|string|unique:rfid_tags,tag_uid,' . $tag->id,
            'short_code' => 'required|string|unique:rfid_tags,short_code,' . $tag->id . '|max:255',
            'embedded_number' => 'nullable|string|max:255',
            'status' => 'in:active,inactive,blocked',
        ]);

        $tag->update([
            'tag_uid' => $request->tag_uid,
            'short_code' => $request->short_code,
            'embedded_number' => $request->embedded_number,
            'status' => $request->status,
        ]);

        return redirect()->route('tags.index')->with('success', 'RFID tag updated successfully!');
    }

    public function destroy($id)
    {
        $tag = RfidTag::findOrFail($id);

        // Check if tag has transactions
        if ($tag->transactions()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete tag with existing transactions.']);
        }

        // Check if tag is linked to an attendee
        if ($tag->attendee) {
            return back()->withErrors(['error' => 'Cannot delete tag that is linked to an attendee.']);
        }

        $tag->delete();

        return redirect()->route('tags.index')->with('success', 'RFID tag deleted successfully!');
    }

    public function loadMoney(Request $request, $id)
    {
        $tag = RfidTag::findOrFail($id);

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $balanceBefore = $tag->balance;
            $amount = $request->amount;
            $balanceAfter = $balanceBefore + $amount;

            // Update tag balance
            $tag->update(['balance' => $balanceAfter]);

            // Create transaction record
            TagTransaction::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => $request->user()->id,
                'type' => 'load',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => $request->description ?? 'Manual balance load',
            ]);

            DB::commit();

            return back()->with('success', 'Money loaded successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to load money: ' . $e->getMessage()]);
        }
    }
}