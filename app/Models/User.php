<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'user_type',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function vendor(): HasOne
    {
        return $this->hasOne(Vendor::class);
    }

    public function tagAttendee(): HasOne
    {
        return $this->hasOne(TagAttendee::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(TagTransaction::class);
    }

    public function operatedTerminals(): HasMany
    {
        return $this->hasMany(VendorTerminal::class, 'operated_by');
    }

    public function isAttendee(): bool
    {
        return $this->user_type === 'ATTENDEE';
    }

    public function isEventAdmin(): bool
    {
        return $this->user_type === 'EVENT_ADMIN';
    }

    public function isVendor(): bool
    {
        return $this->user_type === 'VENDOR';
    }

    public function isSuperAdmin(): bool
    {
        return $this->user_type === 'SUPER_ADMIN';
    }
}
