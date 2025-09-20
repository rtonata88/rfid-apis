<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\VendorTerminal;
use App\Models\RfidTag;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get vendor users
        $vendorUser1 = User::where('email', 'vendor@hievents.com')->first();
        $vendorUser2 = User::where('email', 'food.vendor@hievents.com')->first();

        // Create vendors
        $vendor1 = Vendor::create([
            'name' => 'TechGear Store',
            'description' => 'Electronics and tech accessories',
            'contact_person' => 'John Vendor',
            'contact_email' => 'vendor@hievents.com',
            'contact_phone' => '+1-555-0123',
            'status' => 'active',
            'user_id' => $vendorUser1->id,
        ]);

        $vendor2 = Vendor::create([
            'name' => 'Delicious Bites',
            'description' => 'Fresh food and beverages',
            'contact_person' => 'Mike Food Vendor',
            'contact_email' => 'food.vendor@hievents.com',
            'contact_phone' => '+1-555-0124',
            'status' => 'active',
            'user_id' => $vendorUser2->id,
        ]);

        // Create products for TechGear Store
        $products1 = [
            [
                'name' => 'Wireless Headphones',
                'description' => 'High-quality wireless headphones with noise cancellation',
                'price' => 89.99,
                'sku' => 'WH-001',
                'category' => 'Electronics',
                'stock_quantity' => 25,
            ],
            [
                'name' => 'Phone Charger',
                'description' => 'Universal USB-C phone charger',
                'price' => 19.99,
                'sku' => 'PC-002',
                'category' => 'Electronics',
                'stock_quantity' => 50,
            ],
            [
                'name' => 'Bluetooth Speaker',
                'description' => 'Portable bluetooth speaker with great sound',
                'price' => 45.00,
                'sku' => 'BS-003',
                'category' => 'Electronics',
                'stock_quantity' => 15,
            ],
        ];

        foreach ($products1 as $productData) {
            Product::create(array_merge($productData, ['vendor_id' => $vendor1->id]));
        }

        // Create products for Delicious Bites
        $products2 = [
            [
                'name' => 'Burger Combo',
                'description' => 'Delicious burger with fries and drink',
                'price' => 12.50,
                'sku' => 'BC-001',
                'category' => 'Food',
                'stock_quantity' => null, // Unlimited
            ],
            [
                'name' => 'Pizza Slice',
                'description' => 'Fresh pizza slice with your choice of toppings',
                'price' => 4.50,
                'sku' => 'PS-002',
                'category' => 'Food',
                'stock_quantity' => null, // Unlimited
            ],
            [
                'name' => 'Soft Drink',
                'description' => 'Cold refreshing soft drink',
                'price' => 2.00,
                'sku' => 'SD-003',
                'category' => 'Beverages',
                'stock_quantity' => 100,
            ],
            [
                'name' => 'Coffee',
                'description' => 'Freshly brewed coffee',
                'price' => 3.50,
                'sku' => 'CF-004',
                'category' => 'Beverages',
                'stock_quantity' => null, // Unlimited
            ],
        ];

        foreach ($products2 as $productData) {
            Product::create(array_merge($productData, ['vendor_id' => $vendor2->id]));
        }

        // Create terminals for vendors
        VendorTerminal::create([
            'vendor_id' => $vendor1->id,
            'terminal_name' => 'TechGear Main Terminal',
            'terminal_id' => 'TG-TERM-001',
            'location' => 'Booth A-15',
            'status' => 'active',
            'operated_by' => $vendorUser1->id,
        ]);

        VendorTerminal::create([
            'vendor_id' => $vendor2->id,
            'terminal_name' => 'Food Court Terminal 1',
            'terminal_id' => 'DB-TERM-001',
            'location' => 'Food Court Section B',
            'status' => 'active',
            'operated_by' => $vendorUser2->id,
        ]);

        VendorTerminal::create([
            'vendor_id' => $vendor2->id,
            'terminal_name' => 'Food Court Terminal 2',
            'terminal_id' => 'DB-TERM-002',
            'location' => 'Food Court Section C',
            'status' => 'active',
        ]);

        // Create some sample RFID tags with balances
        $tags = [
            [
                'tag_uid' => 'RFID-123456789',
                'short_code' => 'ABC123',
                'embedded_number' => '001',
                'balance' => 50.00,
                'is_issued' => true,
                'issued_at' => now(),
            ],
            [
                'tag_uid' => 'RFID-987654321',
                'short_code' => 'XYZ789',
                'embedded_number' => '002',
                'balance' => 25.00,
                'is_issued' => true,
                'issued_at' => now(),
            ],
            [
                'tag_uid' => 'RFID-456789123',
                'short_code' => 'DEF456',
                'embedded_number' => '003',
                'balance' => 75.00,
                'is_issued' => false,
            ],
        ];

        foreach ($tags as $tagData) {
            RfidTag::create($tagData);
        }
    }
}
