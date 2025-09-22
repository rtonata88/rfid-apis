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
            'payment_method' => 'required|in:Cash,Card,Tag',
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
                'payment_method' => $request->payment_method,
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
            'vendor_id' => 'required|exists:vendors,id',
            'vendor_terminal_id' => 'nullable|exists:vendor_terminals,id',
            'product_id' => 'nullable|exists:products,id',
            'quantity' => 'nullable|integer|min:1',
            'payment_method' => 'nullable|in:Cash,Card,Tag',
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
            // If product_id is provided, check and decrement stock
            if ($request->product_id) {
                $product = \App\Models\Product::findOrFail($request->product_id);
                
                if (!$product->isAvailable()) {
                    return response()->json(['error' => 'Product is not available'], 422);
                }
                
                $quantity = $request->quantity ?? 1;
                
                // Check if we have enough stock
                if (!$product->decrementStock($quantity)) {
                    return response()->json(['error' => 'Insufficient stock'], 422);
                }
            }

            $balanceBefore = $tag->balance;
            $tag->deductBalance($request->amount);
            $tag->refresh();

            $transaction = TagTransaction::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => $request->user()->id,
                'vendor_id' => $request->vendor_id,
                'vendor_terminal_id' => $request->vendor_terminal_id,
                'product_id' => $request->product_id,
                'type' => 'spend',
                'payment_method' => $request->payment_method,
                'amount' => $request->amount,
                'quantity' => $request->quantity ?? 1,
                'balance_before' => $balanceBefore,
                'balance_after' => $tag->balance,
                'description' => $request->description ?? 'Money spent',
                'reference' => $request->reference,
            ]);

            DB::commit();

            $response = [
                'message' => 'Money spent successfully',
                'tag' => $tag,
                'transaction' => $transaction->load(['product', 'vendor', 'vendorTerminal']),
            ];
            
            // Include remaining stock if product was involved
            if ($request->product_id) {
                $response['remaining_stock'] = $product->fresh()->stock_quantity;
            }
            
            return response()->json($response);
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
            'vendor_id' => 'nullable|exists:vendors,id',
            'vendor_terminal_id' => 'nullable|exists:vendor_terminals,id',
            'product_id' => 'nullable|exists:products,id',
            'payment_method' => 'nullable|in:Cash,Card,Tag',
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
                'vendor_id' => $request->vendor_id,
                'vendor_terminal_id' => $request->vendor_terminal_id,
                'product_id' => $request->product_id,
                'type' => 'refund',
                'payment_method' => $request->payment_method,
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

    /**
     * Get current cash-up amount (since last cash-up or start of shift)
     */
    public function getCurrentCashUp(Request $request)
    {
        $staffUserId = $request->user()->id;
        
        // Find the last cash-up handover for this user today
        $lastHandover = TagTransaction::where('user_id', $staffUserId)
            ->where('type', 'adjustment')
            ->where('payment_method', 'Cash')
            ->where('description', 'like', 'Cash handover to%')
            ->whereDate('created_at', today())
            ->orderBy('created_at', 'desc')
            ->first();

        // Set start time: either after last handover or start of day
        $startTime = $lastHandover 
            ? $lastHandover->created_at 
            : now()->startOfDay();

        // Get cash load transactions since last handover
        $cashTransactions = TagTransaction::where('user_id', $staffUserId)
            ->where('type', 'load')
            ->where('payment_method', 'Cash')
            ->where('created_at', '>', $startTime)
            ->with(['rfidTag'])
            ->orderBy('created_at', 'desc')
            ->get();

        $totalCashAmount = $cashTransactions->sum('amount');

        return response()->json([
            'staff_user_id' => $staffUserId,
            'staff_name' => $request->user()->name,
            'current_cash_up' => [
                'total_cash_amount' => $totalCashAmount,
                'transaction_count' => $cashTransactions->count(),
                'period_start' => $startTime->format('Y-m-d H:i:s'),
                'period_end' => now()->format('Y-m-d H:i:s'),
                'ready_for_handover' => $totalCashAmount > 0,
            ],
            'last_handover' => $lastHandover ? [
                'id' => $lastHandover->id,
                'reference' => $lastHandover->reference,
                'handed_over_at' => $lastHandover->created_at,
                'amount' => $lastHandover->amount,
            ] : null,
            'transactions' => $cashTransactions,
        ]);
    }

    /**
     * Record a cash-up handover (can happen multiple times per shift)
     */
    public function recordCashUp(Request $request)
    {
        $request->validate([
            'physical_cash_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $staffUserId = $request->user()->id;

        // Get current cash amount that should be handed over
        $currentCashUpResponse = $this->getCurrentCashUp($request);
        $currentCashUpData = $currentCashUpResponse->getData(true);
        
        $expectedAmount = $currentCashUpData['current_cash_up']['total_cash_amount'];
        $variance = $request->physical_cash_amount - $expectedAmount;

        // Prevent handover if no cash to hand over
        if ($expectedAmount <= 0) {
            return response()->json([
                'error' => 'No cash transactions to hand over since last cash-up'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Create handover record
            $handoverTransaction = TagTransaction::create([
                'rfid_tag_id' => null,
                'user_id' => $staffUserId,
                'type' => 'adjustment',
                'payment_method' => 'Cash',
                'amount' => $request->physical_cash_amount,
                'balance_before' => $expectedAmount,
                'balance_after' => $request->physical_cash_amount,
                'description' => "Cash handover to {$request->manager_name}",
                'reference' => 'CASHUP-' . now()->format('YmdHis'),
                'metadata' => json_encode([
                    'handover_type' => 'cash_up',
                    'expected_amount' => $expectedAmount,
                    'physical_amount' => $request->physical_cash_amount,
                    'variance' => $variance,
                    'period_start' => $currentCashUpData['current_cash_up']['period_start'],
                    'period_end' => now()->toISOString(),
                    'transaction_count' => $currentCashUpData['current_cash_up']['transaction_count'],
                    'notes' => $request->notes,
                    'handover_timestamp' => now()->toISOString(),
                ]),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Cash-up recorded successfully',
                'handover_id' => $handoverTransaction->id,
                'reference' => $handoverTransaction->reference,
                'summary' => [
                    'staff_name' => $request->user()->name,
                    'manager_name' => $request->manager_name,
                    'expected_amount' => $expectedAmount,
                    'physical_amount' => $request->physical_cash_amount,
                    'variance' => $variance,
                    'variance_percentage' => $expectedAmount > 0 
                        ? round(($variance / $expectedAmount) * 100, 2) 
                        : 0,
                    'status' => abs($variance) <= 5.00 ? 'acceptable' : 'requires_review',
                    'transaction_count' => $currentCashUpData['current_cash_up']['transaction_count'],
                ],
                'next_cash_up_starts_now' => true,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to record cash-up: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get today's cash-up history (all handovers today)
     */
    public function getTodaysCashUps(Request $request)
    {
        $staffUserId = $request->user()->id;

        // Get all cash-up handovers for today
        $handovers = TagTransaction::where('user_id', $staffUserId)
            ->where('type', 'adjustment')
            ->where('payment_method', 'Cash')
            ->where('description', 'like', 'Cash handover to%')
            ->whereDate('created_at', today())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($transaction) {
                $metadata = json_decode($transaction->metadata, true) ?? [];
                return [
                    'id' => $transaction->id,
                    'reference' => $transaction->reference,
                    'handover_time' => $transaction->created_at->format('H:i'),
                    'manager_name' => $metadata['manager_name'] ?? 'Unknown',
                    'expected_amount' => $metadata['expected_amount'] ?? $transaction->balance_before,
                    'physical_amount' => $metadata['physical_amount'] ?? $transaction->amount,
                    'variance' => $metadata['variance'] ?? 0,
                    'transaction_count' => $metadata['transaction_count'] ?? 0,
                    'notes' => $metadata['notes'] ?? '',
                    'status' => abs($metadata['variance'] ?? 0) <= 5.00 ? 'acceptable' : 'requires_review',
                ];
            });

        return response()->json([
            'staff_user_id' => $staffUserId,
            'staff_name' => $request->user()->name,
            'date' => today()->format('Y-m-d'),
            'total_handovers_today' => $handovers->count(),
            'total_cash_handed_over_today' => $handovers->sum('physical_amount'),
            'handovers' => $handovers,
        ]);
    }
}
