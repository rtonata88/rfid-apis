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
            $table->enum('payment_method', ['Cash', 'Card', 'Tag'])->nullable()->after('type');
            $table->index('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tag_transactions', function (Blueprint $table) {
            $table->dropIndex(['tag_transactions_payment_method_index']);
            $table->dropColumn('payment_method');
        });
    }
};
