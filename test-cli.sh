#!/bin/bash

# Quick test script for CLI functionality
# Compiles and tests the CLI independently

echo "Testing LLM Ecosystem Core CLI..."
echo ""

# Compile just the CLI file
echo "Compiling CLI..."
npx tsc src/cli.ts --outDir dist --esModuleInterop --skipLibCheck --resolveJsonModule
echo ""

# Test help command
echo "Testing --help:"
node dist/cli.js --help
echo ""

# Test artifacts list
echo "Testing artifacts list:"
node dist/cli.js artifacts list --format table
echo ""

# Test artifacts list JSON
echo "Testing artifacts list (JSON):"
node dist/cli.js artifacts list --format json
echo ""

# Test artifacts search
echo "Testing artifacts search:"
node dist/cli.js artifacts search "gpt-4"
echo ""

echo "CLI test completed!"
