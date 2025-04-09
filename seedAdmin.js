import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import connectDB from './db.js';

dotenv.config();

// Admin user details
const adminUser = {
  username: 'admin',
  email: 'admin@chat.com',
  password: 'admin123',
  isAdmin: true,
  status: 'online',
  statusMessage: 'System Administrator'
};

// Function to seed admin user
const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create new admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);

    const newAdmin = new User({
      ...adminUser,
      password: hashedPassword
    });

    await newAdmin.save();
    console.log('Admin user created successfully');

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

// Run the seeding process
seedAdmin();

export default seedAdmin;
