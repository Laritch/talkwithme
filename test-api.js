/**
 * Test script to simulate API requests
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Create test results file
const resultsFile = path.join(resultsDir, `test-results-${Date.now()}.log`);

// Log to both console and file
const log = (message) => {
  console.log(message);
  fs.appendFileSync(resultsFile, message + '\n');
};

const makeRequest = async (url, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    log(`${method} ${url}...`);

    try {
      const response = await fetch(url, options);
      const status = response.status;

      try {
        const data = await response.json();
        log(`Response (${status}): ${JSON.stringify(data, null, 2)}`);
        return { status, data };
      } catch (jsonError) {
        const text = await response.text();
        log(`Response (${status}): ${text}`);
        return { status, text };
      }
    } catch (fetchError) {
      log(`Fetch error: ${fetchError.message}`);
      return { error: fetchError.message };
    }
  } catch (error) {
    log(`Error: ${error.message}`);
    return { error: error.message };
  }
};

// Run a series of tests
const runTests = async () => {
  log('Starting API tests...');
  log(`Test results will be saved to: ${resultsFile}`);
  log(`Timestamp: ${new Date().toISOString()}`);
  log('-'.repeat(50));

  try {
    // Test the test endpoint
    log('\n1. Testing /api/test endpoint:');
    await makeRequest('http://localhost:3004/api/test');

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test the error endpoint
    log('\n2. Testing /api/error endpoint:');
    await makeRequest('http://localhost:3004/api/error');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test validation with invalid data
    log('\n3. Testing validation with invalid data:');
    await makeRequest('http://localhost:3004/api/validate', 'POST', {
      name: 'Jo', // too short
      email: 'not-an-email' // invalid email
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test validation with valid data
    log('\n4. Testing validation with valid data:');
    await makeRequest('http://localhost:3004/api/validate', 'POST', {
      name: 'John Doe',
      email: 'john@example.com'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test a non-existent endpoint
    log('\n5. Testing non-existent endpoint:');
    await makeRequest('http://localhost:3004/api/nonexistent');
  } catch (error) {
    log(`Test execution error: ${error.message}`);
  }

  log('-'.repeat(50));
  log('API tests completed!');
  log(`See full results in: ${resultsFile}`);
};

// Run tests
runTests().catch(error => {
  console.error('Test run failed:', error);
  fs.appendFileSync(resultsFile, `FATAL ERROR: ${error.message}\n`);
});
