<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\RfidTag;
use App\Models\TagAttendee;
use App\Models\TagTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendeeController extends Controller
{
    public function linkTag(Request $request)
    {
        $request->validate([
            'tag_identifier' => 'required|string',
        ]);

        if (!$request->user()->isAttendee()) {
            abort(403, 'Only attendees can link RFID tags');
        }

        // Check if user already has a linked tag
        $existingAttendee = $request->user()->tagAttendee;
        if ($existingAttendee) {
            return back()->withErrors(['tag_identifier' => 'You already have a linked RFID tag.']);
        }

        // Find the tag by various identifiers
        $tag = RfidTag::where('tag_uid', $request->tag_identifier)
                      ->orWhere('short_code', $request->tag_identifier)
                      ->orWhere('embedded_number', $request->tag_identifier)
                      ->first();

        if (!$tag) {
            return back()->withErrors(['tag_identifier' => 'RFID tag not found. Please check the identifier and try again.']);
        }

        // Check if tag is already linked to another attendee
        $existingLink = TagAttendee::where('rfid_tag_id', $tag->id)->first();
        if ($existingLink) {
            return back()->withErrors(['tag_identifier' => 'This RFID tag is already linked to another attendee.']);
        }

        // Check if tag is available for linking
        if ($tag->status !== 'active') {
            return back()->withErrors(['tag_identifier' => 'This RFID tag is not available for linking.']);
        }

        DB::beginTransaction();
        try {
            // Create the link
            TagAttendee::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => $request->user()->id,
                'attendee_name' => $request->user()->name,
                'attendee_email' => $request->user()->email,
                'linked_at' => now(),
            ]);

            // Mark tag as issued if not already
            if (!$tag->is_issued) {
                $tag->update([
                    'is_issued' => true,
                    'issued_at' => now(),
                ]);
            }

            DB::commit();

            return back()->with('success', 'RFID tag linked successfully! You can now use it for transactions.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['tag_identifier' => 'Failed to link RFID tag. Please try again.']);
        }
    }

    public function requestRefund(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        if (!$request->user()->isAttendee()) {
            abort(403, 'Only attendees can request refunds');
        }

        $user = $request->user();
        $tag = $user->tagAttendee?->rfidTag;

        if (!$tag) {
            return back()->withErrors(['amount' => 'You need to link an RFID tag before requesting a refund.']);
        }

        if ($tag->balance < $request->amount) {
            return back()->withErrors(['amount' => 'Refund amount cannot exceed your current balance.']);
        }

        DB::beginTransaction();
        try {
            // Create a refund request transaction (pending approval)
            $transaction = TagTransaction::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => null, // Null for attendee-initiated refunds
                'type' => 'refund',
                'payment_method' => 'Refund', // Use the new Refund payment method
                'approval_status' => 'pending', // Pending approval
                'amount' => $request->amount,
                'balance_before' => $tag->balance,
                'balance_after' => $tag->balance, // Will be updated when approved
                'description' => 'Refund request',
                'reference' => 'REFUND-REQ-' . now()->format('YmdHis'),
                'metadata' => json_encode([
                    'refund_request' => true,
                    'requested_by' => $user->id,
                    'requested_at' => now()->toISOString(),
                ]),
            ]);

            DB::commit();

            return back()->with('success', 'Refund request submitted successfully. Please wait for approval from event staff.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Refund request failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'tag_id' => $tag->id,
                'amount' => $request->amount,
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['amount' => 'Failed to submit refund request. Please try again.']);
        }
    }

    public function getWalletInfo(Request $request)
    {
        if (!$request->user()->isAttendee()) {
            abort(403, 'Only attendees can access wallet information');
        }

        $user = $request->user();
        $tagAttendee = $user->load('tagAttendee.rfidTag')->tagAttendee;
        $tag = $tagAttendee?->rfidTag;

        // If no tag is linked, return empty stats
        if (!$tag) {
            $walletInfo = [
                'has_tag' => false,
                'tag' => null,
                'stats' => [
                    'total_loaded' => 0,
                    'total_spent' => 0,
                    'total_refunded' => 0,
                    'transaction_count' => 0,
                ]
            ];
        } else {
            $walletInfo = [
                'has_tag' => true,
                'tag' => [
                    'id' => $tag->id,
                    'short_code' => $tag->short_code,
                    'balance' => $tag->balance,
                    'status' => $tag->status,
                ],
                'stats' => [
                    'total_loaded' => \App\Models\TagTransaction::where('rfid_tag_id', $tag->id)->where('type', 'load')->sum('amount'),
                    'total_spent' => \App\Models\TagTransaction::where('rfid_tag_id', $tag->id)->where('type', 'spend')->sum('amount'),
                    'total_refunded' => \App\Models\TagTransaction::where('rfid_tag_id', $tag->id)->where('type', 'refund')->sum('amount'),
                    'transaction_count' => \App\Models\TagTransaction::where('rfid_tag_id', $tag->id)->count(),
                ]
            ];
        }

        return response()->json($walletInfo);
    }
}
