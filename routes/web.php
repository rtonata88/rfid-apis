<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Web\TagController;
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

    // Additional management routes
    Route::get('/vendors', function () {
        return Inertia::render('Vendors/Index');
    })->name('vendors.index');

    Route::get('/transactions', function () {
        return Inertia::render('Transactions/Index');
    })->name('transactions.index');
});

require __DIR__.'/auth.php';
