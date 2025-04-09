/**
 * Admin User Seed Script
 *
 * This script creates an admin user in the database.
 * Run with: npm run seed-admin
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// In a real application, this would connect to an actual database
// For this demo, we'll simulate by updating a JSON file

// Default admin credentials - in a real app, these should be environment variables
const DEFAULT_ADMIN_EMAIL = 'admin@chat.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

// Path to our mock database file
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

// Create the admin user
async function seedAdmin() {
  console.log('Seeding admin user...');

  // Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory');
  }

  // Check if avatars directory exists
  if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
    console.log('Created avatars directory');
  }

  // Check if admin avatar exists
  const adminAvatarPath = path.join(AVATARS_DIR, 'admin1.png');
  if (!fs.existsSync(adminAvatarPath)) {
    console.log('Admin avatar not found. Please run the following command to create it:');
    console.log('curl -o uploads/avatars/admin1.png https://previews.123rf.com/images/burntime555/burntime5551703/burntime555170300849/73889591-administrator-icon-vector-flat-simple-blue-pictogram-in-a-circle-illustration-symbol.jpg');
  } else {
    console.log('Admin avatar found at', adminAvatarPath);
  }

  // Load existing users or create empty object
  let users = {};
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
      console.log('Loaded existing users');
    } catch (err) {
      console.error('Error reading users file:', err);
      console.log('Creating new users file');
    }
  }

  // Create or update admin user
  const adminId = 'admin1';
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  users[adminId] = {
    id: adminId,
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: passwordHash,
    name: 'Admin User',
    role: 'admin',
    status: 'online',
    avatar: '/uploads/avatars/admin1.png',
    createdAt: new Date().toISOString()
  };

  // Save users back to file
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  console.log(`Admin user created/updated with email: ${DEFAULT_ADMIN_EMAIL}`);
  console.log('You can now log in with these credentials.');
}

// Run the seed function
seedAdmin().catch(err => {
  console.error('Error seeding admin user:', err);
  process.exit(1);
});
