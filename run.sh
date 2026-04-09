#!/bin/bash
# PixTask Production Startup Script
# This script ensures the server starts correctly in production

echo "Starting PixTask Server..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Set production environment
export NODE_ENV=production
export PORT=5000

# Start the server
exec npx tsx server/index.ts