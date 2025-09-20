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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('sku')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_available')->default(true);
            $table->integer('stock_quantity')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('vendor_id');
            $table->index('name');
            $table->index('category');
            $table->index('is_available');
            $table->index(['vendor_id', 'is_available']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
