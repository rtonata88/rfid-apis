<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RfidTag;
use App\Models\TagAttendee;
use App\Models\TagTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RfidTagController extends Controller
{
    public function index(Request $request)
    {
        $query = RfidTag::with(['attendee.user', 'transactions']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
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

        $tags = $query->paginate($request->get('per_page', 15));

        return response()->json($tags);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tag_uid' => 'nullable|string|unique:rfid_tags,tag_uid',
            'short_code' => 'required|string|unique:rfid_tags,short_code',
            'embedded_number' => 'nullable|string',
            'initial_balance' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $tag = RfidTag::create([
                'tag_uid' => $request->tag_uid,
                'short_code' => $request->short_code,
                'embedded_number' => $request->embedded_number,
                'is_issued' => false,
                'balance' => $request->initial_balance ?? 0,
            ]);

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

            return response()->json($tag->load(['attendee.user', 'transactions']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create tag'], 500);
        }
    }

    public function claimTag(Request $request)
    {
        $request->validate([
            'short_code' => 'required|string|exists:rfid_tags,short_code',
            'attendee_name' => 'required|string|max:255',
            'attendee_email' => 'required|email|max:255',
            'attendee_phone' => 'nullable|string|max:20',
        ]);

        $tag = RfidTag::where('short_code', $request->short_code)->firstOrFail();

        if ($tag->attendee !== null) {
            return response()->json(['error' => 'Tag is already claimed'], 422);
        }

        DB::beginTransaction();
        try {
            TagAttendee::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => $request->user()->id,
                'attendee_name' => $request->attendee_name,
                'attendee_email' => $request->attendee_email,
                'attendee_phone' => $request->attendee_phone,
                'linked_at' => now(),
            ]);

            $tag->update([
                'is_issued' => true,
                'issued_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Tag claimed successfully',
                'tag' => $tag->load(['attendee.user', 'transactions'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to claim tag'], 500);
        }
    }

    public function issueTag(Request $request, $id)
    {
        $tag = RfidTag::findOrFail($id);

        if ($tag->is_issued) {
            return response()->json(['error' => 'Tag is already issued'], 422);
        }

        $tag->update([
            'is_issued' => true,
            'issued_at' => now(),
        ]);

        return response()->json([
            'message' => 'Tag issued successfully',
            'tag' => $tag
        ]);
    }

    public function findByShortCode($shortCode)
    {
        $tag = RfidTag::with(['attendee.user', 'transactions'])
            ->where(function($query) use ($shortCode) {
                $query->where('short_code', $shortCode)
                      ->orWhere('embedded_number', $shortCode)
                      ->orWhere('embedded_number', 'like', $shortCode . '%');
            })
            ->first();

        if (!$tag) {
            return response()->json([
                'error' => 'Tag not found',
                'message' => 'No tag found with the provided short code or embedded number'
            ], 404);
        }

        return response()->json($tag);
    }

    public function show($id)
    {
        $tag = RfidTag::with(['attendee.user', 'transactions'])->findOrFail($id);
        return response()->json($tag);
    }

    public function update(Request $request, $id)
    {
        $tag = RfidTag::findOrFail($id);

        $request->validate([
            'tag_uid' => ['nullable', 'string', Rule::unique('rfid_tags')->ignore($tag->id)],
            'tag_uid' => 'nullable|string',
            'short_code' => ['nullable', 'string', Rule::unique('rfid_tags')->ignore($tag->id)],
            'embedded_number' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,blocked',
        ]);

        $tag->update($request->only([
            'tag_uid', 'tag_uid', 'short_code', 'embedded_number', 'status'
        ]));

        return response()->json($tag->load(['attendee.user', 'transactions']));
    }

    public function destroy($id)
    {
        $tag = RfidTag::findOrFail($id);
        $tag->delete();

        return response()->json(['message' => 'Tag deleted successfully']);
    }

    public function findByUid($uid)
    {
        $tag = RfidTag::with(['attendee.user', 'transactions'])
            ->where('tag_uid', $uid)
            ->orWhere('embedded_number', $uid)
            ->orWhere('short_code', $uid)
            ->first();

        if (!$tag) {
            return response()->json([
                'error' => 'Tag not found',
                'message' => 'No tag found with the provided UID'
            ], 404);
        }

        return response()->json($tag);
    }
}
