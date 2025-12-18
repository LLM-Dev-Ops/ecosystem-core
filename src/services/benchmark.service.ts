/**
 * BenchmarkService - Thin glue service for benchmark operations
 * Delegates all operations to benchmark adapter
 */

import { BenchmarkLeaderboard } from '../types';
import {
  IBenchmarkAdapter,
  BenchmarkMetadata,
  RankingEntry,
  ComparisonResult,
} from '../adapters/benchmark.adapter';

/**
 * Benchmark service that coordinates benchmark adapter
 */
export class BenchmarkService {
  constructor(private readonly benchmarkAdapter: IBenchmarkAdapter) {}

  /**
   * Get all public leaderboards
   * Lists available benchmarks and returns their leaderboards
   */
  async getPublicLeaderboards(): Promise<BenchmarkLeaderboard[]> {
    // Get list of all benchmarks
    const benchmarks = await this.benchmarkAdapter.listBenchmarks();

    // Get leaderboard for each benchmark
    const leaderboards = await Promise.all(
      benchmarks.map((benchmark) =>
        this.benchmarkAdapter.getLeaderboard(benchmark.id)
      )
    );

    return leaderboards;
  }

  /**
   * Get rankings for a specific model
   * Delegates directly to benchmark adapter
   */
  async getRankingsForModel(modelId: string): Promise<RankingEntry[]> {
    // Get all benchmark results for the model
    const results = await this.benchmarkAdapter.getBenchmarkResults(modelId);

    // Convert to ranking entries
    return results.map((result) => ({
      rank: result.rank || 0,
      modelId: result.modelId,
      score: result.score,
      metadata: result.metadata,
    }));
  }

  /**
   * Get metadata about available benchmarks
   * Delegates directly to benchmark adapter
   */
  async getBenchmarkMetadata(): Promise<BenchmarkMetadata[]> {
    return this.benchmarkAdapter.listBenchmarks();
  }

  /**
   * Compare multiple models on a specific benchmark
   * Delegates directly to benchmark adapter
   */
  async compareModels(modelIds: string[], benchmarkId: string): Promise<ComparisonResult> {
    return this.benchmarkAdapter.compareBenchmarks(modelIds, benchmarkId);
  }
}
