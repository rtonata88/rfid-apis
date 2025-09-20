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
        Schema::create('tag_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfid_tag_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('attendee_name');
            $table->string('attendee_email');
            $table->string('attendee_phone')->nullable();
            $table->timestamp('linked_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index('rfid_tag_id');
            $table->index('user_id');
            $table->index('attendee_email');
            $table->index('linked_at');

            // Ensure one attendee per tag
            $table->unique('rfid_tag_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tag_attendees');
    }
};
