/**
 * Mock implementations for testing
 * These mocks return predictable test data for verifying glue logic
 */

import {
  MarketplaceItem,
  BenchmarkResult,
  BenchmarkLeaderboard,
  LeaderboardEntry,
  AnalyticsTrend,
  EcosystemMetrics,
  SearchQuery,
  SearchResult,
  TrendDataPoint,
} from '../../src/types';
import { IMarketplaceClient } from '../../src/adapters/marketplace.adapter';
import { IAnalyticsClient, UsageStats, CorrelationResult } from '../../src/adapters/analytics.adapter';
import { IBenchmarkClient, BenchmarkMetadata, RankingEntry, ComparisonResult } from '../../src/adapters/benchmark.adapter';

// Also import SDK client interfaces
import {
  ISDKMarketplaceClient,
  ISDKAnalyticsClient,
  ISDKBenchmarkClient,
  ArtifactSummary,
  BenchmarkMetadata as SDKBenchmarkMetadata,
  ComparisonResult as SDKComparisonResult,
  SDKUsageStats,
} from '../../src/sdk';

/**
 * Mock Marketplace Client
 * Returns predictable marketplace data for testing
 * Implements IMarketplaceClient for use with the marketplace adapter
 */
export class MockMarketplaceClient implements IMarketplaceClient {
  private mockItems: MarketplaceItem[] = [
    {
      id: 'mp-1',
      name: 'Test Prompt Template',
      type: 'prompt',
      source: 'marketplace',
      description: 'A test prompt template',
      author: 'Test Author',
      version: '1.0.0',
      downloads: 1000,
      rating: 4.5,
      price: 0,
      tags: ['test', 'template'],
      license: 'MIT',
      repository: 'https://github.com/test/repo',
      metadata: { featured: true },
      createdAt: new Date('2024-01-01'),
      publishedAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-03'),
    },
    {
      id: 'mp-2',
      name: 'Test Model Fine-tune',
      type: 'model',
      source: 'marketplace',
      description: 'A test fine-tuned model',
      author: 'Test Author 2',
      version: '2.0.0',
      downloads: 500,
      rating: 4.8,
      price: 10,
      tags: ['test', 'model'],
      license: 'Apache-2.0',
      metadata: { featured: false },
      createdAt: new Date('2024-02-01'),
      publishedAt: new Date('2024-02-02'),
      updatedAt: new Date('2024-02-03'),
    },
  ];

  async searchItems(query: SearchQuery): Promise<SearchResult<MarketplaceItem>> {
    let items = [...this.mockItems];

    // Apply query filtering
    if (query.query) {
      const lowerQuery = query.query.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply type filter
    if (query.filters?.type) {
      const types = Array.isArray(query.filters.type)
        ? query.filters.type
        : [query.filters.type];
      items = items.filter((item) => types.includes(item.type));
    }

    // Apply tag filter
    if (query.filters?.tags && query.filters.tags.length > 0) {
      items = items.filter((item) =>
        query.filters!.tags!.some((tag) => item.tags?.includes(tag))
      );
    }

    // Apply sorting
    if (query.sortBy) {
      items.sort((a, b) => {
        const aVal = (a as any)[query.sortBy!];
        const bVal = (b as any)[query.sortBy!];
        const order = query.sortOrder === 'desc' ? -1 : 1;
        return aVal > bVal ? order : aVal < bVal ? -order : 0;
      });
    }

    // Apply pagination
    const page = query.pagination?.page ?? 1;
    const pageSize = query.pagination?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);

    return {
      items: paginatedItems,
      total: items.length,
      page,
      pageSize,
      hasMore: start + pageSize < items.length,
    };
  }

  async getItemById(id: string): Promise<MarketplaceItem | null> {
    return this.mockItems.find((item) => item.id === id) ?? null;
  }

  async getPopularItems(limit: number = 10): Promise<MarketplaceItem[]> {
    return [...this.mockItems]
      .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
      .slice(0, limit);
  }

  async getItemsByAuthor(author: string): Promise<MarketplaceItem[]> {
    return this.mockItems.filter((item) => item.author === author);
  }

  // IMarketplaceClient interface methods

  async listArtifacts(query: SearchQuery): Promise<SearchResult<MarketplaceItem>> {
    return this.searchItems(query);
  }

  async getArtifact(id: string): Promise<MarketplaceItem | null> {
    return this.getItemById(id);
  }

  async searchArtifacts(
    query: string,
    filters?: Record<string, unknown>
  ): Promise<SearchResult<MarketplaceItem>> {
    return this.searchItems({
      query,
      filters: filters as any,
    });
  }

  async getArtifactsByType(type: string): Promise<MarketplaceItem[]> {
    return this.mockItems.filter((item) => item.type === type);
  }
}

/**
 * Mock Analytics Client for adapter tests
 * Returns predictable analytics data for testing
 * Implements IAnalyticsClient for use with the analytics adapter
 */
export class MockAnalyticsClient implements IAnalyticsClient {
  private mockTrends: AnalyticsTrend[] = [
    {
      metric: 'downloads',
      values: [
        { timestamp: new Date('2024-01-01'), value: 100 },
        { timestamp: new Date('2024-01-02'), value: 150 },
        { timestamp: new Date('2024-01-03'), value: 200 },
      ],
      period: 'daily',
      source: 'analytics',
    },
    {
      metric: 'activeUsers',
      values: [
        { timestamp: new Date('2024-01-01'), value: 50 },
        { timestamp: new Date('2024-01-02'), value: 75 },
        { timestamp: new Date('2024-01-03'), value: 100 },
      ],
      period: 'daily',
      source: 'analytics',
    },
  ];

  private mockMetrics: EcosystemMetrics = {
    usage: {
      totalArtifacts: 250,
      totalDownloads: 5000,
      activeUsers: 500,
      activeModels: 50,
      activePrompts: 100,
    },
    trends: [],
    topArtifacts: [
      {
        id: 'top-1',
        name: 'Top Artifact 1',
        type: 'prompt',
        score: 95,
        metadata: { downloads: 2000 },
      },
      {
        id: 'top-2',
        name: 'Top Artifact 2',
        type: 'model',
        score: 90,
        metadata: { downloads: 1500 },
      },
    ],
    lastUpdated: new Date('2024-01-03'),
  };

  // IAnalyticsClient interface methods (for adapters)
  async fetchEcosystemMetrics(): Promise<any> {
    return {
      ...this.mockMetrics,
      trends: this.mockTrends,
    };
  }

  async fetchTrends(metric: string, period: string): Promise<any> {
    const trends = this.mockTrends.filter(
      (t) => t.metric === metric && t.period === period
    );
    if (trends.length === 0) {
      return [{
        metric,
        values: [],
        period,
        source: 'analytics',
      }];
    }
    return trends;
  }

  async fetchUsageStats(artifactId?: string): Promise<any> {
    return {
      totalUsage: artifactId ? 100 : 5000,
      uniqueUsers: artifactId ? 20 : 500,
      trend: 'increasing',
      metadata: { period: 'last_30_days' },
    };
  }

  async analyzeCorrelation(artifactIds: string[]): Promise<any> {
    return {
      correlations: artifactIds.length > 1 ? [
        {
          artifactPair: [artifactIds[0], artifactIds[1]],
          coefficient: 0.75,
          strength: 'strong',
        },
      ] : [],
      confidence: 0.85,
      metadata: { method: 'pearson' },
    };
  }
}

/**
 * Mock Benchmark Client for adapter tests
 * Returns predictable benchmark data for testing
 * Implements IBenchmarkClient for use with the benchmark adapter
 */
export class MockBenchmarkClient implements IBenchmarkClient {
  private mockResults: BenchmarkResult[] = [
    {
      id: 'bench-1',
      modelId: 'model-1',
      benchmarkId: 'mmlu',
      score: 85.5,
      rank: 1,
      metadata: { category: 'reasoning', samples: 1000 },
      evaluatedAt: new Date('2024-01-01'),
    },
    {
      id: 'bench-2',
      modelId: 'model-2',
      benchmarkId: 'mmlu',
      score: 82.3,
      rank: 2,
      metadata: { category: 'reasoning', samples: 1000 },
      evaluatedAt: new Date('2024-01-02'),
    },
    {
      id: 'bench-3',
      modelId: 'model-1',
      benchmarkId: 'hellaswag',
      score: 90.2,
      rank: 1,
      metadata: { category: 'common-sense', samples: 500 },
      evaluatedAt: new Date('2024-01-03'),
    },
  ];

  private mockLeaderboards: Map<string, BenchmarkLeaderboard> = new Map([
    [
      'mmlu',
      {
        benchmarkId: 'mmlu',
        benchmarkName: 'MMLU Benchmark',
        entries: [
          {
            modelId: 'model-1',
            modelName: 'Test Model 1',
            score: 85.5,
            rank: 1,
            metadata: { category: 'reasoning' },
          },
          {
            modelId: 'model-2',
            modelName: 'Test Model 2',
            score: 82.3,
            rank: 2,
            metadata: { category: 'reasoning' },
          },
        ],
        updatedAt: new Date('2024-01-02'),
      },
    ],
    [
      'hellaswag',
      {
        benchmarkId: 'hellaswag',
        benchmarkName: 'HellaSwag Benchmark',
        entries: [
          {
            modelId: 'model-1',
            modelName: 'Test Model 1',
            score: 90.2,
            rank: 1,
            metadata: { category: 'common-sense' },
          },
        ],
        updatedAt: new Date('2024-01-03'),
      },
    ],
  ]);

  async getLeaderboard(benchmarkId: string): Promise<BenchmarkLeaderboard | null> {
    return this.mockLeaderboards.get(benchmarkId) ?? null;
  }

  async getModelResults(modelId: string): Promise<BenchmarkResult[]> {
    return this.mockResults.filter((r) => r.modelId === modelId);
  }

  async submitResult(result: Omit<BenchmarkResult, 'id'>): Promise<BenchmarkResult> {
    const newResult: BenchmarkResult = {
      id: `bench-${Date.now()}`,
      ...result,
    };
    this.mockResults.push(newResult);
    return newResult;
  }

  async compareModels(modelIds: string[]): Promise<{
    models: string[];
    benchmarks: { [benchmarkId: string]: { [modelId: string]: number } };
  }> {
    const benchmarks: { [benchmarkId: string]: { [modelId: string]: number } } = {};

    for (const result of this.mockResults) {
      if (modelIds.includes(result.modelId)) {
        if (!benchmarks[result.benchmarkId]) {
          benchmarks[result.benchmarkId] = {};
        }
        benchmarks[result.benchmarkId][result.modelId] = result.score;
      }
    }

    return {
      models: modelIds,
      benchmarks,
    };
  }

  async getAllLeaderboards(): Promise<BenchmarkLeaderboard[]> {
    return Array.from(this.mockLeaderboards.values());
  }

  // IBenchmarkClient interface methods (for adapters)
  async listBenchmarks(): Promise<any[]> {
    return [
      {
        id: 'mmlu',
        name: 'MMLU Benchmark',
        description: 'Massive Multitask Language Understanding',
        category: 'reasoning',
      },
      {
        id: 'hellaswag',
        name: 'HellaSwag Benchmark',
        description: 'Commonsense reasoning benchmark',
        category: 'common-sense',
      },
    ];
  }

  async getBenchmarkResults(modelId: string): Promise<any[]> {
    return this.mockResults.filter((r) => r.modelId === modelId);
  }

  async getRankings(benchmarkId: string, limit?: number): Promise<any[]> {
    const leaderboard = this.mockLeaderboards.get(benchmarkId);
    if (!leaderboard) {
      return [];
    }
    const rankings = leaderboard.entries.map(entry => ({
      rank: entry.rank,
      modelId: entry.modelId,
      score: entry.score,
      metadata: entry.metadata,
    }));
    return limit ? rankings.slice(0, limit) : rankings;
  }

  async compareBenchmarks(modelIds: string[], benchmarkId: string): Promise<any> {
    const results = this.mockResults.filter(
      (r) => r.benchmarkId === benchmarkId && modelIds.includes(r.modelId)
    );
    return {
      benchmarkId,
      results,
      summary: { compared: modelIds.length, found: results.length },
    };
  }
}

/**
 * Mock SDK Marketplace Client
 * Implements SDK IMarketplaceClient interface
 */
export class MockSDKMarketplaceClient implements ISDKMarketplaceClient {
  private mockItems: MarketplaceItem[] = [
    {
      id: 'mp-1',
      name: 'Test Prompt Template',
      type: 'prompt',
      source: 'marketplace',
      description: 'A test prompt template',
      author: 'Test Author',
      version: '1.0.0',
      downloads: 1000,
      rating: 4.5,
      price: 0,
      tags: ['test', 'template'],
      license: 'MIT',
      metadata: { featured: true },
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'mp-2',
      name: 'Test Model Fine-tune',
      type: 'model',
      source: 'marketplace',
      description: 'A test fine-tuned model',
      author: 'Test Author 2',
      version: '2.0.0',
      downloads: 500,
      rating: 4.8,
      tags: ['test', 'model'],
      metadata: { featured: false },
      createdAt: new Date('2024-02-01'),
    },
  ];

  async list(query?: SearchQuery): Promise<SearchResult<MarketplaceItem>> {
    let items = [...this.mockItems];

    if (query) {
      if (query.query) {
        const lowerQuery = query.query.toLowerCase();
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery)
        );
      }

      if (query.sortBy) {
        items.sort((a, b) => {
          const aVal = (a as any)[query.sortBy!];
          const bVal = (b as any)[query.sortBy!];
          const order = query.sortOrder === 'desc' ? -1 : 1;
          return aVal > bVal ? order : aVal < bVal ? -order : 0;
        });
      }

      if (query.pagination) {
        const page = query.pagination.page ?? 1;
        const pageSize = query.pagination.pageSize ?? 10;
        const start = (page - 1) * pageSize;
        items = items.slice(start, start + pageSize);
      }
    }

    return {
      items,
      total: this.mockItems.length,
      page: query?.pagination?.page ?? 1,
      pageSize: query?.pagination?.pageSize ?? 10,
    };
  }

  async search(query: string): Promise<SearchResult<MarketplaceItem>> {
    return this.list({ query, pagination: { page: 1, pageSize: 10 } });
  }

  async get(id: string): Promise<MarketplaceItem | null> {
    return this.mockItems.find((item) => item.id === id) ?? null;
  }

  async summarize(type?: string): Promise<ArtifactSummary> {
    let items = [...this.mockItems];
    if (type) {
      items = items.filter((item) => item.type === type);
    }

    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      bySource[item.source] = (bySource[item.source] || 0) + 1;
    }

    return {
      totalCount: items.length,
      byType,
      bySource,
      recentlyAdded: items.slice(0, 5),
      lastUpdated: new Date(),
    };
  }
}

/**
 * Mock SDK Analytics Client
 * Implements SDK IAnalyticsClient interface
 */
export class MockSDKAnalyticsClient implements ISDKAnalyticsClient {
  private mockMetrics: EcosystemMetrics = {
    usage: {
      totalArtifacts: 250,
      totalDownloads: 5000,
      activeUsers: 500,
    },
    trends: [
      {
        metric: 'downloads',
        values: [
          { timestamp: new Date('2024-01-01'), value: 100 },
          { timestamp: new Date('2024-01-02'), value: 150 },
          { timestamp: new Date('2024-01-03'), value: 200 },
        ],
        period: 'daily',
        source: 'analytics',
      },
    ],
    topArtifacts: [
      {
        id: 'top-1',
        name: 'Top Artifact 1',
        type: 'prompt',
        score: 95,
      },
    ],
  };

  async getMetrics(): Promise<EcosystemMetrics> {
    return { ...this.mockMetrics };
  }

  async getTrends(metric: string, period?: string): Promise<AnalyticsTrend[]> {
    return [
      {
        metric,
        values: [
          { timestamp: new Date('2024-01-01'), value: 100 },
          { timestamp: new Date('2024-01-02'), value: 150 },
        ],
        period: period || 'daily',
        source: 'analytics',
      },
    ];
  }

  async getUsage(artifactId?: string): Promise<SDKUsageStats> {
    return {
      artifactId,
      downloads: artifactId ? 100 : 5000,
      views: artifactId ? 500 : 25000,
      activeUsers: artifactId ? 20 : 500,
      period: 'last_30_days',
      lastUpdated: new Date(),
    };
  }
}

/**
 * Mock SDK Benchmark Client
 * Implements SDK IBenchmarkClient interface
 */
export class MockSDKBenchmarkClient implements ISDKBenchmarkClient {
  private mockLeaderboards: Map<string, BenchmarkLeaderboard> = new Map([
    [
      'mmlu',
      {
        benchmarkId: 'mmlu',
        benchmarkName: 'MMLU Benchmark',
        entries: [
          {
            modelId: 'model-1',
            modelName: 'Test Model 1',
            score: 85.5,
            rank: 1,
          },
        ],
        updatedAt: new Date('2024-01-02'),
      },
    ],
  ]);

  private mockResults: BenchmarkResult[] = [
    {
      id: 'bench-1',
      modelId: 'model-1',
      benchmarkId: 'mmlu',
      score: 85.5,
      rank: 1,
      metadata: { category: 'reasoning' },
      evaluatedAt: new Date('2024-01-01'),
    },
  ];

  async listBenchmarks(): Promise<SDKBenchmarkMetadata[]> {
    return [
      {
        id: 'mmlu',
        name: 'MMLU Benchmark',
        description: 'Massive Multitask Language Understanding',
      },
    ];
  }

  async getLeaderboard(benchmarkId: string): Promise<BenchmarkLeaderboard> {
    const leaderboard = this.mockLeaderboards.get(benchmarkId);
    if (!leaderboard) {
      throw new Error(`Leaderboard not found: ${benchmarkId}`);
    }
    return { ...leaderboard };
  }

  async getModelRankings(modelId: string): Promise<BenchmarkResult[]> {
    return this.mockResults.filter((r) => r.modelId === modelId);
  }

  async compareModels(modelIds: string[], benchmarkId: string): Promise<SDKComparisonResult> {
    const results = this.mockResults.filter(
      (r) => r.benchmarkId === benchmarkId && modelIds.includes(r.modelId)
    );

    return {
      benchmarkId,
      models: results.map((r) => ({
        modelId: r.modelId,
        score: r.score,
        rank: r.rank,
      })),
      comparedAt: new Date(),
    };
  }
}
