<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $query = Vendor::with(['user']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('contact_email', 'like', "%{$search}%");
            });
        }

        // If user is a vendor, only show their own vendor
        if ($request->user()->isVendor()) {
            $query->where('user_id', $request->user()->id);
        }

        $vendors = $query->paginate($request->get('per_page', 15));

        return response()->json($vendors);
    }

    public function store(Request $request)
    {
        // Only admins can create vendors
        if (!$request->user()->isEventAdmin() && !$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Unauthorized to create vendors'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contact_person' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'status' => 'in:active,inactive',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $vendor = Vendor::create($request->all());

        return response()->json($vendor->load('user'), 201);
    }

    public function show(Request $request, $id)
    {
        $vendor = Vendor::with(['user', 'products', 'terminals'])->findOrFail($id);

        // Check if user can view this vendor
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to view this vendor'], 403);
        }

        return response()->json($vendor);
    }

    public function update(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        // Check if user can update this vendor
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to update this vendor'], 403);
        }

        $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'contact_person' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'status' => 'in:active,inactive',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $vendor->update(array_filter($request->all()));

        return response()->json($vendor->load('user'));
    }

    public function destroy(Request $request, $id)
    {
        // Only admins can delete vendors
        if (!$request->user()->isEventAdmin() && !$request->user()->isSuperAdmin()) {
            return response()->json(['error' => 'Unauthorized to delete vendors'], 403);
        }

        $vendor = Vendor::findOrFail($id);
        $vendor->delete();

        return response()->json(['message' => 'Vendor deleted successfully']);
    }

    public function getSales(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        // Check if user can view sales for this vendor
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to view sales for this vendor'], 403);
        }

        $query = $vendor->transactions()->with(['rfidTag.attendee', 'product', 'vendorTerminal', 'user']);

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

        // Calculate summary statistics
        $totalSales = $vendor->transactions()
                            ->where('type', 'spend')
                            ->when($request->has('start_date'), function($q) use ($request) {
                                return $q->whereDate('created_at', '>=', $request->start_date);
                            })
                            ->when($request->has('end_date'), function($q) use ($request) {
                                return $q->whereDate('created_at', '<=', $request->end_date);
                            })
                            ->sum('amount');

        $totalTransactions = $vendor->transactions()
                                   ->where('type', 'spend')
                                   ->when($request->has('start_date'), function($q) use ($request) {
                                       return $q->whereDate('created_at', '>=', $request->start_date);
                                   })
                                   ->when($request->has('end_date'), function($q) use ($request) {
                                       return $q->whereDate('created_at', '<=', $request->end_date);
                                   })
                                   ->count();

        // Top selling products
        $topProducts = DB::table('tag_transactions')
                        ->join('products', 'tag_transactions.product_id', '=', 'products.id')
                        ->where('tag_transactions.vendor_id', $vendor->id)
                        ->where('tag_transactions.type', 'spend')
                        ->when($request->has('start_date'), function($q) use ($request) {
                            return $q->whereDate('tag_transactions.created_at', '>=', $request->start_date);
                        })
                        ->when($request->has('end_date'), function($q) use ($request) {
                            return $q->whereDate('tag_transactions.created_at', '<=', $request->end_date);
                        })
                        ->select('products.name',
                                DB::raw('SUM(tag_transactions.quantity) as total_quantity'),
                                DB::raw('SUM(tag_transactions.amount) as total_amount'))
                        ->groupBy('products.id', 'products.name')
                        ->orderBy('total_amount', 'desc')
                        ->limit(5)
                        ->get();

        return response()->json([
            'transactions' => $transactions,
            'summary' => [
                'total_sales' => $totalSales,
                'total_transactions' => $totalTransactions,
                'average_transaction' => $totalTransactions > 0 ? $totalSales / $totalTransactions : 0,
            ],
            'top_products' => $topProducts,
        ]);
    }

    public function getCategories($id)
    {
        $vendor = Vendor::findOrFail($id);

        $categories = $vendor->products()
                           ->whereNotNull('category')
                           ->where('category', '!=', '')
                           ->distinct()
                           ->pluck('category')
                           ->sort()
                           ->values();

        return response()->json([
            'vendor_id' => $vendor->id,
            'vendor_name' => $vendor->name,
            'categories' => $categories,
        ]);
    }
}
