<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tag_transactions', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->constrained()->onDelete('set null')->after('user_id');
            $table->foreignId('vendor_terminal_id')->nullable()->constrained()->onDelete('set null')->after('vendor_id');
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null')->after('vendor_terminal_id');
            $table->integer('quantity')->default(1)->after('amount');

            // Add indexes
            $table->index('vendor_id');
            $table->index('vendor_terminal_id');
            $table->index('product_id');
            $table->index(['vendor_id', 'created_at']);
            $table->index(['vendor_terminal_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tag_transactions', function (Blueprint $table) {
            $table->dropIndex(['tag_transactions_vendor_id_index']);
            $table->dropIndex(['tag_transactions_vendor_terminal_id_index']);
            $table->dropIndex(['tag_transactions_product_id_index']);
            $table->dropIndex(['tag_transactions_vendor_id_created_at_index']);
            $table->dropIndex(['tag_transactions_vendor_terminal_id_created_at_index']);
            $table->dropColumn(['vendor_id', 'vendor_terminal_id', 'product_id', 'quantity']);
        });
    }
};
