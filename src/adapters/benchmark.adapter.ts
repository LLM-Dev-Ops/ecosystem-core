/**
 * LLM-Benchmark-Exchange Adapter
 *
 * THIN GLUE LOGIC ONLY - delegates all operations to injected IBenchmarkClient.
 * No scoring algorithms, ranking calculations, or business logic.
 */

import {
  BenchmarkResult,
  BenchmarkLeaderboard,
} from '../types/index.js';

/**
 * Metadata about a benchmark
 */
export interface BenchmarkMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Single ranking entry in a leaderboard
 */
export interface RankingEntry {
  rank: number;
  modelId: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Result of comparing multiple models on a benchmark
 */
export interface ComparisonResult {
  benchmarkId: string;
  results: BenchmarkResult[];
  summary?: Record<string, any>;
}

/**
 * External benchmark client interface (injected dependency)
 * Implementations should be provided by LLM-Benchmark-Exchange or similar systems
 */
export interface IBenchmarkClient {
  /**
   * Fetch leaderboard for a specific benchmark
   */
  getLeaderboard(benchmarkId: string): Promise<any>;

  /**
   * Fetch all benchmark results for a specific model
   */
  getBenchmarkResults(modelId: string): Promise<any[]>;

  /**
   * List all available benchmarks
   */
  listBenchmarks(): Promise<any[]>;

  /**
   * Get rankings for a specific benchmark
   */
  getRankings(benchmarkId: string, limit?: number): Promise<any[]>;

  /**
   * Compare multiple models on a specific benchmark
   */
  compareBenchmarks(modelIds: string[], benchmarkId: string): Promise<any>;
}

/**
 * Benchmark adapter interface - normalized ecosystem operations
 */
export interface IBenchmarkAdapter {
  /**
   * Get leaderboard for a specific benchmark
   */
  getLeaderboard(benchmarkId: string): Promise<BenchmarkLeaderboard>;

  /**
   * Get all benchmark results for a specific model
   */
  getBenchmarkResults(modelId: string): Promise<BenchmarkResult[]>;

  /**
   * List all available benchmarks
   */
  listBenchmarks(): Promise<BenchmarkMetadata[]>;

  /**
   * Get rankings for a specific benchmark
   */
  getRankings(benchmarkId: string, limit?: number): Promise<RankingEntry[]>;

  /**
   * Compare multiple models on a specific benchmark
   */
  compareBenchmarks(modelIds: string[], benchmarkId: string): Promise<ComparisonResult>;
}

/**
 * Benchmark adapter implementation
 *
 * THIN GLUE LOGIC: Delegates all operations to the injected client
 * and normalizes responses to ecosystem types.
 */
export class BenchmarkAdapter implements IBenchmarkAdapter {
  constructor(private readonly client: IBenchmarkClient) {}

  /**
   * Get leaderboard for a specific benchmark
   * Delegates to client and normalizes response
   */
  async getLeaderboard(benchmarkId: string): Promise<BenchmarkLeaderboard> {
    const rawLeaderboard = await this.client.getLeaderboard(benchmarkId);

    return this.normalizeLeaderboard(rawLeaderboard, benchmarkId);
  }

  /**
   * Get all benchmark results for a specific model
   * Delegates to client and normalizes response
   */
  async getBenchmarkResults(modelId: string): Promise<BenchmarkResult[]> {
    const rawResults = await this.client.getBenchmarkResults(modelId);

    return rawResults.map((result) => this.normalizeBenchmarkResult(result, modelId));
  }

  /**
   * List all available benchmarks
   * Delegates to client and normalizes response
   */
  async listBenchmarks(): Promise<BenchmarkMetadata[]> {
    const rawBenchmarks = await this.client.listBenchmarks();

    return rawBenchmarks.map((benchmark) => this.normalizeBenchmarkMetadata(benchmark));
  }

  /**
   * Get rankings for a specific benchmark
   * Delegates to client and normalizes response
   */
  async getRankings(benchmarkId: string, limit?: number): Promise<RankingEntry[]> {
    const rawRankings = await this.client.getRankings(benchmarkId, limit);

    return rawRankings.map((ranking) => this.normalizeRankingEntry(ranking));
  }

  /**
   * Compare multiple models on a specific benchmark
   * Delegates to client and normalizes response
   */
  async compareBenchmarks(modelIds: string[], benchmarkId: string): Promise<ComparisonResult> {
    const rawComparison = await this.client.compareBenchmarks(modelIds, benchmarkId);

    return this.normalizeComparisonResult(rawComparison, benchmarkId);
  }

  /**
   * Normalize raw leaderboard data to ecosystem type
   * THIN GLUE: Only data transformation, no calculations
   */
  private normalizeLeaderboard(raw: any, benchmarkId: string): BenchmarkLeaderboard {
    return {
      benchmarkId: raw.benchmarkId || benchmarkId,
      benchmarkName: raw.benchmarkName || raw.name,
      entries: (raw.entries || []).map((entry: any) => ({
        modelId: entry.modelId || entry.model_id,
        modelName: entry.modelName || entry.model_name || entry.name,
        score: entry.score,
        rank: entry.rank,
        metadata: entry.metadata || {},
      })),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    };
  }

  /**
   * Normalize raw benchmark result to ecosystem type
   * THIN GLUE: Only data transformation, no calculations
   */
  private normalizeBenchmarkResult(raw: any, modelId: string): BenchmarkResult {
    return {
      id: raw.id || `${modelId}-${raw.benchmarkId || raw.benchmark_id}`,
      modelId: raw.modelId || raw.model_id || modelId,
      benchmarkId: raw.benchmarkId || raw.benchmark_id,
      score: raw.score,
      rank: raw.rank,
      metadata: raw.metadata || {},
      evaluatedAt: raw.evaluatedAt ? new Date(raw.evaluatedAt) : undefined,
    };
  }

  /**
   * Normalize raw benchmark metadata to ecosystem type
   * THIN GLUE: Only data transformation, no calculations
   */
  private normalizeBenchmarkMetadata(raw: any): BenchmarkMetadata {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description || '',
      category: raw.category || 'general',
    };
  }

  /**
   * Normalize raw ranking entry to ecosystem type
   * THIN GLUE: Only data transformation, no calculations
   */
  private normalizeRankingEntry(raw: any): RankingEntry {
    return {
      rank: raw.rank,
      modelId: raw.modelId || raw.model_id,
      score: raw.score,
      metadata: raw.metadata,
    };
  }

  /**
   * Normalize raw comparison result to ecosystem type
   * THIN GLUE: Only data transformation, no calculations
   */
  private normalizeComparisonResult(raw: any, benchmarkId: string): ComparisonResult {
    return {
      benchmarkId: raw.benchmarkId || benchmarkId,
      results: (raw.results || []).map((result: any) =>
        this.normalizeBenchmarkResult(result, result.modelId || result.model_id)
      ),
      summary: raw.summary,
    };
  }
}

/**
 * Factory function to create a benchmark adapter
 *
 * @param client - The benchmark client implementation to use
 * @returns Configured benchmark adapter instance
 */
export function createBenchmarkAdapter(client: IBenchmarkClient): IBenchmarkAdapter {
  return new BenchmarkAdapter(client);
}
