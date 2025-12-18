#!/usr/bin/env node

/**
 * CLI interface for LLM-Ecosystem-Core
 * Provides command-line access to ecosystem aggregation features
 */

import {
  MarketplaceItem,
  BenchmarkResult,
  BenchmarkLeaderboard,
  AnalyticsTrend,
  EcosystemMetrics,
  SearchResult,
} from './types';

/**
 * CLI configuration from environment variables
 */
interface CliConfig {
  marketplaceEndpoint: string;
  analyticsEndpoint: string;
  benchmarkEndpoint: string;
  format: 'json' | 'table';
}

/**
 * Parse command-line arguments
 */
function parseArgs(args: string[]): {
  command: string[];
  flags: Record<string, string | boolean>;
} {
  const command: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const flagName = arg.slice(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('--')) {
        flags[flagName] = nextArg;
        i++;
      } else {
        flags[flagName] = true;
      }
    } else if (arg.startsWith('-')) {
      const flagName = arg.slice(1);
      flags[flagName] = true;
    } else {
      command.push(arg);
    }
  }

  return { command, flags };
}

/**
 * Get CLI configuration from environment variables
 */
function getConfig(flags: Record<string, string | boolean>): CliConfig {
  return {
    marketplaceEndpoint:
      process.env.MARKETPLACE_ENDPOINT || 'http://localhost:3001',
    analyticsEndpoint:
      process.env.ANALYTICS_ENDPOINT || 'http://localhost:3002',
    benchmarkEndpoint:
      process.env.BENCHMARK_ENDPOINT || 'http://localhost:3003',
    format: (flags.format as 'json' | 'table') || 'table',
  };
}

/**
 * Format output based on format flag
 */
function formatOutput(data: any, format: 'json' | 'table'): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  // Table format
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return 'No results found.';
    }

    const headers = Object.keys(data[0]);
    const colWidths = headers.map((h) =>
      Math.max(
        h.length,
        ...data.map((row) => String(row[h] || '').length)
      )
    );

    const separator =
      '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+';
    const headerRow =
      '|' +
      headers
        .map((h, i) => ' ' + h.padEnd(colWidths[i]) + ' ')
        .join('|') +
      '|';

    const rows = data.map(
      (row) =>
        '|' +
        headers
          .map((h, i) => ' ' + String(row[h] || '').padEnd(colWidths[i]) + ' ')
          .join('|') +
        '|'
    );

    return [separator, headerRow, separator, ...rows, separator].join('\n');
  }

  // Single object - format as key-value pairs
  const lines = Object.entries(data).map(([key, value]) => {
    const valueStr =
      typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    return `${key}: ${valueStr}`;
  });

  return lines.join('\n');
}

/**
 * Mock API call (replace with actual HTTP requests)
 */
async function apiCall(endpoint: string, path: string): Promise<any> {
  console.error(`[API] ${endpoint}${path}`);

  // In production, this would use fetch or similar:
  // const response = await fetch(`${endpoint}${path}`);
  // return response.json();

  // Return mock data for demonstration
  return mockApiResponse(path);
}

/**
 * Mock API responses for demonstration
 */
function mockApiResponse(path: string): any {
  if (path.includes('/artifacts')) {
    if (path.includes('/search')) {
      return {
        items: [
          {
            id: 'art-001',
            name: 'GPT-4 Prompt Template',
            type: 'prompt',
            source: 'marketplace',
            description: 'Advanced prompt template for GPT-4',
            author: 'john-doe',
            downloads: 1542,
            rating: 4.8,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      };
    } else if (path.match(/\/artifacts\/[^/]+$/)) {
      return {
        id: 'art-001',
        name: 'GPT-4 Prompt Template',
        type: 'prompt',
        source: 'marketplace',
        description: 'Advanced prompt template for GPT-4',
        author: 'john-doe',
        version: '1.2.0',
        downloads: 1542,
        rating: 4.8,
        tags: ['gpt4', 'prompts', 'templates'],
        createdAt: new Date('2024-01-15'),
      };
    } else {
      return {
        items: [
          {
            id: 'art-001',
            name: 'GPT-4 Prompt Template',
            type: 'prompt',
            source: 'marketplace',
            downloads: 1542,
            rating: 4.8,
          },
          {
            id: 'art-002',
            name: 'Claude Code Snippets',
            type: 'code',
            source: 'marketplace',
            downloads: 892,
            rating: 4.6,
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      };
    }
  } else if (path.includes('/benchmarks')) {
    if (path.includes('/leaderboard')) {
      return {
        benchmarkId: 'bench-001',
        benchmarkName: 'MMLU',
        entries: [
          { modelId: 'gpt-4', modelName: 'GPT-4', score: 86.4, rank: 1 },
          { modelId: 'claude-3', modelName: 'Claude 3', score: 84.2, rank: 2 },
        ],
        updatedAt: new Date(),
      };
    } else if (path.includes('/compare')) {
      return {
        benchmark: 'MMLU',
        models: [
          { modelId: 'gpt-4', score: 86.4, rank: 1 },
          { modelId: 'claude-3', score: 84.2, rank: 2 },
        ],
        difference: 2.2,
      };
    } else {
      return [
        { id: 'bench-001', name: 'MMLU', category: 'general' },
        { id: 'bench-002', name: 'HumanEval', category: 'coding' },
      ];
    }
  } else if (path.includes('/analytics')) {
    if (path.includes('/trends')) {
      return {
        metric: 'downloads',
        values: [
          { timestamp: new Date('2024-01-01'), value: 1000 },
          { timestamp: new Date('2024-01-02'), value: 1200 },
        ],
        period: 'daily',
        source: 'marketplace',
      };
    } else if (path.includes('/usage')) {
      return {
        totalArtifacts: 1234,
        totalDownloads: 45678,
        activeUsers: 789,
      };
    }
  } else if (path.includes('/ecosystem/overview')) {
    return {
      usage: {
        totalArtifacts: 1234,
        totalDownloads: 45678,
        activeUsers: 789,
      },
      trends: [],
      topArtifacts: [
        { id: 'art-001', name: 'GPT-4 Prompt Template', type: 'prompt', score: 95 },
      ],
      lastUpdated: new Date(),
    };
  } else if (path.includes('/ecosystem/trending')) {
    return [
      { id: 'art-001', name: 'GPT-4 Prompt Template', type: 'prompt', score: 95 },
      { id: 'art-003', name: 'LangChain Helper', type: 'library', score: 88 },
    ];
  }

  return { error: 'Not implemented' };
}

/**
 * Command handlers
 */

async function handleArtifactsList(
  config: CliConfig,
  flags: Record<string, string | boolean>
): Promise<void> {
  const type = flags.type as string | undefined;
  const limit = flags.limit ? parseInt(flags.limit as string, 10) : 10;

  let path = `/artifacts?limit=${limit}`;
  if (type) {
    path += `&type=${type}`;
  }

  const result = await apiCall(config.marketplaceEndpoint, path);
  const output = formatOutput(result.items, config.format);
  console.log(output);
}

async function handleArtifactsSearch(
  config: CliConfig,
  query: string,
  flags: Record<string, string | boolean>
): Promise<void> {
  const path = `/artifacts/search?q=${encodeURIComponent(query)}`;
  const result = await apiCall(config.marketplaceEndpoint, path);
  const output = formatOutput(result.items, config.format);
  console.log(output);
}

async function handleArtifactsGet(
  config: CliConfig,
  id: string,
  flags: Record<string, string | boolean>
): Promise<void> {
  const path = `/artifacts/${id}`;
  const result = await apiCall(config.marketplaceEndpoint, path);
  const output = formatOutput(result, config.format);
  console.log(output);
}

async function handleBenchmarksList(
  config: CliConfig,
  flags: Record<string, string | boolean>
): Promise<void> {
  const path = '/benchmarks';
  const result = await apiCall(config.benchmarkEndpoint, path);
  const output = formatOutput(result, config.format);
  console.log(output);
}

async function handleBenchmarksLeaderboard(
  config: CliConfig,
  benchmarkId: string,
  flags: Record<string, string | boolean>
): Promise<void> {
  const limit = flags.limit ? parseInt(flags.limit as string, 10) : 10;
  const path = `/benchmarks/${benchmarkId}/leaderboard?limit=${limit}`;
  const result = await apiCall(config.benchmarkEndpoint, path);
  const output = formatOutput(result.entries, config.format);
  console.log(output);
}

async function handleBenchmarksCompare(
  config: CliConfig,
  modelId1: string,
  modelId2: string,
  flags: Record<string, string | boolean>
): Promise<void> {
  const benchmarkId = flags.benchmark as string;
  if (!benchmarkId) {
    console.error('Error: --benchmark flag is required');
    process.exit(1);
  }

  const path = `/benchmarks/${benchmarkId}/compare?model1=${modelId1}&model2=${modelId2}`;
  const result = await apiCall(config.benchmarkEndpoint, path);
  const output = formatOutput(result, config.format);
  console.log(output);
}

async function handleAnalyticsTrends(
  config: CliConfig,
  metric: string,
  flags: Record<string, string | boolean>
): Promise<void> {
  const period = (flags.period as string) || 'daily';
  const path = `/analytics/trends/${metric}?period=${period}`;
  const result = await apiCall(config.analyticsEndpoint, path);
  const output = formatOutput(result, config.format);
  console.log(output);
}

async function handleAnalyticsUsage(
  config: CliConfig,
  flags: Record<string, string | boolean>
): Promise<void> {
  const artifactId = flags.artifact as string | undefined;
  let path = '/analytics/usage';
  if (artifactId) {
    path += `?artifact=${artifactId}`;
  }

  const result = await apiCall(config.analyticsEndpoint, path);
  const output = formatOutput(result, config.format);
  console.log(output);
}

async function handleEcosystemOverview(
  config: CliConfig,
  flags: Record<string, string | boolean>
): Promise<void> {
  const path = '/ecosystem/overview';
  const result = await apiCall(config.marketplaceEndpoint, path);
  const output = formatOutput(result, config.format);
  console.log(output);
}

async function handleEcosystemTrending(
  config: CliConfig,
  flags: Record<string, string | boolean>
): Promise<void> {
  const path = '/ecosystem/trending';
  const result = await apiCall(config.marketplaceEndpoint, path);
  const output = formatOutput(result, config.format);
  console.log(output);
}

/**
 * Display help information
 */
function displayHelp(command?: string[]): void {
  if (!command || command.length === 0) {
    console.log(`
LLM Ecosystem Core CLI

Usage: ecosystem-core <command> [options]

Commands:
  artifacts list [--type <type>] [--limit <n>]
    List shared artifacts from marketplace

  artifacts search <query>
    Search artifacts

  artifacts get <id>
    Get artifact details

  benchmarks list
    List available benchmarks

  benchmarks leaderboard <benchmarkId> [--limit <n>]
    Show benchmark leaderboard

  benchmarks compare <modelId1> <modelId2> --benchmark <id>
    Compare two models on a benchmark

  analytics trends <metric> [--period <period>]
    Get ecosystem trends for a metric

  analytics usage [--artifact <id>]
    Get usage statistics

  ecosystem overview
    Get full ecosystem overview

  ecosystem trending
    Get trending artifacts

Global Options:
  --format <json|table>  Output format (default: table)
  --help                 Show help information

Environment Variables:
  MARKETPLACE_ENDPOINT   Marketplace API endpoint (default: http://localhost:3001)
  ANALYTICS_ENDPOINT     Analytics API endpoint (default: http://localhost:3002)
  BENCHMARK_ENDPOINT     Benchmark API endpoint (default: http://localhost:3003)

Examples:
  ecosystem-core artifacts list --type prompt --limit 5
  ecosystem-core artifacts search "gpt-4 template"
  ecosystem-core benchmarks leaderboard mmlu --limit 10
  ecosystem-core analytics trends downloads --period weekly
`);
  } else if (command[0] === 'artifacts') {
    console.log(`
Artifacts Commands:

  artifacts list [--type <type>] [--limit <n>]
    List shared artifacts from marketplace

    Options:
      --type <type>   Filter by artifact type (prompt, code, model, etc.)
      --limit <n>     Limit number of results (default: 10)

    Example:
      ecosystem-core artifacts list --type prompt --limit 5

  artifacts search <query>
    Search artifacts by query string

    Example:
      ecosystem-core artifacts search "gpt-4 template"

  artifacts get <id>
    Get detailed information about a specific artifact

    Example:
      ecosystem-core artifacts get art-001
`);
  } else if (command[0] === 'benchmarks') {
    console.log(`
Benchmarks Commands:

  benchmarks list
    List all available benchmarks

    Example:
      ecosystem-core benchmarks list

  benchmarks leaderboard <benchmarkId> [--limit <n>]
    Show leaderboard for a specific benchmark

    Options:
      --limit <n>     Limit number of entries (default: 10)

    Example:
      ecosystem-core benchmarks leaderboard mmlu --limit 10

  benchmarks compare <modelId1> <modelId2> --benchmark <id>
    Compare performance of two models on a benchmark

    Options:
      --benchmark <id>  Benchmark ID (required)

    Example:
      ecosystem-core benchmarks compare gpt-4 claude-3 --benchmark mmlu
`);
  } else if (command[0] === 'analytics') {
    console.log(`
Analytics Commands:

  analytics trends <metric> [--period <period>]
    Get trend data for a specific metric

    Options:
      --period <period>  Time period (daily, weekly, monthly) (default: daily)

    Example:
      ecosystem-core analytics trends downloads --period weekly

  analytics usage [--artifact <id>]
    Get usage statistics

    Options:
      --artifact <id>  Filter by specific artifact

    Example:
      ecosystem-core analytics usage --artifact art-001
`);
  } else if (command[0] === 'ecosystem') {
    console.log(`
Ecosystem Commands:

  ecosystem overview
    Get comprehensive ecosystem overview including usage stats,
    trends, and top artifacts

    Example:
      ecosystem-core ecosystem overview

  ecosystem trending
    Get list of currently trending artifacts

    Example:
      ecosystem-core ecosystem trending
`);
  }
}

/**
 * Main CLI entry point
 */
export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  try {
    const { command, flags } = parseArgs(argv);

    if (flags.help || command.length === 0) {
      displayHelp(command);
      return;
    }

    const config = getConfig(flags);

    // Route to appropriate handler
    const [category, action, ...args] = command;

    if (category === 'artifacts') {
      if (action === 'list') {
        await handleArtifactsList(config, flags);
      } else if (action === 'search') {
        if (args.length === 0) {
          console.error('Error: search query is required');
          process.exit(1);
        }
        await handleArtifactsSearch(config, args.join(' '), flags);
      } else if (action === 'get') {
        if (args.length === 0) {
          console.error('Error: artifact ID is required');
          process.exit(1);
        }
        await handleArtifactsGet(config, args[0], flags);
      } else {
        console.error(`Unknown artifacts command: ${action}`);
        displayHelp(['artifacts']);
        process.exit(1);
      }
    } else if (category === 'benchmarks') {
      if (action === 'list') {
        await handleBenchmarksList(config, flags);
      } else if (action === 'leaderboard') {
        if (args.length === 0) {
          console.error('Error: benchmark ID is required');
          process.exit(1);
        }
        await handleBenchmarksLeaderboard(config, args[0], flags);
      } else if (action === 'compare') {
        if (args.length < 2) {
          console.error('Error: two model IDs are required');
          process.exit(1);
        }
        await handleBenchmarksCompare(config, args[0], args[1], flags);
      } else {
        console.error(`Unknown benchmarks command: ${action}`);
        displayHelp(['benchmarks']);
        process.exit(1);
      }
    } else if (category === 'analytics') {
      if (action === 'trends') {
        if (args.length === 0) {
          console.error('Error: metric name is required');
          process.exit(1);
        }
        await handleAnalyticsTrends(config, args[0], flags);
      } else if (action === 'usage') {
        await handleAnalyticsUsage(config, flags);
      } else {
        console.error(`Unknown analytics command: ${action}`);
        displayHelp(['analytics']);
        process.exit(1);
      }
    } else if (category === 'ecosystem') {
      if (action === 'overview') {
        await handleEcosystemOverview(config, flags);
      } else if (action === 'trending') {
        await handleEcosystemTrending(config, flags);
      } else {
        console.error(`Unknown ecosystem command: ${action}`);
        displayHelp(['ecosystem']);
        process.exit(1);
      }
    } else {
      console.error(`Unknown command: ${category}`);
      displayHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
