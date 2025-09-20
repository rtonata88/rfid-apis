<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin
        User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@hievents.com',
            'password' => Hash::make('password123'),
            'user_type' => 'SUPER_ADMIN',
            'email_verified_at' => now(),
        ]);

        // Create Event Admin
        User::create([
            'name' => 'Event Manager',
            'email' => 'eventadmin@hievents.com',
            'password' => Hash::make('password123'),
            'user_type' => 'EVENT_ADMIN',
            'email_verified_at' => now(),
        ]);

        // Create Vendor User
        User::create([
            'name' => 'John Vendor',
            'email' => 'vendor@hievents.com',
            'password' => Hash::make('password123'),
            'user_type' => 'VENDOR',
            'email_verified_at' => now(),
        ]);

        // Create Attendee User
        User::create([
            'name' => 'Jane Attendee',
            'email' => 'attendee@hievents.com',
            'password' => Hash::make('password123'),
            'user_type' => 'ATTENDEE',
            'email_verified_at' => now(),
        ]);

        // Create additional users for testing
        User::create([
            'name' => 'Mike Food Vendor',
            'email' => 'food.vendor@hievents.com',
            'password' => Hash::make('password123'),
            'user_type' => 'VENDOR',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Sarah Attendee',
            'email' => 'sarah.attendee@hievents.com',
            'password' => Hash::make('password123'),
            'user_type' => 'ATTENDEE',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'David Event Staff',
            'email' => 'david.staff@hievents.com',
            'password' => Hash::make('password123'),
            'user_type' => 'EVENT_ADMIN',
            'email_verified_at' => now(),
        ]);
    }
}
