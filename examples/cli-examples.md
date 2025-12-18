# CLI Usage Examples

This document provides comprehensive examples of using the LLM Ecosystem Core CLI.

## Setup

### Installation

```bash
# Global installation
npm install -g llm-ecosystem-core

# Or use from source
git clone <repository>
cd ecosystem-core
npm install
npm run build
```

### Configuration

Set API endpoints via environment variables:

```bash
export MARKETPLACE_ENDPOINT="http://localhost:3001"
export ANALYTICS_ENDPOINT="http://localhost:3002"
export BENCHMARK_ENDPOINT="http://localhost:3003"
```

## Command Examples

### Artifacts Commands

#### List Artifacts

List all artifacts with default settings:
```bash
ecosystem-core artifacts list
```

Output:
```
+---------+-----------------------+--------+-------------+-----------+--------+
| id      | name                  | type   | source      | downloads | rating |
+---------+-----------------------+--------+-------------+-----------+--------+
| art-001 | GPT-4 Prompt Template | prompt | marketplace | 1542      | 4.8    |
| art-002 | Claude Code Snippets  | code   | marketplace | 892       | 4.6    |
+---------+-----------------------+--------+-------------+-----------+--------+
```

Filter by type:
```bash
ecosystem-core artifacts list --type prompt
```

Limit results:
```bash
ecosystem-core artifacts list --limit 5
```

Combine filters:
```bash
ecosystem-core artifacts list --type prompt --limit 5
```

Get JSON output:
```bash
ecosystem-core artifacts list --format json
```

Output:
```json
[
  {
    "id": "art-001",
    "name": "GPT-4 Prompt Template",
    "type": "prompt",
    "source": "marketplace",
    "downloads": 1542,
    "rating": 4.8
  }
]
```

#### Search Artifacts

Search by keyword:
```bash
ecosystem-core artifacts search "gpt-4"
```

Search with multiple words:
```bash
ecosystem-core artifacts search "prompt template gpt-4"
```

#### Get Artifact Details

Get detailed information about a specific artifact:
```bash
ecosystem-core artifacts get art-001
```

Output:
```
id: art-001
name: GPT-4 Prompt Template
type: prompt
source: marketplace
description: Advanced prompt template for GPT-4
author: john-doe
version: 1.2.0
downloads: 1542
rating: 4.8
tags: ["gpt4","prompts","templates"]
createdAt: 2024-01-15T00:00:00.000Z
```

### Benchmarks Commands

#### List Benchmarks

List all available benchmarks:
```bash
ecosystem-core benchmarks list
```

Output:
```
+------------+----------+----------+
| id         | name     | category |
+------------+----------+----------+
| bench-001  | MMLU     | general  |
| bench-002  | HumanEval| coding   |
+------------+----------+----------+
```

#### Show Leaderboard

Show top performers for a benchmark:
```bash
ecosystem-core benchmarks leaderboard mmlu
```

Output:
```
+----------+-----------+-------+------+
| modelId  | modelName | score | rank |
+----------+-----------+-------+------+
| gpt-4    | GPT-4     | 86.4  | 1    |
| claude-3 | Claude 3  | 84.2  | 2    |
+----------+-----------+-------+------+
```

Limit leaderboard entries:
```bash
ecosystem-core benchmarks leaderboard mmlu --limit 10
```

Get leaderboard in JSON:
```bash
ecosystem-core benchmarks leaderboard mmlu --format json
```

#### Compare Models

Compare two models on a specific benchmark:
```bash
ecosystem-core benchmarks compare gpt-4 claude-3 --benchmark mmlu
```

Output:
```
benchmark: MMLU
models: [
  {
    "modelId": "gpt-4",
    "score": 86.4,
    "rank": 1
  },
  {
    "modelId": "claude-3",
    "score": 84.2,
    "rank": 2
  }
]
difference: 2.2
```

### Analytics Commands

#### Get Trends

Get trend data for a metric:
```bash
ecosystem-core analytics trends downloads
```

Get trends with specific period:
```bash
ecosystem-core analytics trends downloads --period daily
ecosystem-core analytics trends downloads --period weekly
ecosystem-core analytics trends downloads --period monthly
```

Get trends in JSON format:
```bash
ecosystem-core analytics trends downloads --period weekly --format json
```

#### Get Usage Statistics

Get overall usage statistics:
```bash
ecosystem-core analytics usage
```

Output:
```
totalArtifacts: 1234
totalDownloads: 45678
activeUsers: 789
```

Get usage for specific artifact:
```bash
ecosystem-core analytics usage --artifact art-001
```

### Ecosystem Commands

#### Get Ecosystem Overview

Get comprehensive ecosystem overview:
```bash
ecosystem-core ecosystem overview
```

Output:
```
usage: {
  "totalArtifacts": 1234,
  "totalDownloads": 45678,
  "activeUsers": 789
}
trends: []
topArtifacts: [
  {
    "id": "art-001",
    "name": "GPT-4 Prompt Template",
    "type": "prompt",
    "score": 95
  }
]
lastUpdated: "2025-12-18T04:30:21.198Z"
```

Get overview in JSON:
```bash
ecosystem-core ecosystem overview --format json
```

#### Get Trending Artifacts

Get currently trending artifacts:
```bash
ecosystem-core ecosystem trending
```

Output:
```
+---------+-----------------------+----------+-------+
| id      | name                  | type     | score |
+---------+-----------------------+----------+-------+
| art-001 | GPT-4 Prompt Template | prompt   | 95    |
| art-003 | LangChain Helper      | library  | 88    |
+---------+-----------------------+----------+-------+
```

## Advanced Usage

### Piping to jq for JSON Processing

Filter high-rated artifacts:
```bash
ecosystem-core artifacts list --format json | jq '.[] | select(.rating > 4.5)'
```

Extract specific fields:
```bash
ecosystem-core artifacts list --format json | jq '.[] | {id, name, rating}'
```

Count results:
```bash
ecosystem-core artifacts list --format json | jq 'length'
```

### Scripting Examples

#### Bash Script to Monitor Trends

```bash
#!/bin/bash

# Monitor download trends
echo "Daily download trends:"
ecosystem-core analytics trends downloads --period daily --format json | \
  jq '.values[] | "\(.timestamp): \(.value) downloads"'

# Get top artifacts
echo -e "\nTop artifacts:"
ecosystem-core ecosystem trending --format json | \
  jq -r '.[] | "\(.name) (Score: \(.score))"'
```

#### Monitor Benchmark Performance

```bash
#!/bin/bash

BENCHMARK="mmlu"
MODEL1="gpt-4"
MODEL2="claude-3"

echo "Comparing $MODEL1 vs $MODEL2 on $BENCHMARK:"
ecosystem-core benchmarks compare $MODEL1 $MODEL2 --benchmark $BENCHMARK --format json | \
  jq '{benchmark, difference, winner: .models[0].modelId}'
```

### Environment-Specific Configuration

Development:
```bash
export MARKETPLACE_ENDPOINT="http://localhost:3001"
export ANALYTICS_ENDPOINT="http://localhost:3002"
export BENCHMARK_ENDPOINT="http://localhost:3003"
```

Staging:
```bash
export MARKETPLACE_ENDPOINT="https://staging-marketplace.example.com"
export ANALYTICS_ENDPOINT="https://staging-analytics.example.com"
export BENCHMARK_ENDPOINT="https://staging-benchmark.example.com"
```

Production:
```bash
export MARKETPLACE_ENDPOINT="https://marketplace.example.com"
export ANALYTICS_ENDPOINT="https://analytics.example.com"
export BENCHMARK_ENDPOINT="https://benchmark.example.com"
```

## Help System

### General Help

```bash
ecosystem-core --help
```

### Command-Specific Help

```bash
ecosystem-core artifacts --help
ecosystem-core benchmarks --help
ecosystem-core analytics --help
ecosystem-core ecosystem --help
```

## Error Handling

### Missing Required Arguments

```bash
$ ecosystem-core artifacts search
Error: search query is required
```

### Invalid Command

```bash
$ ecosystem-core invalid command
Unknown command: invalid
```

### API Errors

When API endpoints are unreachable:
```bash
$ ecosystem-core artifacts list
[API] http://localhost:3001/artifacts?limit=10
Error: Failed to fetch artifacts
```

## Tips and Best Practices

1. **Use JSON format for scripting**: Always use `--format json` when integrating with other tools
2. **Set environment variables**: Configure endpoints once in your shell profile
3. **Use help liberally**: Each command group has detailed help with examples
4. **Combine with jq**: For advanced JSON processing and filtering
5. **Check exit codes**: CLI returns non-zero exit codes on errors for script integration

## Common Use Cases

### Daily Monitoring Dashboard

```bash
#!/bin/bash

echo "=== LLM Ecosystem Daily Report ==="
echo ""

echo "Top Trending Artifacts:"
ecosystem-core ecosystem trending --limit 5
echo ""

echo "Download Trends (Last 7 days):"
ecosystem-core analytics trends downloads --period daily
echo ""

echo "Benchmark Leaderboard (MMLU):"
ecosystem-core benchmarks leaderboard mmlu --limit 5
echo ""
```

### Artifact Discovery

```bash
# Find all prompt templates
ecosystem-core artifacts list --type prompt --format json | \
  jq '.[] | select(.rating > 4.5) | {name, rating, downloads}'

# Search for specific topics
ecosystem-core artifacts search "code generation" --format json
```

### Performance Analysis

```bash
# Compare top models across benchmark
ecosystem-core benchmarks leaderboard mmlu --limit 2 --format json | \
  jq -r '.[0].modelId, .[1].modelId' | \
  xargs -n2 bash -c 'ecosystem-core benchmarks compare $0 $1 --benchmark mmlu'
```
