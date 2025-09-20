<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VendorTerminal;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VendorTerminalController extends Controller
{
    public function index(Request $request)
    {
        $query = VendorTerminal::with(['vendor', 'operator']);

        if ($request->has('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('terminal_name', 'like', "%{$search}%")
                  ->orWhere('terminal_id', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        // If user is a vendor, only show their terminals
        if ($request->user()->isVendor()) {
            $vendorIds = Vendor::where('user_id', $request->user()->id)->pluck('id');
            $query->whereIn('vendor_id', $vendorIds);
        }

        $terminals = $query->paginate($request->get('per_page', 15));

        return response()->json($terminals);
    }

    public function store(Request $request)
    {
        $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'terminal_name' => 'required|string|max:255',
            'terminal_id' => 'required|string|unique:vendor_terminals,terminal_id',
            'location' => 'nullable|string|max:255',
            'status' => 'in:active,inactive,maintenance',
            'operated_by' => 'nullable|exists:users,id',
        ]);

        // Check if user can create terminals for this vendor
        $vendor = Vendor::findOrFail($request->vendor_id);
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to create terminals for this vendor'], 403);
        }

        $terminal = VendorTerminal::create($request->all());

        return response()->json($terminal->load(['vendor', 'operator']), 201);
    }

    public function show(Request $request, $id)
    {
        $terminal = VendorTerminal::with(['vendor', 'operator', 'transactions'])->findOrFail($id);

        // Check if user can view this terminal
        if ($request->user()->isVendor() && $terminal->vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to view this terminal'], 403);
        }

        return response()->json($terminal);
    }

    public function update(Request $request, $id)
    {
        $terminal = VendorTerminal::findOrFail($id);

        // Check if user can update this terminal
        if ($request->user()->isVendor() && $terminal->vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to update this terminal'], 403);
        }

        $request->validate([
            'vendor_id' => ['nullable', Rule::exists('vendors', 'id')],
            'terminal_name' => 'nullable|string|max:255',
            'terminal_id' => ['nullable', 'string', Rule::unique('vendor_terminals')->ignore($terminal->id)],
            'location' => 'nullable|string|max:255',
            'status' => 'in:active,inactive,maintenance',
            'operated_by' => 'nullable|exists:users,id',
        ]);

        $terminal->update(array_filter($request->all()));

        return response()->json($terminal->load(['vendor', 'operator']));
    }

    public function destroy(Request $request, $id)
    {
        $terminal = VendorTerminal::findOrFail($id);

        // Check if user can delete this terminal
        if ($request->user()->isVendor() && $terminal->vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to delete this terminal'], 403);
        }

        $terminal->delete();

        return response()->json(['message' => 'Terminal deleted successfully']);
    }

    public function getTransactions(Request $request, $id)
    {
        $terminal = VendorTerminal::findOrFail($id);

        // Check if user can view transactions for this terminal
        if ($request->user()->isVendor() && $terminal->vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to view transactions for this terminal'], 403);
        }

        $query = $terminal->transactions()->with(['rfidTag.attendee', 'product', 'vendor', 'user']);

        // Date filtering
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Transaction type filtering
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->orderBy('created_at', 'desc')
                             ->paginate($request->get('per_page', 15));

        // Calculate summary statistics for this terminal
        $totalSales = $terminal->transactions()
                              ->where('type', 'spend')
                              ->when($request->has('start_date'), function($q) use ($request) {
                                  return $q->whereDate('created_at', '>=', $request->start_date);
                              })
                              ->when($request->has('end_date'), function($q) use ($request) {
                                  return $q->whereDate('created_at', '<=', $request->end_date);
                              })
                              ->sum('amount');

        $totalTransactions = $terminal->transactions()
                                     ->where('type', 'spend')
                                     ->when($request->has('start_date'), function($q) use ($request) {
                                         return $q->whereDate('created_at', '>=', $request->start_date);
                                     })
                                     ->when($request->has('end_date'), function($q) use ($request) {
                                         return $q->whereDate('created_at', '<=', $request->end_date);
                                     })
                                     ->count();

        return response()->json([
            'terminal' => $terminal,
            'transactions' => $transactions,
            'summary' => [
                'total_sales' => $totalSales,
                'total_transactions' => $totalTransactions,
                'average_transaction' => $totalTransactions > 0 ? $totalSales / $totalTransactions : 0,
            ],
        ]);
    }

    public function activate(Request $request, $id)
    {
        $terminal = VendorTerminal::findOrFail($id);

        // Check if user can activate this terminal
        if ($request->user()->isVendor() && $terminal->vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to activate this terminal'], 403);
        }

        $terminal->update(['status' => 'active']);

        return response()->json([
            'message' => 'Terminal activated successfully',
            'terminal' => $terminal->load(['vendor', 'operator'])
        ]);
    }

    public function deactivate(Request $request, $id)
    {
        $terminal = VendorTerminal::findOrFail($id);

        // Check if user can deactivate this terminal
        if ($request->user()->isVendor() && $terminal->vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to deactivate this terminal'], 403);
        }

        $terminal->update(['status' => 'inactive']);

        return response()->json([
            'message' => 'Terminal deactivated successfully',
            'terminal' => $terminal->load(['vendor', 'operator'])
        ]);
    }
}
