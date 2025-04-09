# Enhanced Chat System - Login Documentation

## Login System

The Enhanced Chat System includes a secure login system with both regular user authentication and admin access capabilities. This document outlines how to use the login system and provides admin login details.

## Accessing the Login Page

1. Open the application in your browser
2. Click the "Login" button on the home page, or navigate directly to `/login.html`
3. You'll see a login form with options to sign in or register

## User Registration

New users can register by:

1. Clicking the "Register" tab
2. Filling out the registration form with:
   - Username (at least 3 characters)
   - Valid email address
   - Secure password (minimum 6 characters)
   - Password confirmation
3. Clicking "Create Account"

## User Login

Existing users can log in by:

1. Entering their email address
2. Entering their password
3. Clicking "Sign In"

## Admin Login Details

For administrative access, you can use the pre-configured admin account:

- **Email:** admin@chat.com
- **Password:** admin123

You can also use the convenient "Admin Login" button on the login page to automatically fill in these credentials.

## Admin Features

When logged in as an admin, you'll have access to:

1. All standard chat functionality
2. Admin Panel (accessible via the "Admin Panel" button in the top right)
3. User management capabilities
4. System statistics and monitoring
5. Message moderation tools

## Authentication Security

The system implements several security measures:

- JWT (JSON Web Token) for secure authentication
- Password hashing with bcrypt
- Token-based API protection
- Automatic session timeout after 30 days

## Seeding the Admin User

If the admin user doesn't exist in your database, you can seed it by running:

```
npm run seed-admin
```

This will create the admin user with the credentials specified above.

## Troubleshooting

If you encounter login issues:

1. Ensure your database connection is working properly
2. Verify that the admin user has been seeded
3. Check that the JWT_SECRET is properly set in your .env file
4. Clear browser cookies and cache if experiencing persistent problems

For additional support, please contact the system administrator.
