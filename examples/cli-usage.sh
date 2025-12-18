#!/bin/bash

# Example CLI usage for LLM Ecosystem Core
# This script demonstrates all CLI commands

echo "=== LLM Ecosystem Core CLI Examples ==="
echo ""

# Configuration
export MARKETPLACE_ENDPOINT="http://localhost:3001"
export ANALYTICS_ENDPOINT="http://localhost:3002"
export BENCHMARK_ENDPOINT="http://localhost:3003"

# Build the CLI first
echo "Building CLI..."
npm run build
echo ""

# Help commands
echo "=== Getting Help ==="
node dist/cli.js --help
echo ""

# Artifacts commands
echo "=== Artifacts Commands ==="
echo "1. List all artifacts:"
node dist/cli.js artifacts list
echo ""

echo "2. List artifacts with filters:"
node dist/cli.js artifacts list --type prompt --limit 5
echo ""

echo "3. Search artifacts:"
node dist/cli.js artifacts search "gpt-4 template"
echo ""

echo "4. Get artifact details:"
node dist/cli.js artifacts get art-001
echo ""

# Benchmarks commands
echo "=== Benchmarks Commands ==="
echo "1. List benchmarks:"
node dist/cli.js benchmarks list
echo ""

echo "2. Show leaderboard:"
node dist/cli.js benchmarks leaderboard mmlu --limit 10
echo ""

echo "3. Compare models:"
node dist/cli.js benchmarks compare gpt-4 claude-3 --benchmark mmlu
echo ""

# Analytics commands
echo "=== Analytics Commands ==="
echo "1. Get trends:"
node dist/cli.js analytics trends downloads --period weekly
echo ""

echo "2. Get usage statistics:"
node dist/cli.js analytics usage
echo ""

echo "3. Get artifact-specific usage:"
node dist/cli.js analytics usage --artifact art-001
echo ""

# Ecosystem commands
echo "=== Ecosystem Commands ==="
echo "1. Get ecosystem overview:"
node dist/cli.js ecosystem overview
echo ""

echo "2. Get trending artifacts:"
node dist/cli.js ecosystem trending
echo ""

# JSON output format
echo "=== JSON Output Format ==="
echo "Get artifacts in JSON format:"
node dist/cli.js artifacts list --format json
echo ""

echo "=== All examples completed ==="
