<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RfidTag;
use App\Models\TagTransaction;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['vendor']);

        if ($request->has('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('available')) {
            $query->where('is_available', $request->boolean('available'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->paginate($request->get('per_page', 15));

        return response()->json($products);
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
            return response()->json(['error' => 'Unauthorized to create products for this vendor'], 403);
        }

        $product = Product::create($request->all());

        return response()->json($product->load('vendor'), 201);
    }

    public function show($id)
    {
        $product = Product::with(['vendor'])->findOrFail($id);
        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Check if user can update this product
        if ($request->user()->isVendor() && $product->vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to update this product'], 403);
        }

        $request->validate([
            'vendor_id' => ['nullable', Rule::exists('vendors', 'id')],
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'stock_quantity' => 'nullable|integer|min:0',
            'image_url' => 'nullable|url',
        ]);

        $product->update(array_filter($request->all()));

        return response()->json($product->load('vendor'));
    }

    public function destroy(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Check if user can delete this product
        if ($request->user()->isVendor() && $product->vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized to delete this product'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }

    public function purchase(Request $request, $id)
    {
        $request->validate([
            'tag_uid' => 'nullable|string',
            'short_code' => 'nullable|string',
            'quantity' => 'integer|min:1',
            'terminal_id' => 'required|exists:vendor_terminals,id',
        ]);

        if (!$request->tag_uid && !$request->short_code) {
            return response()->json(['error' => 'Either tag_uid or short_code is required'], 422);
        }

        $product = Product::findOrFail($id);

        if (!$product->isAvailable()) {
            return response()->json(['error' => 'Product is not available'], 422);
        }

        $quantity = $request->quantity ?? 1;
        $totalAmount = $product->price * $quantity;

        // Find the tag
        $tagQuery = RfidTag::query();
        if ($request->tag_uid) {
            $tagQuery->where('tag_uid', $request->tag_uid);
        } else {
            $tagQuery->where('short_code', $request->short_code);
        }

        $tag = $tagQuery->firstOrFail();

        if (!$tag->isActive()) {
            return response()->json(['error' => 'Tag is not active'], 422);
        }

        if ($tag->balance < $totalAmount) {
            return response()->json(['error' => 'Insufficient balance'], 422);
        }

        DB::beginTransaction();
        try {
            // Check and decrement stock
            if (!$product->decrementStock($quantity)) {
                return response()->json(['error' => 'Insufficient stock'], 422);
            }

            // Deduct balance from tag
            $balanceBefore = $tag->balance;
            $tag->deductBalance($totalAmount);
            $tag->refresh();

            // Create transaction
            $transaction = TagTransaction::create([
                'rfid_tag_id' => $tag->id,
                'user_id' => $request->user()->id,
                'vendor_id' => $product->vendor_id,
                'vendor_terminal_id' => $request->terminal_id,
                'product_id' => $product->id,
                'type' => 'spend',
                'amount' => $totalAmount,
                'quantity' => $quantity,
                'balance_before' => $balanceBefore,
                'balance_after' => $tag->balance,
                'description' => "Purchase: {$quantity}x {$product->name}",
                'reference' => "PURCHASE-" . now()->format('YmdHis') . "-" . $product->id,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Purchase completed successfully',
                'transaction' => $transaction->load(['product', 'vendor', 'vendorTerminal']),
                'tag' => $tag,
                'remaining_stock' => $product->fresh()->stock_quantity,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to process purchase'], 500);
        }
    }

    public function getByVendor($vendorId)
    {
        $vendor = Vendor::findOrFail($vendorId);
        $products = $vendor->products()->paginate(15);

        return response()->json($products);
    }
}
