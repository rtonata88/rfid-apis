<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\TagTransaction;
use App\Models\RfidTag;
use App\Models\Vendor;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = TagTransaction::with(['rfidTag.attendee', 'user', 'vendor', 'product']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhereHas('rfidTag', function($tagQuery) use ($search) {
                      $tagQuery->where('short_code', 'like', "%{$search}%")
                               ->orWhere('tag_uid', 'like', "%{$search}%")
                               ->orWhereHas('attendee', function($attendeeQuery) use ($search) {
                                   $attendeeQuery->where('attendee_name', 'like', "%{$search}%")
                                                ->orWhere('attendee_email', 'like', "%{$search}%");
                               });
                  })
                  ->orWhereHas('vendor', function($vendorQuery) use ($search) {
                      $vendorQuery->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('product', function($productQuery) use ($search) {
                      $productQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Type filter
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        // Date range filters
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // If user is a vendor, only show their transactions
        if ($request->user()->isVendor()) {
            $vendor = $request->user()->vendor;
            if ($vendor) {
                $query->where('vendor_id', $vendor->id);
            }
        }

        $transactions = $query->orderBy('created_at', 'desc')
                             ->paginate($request->get('per_page', 20))
                             ->withQueryString();

        // Get summary statistics for the filtered results
        $summaryQuery = TagTransaction::query();
        
        // Apply the same filters for summary
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $summaryQuery->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhereHas('rfidTag', function($tagQuery) use ($search) {
                      $tagQuery->where('short_code', 'like', "%{$search}%")
                               ->orWhere('tag_uid', 'like', "%{$search}%")
                               ->orWhereHas('attendee', function($attendeeQuery) use ($search) {
                                   $attendeeQuery->where('attendee_name', 'like', "%{$search}%")
                                                ->orWhere('attendee_email', 'like', "%{$search}%");
                               });
                  })
                  ->orWhereHas('vendor', function($vendorQuery) use ($search) {
                      $vendorQuery->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('product', function($productQuery) use ($search) {
                      $productQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('type') && $request->type) {
            $summaryQuery->where('type', $request->type);
        }

        if ($request->has('date_from') && $request->date_from) {
            $summaryQuery->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $summaryQuery->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->user()->isVendor()) {
            $vendor = $request->user()->vendor;
            if ($vendor) {
                $summaryQuery->where('vendor_id', $vendor->id);
            }
        }

        // Calculate summary statistics
        $summary = [
            'total_loaded' => $summaryQuery->where('type', 'load')->sum('amount'),
            'total_spent' => $summaryQuery->where('type', 'spend')->sum('amount'),
            'total_refunded' => $summaryQuery->where('type', 'refund')->sum('amount'),
            'load_count' => $summaryQuery->where('type', 'load')->count(),
            'spend_count' => $summaryQuery->where('type', 'spend')->count(),
            'refund_count' => $summaryQuery->where('type', 'refund')->count(),
            'total_transactions' => $summaryQuery->count(),
        ];

        // Add summary to transactions data
        $transactions->summary = $summary;

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['search', 'type', 'date_from', 'date_to']),
        ]);
    }

    public function show(Request $request, $id)
    {
        $transaction = TagTransaction::with([
            'rfidTag.attendee', 
            'user', 
            'vendor', 
            'product'
        ])->findOrFail($id);

        // Check access permissions
        if ($request->user()->isVendor()) {
            $vendor = $request->user()->vendor;
            if (!$vendor || $transaction->vendor_id !== $vendor->id) {
                abort(403, 'Unauthorized to view this transaction');
            }
        }

        // Get related transactions for this tag
        $relatedTransactions = TagTransaction::with(['vendor', 'product'])
                                           ->where('rfid_tag_id', $transaction->rfid_tag_id)
                                           ->where('id', '!=', $transaction->id)
                                           ->orderBy('created_at', 'desc')
                                           ->limit(10)
                                           ->get();

        return Inertia::render('Transactions/Show', [
            'transaction' => $transaction,
            'relatedTransactions' => $relatedTransactions,
        ]);
    }

    public function create()
    {
        // Get active tags for selection
        $tags = RfidTag::where('status', 'active')
                      ->with('attendee')
                      ->orderBy('short_code')
                      ->get()
                      ->map(function($tag) {
                          return [
                              'id' => $tag->id,
                              'short_code' => $tag->short_code,
                              'tag_uid' => $tag->tag_uid,
                              'balance' => $tag->balance,
                              'attendee_name' => $tag->attendee->attendee_name ?? 'Unlinked',
                          ];
                      });

        // Get vendors for selection (if admin)
        $vendors = [];
        if (auth()->user()->isEventAdmin() || auth()->user()->isSuperAdmin()) {
            $vendors = Vendor::where('status', 'active')
                           ->orderBy('name')
                           ->get(['id', 'name']);
        }

        return Inertia::render('Transactions/Create', [
            'tags' => $tags,
            'vendors' => $vendors,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'rfid_tag_id' => 'required|exists:rfid_tags,id',
            'type' => 'required|in:load,spend,refund',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:100',
            'vendor_id' => 'nullable|exists:vendors,id',
            'product_id' => 'nullable|exists:products,id',
        ]);

        $tag = RfidTag::findOrFail($request->rfid_tag_id);

        if (!$tag->isActive()) {
            return back()->withErrors(['rfid_tag_id' => 'Tag is not active']);
        }

        if ($request->type === 'spend' && $tag->balance < $request->amount) {
            return back()->withErrors(['amount' => 'Insufficient balance']);
        }

        DB::beginTransaction();
        try {
            $balanceBefore = $tag->balance;
            
            if ($request->type === 'load' || $request->type === 'refund') {
                $tag->addBalance($request->amount);
            } else {
                $tag->deductBalance($request->amount);
            }
            
            $tag->refresh();

            $transaction = TagTransaction::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => $request->user()->id,
                'type' => $request->type,
                'amount' => $request->amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $tag->balance,
                'description' => $request->description ?? ucfirst($request->type) . ' transaction',
                'reference' => $request->reference,
                'vendor_id' => $request->vendor_id,
                'product_id' => $request->product_id,
            ]);

            DB::commit();

            return redirect()->route('transactions.show', $transaction->id)
                           ->with('success', 'Transaction created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create transaction: ' . $e->getMessage()]);
        }
    }
}
