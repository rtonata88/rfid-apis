<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Web\TagController;
use App\Http\Controllers\Web\VendorController;
use App\Http\Controllers\Web\TransactionController;
use App\Http\Controllers\Web\RefundController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // RFID Tags CRUD
    Route::resource('tags', TagController::class);
    Route::post('/tags/{id}/load-money', [TagController::class, 'loadMoney'])->name('tags.load-money');

    // Test route for debugging
    Route::get('/tags-test', function () {
        return Inertia::render('Tags/Index', [
            'tags' => \App\Models\RfidTag::paginate(10),
            'filters' => []
        ]);
    })->name('tags.test');

    // Debug route
    Route::get('/tags-debug', function () {
        return Inertia::render('Tags/Debug', [
            'tags' => \App\Models\RfidTag::paginate(5),
            'filters' => []
        ]);
    })->name('tags.debug');

    // Vendor management routes
    Route::resource('vendors', VendorController::class);

    // Product management routes
    Route::resource('products', \App\Http\Controllers\Web\ProductController::class);

    // Transaction management routes
    Route::resource('transactions', TransactionController::class);

    // Refund management routes (Super Admin & Event Admin only)
    Route::prefix('refunds')->name('refunds.')->group(function () {
        Route::get('/', [RefundController::class, 'index'])->name('index');
        Route::get('/{id}', [RefundController::class, 'show'])->name('show');
        Route::post('/{id}/approve', [RefundController::class, 'approve'])->name('approve');
        Route::post('/{id}/reject', [RefundController::class, 'reject'])->name('reject');
    });

    // Attendee-specific routes
    Route::prefix('attendee')->name('attendee.')->group(function () {
        Route::post('/link-tag', [\App\Http\Controllers\Web\AttendeeController::class, 'linkTag'])->name('link-tag');
        Route::post('/request-refund', [\App\Http\Controllers\Web\AttendeeController::class, 'requestRefund'])->name('request-refund');
        Route::get('/wallet-info', [\App\Http\Controllers\Web\AttendeeController::class, 'getWalletInfo'])->name('wallet-info');
    });
});

require __DIR__.'/auth.php';
