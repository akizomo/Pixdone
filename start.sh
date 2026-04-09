#!/bin/bash

# PixTask Server Startup Script
# This script starts the Node.js server properly for deployment

echo "Starting PixTask Server..."

# Navigate to the project directory
cd /app || cd .

# Start the server
exec tsx server/index.ts