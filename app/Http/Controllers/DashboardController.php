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

        // Top products
        $topProducts = Product::select(
                'products.id',
                'products.name',
                'products.description',
                'products.price',
                'products.category'
            )
            ->selectRaw('COALESCE(SUM(tag_transactions.quantity), 0) as total_sold')
            ->selectRaw('COALESCE(SUM(tag_transactions.amount), 0) as total_revenue')
            ->leftJoin('tag_transactions', function($join) use ($startDate, $endDate) {
                $join->on('products.id', '=', 'tag_transactions.product_id')
                     ->where('tag_transactions.type', '=', 'spend')
                     ->whereBetween('tag_transactions.created_at', [$startDate, $endDate]);
            })
            ->groupBy('products.id', 'products.name', 'products.description', 'products.price', 'products.category')
            ->orderBy('total_revenue', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'financialStats' => $financialStats,
            'transactionStats' => $transactionStats,
            'recentTransactions' => $recentTransactions,
            'topVendors' => $topVendors,
            'topProducts' => $topProducts,
            'chartData' => $chartData,
            'dateRange' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'user' => $user
        ]);
    }
}