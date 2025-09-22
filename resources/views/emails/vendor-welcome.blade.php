<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Hi-Events</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .welcome-message {
            background-color: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            margin: 20px 0;
        }
        .important-info {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
        }
        .login-instructions {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
        }
        .contact-info {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 20px;
        }
        h2 {
            color: #374151;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .credential {
            font-family: 'Courier New', monospace;
            background-color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Hi-Events</div>
            <p>Vendor Management System</p>
        </div>

        <h1>Welcome to Hi-Events, {{ $vendor->contact_person ?? $vendor->name }}!</h1>

        <div class="welcome-message">
            <p><strong>Congratulations!</strong> Your vendor account has been successfully created in the Hi-Events system.</p>
        </div>

        <h2>📋 Your Vendor Details</h2>
        <ul>
            <li><strong>Vendor Name:</strong> {{ $vendor->name }}</li>
            <li><strong>Contact Person:</strong> {{ $vendor->contact_person ?? 'Not specified' }}</li>
            <li><strong>Contact Email:</strong> {{ $vendor->contact_email ?? 'Not specified' }}</li>
            @if($vendor->contact_phone)
            <li><strong>Contact Phone:</strong> {{ $vendor->contact_phone }}</li>
            @endif
            <li><strong>Status:</strong> {{ ucfirst($vendor->status) }}</li>
        </ul>

        @if($vendor->user)
        <div class="important-info">
            <h2>🔐 Account Security - IMPORTANT</h2>
            <p><strong>Please change your password immediately after logging in.</strong></p>
            <p>Your login credentials:</p>
            <ul>
                <li><strong>Email:</strong> <span class="credential">{{ $vendor->user->email }}</span></li>
                @if($temporaryPassword)
                <li><strong>Temporary Password:</strong> <span class="credential">{{ $temporaryPassword }}</span></li>
                @else
                <li><strong>Password:</strong> Use the password provided to you separately</li>
                @endif
            </ul>
        </div>

        <div class="login-instructions">
            <h2>🚀 Getting Started</h2>
            <p>To access your vendor dashboard and start managing your products:</p>
            <ol>
                <li>Visit the Hi-Events vendor portal: <strong>{{ config('app.url') }}/login</strong></li>
                <li>Log in using your email and the temporary password provided</li>
                <li><strong>Immediately change your password</strong> from the profile settings</li>
                <li>Complete your vendor profile information</li>
                <li>Start adding your products to the system</li>
            </ol>
            
            <div style="text-align: center; margin: 20px 0;">
                <a href="{{ config('app.url') }}/login" class="button">Login to Your Account</a>
            </div>
        </div>
        @endif

        <h2>📦 Managing Your Products</h2>
        <p>Once you're logged in, you'll be able to:</p>
        <ul>
            <li>Add new products with descriptions, prices, and images</li>
            <li>Manage your product inventory and availability</li>
            <li>View sales reports and transaction history</li>
            <li>Update your vendor profile and contact information</li>
            <li>Monitor your vendor terminal operations</li>
        </ul>

        <h2>💼 Vendor Support</h2>
        <p>If you need any assistance or have questions about:</p>
        <ul>
            <li>Setting up your products</li>
            <li>Using the vendor dashboard</li>
            <li>Technical support</li>
            <li>Account-related inquiries</li>
        </ul>

        <p>Please don't hesitate to contact our support team. We're here to help you succeed!</p>

        <div class="contact-info">
            <p><strong>Hi-Events Support Team</strong></p>
            <p>Email: support@hi-events.com | Phone: +1-555-EVENTS</p>
            <p>Business Hours: Monday - Friday, 9:00 AM - 6:00 PM</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
            This email was sent to {{ $vendor->contact_email ?? $vendor->user->email ?? 'you' }} because a vendor account was created for you in the Hi-Events system.
            <br>
            If you believe this was sent in error, please contact our support team immediately.
        </p>
    </div>
</body>
</html>
