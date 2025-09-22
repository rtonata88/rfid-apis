<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL, we need to modify the enum to include 'Refund'
        DB::statement("ALTER TABLE tag_transactions MODIFY COLUMN payment_method ENUM('Cash', 'Card', 'Tag', 'Refund') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to the original enum values
        // First, update any 'Refund' values to NULL to avoid constraint errors
        DB::statement("UPDATE tag_transactions SET payment_method = NULL WHERE payment_method = 'Refund'");
        
        // Then modify the enum back to original values
        DB::statement("ALTER TABLE tag_transactions MODIFY COLUMN payment_method ENUM('Cash', 'Card', 'Tag') NULL");
    }
};