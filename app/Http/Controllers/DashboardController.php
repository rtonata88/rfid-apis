<?php

namespace App\Http\Controllers;

use App\Models\RfidTag;
use App\Models\TagTransaction;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Route to different dashboards based on user type
        if ($user->isVendor()) {
            return $this->vendorDashboard($request);
        } elseif ($user->isAttendee()) {
            return $this->attendeeDashboard($request);
        }

        // Super Admin and Event Admin dashboard
        return $this->adminDashboard($request);
    }

    private function adminDashboard(Request $request)
    {
        $user = $request->user();

        // Get date range for filtering (default to last 30 days)
        $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        // Base statistics
        $stats = [
            'total_tags' => RfidTag::count(),
            'active_tags' => RfidTag::where('status', 'active')->count(),
            'issued_tags' => RfidTag::where('is_issued', true)->count(),
            'total_vendors' => Vendor::count(),
            'active_vendors' => Vendor::where('status', 'active')->count(),
            'total_products' => Product::count(),
            'total_users' => User::count(),
        ];

        // Financial statistics for the date range
        $financialStats = [
            'total_loaded' => TagTransaction::where('type', 'load')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('amount'),
            'total_spent' => TagTransaction::where('type', 'spend')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('amount'),
            'total_refunded' => TagTransaction::where('type', 'refund')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('amount'),
            'total_balance' => RfidTag::sum('balance'),
        ];

        // Transaction counts for the date range
        $transactionStats = [
            'load_transactions' => TagTransaction::where('type', 'load')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count(),
            'spend_transactions' => TagTransaction::where('type', 'spend')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count(),
            'refund_transactions' => TagTransaction::where('type', 'refund')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count(),
        ];

        // Recent transactions
        $recentTransactions = TagTransaction::with(['rfidTag', 'user', 'vendor', 'product'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Top vendors by sales (last 30 days)
        $topVendors = Vendor::select(
                'vendors.id',
                'vendors.name',
                'vendors.description',
                'vendors.status'
            )
            ->selectRaw('COALESCE(SUM(tag_transactions.amount), 0) as total_sales')
            ->selectRaw('COUNT(tag_transactions.id) as transaction_count')
            ->leftJoin('tag_transactions', function($join) use ($startDate, $endDate) {
                $join->on('vendors.id', '=', 'tag_transactions.vendor_id')
                     ->where('tag_transactions.type', '=', 'spend')
                     ->whereBetween('tag_transactions.created_at', [$startDate, $endDate]);
            })
            ->groupBy('vendors.id', 'vendors.name', 'vendors.description', 'vendors.status')
            ->orderBy('total_sales', 'desc')
            ->limit(5)
            ->get();

        // Daily transaction chart data (last 7 days)
        $chartData = TagTransaction::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(CASE WHEN type = "load" THEN amount ELSE 0 END) as loaded'),
                DB::raw('SUM(CASE WHEN type = "spend" THEN amount ELSE 0 END) as spent'),
                DB::raw('COUNT(*) as transactions')
            )
            ->whereBetween('created_at', [now()->subDays(7), now()])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Recent products
        $recentProducts = Product::with(['vendor'])
            ->select('products.id', 'products.name', 'products.price', 'products.category', 'products.is_available', 'products.created_at')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'financialStats' => $financialStats,
            'transactionStats' => $transactionStats,
            'recentTransactions' => $recentTransactions,
            'topVendors' => $topVendors,
            'recentProducts' => $recentProducts,
            'chartData' => $chartData,
            'dateRange' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'user' => $user
        ]);
    }

    private function vendorDashboard(Request $request)
    {
        $user = $request->user();
        $vendor = $user->vendor;

        if (!$vendor) {
            // If vendor user doesn't have a vendor record, create one
            $vendor = Vendor::create([
                'user_id' => $user->id,
                'name' => $user->name . "'s Store",
                'status' => 'active',
                'contact_person' => $user->name,
                'contact_email' => $user->email,
            ]);
        }

        // Get date range for filtering (default to last 30 days)
        $startDate = $request->get('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        // Vendor's product stats
        $productStats = [
            'total_products' => $vendor->products()->count(),
            'active_products' => $vendor->products()->where('is_available', true)->count(),
            'low_stock_products' => $vendor->products()->where('stock_quantity', '>', 0)->where('stock_quantity', '<=', 10)->count(),
            'out_of_stock_products' => $vendor->products()->where('stock_quantity', 0)->count(),
        ];

        // Sales statistics for the date range
        $salesStats = [
            'total_revenue' => $vendor->transactions()
                ->where('type', 'spend')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('amount'),
            'total_transactions' => $vendor->transactions()
                ->where('type', 'spend')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count(),
            'total_items_sold' => $vendor->transactions()
                ->where('type', 'spend')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('quantity'),
            'avg_transaction' => $vendor->transactions()
                ->where('type', 'spend')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->avg('amount') ?? 0,
        ];

        // Recent transactions
        $recentTransactions = $vendor->transactions()
            ->with(['rfidTag.attendee', 'user', 'product'])
            ->where('type', 'spend')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get vendor's products for inventory overview only
        $vendorProducts = $vendor->products()
            ->select('id', 'name', 'price', 'is_available', 'stock_quantity', 'category')
            ->limit(5)
            ->orderBy('created_at', 'desc')
            ->get();

        // Daily sales chart data (last 7 days)
        $chartData = $vendor->transactions()
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('COUNT(*) as transactions'),
                DB::raw('SUM(quantity) as items_sold')
            )
            ->where('type', 'spend')
            ->whereBetween('created_at', [now()->subDays(7), now()])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Dashboard/Vendor', [
            'vendor' => $vendor,
            'productStats' => $productStats,
            'salesStats' => $salesStats,
            'recentTransactions' => $recentTransactions,
            'vendorProducts' => $vendorProducts,
            'chartData' => $chartData,
            'dateRange' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
        ]);
    }

    private function attendeeDashboard(Request $request)
    {
        $user = $request->user();
        
        // Get attendee's linked tag
        $tagAttendee = $user->load('tagAttendee.rfidTag')->tagAttendee;
        $tag = $tagAttendee?->rfidTag;
        
        // If no tag is linked, show empty dashboard
        if (!$tag) {
            return Inertia::render('Dashboard/Attendee', [
                'tag' => null,
                'walletStats' => [
                    'balance' => 0,
                    'total_loaded' => 0,
                    'total_spent' => 0,
                    'total_refunded' => 0,
                ],
                'recentTransactions' => [],
                'spendingByVendor' => [],
            ]);
        }
        
        // Get wallet balance and transaction stats
        $walletStats = [
            'balance' => $tag->balance,
            'total_loaded' => TagTransaction::where('rfid_tag_id', $tag->id)->where('type', 'load')->sum('amount'),
            'total_spent' => TagTransaction::where('rfid_tag_id', $tag->id)->where('type', 'spend')->sum('amount'),
            'total_refunded' => TagTransaction::where('rfid_tag_id', $tag->id)->where('type', 'refund')->sum('amount'),
        ];

        // Recent transactions
        $recentTransactions = TagTransaction::where('rfid_tag_id', $tag->id)
            ->with(['vendor', 'product', 'rfidTag'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Spending by vendor (last 30 days)
        $spendingByVendor = TagTransaction::where('rfid_tag_id', $tag->id)
            ->with('vendor')
            ->where('type', 'spend')
            ->where('created_at', '>=', now()->subDays(30))
            ->get()
            ->groupBy('vendor.name')
            ->map(function ($transactions, $vendorName) {
                return [
                    'vendor_name' => $vendorName ?: 'Unknown Vendor',
                    'total_spent' => $transactions->sum('amount'),
                    'transaction_count' => $transactions->count(),
                ];
            })
            ->sortByDesc('total_spent')
            ->take(5)
            ->values();

        return Inertia::render('Dashboard/Attendee', [
            'tag' => $tag,
            'walletStats' => $walletStats,
            'recentTransactions' => $recentTransactions,
            'spendingByVendor' => $spendingByVendor,
        ]);
    }
}