<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['vendor']);

        // If user is a vendor, only show their products
        if ($request->user()->isVendor()) {
            $vendor = $request->user()->vendor;
            if (!$vendor) {
                abort(403, 'You are not associated with a vendor');
            }
            $query->where('products.vendor_id', $vendor->id);
        }

        // Vendor filter for admins
        if ($request->has('vendor_id') && ($request->user()->isEventAdmin() || $request->user()->isSuperAdmin())) {
            $query->where('products.vendor_id', $request->vendor_id);
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('products.name', 'like', "%{$search}%")
                  ->orWhere('products.description', 'like', "%{$search}%")
                  ->orWhere('products.sku', 'like', "%{$search}%")
                  ->orWhere('products.category', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->has('category') && $request->category) {
            $query->where('products.category', $request->category);
        }

        // Availability filter
        if ($request->has('available') && $request->available !== '') {
            $query->where('products.is_available', $request->boolean('available'));
        }

        $products = $query->orderBy('products.created_at', 'desc')
                         ->paginate($request->get('per_page', 15))
                         ->withQueryString();

        // Get available categories for filter
        $categoriesQuery = Product::select('category')
                                 ->whereNotNull('category')
                                 ->where('category', '!=', '');
        
        if ($request->user()->isVendor()) {
            $vendor = $request->user()->vendor;
            $categoriesQuery->where('vendor_id', $vendor->id);
        }
        
        $categories = $categoriesQuery->distinct()->pluck('category')->sort()->values();

        // Get vendors list for admins
        $vendors = [];
        if ($request->user()->isEventAdmin() || $request->user()->isSuperAdmin()) {
            $vendors = Vendor::select('id', 'name')->orderBy('name')->get();
        }

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => $request->only(['search', 'category', 'available', 'vendor_id']),
            'categories' => $categories,
            'vendors' => $vendors,
        ]);
    }

    public function create(Request $request)
    {
        // Check if user can create products
        $vendor = null;
        if ($request->user()->isVendor()) {
            $vendor = $request->user()->vendor;
            if (!$vendor) {
                abort(403, 'You are not associated with a vendor');
            }
        }

        // Get vendors list for admins
        $vendors = [];
        if ($request->user()->isEventAdmin() || $request->user()->isSuperAdmin()) {
            $vendors = Vendor::select('id', 'name')->orderBy('name')->get();
        }

        return Inertia::render('Products/Create', [
            'vendor' => $vendor,
            'vendors' => $vendors,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sku' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'stock_quantity' => 'nullable|integer|min:0',
            'image_url' => 'nullable|url',
        ]);

        // Check if user can create products for this vendor
        $vendor = Vendor::findOrFail($request->vendor_id);
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized to create products for this vendor');
        }

        $product = Product::create($request->all());

        return redirect()->route('products.index')->with('success', 'Product created successfully!');
    }

    public function show(Request $request, $id)
    {
        $product = Product::with(['vendor'])->findOrFail($id);

        // Check access permissions
        if ($request->user()->isVendor() && $product->vendor->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized to view this product');
        }

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    public function edit(Request $request, $id)
    {
        $product = Product::with(['vendor'])->findOrFail($id);

        // Check permissions
        if ($request->user()->isVendor() && $product->vendor->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized to edit this product');
        }

        // Get vendors list for admins
        $vendors = [];
        if ($request->user()->isEventAdmin() || $request->user()->isSuperAdmin()) {
            $vendors = Vendor::select('id', 'name')->orderBy('name')->get();
        }

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'vendors' => $vendors,
        ]);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Check permissions
        if ($request->user()->isVendor() && $product->vendor->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized to edit this product');
        }

        $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sku' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'stock_quantity' => 'nullable|integer|min:0',
            'image_url' => 'nullable|url',
        ]);

        // Additional vendor authorization check for vendor_id changes
        if ($request->user()->isVendor()) {
            $newVendor = Vendor::findOrFail($request->vendor_id);
            if ($newVendor->user_id !== $request->user()->id) {
                abort(403, 'Unauthorized to assign product to this vendor');
            }
        }

        $product->update($request->all());

        return redirect()->route('products.index')->with('success', 'Product updated successfully!');
    }

    public function destroy(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Check permissions
        if ($request->user()->isVendor() && $product->vendor->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized to delete this product');
        }

        // Check if product has transactions
        $hasTransactions = DB::table('tag_transactions')
                            ->where('product_id', $product->id)
                            ->exists();

        if ($hasTransactions) {
            return back()->withErrors(['error' => 'Cannot delete product with existing transactions.']);
        }

        $product->delete();

        return redirect()->route('products.index')->with('success', 'Product deleted successfully!');
    }
}
