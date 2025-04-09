/**
 * API Testing Script
 *
 * This script tests the LetsChat API endpoints to ensure they are working correctly.
 * It requires the server to be running before execution.
 *
 * Run with: node scripts/test-api.js
 */

const http = require('http');
const https = require('https');
const querystring = require('querystring');
const { URL } = require('url');

// Configuration
const API_BASE = 'http://localhost:4000/api';
let authToken = null;

// Helper function to make HTTP requests
function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
    const options = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Use the right client based on protocol
    const client = url.protocol === 'https:' ? https : http;

    const req = client.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          console.error('Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testLoginEndpoint() {
  console.log('\n----- Testing Login Endpoint -----');

  try {
    // Try with invalid credentials first
    console.log('Testing with invalid credentials...');
    const invalidResponse = await request('POST', '/auth/login', {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });

    console.log(`Status code: ${invalidResponse.statusCode}`);
    console.log(`Response: ${JSON.stringify(invalidResponse.data, null, 2)}`);

    // Now try with valid credentials
    console.log('\nTesting with valid credentials...');
    const validResponse = await request('POST', '/auth/login', {
      email: 'admin@chat.com',
      password: 'admin123'
    });

    console.log(`Status code: ${validResponse.statusCode}`);
    console.log(`Success: ${validResponse.statusCode === 200}`);

    if (validResponse.statusCode === 200 && validResponse.data.token) {
      authToken = validResponse.data.token;
      console.log('Successfully obtained authentication token');
    } else {
      console.error('Failed to obtain authentication token');
    }
  } catch (error) {
    console.error('Error testing login endpoint:', error);
  }
}

async function testGetUsers() {
  console.log('\n----- Testing Get Users Endpoint -----');

  if (!authToken) {
    console.error('Authentication token not available. Please login first.');
    return;
  }

  try {
    const response = await request('GET', '/users', null, authToken);

    console.log(`Status code: ${response.statusCode}`);
    console.log(`Success: ${response.statusCode === 200}`);

    if (response.statusCode === 200) {
      console.log(`Retrieved ${response.data.length} users`);
    }
  } catch (error) {
    console.error('Error testing get users endpoint:', error);
  }
}

async function testGetMessages() {
  console.log('\n----- Testing Get Messages Endpoint -----');

  if (!authToken) {
    console.error('Authentication token not available. Please login first.');
    return;
  }

  try {
    const response = await request('GET', '/messages', null, authToken);

    console.log(`Status code: ${response.statusCode}`);
    console.log(`Success: ${response.statusCode === 200}`);

    if (response.statusCode === 200) {
      console.log(`Retrieved ${response.data.length} messages`);
    }
  } catch (error) {
    console.error('Error testing get messages endpoint:', error);
  }
}

async function testGetResources() {
  console.log('\n----- Testing Get Resources Endpoint -----');

  if (!authToken) {
    console.error('Authentication token not available. Please login first.');
    return;
  }

  try {
    const response = await request('GET', '/resources', null, authToken);

    console.log(`Status code: ${response.statusCode}`);
    console.log(`Success: ${response.statusCode === 200}`);

    if (response.statusCode === 200) {
      console.log(`Retrieved ${response.data.length} resources`);
    }
  } catch (error) {
    console.error('Error testing get resources endpoint:', error);
  }
}

async function testLogoutEndpoint() {
  console.log('\n----- Testing Logout Endpoint -----');

  if (!authToken) {
    console.error('Authentication token not available. Please login first.');
    return;
  }

  try {
    const response = await request('POST', '/auth/logout', null, authToken);

    console.log(`Status code: ${response.statusCode}`);
    console.log(`Success: ${response.statusCode === 200}`);

    if (response.statusCode === 200) {
      authToken = null;
      console.log('Successfully logged out');
    }
  } catch (error) {
    console.error('Error testing logout endpoint:', error);
  }
}

// Run tests
async function runTests() {
  console.log('Starting API tests...');
  console.log('======================');

  try {
    // Test authentication
    await testLoginEndpoint();

    if (authToken) {
      // Test data endpoints
      await testGetUsers();
      await testGetMessages();
      await testGetResources();

      // Logout
      await testLogoutEndpoint();
    }

    console.log('\n======================');
    console.log('API tests completed');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Entry point
runTests().catch(error => {
  console.error('Fatal error:', error);
});
