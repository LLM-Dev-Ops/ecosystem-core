/**
 * Instrumented Ecosystem SDK
 *
 * Wraps the EcosystemSDK to emit hierarchical execution spans
 * conforming to the agentics-execution-engine contract.
 *
 * Every SDK operation produces:
 *   Core span (ecosystem-core)
 *     └─ Repo span (marketplace | analytics | benchmark)
 *         └─ Agent span (the specific operation)
 *
 * The instrumented SDK returns CoreExecutionResult for every call,
 * containing both the operation result and the full execution graph.
 */

import { EcosystemSDK, EcosystemConfig } from '../sdk';
import {
  SearchQuery,
  SearchResult,
  MarketplaceItem,
} from '../types';
import { ExecutionContext } from './context';
import { CoreExecutionResult } from './types';

/**
 * Maps SDK namespaces to repo names for span creation.
 */
const REPO_NAMES = {
  marketplace: 'marketplace',
  analytics: 'analytics',
  benchmark: 'benchmark',
} as const;

/**
 * Configuration for the instrumented SDK, extending the base config.
 */
export interface InstrumentedSDKConfig extends EcosystemConfig {
  /** Core name used in span identification. Defaults to 'ecosystem-core'. */
  coreName?: string;
  /** Parent span ID from the calling execution engine. */
  parentSpanId?: string | null;
}

/**
 * Wraps an async operation with full span instrumentation.
 *
 * Creates a fresh ExecutionContext per call with:
 *   Core span → Repo span → Agent span
 *
 * The agent span captures the actual operation execution.
 * Artifacts are attached at the agent level (lowest possible).
 */
async function executeWithSpans<T>(
  coreName: string,
  parentSpanId: string | null,
  repoName: string,
  agentName: string,
  operation: string,
  fn: () => Promise<T>
): Promise<CoreExecutionResult> {
  const ctx = new ExecutionContext(coreName, parentSpanId);

  // Create repo span as child of core
  const repoSpan = ctx.startRepoSpan(repoName);

  // Create agent span as child of repo
  const agentSpan = ctx.startAgentSpan(
    repoSpan.span_id,
    agentName,
    operation
  );

  let operationResult: T | null = null;

  try {
    // Execute the actual operation
    operationResult = await fn();

    // Attach result evidence at the agent level
    ctx.attachEvidenceToSpan(agentSpan.span_id, {
      type: 'id',
      value: `${repoName}:${operation}:${agentSpan.span_id}`,
      description: `Completed ${operation} via ${agentName}`,
    });

    // Complete agent and repo spans
    ctx.completeAgentSpan(agentSpan.span_id);
    ctx.completeRepoSpan(repoSpan.span_id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Fail agent and repo spans
    ctx.failAgentSpan(agentSpan.span_id, [errorMessage]);
    ctx.failRepoSpan(repoSpan.span_id, [
      `Agent "${agentName}" failed: ${errorMessage}`,
    ]);
  }

  return ctx.finalize(operationResult);
}

/**
 * Wraps a multi-repo operation with full span instrumentation.
 *
 * Used for ecosystem-level operations that coordinate multiple repos.
 * Creates a single core span with multiple repo → agent chains.
 */
async function executeMultiRepoWithSpans<T>(
  coreName: string,
  parentSpanId: string | null,
  repos: Array<{
    repoName: string;
    agentName: string;
    operation: string;
    fn: () => Promise<unknown>;
  }>,
  aggregator: (results: unknown[]) => T
): Promise<CoreExecutionResult> {
  const ctx = new ExecutionContext(coreName, parentSpanId);
  const results: unknown[] = [];
  let hasFailure = false;

  for (const repo of repos) {
    const repoSpan = ctx.startRepoSpan(repo.repoName);
    const agentSpan = ctx.startAgentSpan(
      repoSpan.span_id,
      repo.agentName,
      repo.operation
    );

    try {
      const result = await repo.fn();
      results.push(result);

      ctx.attachEvidenceToSpan(agentSpan.span_id, {
        type: 'id',
        value: `${repo.repoName}:${repo.operation}:${agentSpan.span_id}`,
        description: `Completed ${repo.operation} via ${repo.agentName}`,
      });

      ctx.completeAgentSpan(agentSpan.span_id);
      ctx.completeRepoSpan(repoSpan.span_id);
    } catch (error) {
      hasFailure = true;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      ctx.failAgentSpan(agentSpan.span_id, [errorMessage]);
      ctx.failRepoSpan(repoSpan.span_id, [
        `Agent "${repo.agentName}" failed: ${errorMessage}`,
      ]);
      results.push(null);
    }
  }

  let aggregatedResult: T | null = null;
  if (!hasFailure) {
    try {
      aggregatedResult = aggregator(results);
    } catch (error) {
      // Aggregation failure doesn't need new spans but is recorded
    }
  }

  return ctx.finalize(aggregatedResult);
}

/**
 * InstrumentedEcosystemSDK wraps EcosystemSDK with execution span emission.
 *
 * Every method returns a CoreExecutionResult containing:
 * - The operation result (accessible via .result)
 * - The full execution graph with core → repo → agent spans
 * - Validation status and any failures
 *
 * The execution graph is returned on success, partial failure, and total failure.
 */
export class InstrumentedEcosystemSDK {
  private sdk: EcosystemSDK;
  private coreName: string;
  private parentSpanId: string | null;

  constructor(config: InstrumentedSDKConfig) {
    this.sdk = new EcosystemSDK(config);
    this.coreName = config.coreName || 'ecosystem-core';
    this.parentSpanId = config.parentSpanId ?? null;
  }

  /**
   * Artifact operations — each wraps marketplace repo invocation.
   */
  public artifacts = {
    list: (query?: SearchQuery): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.marketplace,
        'marketplace-agent',
        'list_artifacts',
        () => this.sdk.artifacts.list(query)
      ),

    search: (query: string): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.marketplace,
        'marketplace-agent',
        'search_artifacts',
        () => this.sdk.artifacts.search(query)
      ),

    get: (id: string): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.marketplace,
        'marketplace-agent',
        'get_artifact',
        () => this.sdk.artifacts.get(id)
      ),

    summarize: (type?: string): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.marketplace,
        'marketplace-agent',
        'summarize_artifacts',
        () => this.sdk.artifacts.summarize(type)
      ),
  };

  /**
   * Benchmark operations — each wraps benchmark repo invocation.
   */
  public benchmarks = {
    list: (): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.benchmark,
        'benchmark-agent',
        'list_benchmarks',
        () => this.sdk.benchmarks.list()
      ),

    leaderboard: (benchmarkId: string): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.benchmark,
        'benchmark-agent',
        'get_leaderboard',
        () => this.sdk.benchmarks.leaderboard(benchmarkId)
      ),

    rankings: (modelId: string): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.benchmark,
        'benchmark-agent',
        'get_rankings',
        () => this.sdk.benchmarks.rankings(modelId)
      ),

    compare: (
      modelIds: string[],
      benchmarkId: string
    ): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.benchmark,
        'benchmark-agent',
        'compare_models',
        () => this.sdk.benchmarks.compare(modelIds, benchmarkId)
      ),
  };

  /**
   * Analytics operations — each wraps analytics repo invocation.
   */
  public analytics = {
    metrics: (): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.analytics,
        'analytics-agent',
        'get_metrics',
        () => this.sdk.analytics.metrics()
      ),

    trends: (metric: string, period?: string): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.analytics,
        'analytics-agent',
        'get_trends',
        () => this.sdk.analytics.trends(metric, period)
      ),

    usage: (artifactId?: string): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.analytics,
        'analytics-agent',
        'get_usage',
        () => this.sdk.analytics.usage(artifactId)
      ),
  };

  /**
   * Ecosystem operations — multi-repo coordination with spans.
   */
  public ecosystem = {
    overview: (): Promise<CoreExecutionResult> =>
      executeMultiRepoWithSpans(
        this.coreName,
        this.parentSpanId,
        [
          {
            repoName: REPO_NAMES.analytics,
            agentName: 'analytics-agent',
            operation: 'get_metrics',
            fn: () => this.sdk.analytics.metrics(),
          },
          {
            repoName: REPO_NAMES.marketplace,
            agentName: 'marketplace-agent',
            operation: 'list_artifacts',
            fn: () =>
              this.sdk.artifacts.list({
                query: '',
                pagination: { page: 1, pageSize: 10 },
                sortBy: 'createdAt',
                sortOrder: 'desc',
              }),
          },
          {
            repoName: REPO_NAMES.benchmark,
            agentName: 'benchmark-agent',
            operation: 'list_benchmarks',
            fn: () => this.sdk.benchmarks.list(),
          },
        ],
        (results) => {
          const [metrics, artifacts, benchmarks] = results as [any, any, any];
          return {
            metrics,
            artifacts: artifacts?.items || [],
            benchmarkCount: benchmarks?.length || 0,
            lastUpdated: new Date().toISOString(),
          };
        }
      ),

    trending: (): Promise<CoreExecutionResult> =>
      executeWithSpans(
        this.coreName,
        this.parentSpanId,
        REPO_NAMES.marketplace,
        'marketplace-agent',
        'list_trending',
        () =>
          this.sdk.artifacts.list({
            query: '',
            pagination: { page: 1, pageSize: 20 },
            sortBy: 'downloads',
            sortOrder: 'desc',
          })
      ),

    insights: (artifactIds: string[]): Promise<CoreExecutionResult> =>
      executeMultiRepoWithSpans(
        this.coreName,
        this.parentSpanId,
        artifactIds.map((id) => ({
          repoName: REPO_NAMES.marketplace,
          agentName: 'marketplace-agent',
          operation: `get_artifact:${id}`,
          fn: () => this.sdk.artifacts.get(id),
        })),
        (results) => {
          const validArtifacts = results.filter(
            (a): a is MarketplaceItem => a !== null
          );
          return {
            artifacts: artifactIds,
            validCount: validArtifacts.length,
            resolvedAt: new Date().toISOString(),
          };
        }
      ),
  };
}

/**
 * Factory function to create an InstrumentedEcosystemSDK.
 */
export function createInstrumentedEcosystemSDK(
  config: InstrumentedSDKConfig
): InstrumentedEcosystemSDK {
  return new InstrumentedEcosystemSDK(config);
}
