<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RfidTagController;
use App\Http\Controllers\Api\TagTransactionController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\VendorTerminalController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public endpoints (none for tags - all require authentication)

// Public product endpoints
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/vendors', [VendorController::class, 'index']);
Route::get('/vendors/{id}', [VendorController::class, 'show']);
Route::get('/vendors/{vendorId}/products', [ProductController::class, 'getByVendor']);
Route::get('/vendors/{id}/categories', [VendorController::class, 'getCategories']);

Route::middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // RFID Tag Management (all tag endpoints require authentication)
    Route::apiResource('tags', RfidTagController::class)->names([
        'index' => 'api.tags.index',
        'store' => 'api.tags.store',
        'show' => 'api.tags.show',
        'update' => 'api.tags.update',
        'destroy' => 'api.tags.destroy'
    ]);
    Route::post('/tags/claim', [RfidTagController::class, 'claimTag']);
    Route::post('/tags/{id}/issue', [RfidTagController::class, 'issueTag']);
    Route::get('/tags/uid/{uid}', [RfidTagController::class, 'findByUid']);
    Route::get('/tags/code/{shortCode}', [RfidTagController::class, 'findByShortCode']);
    Route::get('/tags/{tagUid}/balance', [TagTransactionController::class, 'getBalance']);
    Route::get('/tags/{tagUid}/transactions', [TagTransactionController::class, 'getTransactions']);

    // Transaction Management
    Route::post('/transactions/load', [TagTransactionController::class, 'loadMoney']);
    Route::post('/transactions/spend', [TagTransactionController::class, 'spendMoney']);
    Route::post('/transactions/refund', [TagTransactionController::class, 'refund']);

    // Cash-Up Management Routes (Multiple times per shift)
    Route::prefix('cash-up')->group(function () {
        Route::get('/current', [TagTransactionController::class, 'getCurrentCashUp']);
        Route::post('/record', [TagTransactionController::class, 'recordCashUp']);
        Route::get('/today', [TagTransactionController::class, 'getTodaysCashUps']);
    });

    // Product Management
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{id}/purchase', [ProductController::class, 'purchase']);

    // Vendor Management
    Route::post('/vendors', [VendorController::class, 'store']);
    Route::put('/vendors/{id}', [VendorController::class, 'update']);
    Route::delete('/vendors/{id}', [VendorController::class, 'destroy']);
    Route::get('/vendors/{id}/sales', [VendorController::class, 'getSales']);

    // Enhanced Analytics Routes for Single-Night Event
    Route::prefix('vendors/{id}/analytics')->group(function () {
        Route::get('/event', [VendorController::class, 'getEventAnalytics']);
        Route::get('/inventory-alerts', [VendorController::class, 'getInventoryAlerts']);
        Route::get('/stock-trends', [VendorController::class, 'getStockMovementTrend']);
        Route::get('/live-dashboard', [VendorController::class, 'getLiveSalesDashboard']);
        Route::get('/quick-summary', [VendorController::class, 'getQuickSummary']);
    });

    // Terminal Management
    Route::apiResource('terminals', VendorTerminalController::class)->names([
        'index' => 'api.terminals.index',
        'store' => 'api.terminals.store',
        'show' => 'api.terminals.show',
        'update' => 'api.terminals.update',
        'destroy' => 'api.terminals.destroy'
    ]);
    Route::get('/terminals/{id}/transactions', [VendorTerminalController::class, 'getTransactions']);
    Route::post('/terminals/{id}/activate', [VendorTerminalController::class, 'activate']);
    Route::post('/terminals/{id}/deactivate', [VendorTerminalController::class, 'deactivate']);
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});