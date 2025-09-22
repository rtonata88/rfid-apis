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

    /**
     * Get comprehensive analytics including inventory for single-night event
     */
    public function getEventAnalytics(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        // Check permissions
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $eventStart = now()->startOfDay();
        $now = now();

        // Sales Summary
        $salesQuery = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $eventStart);

        $totalSales = $salesQuery->sum('amount');
        $totalTransactions = $salesQuery->count();
        $totalItems = $salesQuery->sum('quantity');

        // Inventory Analysis
        $products = DB::table('products')
            ->leftJoin('tag_transactions', function ($join) use ($eventStart) {
                $join->on('products.id', '=', 'tag_transactions.product_id')
                     ->where('tag_transactions.type', '=', 'spend')
                     ->where('tag_transactions.created_at', '>=', $eventStart);
            })
            ->where('products.vendor_id', $vendor->id)
            ->select(
                'products.id',
                'products.name',
                'products.category',
                'products.price',
                'products.sku',
                'products.stock_quantity as initial_stock',
                'products.is_available',
                DB::raw('COALESCE(SUM(tag_transactions.quantity), 0) as sold_quantity'),
                DB::raw('COALESCE(SUM(tag_transactions.amount), 0) as revenue'),
                DB::raw('COALESCE(COUNT(tag_transactions.id), 0) as transaction_count')
            )
            ->groupBy('products.id', 'products.name', 'products.category', 'products.price', 'products.sku', 'products.stock_quantity', 'products.is_available')
            ->orderBy('revenue', 'desc')
            ->get()
            ->map(function ($product) {
                $remaining = $product->initial_stock !== null ? 
                    max(0, $product->initial_stock - $product->sold_quantity) : 
                    null;
                
                $sellThroughRate = $product->initial_stock > 0 ? 
                    round(($product->sold_quantity / $product->initial_stock) * 100, 1) : 
                    ($product->sold_quantity > 0 ? 100 : 0);

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category ?: 'Uncategorized',
                    'price' => $product->price,
                    'sku' => $product->sku,
                    'initial_stock' => $product->initial_stock,
                    'sold_quantity' => $product->sold_quantity,
                    'remaining_stock' => $remaining,
                    'revenue' => $product->revenue,
                    'transaction_count' => $product->transaction_count,
                    'sell_through_rate' => $sellThroughRate,
                    'stock_status' => $this->getStockStatus($remaining, $product->initial_stock),
                    'is_available' => $product->is_available,
                ];
            });

        // Stock Status Summary
        $stockSummary = [
            'total_products' => $products->count(),
            'in_stock' => $products->where('stock_status', 'good')->count(),
            'low_stock' => $products->where('stock_status', 'low')->count(),
            'out_of_stock' => $products->where('stock_status', 'out_of_stock')->count(),
            'unlimited_stock' => $products->where('stock_status', 'unlimited')->count(),
            'total_initial_value' => $products->sum(function($p) { 
                return $p['initial_stock'] ? $p['initial_stock'] * $p['price'] : 0; 
            }),
            'total_remaining_value' => $products->sum(function($p) { 
                return $p['remaining_stock'] ? $p['remaining_stock'] * $p['price'] : 0; 
            }),
        ];

        // Category Analysis
        $categoryAnalysis = $products->groupBy('category')->map(function ($categoryProducts, $category) {
            $totalInitialValue = $categoryProducts->sum(function($p) { 
                return $p['initial_stock'] ? $p['initial_stock'] * $p['price'] : 0; 
            });
            $totalRemainingValue = $categoryProducts->sum(function($p) { 
                return $p['remaining_stock'] ? $p['remaining_stock'] * $p['price'] : 0; 
            });

            return [
                'category' => $category,
                'product_count' => $categoryProducts->count(),
                'total_sold' => $categoryProducts->sum('sold_quantity'),
                'total_revenue' => $categoryProducts->sum('revenue'),
                'out_of_stock_count' => $categoryProducts->where('stock_status', 'out_of_stock')->count(),
                'low_stock_count' => $categoryProducts->where('stock_status', 'low')->count(),
                'avg_sell_through_rate' => round($categoryProducts->avg('sell_through_rate'), 1),
                'total_initial_value' => $totalInitialValue,
                'total_remaining_value' => $totalRemainingValue,
                'value_sold' => $totalInitialValue - $totalRemainingValue,
            ];
        })->values();

        // Hourly stock depletion tracking
        $hourlyStockMovement = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $eventStart)
            ->selectRaw('HOUR(created_at) as hour, SUM(quantity) as items_sold, COUNT(*) as transactions')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(function ($hour) {
                return [
                    'hour' => $hour->hour,
                    'time' => sprintf('%02d:00', $hour->hour),
                    'items_sold' => $hour->items_sold,
                    'transactions' => $hour->transactions,
                ];
            });

        // Top/Bottom performers
        $topPerformers = $products->sortByDesc('revenue')->take(5)->values();
        $bottomPerformers = $products->where('transaction_count', 0)->sortBy('name')->take(5)->values();
        $fastMoving = $products->where('sell_through_rate', '>', 50)->sortByDesc('sell_through_rate')->take(5)->values();

        return response()->json([
            'vendor_id' => $vendor->id,
            'vendor_name' => $vendor->name,
            'event_date' => $eventStart->format('Y-m-d'),
            'last_updated' => $now->format('H:i:s'),
            
            // Sales Summary
            'sales_summary' => [
                'total_sales' => $totalSales,
                'total_transactions' => $totalTransactions,
                'total_items_sold' => $totalItems,
                'average_transaction' => $totalTransactions > 0 ? round($totalSales / $totalTransactions, 2) : 0,
            ],
            
            // Inventory Overview
            'inventory_summary' => $stockSummary,
            
            // Detailed Product Data
            'products' => $products,
            
            // Category Breakdown
            'category_analysis' => $categoryAnalysis,
            
            // Hourly Movement
            'hourly_stock_movement' => $hourlyStockMovement,
            
            // Performance Insights
            'insights' => [
                'top_revenue_products' => $topPerformers,
                'not_sold_products' => $bottomPerformers,
                'fast_moving_products' => $fastMoving,
                'restock_needed' => $products->where('stock_status', 'out_of_stock')->values(),
                'low_stock_alerts' => $products->where('stock_status', 'low')->values(),
            ],
        ]);
    }

    /**
     * Get real-time inventory status with stock alerts
     */
    public function getInventoryAlerts(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        // Check permissions
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $eventStart = now()->startOfDay();

        // Get current stock levels with recent sales
        $products = DB::table('products')
            ->leftJoin('tag_transactions', function ($join) use ($eventStart) {
                $join->on('products.id', '=', 'tag_transactions.product_id')
                     ->where('tag_transactions.type', '=', 'spend')
                     ->where('tag_transactions.created_at', '>=', $eventStart);
            })
            ->where('products.vendor_id', $vendor->id)
            ->where('products.is_available', true)
            ->select(
                'products.id',
                'products.name',
                'products.category',
                'products.price',
                'products.stock_quantity',
                DB::raw('COALESCE(SUM(tag_transactions.quantity), 0) as sold_today'),
                DB::raw('MAX(tag_transactions.created_at) as last_sale')
            )
            ->groupBy('products.id', 'products.name', 'products.category', 'products.price', 'products.stock_quantity')
            ->get()
            ->map(function ($product) {
                $remaining = $product->stock_quantity !== null ? 
                    max(0, $product->stock_quantity - $product->sold_today) : 
                    null;
                
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category,
                    'remaining_stock' => $remaining,
                    'stock_status' => $this->getStockStatus($remaining, $product->stock_quantity),
                    'last_sale' => $product->last_sale,
                    'minutes_since_sale' => $product->last_sale ? now()->diffInMinutes($product->last_sale) : null,
                ];
            });

        // Generate alerts
        $alerts = [];
        
        // Out of stock alerts
        $outOfStock = $products->where('stock_status', 'out_of_stock');
        if ($outOfStock->count() > 0) {
            $alerts[] = [
                'type' => 'critical',
                'title' => 'Products Out of Stock',
                'message' => $outOfStock->count() . ' products are completely out of stock',
                'products' => $outOfStock->pluck('name')->toArray(),
            ];
        }

        // Low stock alerts
        $lowStock = $products->where('stock_status', 'low');
        if ($lowStock->count() > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Low Stock Alert',
                'message' => $lowStock->count() . ' products are running low',
                'products' => $lowStock->pluck('name')->toArray(),
            ];
        }

        // Slow moving alerts (no sales in last 2 hours)
        $slowMoving = $products->filter(function($product) {
            return $product['minutes_since_sale'] && $product['minutes_since_sale'] > 120;
        });
        
        if ($slowMoving->count() > 0) {
            $alerts[] = [
                'type' => 'info',
                'title' => 'Slow Moving Products',
                'message' => $slowMoving->count() . ' products haven\'t sold in 2+ hours',
                'products' => $slowMoving->pluck('name')->toArray(),
            ];
        }

        return response()->json([
            'vendor_id' => $vendor->id,
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'alerts' => $alerts,
            'alert_counts' => [
                'critical' => collect($alerts)->where('type', 'critical')->count(),
                'warning' => collect($alerts)->where('type', 'warning')->count(),
                'info' => collect($alerts)->where('type', 'info')->count(),
            ],
            'stock_overview' => [
                'out_of_stock' => $outOfStock->count(),
                'low_stock' => $lowStock->count(),
                'good_stock' => $products->where('stock_status', 'good')->count(),
                'unlimited' => $products->where('stock_status', 'unlimited')->count(),
            ],
        ]);
    }

    /**
     * Get stock movement trend for the event
     */
    public function getStockMovementTrend(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        // Check permissions
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $eventStart = now()->startOfDay();
        
        // Get hourly stock movement
        $hourlyMovement = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $eventStart)
            ->selectRaw('
                HOUR(created_at) as hour,
                SUM(quantity) as total_items,
                SUM(amount) as total_revenue,
                COUNT(DISTINCT product_id) as unique_products,
                COUNT(*) as transaction_count
            ')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        // Calculate cumulative stock depletion
        $cumulativeData = [];
        $runningTotal = 0;
        
        foreach (range(0, 23) as $hour) {
            $hourData = $hourlyMovement->where('hour', $hour)->first();
            $hourItems = $hourData ? $hourData->total_items : 0;
            $runningTotal += $hourItems;
            
            $cumulativeData[] = [
                'hour' => $hour,
                'time' => sprintf('%02d:00', $hour),
                'hourly_items' => $hourItems,
                'cumulative_items' => $runningTotal,
                'hourly_revenue' => $hourData ? $hourData->total_revenue : 0,
                'transaction_count' => $hourData ? $hourData->transaction_count : 0,
            ];
        }

        // Predict stock depletion for remaining hours
        $currentHour = now()->hour;
        $hoursElapsed = $currentHour >= 18 ? $currentHour - 18 + 1 : $currentHour + 6 + 1; // Assuming event starts at 6 PM
        $avgItemsPerHour = $hoursElapsed > 0 ? $runningTotal / $hoursElapsed : 0;

        return response()->json([
            'vendor_id' => $vendor->id,
            'event_date' => $eventStart->format('Y-m-d'),
            'current_hour' => $currentHour,
            'hourly_movement' => $cumulativeData,
            'trends' => [
                'total_items_sold' => $runningTotal,
                'avg_items_per_hour' => round($avgItemsPerHour, 1),
                'peak_hour' => $hourlyMovement->sortByDesc('total_items')->first()?->hour,
                'predicted_remaining_sales' => round($avgItemsPerHour * (24 - $currentHour), 0),
            ],
        ]);
    }

    /**
     * Get live sales dashboard for single-night event
     */
    public function getLiveSalesDashboard(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        // Check permissions
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $eventStart = now()->startOfDay();
        $now = now();

        // Get all sales for today (the event)
        $salesQuery = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $eventStart);

        $totalSales = $salesQuery->sum('amount');
        $totalTransactions = $salesQuery->count();
        $totalItems = $salesQuery->sum('quantity');

        // Hourly breakdown for the event (focusing on evening hours)
        $hourlySales = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $eventStart)
            ->selectRaw('HOUR(created_at) as hour, SUM(amount) as amount, COUNT(*) as transactions, SUM(quantity) as items')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->keyBy('hour');

        // Create hourly data for event hours (typically 6 PM to 2 AM)
        $eventHours = array_merge(range(18, 23), range(0, 2));
        $hourlyData = [];
        foreach ($eventHours as $hour) {
            $hourlyData[] = [
                'hour' => $hour,
                'time' => sprintf('%02d:00', $hour),
                'amount' => $hourlySales->get($hour)->amount ?? 0,
                'transactions' => $hourlySales->get($hour)->transactions ?? 0,
                'items' => $hourlySales->get($hour)->items ?? 0,
            ];
        }

        // Recent transactions (last 10)
        $recentTransactions = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $eventStart)
            ->with(['product', 'rfidTag.attendee'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($transaction) {
                return [
                    'time' => $transaction->created_at->format('H:i'),
                    'product' => $transaction->product->name ?? 'Unknown',
                    'quantity' => $transaction->quantity,
                    'amount' => $transaction->amount,
                    'customer' => $transaction->rfidTag->attendee->user->name ?? 'Guest',
                ];
            });

        // Top selling products for the event
        $topProducts = DB::table('tag_transactions')
            ->join('products', 'tag_transactions.product_id', '=', 'products.id')
            ->where('tag_transactions.vendor_id', $vendor->id)
            ->where('tag_transactions.type', 'spend')
            ->where('tag_transactions.created_at', '>=', $eventStart)
            ->select(
                'products.name',
                'products.price',
                DB::raw('SUM(tag_transactions.quantity) as total_sold'),
                DB::raw('SUM(tag_transactions.amount) as revenue'),
                DB::raw('COUNT(tag_transactions.id) as orders')
            )
            ->groupBy('products.id', 'products.name', 'products.price')
            ->orderBy('revenue', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'vendor_id' => $vendor->id,
            'vendor_name' => $vendor->name,
            'event_date' => $eventStart->format('Y-m-d'),
            'last_updated' => $now->format('H:i:s'),
            'summary' => [
                'total_sales' => $totalSales,
                'total_transactions' => $totalTransactions,
                'total_items_sold' => $totalItems,
                'average_transaction' => $totalTransactions > 0 ? round($totalSales / $totalTransactions, 2) : 0,
                'sales_per_hour' => $now->diffInHours($eventStart) > 0 ? round($totalSales / $now->diffInHours($eventStart), 2) : 0,
            ],
            'hourly_breakdown' => $hourlyData,
            'recent_transactions' => $recentTransactions,
            'top_products' => $topProducts,
        ]);
    }

    /**
     * Get simple sales summary for quick POS overview
     */
    public function getQuickSummary(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        // Check permissions
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $eventStart = now()->startOfDay();
        $currentHour = now()->hour;
        $hourStart = now()->startOfHour();

        // Total event sales
        $totalSales = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $eventStart)
            ->sum('amount');

        $totalTransactions = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $eventStart)
            ->count();

        // Current hour sales
        $hourSales = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $hourStart)
            ->sum('amount');

        $hourTransactions = $vendor->transactions()
            ->where('type', 'spend')
            ->where('created_at', '>=', $hourStart)
            ->count();

        return response()->json([
            'vendor_id' => $vendor->id,
            'timestamp' => now()->format('H:i:s'),
            'event_totals' => [
                'sales' => $totalSales,
                'transactions' => $totalTransactions,
                'average' => $totalTransactions > 0 ? round($totalSales / $totalTransactions, 2) : 0,
            ],
            'current_hour' => [
                'hour' => $currentHour,
                'sales' => $hourSales,
                'transactions' => $hourTransactions,
            ],
        ]);
    }

    /**
     * Helper method to determine stock status
     */
    private function getStockStatus($remaining, $initial)
    {
        if ($remaining === null) return 'unlimited';
        if ($remaining <= 0) return 'out_of_stock';
        if ($initial && $remaining <= ($initial * 0.2)) return 'low'; // 20% or less
        return 'good';
    }
}
