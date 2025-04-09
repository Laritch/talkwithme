#!/bin/bash

# Start LetsChat Application
echo "Starting LetsChat application..."

# Ensure we're in the project root directory
cd "$(dirname "$0")/.."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one from .env.example"
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Seed admin user if not already done
echo "Ensuring admin user exists..."
node scripts/seed-admin.js

# Start the server
echo "Starting server..."
node server.js
