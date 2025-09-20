<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RfidTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'tag_uid',
        'hex_number',
        'short_code',
        'embedded_number',
        'is_issued',
        'balance',
        'status',
        'issued_at',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'is_issued' => 'boolean',
        'issued_at' => 'datetime',
    ];

    public function attendee(): HasOne
    {
        return $this->hasOne(TagAttendee::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(TagTransaction::class);
    }

    public function getUser()
    {
        return $this->attendee?->user;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function addBalance(float $amount): void
    {
        $this->increment('balance', $amount);
    }

    public function deductBalance(float $amount): bool
    {
        if ($this->balance >= $amount) {
            $this->decrement('balance', $amount);
            return true;
        }
        return false;
    }
}
