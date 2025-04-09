/**
 * Test Data Loading Script
 *
 * This script verifies that data is being loaded correctly from the JSON files.
 * Run with: node scripts/test-data.js
 */

const fs = require('fs');
const path = require('path');

// Data files paths
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const RESOURCES_FILE = path.join(DATA_DIR, 'resources.json');

// Load data from files
function loadData() {
  try {
    // Load users
    const users = fs.existsSync(USERS_FILE)
      ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
      : {};

    // Load messages
    const messages = fs.existsSync(MESSAGES_FILE)
      ? JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'))
      : [];

    // Load sessions
    const sessions = fs.existsSync(SESSIONS_FILE)
      ? JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'))
      : [];

    // Load resources
    const resources = fs.existsSync(RESOURCES_FILE)
      ? JSON.parse(fs.readFileSync(RESOURCES_FILE, 'utf8'))
      : [];

    return { users, messages, sessions, resources };
  } catch (error) {
    console.error('Error loading data files:', error);
    return {
      users: {},
      messages: [],
      sessions: [],
      resources: []
    };
  }
}

// Run the test
function testDataLoading() {
  console.log('Testing data loading...');

  const { users, messages, sessions, resources } = loadData();

  console.log('Users loaded:', Object.keys(users).length);
  console.log('Messages loaded:', messages.length);
  console.log('Sessions loaded:', sessions.length);
  console.log('Resources loaded:', resources.length);

  // Check for admin user
  if (users['admin1']) {
    console.log('Admin user found:', users['admin1'].email);
  } else {
    console.warn('Admin user not found!');
  }

  // Check for sample data
  if (messages.length > 0) {
    console.log('Sample message:', messages[0].content.substring(0, 30) + '...');
  }

  if (sessions.length > 0) {
    console.log('Sample session:', sessions[0].title);
  }

  if (resources.length > 0) {
    console.log('Sample resource:', resources[0].title);
  }

  console.log('Data loading test complete!');
}

// Run the test
testDataLoading();
