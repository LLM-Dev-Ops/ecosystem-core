# CLI Quick Reference

## Installation

```bash
npm install -g llm-ecosystem-core
```

## Configuration

```bash
export MARKETPLACE_ENDPOINT="http://localhost:3001"
export ANALYTICS_ENDPOINT="http://localhost:3002"
export BENCHMARK_ENDPOINT="http://localhost:3003"
```

## Commands Quick Reference

### Artifacts

| Command | Description | Example |
|---------|-------------|---------|
| `artifacts list` | List all artifacts | `ecosystem-core artifacts list` |
| `artifacts list --type <type>` | Filter by type | `ecosystem-core artifacts list --type prompt` |
| `artifacts list --limit <n>` | Limit results | `ecosystem-core artifacts list --limit 5` |
| `artifacts search <query>` | Search artifacts | `ecosystem-core artifacts search "gpt-4"` |
| `artifacts get <id>` | Get artifact details | `ecosystem-core artifacts get art-001` |

### Benchmarks

| Command | Description | Example |
|---------|-------------|---------|
| `benchmarks list` | List benchmarks | `ecosystem-core benchmarks list` |
| `benchmarks leaderboard <id>` | Show leaderboard | `ecosystem-core benchmarks leaderboard mmlu` |
| `benchmarks leaderboard <id> --limit <n>` | Limit leaderboard | `ecosystem-core benchmarks leaderboard mmlu --limit 10` |
| `benchmarks compare <m1> <m2> --benchmark <id>` | Compare models | `ecosystem-core benchmarks compare gpt-4 claude-3 --benchmark mmlu` |

### Analytics

| Command | Description | Example |
|---------|-------------|---------|
| `analytics trends <metric>` | Get trends | `ecosystem-core analytics trends downloads` |
| `analytics trends <metric> --period <p>` | Get trends by period | `ecosystem-core analytics trends downloads --period weekly` |
| `analytics usage` | Get usage stats | `ecosystem-core analytics usage` |
| `analytics usage --artifact <id>` | Get artifact usage | `ecosystem-core analytics usage --artifact art-001` |

### Ecosystem

| Command | Description | Example |
|---------|-------------|---------|
| `ecosystem overview` | Get overview | `ecosystem-core ecosystem overview` |
| `ecosystem trending` | Get trending artifacts | `ecosystem-core ecosystem trending` |

## Global Options

| Option | Description | Values |
|--------|-------------|--------|
| `--format <format>` | Output format | `json`, `table` (default) |
| `--help` | Show help | - |

## Output Formats

### Table (Default)

```bash
ecosystem-core artifacts list
```

```
+---------+-----------------------+--------+
| id      | name                  | type   |
+---------+-----------------------+--------+
| art-001 | GPT-4 Prompt Template | prompt |
+---------+-----------------------+--------+
```

### JSON

```bash
ecosystem-core artifacts list --format json
```

```json
[
  {
    "id": "art-001",
    "name": "GPT-4 Prompt Template",
    "type": "prompt"
  }
]
```

## Common Usage Patterns

### Find High-Rated Prompts

```bash
ecosystem-core artifacts list --type prompt --format json | \
  jq '.[] | select(.rating > 4.5)'
```

### Monitor Daily Trends

```bash
ecosystem-core analytics trends downloads --period daily
```

### Compare Top Models

```bash
ecosystem-core benchmarks compare gpt-4 claude-3 --benchmark mmlu
```

### Get Trending Artifacts

```bash
ecosystem-core ecosystem trending --limit 10
```

## Help Commands

```bash
ecosystem-core --help                    # General help
ecosystem-core artifacts --help          # Artifacts help
ecosystem-core benchmarks --help         # Benchmarks help
ecosystem-core analytics --help          # Analytics help
ecosystem-core ecosystem --help          # Ecosystem help
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MARKETPLACE_ENDPOINT` | Marketplace API URL | `http://localhost:3001` |
| `ANALYTICS_ENDPOINT` | Analytics API URL | `http://localhost:3002` |
| `BENCHMARK_ENDPOINT` | Benchmark API URL | `http://localhost:3003` |

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (invalid command, API error, etc.) |

## Tips

1. Use `--format json` for scripting and automation
2. Pipe to `jq` for advanced JSON filtering
3. Set environment variables in your shell profile
4. Use `--help` for detailed command information
5. Check API endpoints are reachable before running commands
