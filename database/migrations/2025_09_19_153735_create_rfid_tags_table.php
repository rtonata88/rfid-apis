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
        Schema::create('rfid_tags', function (Blueprint $table) {
            $table->id();
            $table->string('tag_uid')->unique();
            $table->string('short_code')->unique();
            $table->string('embedded_number')->nullable();
            $table->decimal('balance', 10, 2)->default(0.00);
            $table->enum('status', ['active', 'inactive', 'blocked'])->default('active');
            $table->boolean('is_issued')->default(false);
            $table->timestamp('issued_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');

            // Add indexes for performance
            $table->index('tag_uid');
            $table->index('short_code');
            $table->index('embedded_number');
            $table->index('is_issued');
            $table->index(['status', 'is_issued']);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rfid_tags');
    }
};
