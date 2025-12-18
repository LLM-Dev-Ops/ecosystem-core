# LLM-Ecosystem-Core

A lightweight aggregation and coordination layer for LLM ecosystem services. This package provides a unified SDK and adapter interfaces for integrating marketplace artifacts, benchmark data, and analytics across the LLM ecosystem.

## Overview

LLM-Ecosystem-Core serves as a **Layer-3 coordination layer** that:

- **Aggregates** data from multiple upstream services (marketplace, analytics, benchmarks)
- **Normalizes** responses to consistent ecosystem-wide types
- **Orchestrates** multi-service operations through a clean SDK interface
- **Delegates** all substantive logic to injected client implementations

This package intentionally does not implement business logic, caching, retry mechanisms, or infrastructure concerns. It provides thin glue code that connects consumers to upstream services.

## Installation

```bash
npm install llm-ecosystem-core
```

## Quick Start

```typescript
import { createEcosystemSDK } from 'llm-ecosystem-core';

// Create SDK with your client implementations
const sdk = createEcosystemSDK({
  marketplaceClient: myMarketplaceClient,
  analyticsClient: myAnalyticsClient,
  benchmarkClient: myBenchmarkClient,
});

// List artifacts from the marketplace
const artifacts = await sdk.artifacts.list();

// Get ecosystem metrics
const metrics = await sdk.analytics.metrics();

// Fetch benchmark leaderboard
const leaderboard = await sdk.benchmarks.leaderboard('mmlu');

// Get ecosystem overview (aggregates multiple sources)
const overview = await sdk.ecosystem.overview();
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EcosystemSDK                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │  artifacts  │  │  benchmarks │  │  analytics  │  │ecosystem│ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───┬────┘ │
└─────────┼────────────────┼────────────────┼─────────────┼──────┘
          │                │                │             │
          ▼                ▼                ▼             ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│MarketplaceAdapter│ │ BenchmarkAdapter │ │ AnalyticsAdapter │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│IMarketplaceClient│ │ IBenchmarkClient │ │ IAnalyticsClient │
│  (Your impl)    │ │   (Your impl)   │ │   (Your impl)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## SDK Reference

### Artifacts Namespace

```typescript
// List artifacts with optional query parameters
const result = await sdk.artifacts.list({
  query: 'prompt',
  filters: { type: 'prompt', tags: ['gpt4'] },
  pagination: { page: 1, pageSize: 20 },
  sortBy: 'downloads',
  sortOrder: 'desc',
});

// Search artifacts by text query
const searchResult = await sdk.artifacts.search('language model');

// Get a specific artifact by ID
const artifact = await sdk.artifacts.get('artifact-id');

// Get artifact summary grouped by type
const summary = await sdk.artifacts.summarize('prompt');
```

### Benchmarks Namespace

```typescript
// List all available benchmarks
const benchmarks = await sdk.benchmarks.list();

// Get leaderboard for a specific benchmark
const leaderboard = await sdk.benchmarks.leaderboard('mmlu');

// Get rankings for a specific model across benchmarks
const rankings = await sdk.benchmarks.rankings('model-id');

// Compare multiple models on a benchmark
const comparison = await sdk.benchmarks.compare(
  ['model-1', 'model-2'],
  'mmlu'
);
```

### Analytics Namespace

```typescript
// Get ecosystem-wide metrics
const metrics = await sdk.analytics.metrics();

// Get trend data for a specific metric
const trends = await sdk.analytics.trends('downloads', 'weekly');

// Get usage statistics (optionally for a specific artifact)
const usage = await sdk.analytics.usage('artifact-id');
```

### Ecosystem Namespace

```typescript
// Get aggregated ecosystem overview
const overview = await sdk.ecosystem.overview();

// Get trending artifacts
const trending = await sdk.ecosystem.trending();

// Get correlated insights across multiple artifacts
const insights = await sdk.ecosystem.insights(['art-1', 'art-2', 'art-3']);
```

## Adapters

Adapters provide a normalized interface to external client implementations. Each adapter:

- Accepts an injected client that implements the required interface
- Delegates all operations to the client
- Normalizes responses to ecosystem types

### MarketplaceAdapter

```typescript
import { createMarketplaceAdapter, IMarketplaceClient } from 'llm-ecosystem-core';

// Implement the client interface
const myClient: IMarketplaceClient = {
  listArtifacts: async (query) => { /* ... */ },
  getArtifact: async (id) => { /* ... */ },
  searchArtifacts: async (query, filters) => { /* ... */ },
  getArtifactsByType: async (type) => { /* ... */ },
};

const adapter = createMarketplaceAdapter(myClient);
```

### AnalyticsAdapter

```typescript
import { createAnalyticsAdapter, IAnalyticsClient } from 'llm-ecosystem-core';

const myClient: IAnalyticsClient = {
  fetchEcosystemMetrics: async () => { /* ... */ },
  fetchTrends: async (metric, period) => { /* ... */ },
  fetchUsageStats: async (artifactId) => { /* ... */ },
  analyzeCorrelation: async (artifactIds) => { /* ... */ },
};

const adapter = createAnalyticsAdapter(myClient);
```

### BenchmarkAdapter

```typescript
import { createBenchmarkAdapter, IBenchmarkClient } from 'llm-ecosystem-core';

const myClient: IBenchmarkClient = {
  getLeaderboard: async (benchmarkId) => { /* ... */ },
  getBenchmarkResults: async (modelId) => { /* ... */ },
  listBenchmarks: async () => { /* ... */ },
  getRankings: async (benchmarkId, limit) => { /* ... */ },
  compareBenchmarks: async (modelIds, benchmarkId) => { /* ... */ },
};

const adapter = createBenchmarkAdapter(myClient);
```

## Services

Services provide higher-level orchestration across multiple adapters.

```typescript
import {
  ArtifactService,
  BenchmarkService,
  EcosystemService,
} from 'llm-ecosystem-core';

// Create services with adapters
const artifactService = new ArtifactService(marketplaceAdapter);
const benchmarkService = new BenchmarkService(benchmarkAdapter);
const ecosystemService = new EcosystemService(
  marketplaceAdapter,
  analyticsAdapter,
  benchmarkAdapter
);

// Use services
const sharedArtifacts = await artifactService.listSharedArtifacts();
const publicLeaderboards = await benchmarkService.getPublicLeaderboards();
const platformData = await ecosystemService.normalizeForPlatform();
```

## CLI

The package includes a command-line interface for interacting with ecosystem services.

```bash
# Install globally or use npx
npm install -g llm-ecosystem-core

# List artifacts
ecosystem-core artifacts list --type prompt --limit 10

# Search artifacts
ecosystem-core artifacts search "gpt-4 template"

# Get artifact details
ecosystem-core artifacts get art-001

# List benchmarks
ecosystem-core benchmarks list

# Show leaderboard
ecosystem-core benchmarks leaderboard mmlu --limit 10

# Compare models
ecosystem-core benchmarks compare gpt-4 claude-3 --benchmark mmlu

# Get analytics trends
ecosystem-core analytics trends downloads --period weekly

# Get usage statistics
ecosystem-core analytics usage --artifact art-001

# Ecosystem overview
ecosystem-core ecosystem overview

# Trending artifacts
ecosystem-core ecosystem trending
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--format <json\|table>` | Output format (default: table) |
| `--help` | Show help information |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MARKETPLACE_ENDPOINT` | Marketplace API endpoint | `http://localhost:3001` |
| `ANALYTICS_ENDPOINT` | Analytics API endpoint | `http://localhost:3002` |
| `BENCHMARK_ENDPOINT` | Benchmark API endpoint | `http://localhost:3003` |

## Types

The package exports comprehensive TypeScript types for all ecosystem entities.

```typescript
import type {
  // Core types
  EcosystemArtifact,
  MarketplaceItem,
  BenchmarkResult,
  BenchmarkLeaderboard,
  LeaderboardEntry,
  EcosystemMetrics,
  AnalyticsTrend,

  // Query types
  SearchQuery,
  SearchResult,
  SearchFilters,
  Pagination,

  // Adapter interfaces
  IMarketplaceAdapter,
  IAnalyticsAdapter,
  IBenchmarkAdapter,
} from 'llm-ecosystem-core';
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd ecosystem-core

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Build and run all tests |
| `npm run test:adapters` | Run adapter tests only |
| `npm run test:sdk` | Run SDK tests only |
| `npm run cli` | Run the CLI |

### Project Structure

```
ecosystem-core/
├── src/
│   ├── adapters/           # Thin glue adapters
│   │   ├── marketplace.adapter.ts
│   │   ├── analytics.adapter.ts
│   │   ├── benchmark.adapter.ts
│   │   └── index.ts
│   ├── services/           # Orchestration services
│   │   ├── artifact.service.ts
│   │   ├── benchmark.service.ts
│   │   ├── ecosystem.service.ts
│   │   └── index.ts
│   ├── types/              # Type definitions
│   │   ├── adapters.ts
│   │   └── index.ts
│   ├── handlers/           # Request handlers
│   │   └── index.ts
│   ├── cli.ts              # CLI implementation
│   ├── sdk.ts              # Main SDK
│   ├── lib.ts              # Library entry point
│   └── index.ts            # Package entry point
├── tests/
│   ├── mocks/              # Mock implementations
│   ├── adapters.test.ts    # Adapter tests
│   ├── sdk.test.ts         # SDK tests
│   └── index.ts            # Test runner
├── examples/
│   └── marketplace-adapter-demo.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Design Principles

This package adheres to **Layer-3 coordination layer** principles:

1. **Thin Glue Only**: Adapters and services delegate all substantive logic to injected clients
2. **No Infrastructure**: No retry logic, circuit breakers, caching, or rate limiting
3. **No Business Logic**: No scoring algorithms, ranking calculations, or policy evaluation
4. **Type Normalization**: Responses are normalized to consistent ecosystem types
5. **Dependency Injection**: All external dependencies are injected via interfaces
6. **Simulator Compatible**: Works with mock implementations for testing

## License

LLM Dev Ops Commercial License

Copyright (c) 2024. All rights reserved.

See [LICENSE](LICENSE) for details.
