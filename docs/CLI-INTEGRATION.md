# CLI Integration Guide

This guide explains how to integrate the LLM Ecosystem Core CLI with real API endpoints.

## Current State

The CLI (`/workspaces/ecosystem-core/src/cli.ts`) is currently implemented with:
- ✅ Full command parsing and routing
- ✅ All 10 commands implemented
- ✅ Table and JSON output formats
- ✅ Comprehensive help system
- ✅ Environment-based configuration
- ✅ Mock data for demonstration

## Integrating with Real APIs

### Step 1: Replace Mock API Calls

The current implementation uses a mock `apiCall` function. To integrate with real APIs:

```typescript
// Current implementation (mock)
async function apiCall(endpoint: string, path: string): Promise<any> {
  console.error(`[API] ${endpoint}${path}`);
  return mockApiResponse(path);
}

// Replace with real HTTP calls
async function apiCall(endpoint: string, path: string): Promise<any> {
  const response = await fetch(`${endpoint}${path}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

### Step 2: Add HTTP Client Dependency

Update `package.json` to include a fetch polyfill (if needed for Node.js < 18):

```json
{
  "dependencies": {
    "node-fetch": "^3.0.0"
  }
}
```

Or use the native fetch (Node.js 18+):

```typescript
// No additional dependencies needed
// fetch is globally available
```

### Step 3: Remove Mock Response Function

Once real APIs are connected, remove the `mockApiResponse` function:

```typescript
// Remove this entire function
function mockApiResponse(path: string): any { ... }
```

### Step 4: Add Error Handling

Enhance error handling for production use:

```typescript
async function apiCall(endpoint: string, path: string): Promise<any> {
  try {
    const response = await fetch(`${endpoint}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LLM-Ecosystem-CLI/1.0.0',
      },
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to connect to ${endpoint}: ${error.message}`);
    }
    throw error;
  }
}
```

### Step 5: Add Authentication (if required)

If your APIs require authentication, add token support:

```typescript
interface CliConfig {
  marketplaceEndpoint: string;
  analyticsEndpoint: string;
  benchmarkEndpoint: string;
  format: 'json' | 'table';
  apiKey?: string; // Add API key support
}

function getConfig(flags: Record<string, string | boolean>): CliConfig {
  return {
    marketplaceEndpoint: process.env.MARKETPLACE_ENDPOINT || 'http://localhost:3001',
    analyticsEndpoint: process.env.ANALYTICS_ENDPOINT || 'http://localhost:3002',
    benchmarkEndpoint: process.env.BENCHMARK_ENDPOINT || 'http://localhost:3003',
    format: (flags.format as 'json' | 'table') || 'table',
    apiKey: process.env.ECOSYSTEM_API_KEY, // Support API key from env
  };
}

async function apiCall(
  endpoint: string,
  path: string,
  config: CliConfig
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(`${endpoint}${path}`, { headers });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

## API Endpoint Contracts

The CLI expects the following API contracts:

### Marketplace Endpoints

```typescript
// GET /artifacts?limit={n}&type={type}
interface ArtifactsListResponse {
  items: Array<{
    id: string;
    name: string;
    type: string;
    source: string;
    downloads?: number;
    rating?: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

// GET /artifacts/search?q={query}
interface ArtifactsSearchResponse {
  items: Array<{
    id: string;
    name: string;
    type: string;
    source: string;
    description?: string;
    author?: string;
    downloads?: number;
    rating?: number;
  }>;
  total: number;
}

// GET /artifacts/{id}
interface ArtifactDetailsResponse {
  id: string;
  name: string;
  type: string;
  source: string;
  description?: string;
  author?: string;
  version?: string;
  downloads?: number;
  rating?: number;
  tags?: string[];
  createdAt: string; // ISO date
}

// GET /ecosystem/overview
interface EcosystemOverviewResponse {
  usage: {
    totalArtifacts: number;
    totalDownloads: number;
    activeUsers: number;
  };
  trends: Array<any>;
  topArtifacts: Array<{
    id: string;
    name: string;
    type: string;
    score: number;
  }>;
  lastUpdated: string; // ISO date
}

// GET /ecosystem/trending
type TrendingArtifactsResponse = Array<{
  id: string;
  name: string;
  type: string;
  score: number;
}>;
```

### Benchmark Endpoints

```typescript
// GET /benchmarks
type BenchmarksListResponse = Array<{
  id: string;
  name: string;
  category?: string;
}>;

// GET /benchmarks/{benchmarkId}/leaderboard?limit={n}
interface LeaderboardResponse {
  benchmarkId: string;
  benchmarkName?: string;
  entries: Array<{
    modelId: string;
    modelName: string;
    score: number;
    rank: number;
  }>;
  updatedAt: string; // ISO date
}

// GET /benchmarks/{benchmarkId}/compare?model1={id1}&model2={id2}
interface CompareModelsResponse {
  benchmark: string;
  models: Array<{
    modelId: string;
    score: number;
    rank: number;
  }>;
  difference: number;
}
```

### Analytics Endpoints

```typescript
// GET /analytics/trends/{metric}?period={period}
interface TrendsResponse {
  metric: string;
  values: Array<{
    timestamp: string; // ISO date
    value: number;
  }>;
  period: string;
  source: string;
}

// GET /analytics/usage?artifact={id}
interface UsageStatsResponse {
  totalArtifacts: number;
  totalDownloads: number;
  activeUsers: number;
}
```

## Testing with Real APIs

### 1. Start Local API Servers

If you have local implementations:

```bash
# Terminal 1: Marketplace API
cd llm-marketplace
npm start # Runs on port 3001

# Terminal 2: Analytics API
cd llm-analytics-hub
npm start # Runs on port 3002

# Terminal 3: Benchmark API
cd llm-benchmark-system
npm start # Runs on port 3003
```

### 2. Configure Environment

```bash
export MARKETPLACE_ENDPOINT="http://localhost:3001"
export ANALYTICS_ENDPOINT="http://localhost:3002"
export BENCHMARK_ENDPOINT="http://localhost:3003"
export ECOSYSTEM_API_KEY="your-api-key-here" # If required
```

### 3. Test CLI Commands

```bash
# Build CLI
npm run build

# Test with real APIs
ecosystem-core artifacts list
ecosystem-core benchmarks leaderboard mmlu
ecosystem-core analytics trends downloads
```

## Production Deployment

### 1. Environment Configuration

Create environment-specific configurations:

```bash
# .env.production
MARKETPLACE_ENDPOINT=https://api.llm-ecosystem.com/marketplace
ANALYTICS_ENDPOINT=https://api.llm-ecosystem.com/analytics
BENCHMARK_ENDPOINT=https://api.llm-ecosystem.com/benchmarks
ECOSYSTEM_API_KEY=prod-api-key
```

### 2. Build and Package

```bash
npm run build
npm pack
```

### 3. Global Installation

```bash
npm install -g llm-ecosystem-core-1.0.0.tgz
```

### 4. Usage

```bash
# CLI is now available globally
ecosystem-core artifacts list
```

## Advanced Integration

### Adding Request Caching

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

async function apiCall(endpoint: string, path: string): Promise<any> {
  const cacheKey = `${endpoint}${path}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    console.error('[CACHE HIT]', cacheKey);
    return cached;
  }

  const response = await fetch(`${endpoint}${path}`);
  const data = await response.json();

  cache.set(cacheKey, data);
  return data;
}
```

### Adding Retry Logic

```typescript
async function apiCallWithRetry(
  endpoint: string,
  path: string,
  retries: number = 3
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${endpoint}${path}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;

      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      console.error(`Retry ${i + 1}/${retries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Adding Progress Indicators

```typescript
import ora from 'ora';

async function handleArtifactsList(
  config: CliConfig,
  flags: Record<string, string | boolean>
): Promise<void> {
  const spinner = ora('Fetching artifacts...').start();

  try {
    const result = await apiCall(config.marketplaceEndpoint, path);
    spinner.succeed('Artifacts loaded');

    const output = formatOutput(result.items, config.format);
    console.log(output);
  } catch (error) {
    spinner.fail('Failed to fetch artifacts');
    throw error;
  }
}
```

## Troubleshooting

### Connection Issues

If you see connection errors:
```bash
Error: Failed to connect to http://localhost:3001
```

Check:
1. API servers are running
2. Environment variables are set correctly
3. Firewall/network allows connections
4. API endpoints return valid JSON

### Authentication Issues

If you see 401/403 errors:
```bash
Error: API error (401): Unauthorized
```

Check:
1. API key is set: `echo $ECOSYSTEM_API_KEY`
2. API key is valid and not expired
3. API key has correct permissions

### Data Format Issues

If you see parsing errors:
```bash
Error: Unexpected token in JSON
```

Check:
1. API response matches expected contract
2. Content-Type header is set correctly
3. Response is valid JSON

## Next Steps

1. Implement real HTTP client in `apiCall` function
2. Remove `mockApiResponse` function
3. Add error handling and retry logic
4. Add authentication support
5. Test with local API servers
6. Deploy to production
7. Add monitoring and logging
