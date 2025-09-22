<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\TagTransaction;
use App\Mail\VendorWelcome;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $query = Vendor::with(['user'])
                      ->withCount(['products', 'transactions']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('contact_email', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // If user is a vendor, only show their own vendor
        if ($request->user()->isVendor()) {
            $query->where('user_id', $request->user()->id);
        }

        $vendors = $query->orderBy('created_at', 'desc')
                        ->paginate($request->get('per_page', 15))
                        ->withQueryString();

        return Inertia::render('Vendors/Index', [
            'vendors' => $vendors,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(Request $request)
    {
        // Only super admins can create vendors
        if (!$request->user()->isSuperAdmin()) {
            abort(403, 'Unauthorized to create vendors');
        }

        return Inertia::render('Vendors/Create');
    }

    public function store(Request $request)
    {
        // Only super admins can create vendors
        if (!$request->user()->isSuperAdmin()) {
            abort(403, 'Unauthorized to create vendors');
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

        // Load the vendor with its user relationship for email sending
        $vendor->load('user');

        // Send welcome email to the vendor
        $this->sendWelcomeEmail($vendor);

        return redirect()->route('vendors.index')->with('success', 'Vendor created successfully!');
    }

    public function show(Request $request, $id)
    {
        $vendor = Vendor::with(['user', 'products', 'terminals'])
                        ->withCount(['products', 'transactions'])
                        ->findOrFail($id);

        // Check access permissions
        if ($request->user()->isVendor() && $vendor->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized to view this vendor');
        }

        // Get vendor sales statistics
        $salesStats = [
            'total_sales' => $vendor->transactions()->where('type', 'spend')->sum('amount'),
            'total_transactions' => $vendor->transactions()->where('type', 'spend')->count(),
            'avg_transaction' => $vendor->transactions()->where('type', 'spend')->avg('amount') ?? 0,
        ];

        // Get recent transactions
        $recentTransactions = $vendor->transactions()
                                   ->with(['rfidTag.attendee', 'user', 'product'])
                                   ->orderBy('created_at', 'desc')
                                   ->limit(10)
                                   ->get();

        // Get top products
        $topProducts = Product::where('products.vendor_id', $vendor->id)
                             ->select('products.id', 'products.vendor_id', 'products.name', 'products.description', 'products.price', 'products.sku', 'products.category', 'products.is_available', 'products.stock_quantity', 'products.image_url', 'products.created_at', 'products.updated_at')
                             ->selectRaw('COALESCE(SUM(tag_transactions.amount), 0) as total_revenue')
                             ->selectRaw('COALESCE(SUM(tag_transactions.quantity), 0) as total_sold')
                             ->leftJoin('tag_transactions', function($join) {
                                 $join->on('products.id', '=', 'tag_transactions.product_id')
                                      ->where('tag_transactions.type', '=', 'spend');
                             })
                             ->groupBy('products.id', 'products.vendor_id', 'products.name', 'products.description', 'products.price', 'products.sku', 'products.category', 'products.is_available', 'products.stock_quantity', 'products.image_url', 'products.created_at', 'products.updated_at')
                             ->orderBy('total_revenue', 'desc')
                             ->limit(5)
                             ->get();

        return Inertia::render('Vendors/Show', [
            'vendor' => $vendor,
            'salesStats' => $salesStats,
            'recentTransactions' => $recentTransactions,
            'topProducts' => $topProducts,
        ]);
    }

    public function edit(Request $request, $id)
    {
        $vendor = Vendor::with(['user'])->findOrFail($id);

        // Check permissions - only super admins and vendors can edit their own vendor
        if (!$request->user()->isSuperAdmin() && 
            (!$request->user()->isVendor() || $vendor->user_id !== $request->user()->id)) {
            abort(403, 'Unauthorized to edit this vendor');
        }

        return Inertia::render('Vendors/Edit', [
            'vendor' => $vendor,
        ]);
    }

    public function update(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        // Check permissions - only super admins and vendors can edit their own vendor
        if (!$request->user()->isSuperAdmin() && 
            (!$request->user()->isVendor() || $vendor->user_id !== $request->user()->id)) {
            abort(403, 'Unauthorized to edit this vendor');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contact_person' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'status' => 'in:active,inactive',
        ]);

        $vendor->update($request->only([
            'name', 'description', 'contact_person', 
            'contact_email', 'contact_phone', 'status'
        ]));

        return redirect()->route('vendors.index')->with('success', 'Vendor updated successfully!');
    }

    public function destroy(Request $request, $id)
    {
        // Only super admins can delete vendors
        if (!$request->user()->isSuperAdmin()) {
            abort(403, 'Unauthorized to delete vendors');
        }

        $vendor = Vendor::findOrFail($id);

        // Check if vendor has transactions
        if ($vendor->transactions()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete vendor with existing transactions.']);
        }

        // Check if vendor has products
        if ($vendor->products()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete vendor with existing products.']);
        }

        $vendor->delete();

        return redirect()->route('vendors.index')->with('success', 'Vendor deleted successfully!');
    }

    /**
     * Send welcome email to the newly created vendor
     */
    private function sendWelcomeEmail(Vendor $vendor): void
    {
        try {
            // Determine which email to send to
            $emailAddress = null;
            
            if ($vendor->user && $vendor->user->email) {
                // If vendor has an associated user, send to the user's email
                $emailAddress = $vendor->user->email;
            } elseif ($vendor->contact_email) {
                // Otherwise, send to the vendor's contact email
                $emailAddress = $vendor->contact_email;
            }

            // Only send email if we have a valid email address
            if ($emailAddress && filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) {
                Mail::to($emailAddress)->send(new VendorWelcome($vendor));
                
                // Log the email sending (optional)
                Log::info("Welcome email sent to vendor: {$vendor->name} at {$emailAddress}");
            } else {
                // Log warning if no valid email found
                Log::warning("Could not send welcome email to vendor: {$vendor->name} - no valid email address found");
            }
        } catch (\Exception $e) {
            // Log the error but don't break the vendor creation process
            Log::error("Failed to send welcome email to vendor: {$vendor->name}. Error: " . $e->getMessage());
        }
    }
}
