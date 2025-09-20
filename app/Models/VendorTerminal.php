<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorTerminal extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'terminal_name',
        'terminal_id',
        'location',
        'status',
        'operated_by',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operated_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(TagTransaction::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
