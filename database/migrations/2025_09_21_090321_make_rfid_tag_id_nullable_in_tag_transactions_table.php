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
            // Drop the foreign key constraint first
            $table->dropForeign(['rfid_tag_id']);
            
            // Modify the column to be nullable
            $table->foreignId('rfid_tag_id')->nullable()->change();
            
            // Re-add the foreign key constraint with nullable support
            $table->foreign('rfid_tag_id')->references('id')->on('rfid_tags')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tag_transactions', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['rfid_tag_id']);
            
            // Make the column non-nullable again
            $table->foreignId('rfid_tag_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint
            $table->foreign('rfid_tag_id')->references('id')->on('rfid_tags')->onDelete('cascade');
        });
    }
};