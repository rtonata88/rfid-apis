<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'contact_person',
        'contact_email',
        'contact_phone',
        'status',
        'user_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function terminals(): HasMany
    {
        return $this->hasMany(VendorTerminal::class);
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
