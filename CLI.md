# LLM Ecosystem Core CLI

Command-line interface for LLM-Ecosystem-Core providing access to ecosystem aggregation features.

## Installation

```bash
npm install -g llm-ecosystem-core
```

Or use locally:

```bash
npm install
npm run build
npm run cli -- <command>
```

## Configuration

Configure API endpoints via environment variables:

```bash
export MARKETPLACE_ENDPOINT=http://localhost:3001
export ANALYTICS_ENDPOINT=http://localhost:3002
export BENCHMARK_ENDPOINT=http://localhost:3003
```

## Commands

### Artifacts

List shared artifacts from marketplace:
```bash
ecosystem-core artifacts list
ecosystem-core artifacts list --type prompt --limit 5
```

Search artifacts:
```bash
ecosystem-core artifacts search "gpt-4 template"
```

Get artifact details:
```bash
ecosystem-core artifacts get art-001
```

### Benchmarks

List available benchmarks:
```bash
ecosystem-core benchmarks list
```

Show benchmark leaderboard:
```bash
ecosystem-core benchmarks leaderboard mmlu
ecosystem-core benchmarks leaderboard mmlu --limit 10
```

Compare models:
```bash
ecosystem-core benchmarks compare gpt-4 claude-3 --benchmark mmlu
```

### Analytics

Get ecosystem trends:
```bash
ecosystem-core analytics trends downloads
ecosystem-core analytics trends downloads --period weekly
```

Get usage statistics:
```bash
ecosystem-core analytics usage
ecosystem-core analytics usage --artifact art-001
```

### Ecosystem

Get full ecosystem overview:
```bash
ecosystem-core ecosystem overview
```

Get trending artifacts:
```bash
ecosystem-core ecosystem trending
```

## Output Formats

### Table Format (Default)

```bash
ecosystem-core artifacts list
```

Output:
```
+--------+----------------------+--------+------------+--------+
| id     | name                 | type   | downloads  | rating |
+--------+----------------------+--------+------------+--------+
| art-001| GPT-4 Prompt Template| prompt | 1542       | 4.8    |
| art-002| Claude Code Snippets | code   | 892        | 4.6    |
+--------+----------------------+--------+------------+--------+
```

### JSON Format

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
    "downloads": 1542,
    "rating": 4.8
  },
  {
    "id": "art-002",
    "name": "Claude Code Snippets",
    "type": "code",
    "downloads": 892,
    "rating": 4.6
  }
]
```

## Help

Get general help:
```bash
ecosystem-core --help
```

Get command-specific help:
```bash
ecosystem-core artifacts --help
ecosystem-core benchmarks --help
ecosystem-core analytics --help
ecosystem-core ecosystem --help
```

## Examples

```bash
# List top 5 prompt artifacts
ecosystem-core artifacts list --type prompt --limit 5

# Search for GPT-4 related artifacts
ecosystem-core artifacts search "gpt-4"

# Get details about a specific artifact
ecosystem-core artifacts get art-001

# View MMLU benchmark leaderboard
ecosystem-core benchmarks leaderboard mmlu --limit 10

# Compare two models on MMLU
ecosystem-core benchmarks compare gpt-4 claude-3 --benchmark mmlu

# Get weekly download trends
ecosystem-core analytics trends downloads --period weekly

# Get usage stats for a specific artifact
ecosystem-core analytics usage --artifact art-001

# Get ecosystem overview
ecosystem-core ecosystem overview

# Get trending artifacts
ecosystem-core ecosystem trending

# Output as JSON for scripting
ecosystem-core artifacts list --format json | jq '.[] | select(.rating > 4.5)'
```

## Development

Build the CLI:
```bash
npm run build
```

Run locally:
```bash
node dist/cli.js artifacts list
# or
npm run cli -- artifacts list
```

## API Integration

The CLI currently uses mock data for demonstration. To integrate with real APIs:

1. Set the appropriate environment variables for your API endpoints
2. The `apiCall` function in `/workspaces/ecosystem-core/src/cli.ts` can be updated to use actual HTTP requests (e.g., with `fetch` or `axios`)
3. Replace the `mockApiResponse` function with real API responses

Example integration with fetch:

```typescript
async function apiCall(endpoint: string, path: string): Promise<any> {
  const response = await fetch(`${endpoint}${path}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}
```
