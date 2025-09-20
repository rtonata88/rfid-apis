<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RfidTag;
use App\Models\TagTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TagTransactionController extends Controller
{
    public function loadMoney(Request $request)
    {
        $request->validate([
            'tag_uid' => 'nullable|string',
            'short_code' => 'nullable|string',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:100',
        ]);

        if (!$request->tag_uid && !$request->short_code) {
            return response()->json(['error' => 'Either tag_uid or short_code is required'], 422);
        }

        $query = RfidTag::query();
        if ($request->tag_uid) {
            $query->where('tag_uid', $request->tag_uid);
        } else {
            $query->where('short_code', $request->short_code);
        }

        $tag = $query->firstOrFail();

        if (!$tag->isActive()) {
            return response()->json(['error' => 'Tag is not active'], 422);
        }

        DB::beginTransaction();
        try {
            $balanceBefore = $tag->balance;
            $tag->addBalance($request->amount);
            $tag->refresh();

            $transaction = TagTransaction::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => $request->user()->id,
                'type' => 'load',
                'amount' => $request->amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $tag->balance,
                'description' => $request->description ?? 'Money loaded',
                'reference' => $request->reference,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Money loaded successfully',
                'tag' => $tag,
                'transaction' => $transaction,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to load money'], 500);
        }
    }

    public function spendMoney(Request $request)
    {
        $request->validate([
            'tag_uid' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $tag = RfidTag::where('tag_uid', $value)
                        ->orWhere('embedded_number', $value)
                        ->orWhere('short_code', $value)
                        ->first();
                    
                    if (!$tag) {
                        $fail('The selected tag identifier does not exist.');
                    }
                }
            ],
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:100',
        ]);

        $tag = RfidTag::where('tag_uid', $request->tag_uid)
        ->orWhere('embedded_number', $request->tag_uid)
        ->orWhere('short_code', $request->tag_uid)
            ->firstOrFail();

        if (!$tag->isActive()) {
            return response()->json(['error' => 'Tag is not active'], 422);
        }

        if ($tag->balance < $request->amount) {
            return response()->json(['error' => 'Insufficient balance'], 422);
        }

        DB::beginTransaction();
        try {
            $balanceBefore = $tag->balance;
            $tag->deductBalance($request->amount);
            $tag->refresh();

            $transaction = TagTransaction::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => $request->user()->id,
                'type' => 'spend',
                'amount' => $request->amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $tag->balance,
                'description' => $request->description ?? 'Money spent',
                'reference' => $request->reference,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Money spent successfully',
                'tag' => $tag,
                'transaction' => $transaction,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to process transaction'], 500);
        }
    }

    public function getBalance($tagUid)
    {
        $tag = RfidTag::where('tag_uid', $tagUid)->firstOrFail();

        return response()->json([
            'tag_uid' => $tag->tag_uid,
            'balance' => $tag->balance,
            'status' => $tag->status,
        ]);
    }

    public function getTransactions(Request $request, $tagUid)
    {
        $tag = RfidTag::where('tag_uid', $tagUid)->firstOrFail();

        $query = $tag->transactions()->with('user')->orderBy('created_at', 'desc');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->paginate($request->get('per_page', 15));

        return response()->json($transactions);
    }

    public function refund(Request $request)
    {
        $request->validate([
            'tag_uid' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $tag = RfidTag::where('tag_uid', $value)
                        ->orWhere('embedded_number', $value)
                        ->orWhere('short_code', $value)
                        ->first();
                    
                    if (!$tag) {
                        $fail('The selected tag identifier does not exist.');
                    }
                }
            ],
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:100',
        ]);

        $tag = RfidTag::where('tag_uid', $request->tag_uid)
            ->orWhere('embedded_number', $request->tag_uid)
            ->orWhere('short_code', $request->tag_uid)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            $balanceBefore = $tag->balance;
            $tag->addBalance($request->amount);
            $tag->refresh();

            $transaction = TagTransaction::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => $request->user()->id,
                'type' => 'refund',
                'amount' => $request->amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $tag->balance,
                'description' => $request->description ?? 'Refund processed',
                'reference' => $request->reference,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Refund processed successfully',
                'tag' => $tag,
                'transaction' => $transaction,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to process refund'], 500);
        }
    }
}
