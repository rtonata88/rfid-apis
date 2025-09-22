<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\TagTransaction;
use App\Models\RfidTag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class RefundController extends Controller
{
    public function index(Request $request)
    {
        // Only super admins and event admins can access refund management
        if (!$request->user()->isSuperAdmin() && !$request->user()->isEventAdmin()) {
            abort(403, 'Unauthorized access to refund management');
        }

        // Get refund requests
        $query = TagTransaction::with(['rfidTag.attendee', 'user'])
            ->where('type', 'refund')
            ->where('payment_method', 'Refund');

        // Filter by approval status
        if ($request->has('status') && $request->status) {
            $query->where('approval_status', $request->status);
        } else {
            // Default to pending if no status filter is provided
            $query->where('approval_status', 'pending');
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%") // Search by transaction ID
                  ->orWhere('amount', 'like', "%{$search}%") // Search by amount
                  ->orWhereHas('rfidTag', function($tagQuery) use ($search) {
                      $tagQuery->where('short_code', 'like', "%{$search}%")
                               ->orWhere('tag_uid', 'like', "%{$search}%") // Search by tag UID
                               ->orWhereHas('attendee', function($attendeeQuery) use ($search) {
                                   $attendeeQuery->where('attendee_name', 'like', "%{$search}%")
                                                ->orWhere('attendee_email', 'like', "%{$search}%");
                               });
                  });
            });
        }

        // Date range filters
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $refundRequests = $query->orderBy('created_at', 'desc')
                               ->paginate($request->get('per_page', 20))
                               ->withQueryString();

        // Get summary statistics
        $summary = [
            'pending_count' => TagTransaction::where('type', 'refund')
                ->where('payment_method', 'Refund')
                ->where('approval_status', 'pending')
                ->count(),
            'pending_amount' => TagTransaction::where('type', 'refund')
                ->where('payment_method', 'Refund')
                ->where('approval_status', 'pending')
                ->sum('amount'),
            'approved_today' => TagTransaction::where('type', 'refund')
                ->where('payment_method', 'Refund')
                ->where('approval_status', 'approved')
                ->whereDate('updated_at', today())
                ->count(),
            'rejected_today' => TagTransaction::where('type', 'refund')
                ->where('payment_method', 'Refund')
                ->where('approval_status', 'rejected')
                ->whereDate('updated_at', today())
                ->count(),
        ];

        return Inertia::render('Refunds/Index', [
            'refundRequests' => $refundRequests,
            'summary' => $summary,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }

    public function approve(Request $request, $id)
    {
        // Only super admins and event admins can approve refunds
        if (!$request->user()->isSuperAdmin() && !$request->user()->isEventAdmin()) {
            abort(403, 'Unauthorized to approve refunds');
        }

        $request->validate([
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $transaction = TagTransaction::with(['rfidTag.attendee'])->findOrFail($id);

        // Verify it's a pending refund request
        if ($transaction->type !== 'refund' || $transaction->payment_method !== 'Refund' || $transaction->approval_status !== 'pending') {
            return back()->withErrors(['error' => 'This is not a pending refund request.']);
        }

        DB::beginTransaction();
        try {
            $tag = $transaction->rfidTag;
            
            // Check if tag still has sufficient balance
            if ($tag->balance < $transaction->amount) {
                return back()->withErrors(['error' => 'Insufficient balance on tag to process refund.']);
            }

            // Deduct the amount from the tag balance
            $tag->deductBalance($transaction->amount);
            $tag->refresh();

            // Update the transaction
            $metadata['approved_by'] = $request->user()->id;
            $metadata['approved_at'] = now()->toISOString();
            $metadata['admin_notes'] = $request->admin_notes;

            $transaction->update([
                'balance_after' => $tag->balance,
                'approval_status' => 'approved',
                'metadata' => $metadata,
                'description' => 'Refund approved and processed',
            ]);

            DB::commit();

            Log::info('Refund approved', [
                'transaction_id' => $transaction->id,
                'tag_id' => $tag->id,
                'amount' => $transaction->amount,
                'approved_by' => $request->user()->id,
                'admin_notes' => $request->admin_notes,
            ]);

            return back()->with('success', 'Refund approved and processed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Refund approval failed: ' . $e->getMessage(), [
                'transaction_id' => $id,
                'admin_id' => $request->user()->id,
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['error' => 'Failed to approve refund. Please try again.']);
        }
    }

    public function reject(Request $request, $id)
    {
        // Only super admins and event admins can reject refunds
        if (!$request->user()->isSuperAdmin() && !$request->user()->isEventAdmin()) {
            abort(403, 'Unauthorized to reject refunds');
        }

        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $transaction = TagTransaction::findOrFail($id);

        // Verify it's a pending refund request
        if ($transaction->type !== 'refund' || $transaction->payment_method !== 'Refund' || $transaction->approval_status !== 'pending') {
            return back()->withErrors(['error' => 'This is not a pending refund request.']);
        }

        DB::beginTransaction();
        try {
            // Update the transaction metadata
            $metadata['rejected_by'] = $request->user()->id;
            $metadata['rejected_at'] = now()->toISOString();
            $metadata['rejection_reason'] = $request->rejection_reason;

            $transaction->update([
                'approval_status' => 'rejected',
                'metadata' => $metadata,
                'description' => 'Refund request rejected',
            ]);

            DB::commit();

            Log::info('Refund rejected', [
                'transaction_id' => $transaction->id,
                'rejected_by' => $request->user()->id,
                'rejection_reason' => $request->rejection_reason,
            ]);

            return back()->with('success', 'Refund request rejected.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Refund rejection failed: ' . $e->getMessage(), [
                'transaction_id' => $id,
                'admin_id' => $request->user()->id,
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['error' => 'Failed to reject refund. Please try again.']);
        }
    }

    public function show(Request $request, $id)
    {
        // Only super admins and event admins can view refund details
        if (!$request->user()->isSuperAdmin() && !$request->user()->isEventAdmin()) {
            abort(403, 'Unauthorized to view refund details');
        }

        $transaction = TagTransaction::with(['rfidTag.attendee', 'user'])->findOrFail($id);

        // Get related transactions for this tag
        $relatedTransactions = TagTransaction::with(['vendor', 'product'])
                                           ->where('rfid_tag_id', $transaction->rfid_tag_id)
                                           ->where('id', '!=', $transaction->id)
                                           ->orderBy('created_at', 'desc')
                                           ->limit(10)
                                           ->get();

        return Inertia::render('Refunds/Show', [
            'transaction' => $transaction,
            'relatedTransactions' => $relatedTransactions,
        ]);
    }
}
