/**
 * Adapter Tests
 * Tests verify that adapters correctly delegate to their respective clients
 * and normalize responses to ecosystem types
 */

import { MarketplaceAdapter } from '../src/adapters/marketplace.adapter';
import { AnalyticsAdapter } from '../src/adapters/analytics.adapter';
import { BenchmarkAdapter } from '../src/adapters/benchmark.adapter';
import { MockMarketplaceClient, MockAnalyticsClient, MockBenchmarkClient } from './mocks';

// Simple test framework
let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      testsPassed++;
      console.log(`✓ ${name}`);
    } catch (error) {
      testsFailed++;
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

function assertEqual(actual: unknown, expected: unknown, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      message || `Expected ${expectedStr} but got ${actualStr}`
    );
  }
}

function assertTruthy(value: unknown, message?: string) {
  if (!value) {
    throw new Error(message || `Expected truthy value but got ${value}`);
  }
}

function assertInstanceOf(value: unknown, type: any, message?: string) {
  if (!(value instanceof type)) {
    throw new Error(
      message || `Expected instance of ${type.name} but got ${typeof value}`
    );
  }
}

// MarketplaceAdapter Tests
async function testMarketplaceAdapterDelegatesListArtifacts() {
  const client = new MockMarketplaceClient();
  const adapter = new MarketplaceAdapter(client);

  const result = await adapter.listArtifacts({ query: 'prompt' });

  assertTruthy(result, 'Result should exist');
  assertTruthy(Array.isArray(result.items), 'Result should have items array');
  assertEqual(result.items.length, 1, 'Should find 1 matching item');
  assertEqual(result.items[0].name, 'Test Prompt Template');
}

async function testMarketplaceAdapterDelegatesGetArtifact() {
  const client = new MockMarketplaceClient();
  const adapter = new MarketplaceAdapter(client);

  const artifact = await adapter.getArtifact('mp-1');

  assertTruthy(artifact, 'Artifact should exist');
  assertEqual(artifact!.id, 'mp-1');
  assertEqual(artifact!.name, 'Test Prompt Template');
}

async function testMarketplaceAdapterDelegatesSearchArtifacts() {
  const client = new MockMarketplaceClient();
  const adapter = new MarketplaceAdapter(client);

  const result = await adapter.searchArtifacts('model');

  assertTruthy(result, 'Result should exist');
  assertEqual(result.items.length, 1, 'Should find 1 matching item');
  assertEqual(result.items[0].type, 'model');
}

async function testMarketplaceAdapterDelegatesGetArtifactsByType() {
  const client = new MockMarketplaceClient();
  const adapter = new MarketplaceAdapter(client);

  const artifacts = await adapter.getArtifactsByType('prompt');

  assertTruthy(Array.isArray(artifacts), 'Result should be an array');
  assertEqual(artifacts.length, 1, 'Should find 1 prompt');
  assertEqual(artifacts[0].type, 'prompt');
}

async function testMarketplaceAdapterNormalizesDateFields() {
  const client = new MockMarketplaceClient();
  const adapter = new MarketplaceAdapter(client);

  const artifact = await adapter.getArtifact('mp-1');

  assertTruthy(artifact, 'Artifact should exist');
  assertInstanceOf(artifact!.createdAt, Date, 'createdAt should be a Date');
  assertInstanceOf(artifact!.publishedAt!, Date, 'publishedAt should be a Date');
  assertInstanceOf(artifact!.updatedAt!, Date, 'updatedAt should be a Date');
}

// AnalyticsAdapter Tests
async function testAnalyticsAdapterDelegatesGetEcosystemMetrics() {
  const client = new MockAnalyticsClient();
  const adapter = new AnalyticsAdapter(client);

  const metrics = await adapter.getEcosystemMetrics();

  assertTruthy(metrics, 'Metrics should exist');
  assertEqual(metrics.usage.totalArtifacts, 250);
  assertEqual(metrics.usage.totalDownloads, 5000);
  assertEqual(metrics.usage.activeUsers, 500);
  assertTruthy(Array.isArray(metrics.trends), 'Trends should be an array');
  assertTruthy(Array.isArray(metrics.topArtifacts), 'Top artifacts should be an array');
}

async function testAnalyticsAdapterDelegatesGetTrends() {
  const client = new MockAnalyticsClient();
  const adapter = new AnalyticsAdapter(client);

  const trends = await adapter.getTrends('downloads', 'daily');

  assertTruthy(Array.isArray(trends), 'Result should be an array');
  assertTruthy(trends.length > 0, 'Should have at least one trend');
  assertEqual(trends[0].metric, 'downloads');
  assertEqual(trends[0].period, 'daily');
  assertEqual(trends[0].source, 'analytics');
}

async function testAnalyticsAdapterDelegatesGetUsageStats() {
  const client = new MockAnalyticsClient();
  const adapter = new AnalyticsAdapter(client);

  const stats = await adapter.getUsageStats('artifact-123');

  assertTruthy(stats, 'Stats should exist');
  assertEqual(stats.totalUsage, 100);
  assertEqual(stats.uniqueUsers, 20);
  assertEqual(stats.trend, 'increasing');
}

async function testAnalyticsAdapterDelegatesCorrelateUsage() {
  const client = new MockAnalyticsClient();
  const adapter = new AnalyticsAdapter(client);

  const correlation = await adapter.correlateUsage(['artifact-1', 'artifact-2']);

  assertTruthy(correlation, 'Correlation should exist');
  assertTruthy(Array.isArray(correlation.correlations), 'Correlations should be an array');
  assertEqual(correlation.correlations.length, 1);
  assertEqual(correlation.correlations[0].strength, 'strong');
  assertEqual(correlation.confidence, 0.85);
}

async function testAnalyticsAdapterNormalizesMetricsStructure() {
  const client = new MockAnalyticsClient();
  const adapter = new AnalyticsAdapter(client);

  const metrics = await adapter.getEcosystemMetrics();

  assertTruthy(metrics.usage, 'Usage object should exist');
  assertTruthy(typeof metrics.usage.totalArtifacts === 'number', 'totalArtifacts should be a number');
  assertTruthy(typeof metrics.usage.totalDownloads === 'number', 'totalDownloads should be a number');
  assertTruthy(typeof metrics.usage.activeUsers === 'number', 'activeUsers should be a number');
}

// BenchmarkAdapter Tests
async function testBenchmarkAdapterDelegatesGetLeaderboard() {
  const client = new MockBenchmarkClient();
  const adapter = new BenchmarkAdapter(client);

  const leaderboard = await adapter.getLeaderboard('mmlu');

  assertTruthy(leaderboard, 'Leaderboard should exist');
  assertEqual(leaderboard.benchmarkId, 'mmlu');
  assertEqual(leaderboard.benchmarkName, 'MMLU Benchmark');
  assertTruthy(Array.isArray(leaderboard.entries), 'Entries should be an array');
  assertEqual(leaderboard.entries.length, 2);
}

async function testBenchmarkAdapterDelegatesGetBenchmarkResults() {
  const client = new MockBenchmarkClient();
  const adapter = new BenchmarkAdapter(client);

  const results = await adapter.getBenchmarkResults('model-1');

  assertTruthy(Array.isArray(results), 'Results should be an array');
  assertEqual(results.length, 2, 'Model-1 should have 2 results');
  assertEqual(results[0].modelId, 'model-1');
  assertEqual(results[1].modelId, 'model-1');
}

async function testBenchmarkAdapterDelegatesListBenchmarks() {
  const client = new MockBenchmarkClient();
  const adapter = new BenchmarkAdapter(client);

  const benchmarks = await adapter.listBenchmarks();

  assertTruthy(Array.isArray(benchmarks), 'Benchmarks should be an array');
  assertEqual(benchmarks.length, 2);
  assertEqual(benchmarks[0].id, 'mmlu');
  assertEqual(benchmarks[1].id, 'hellaswag');
}

async function testBenchmarkAdapterDelegatesGetRankings() {
  const client = new MockBenchmarkClient();
  const adapter = new BenchmarkAdapter(client);

  const rankings = await adapter.getRankings('mmlu', 10);

  assertTruthy(Array.isArray(rankings), 'Rankings should be an array');
  assertTruthy(rankings.length > 0, 'Should have rankings');
  assertEqual(rankings[0].modelId, 'model-1');
  assertEqual(rankings[0].score, 85.5);
}

async function testBenchmarkAdapterDelegatesCompareBenchmarks() {
  const client = new MockBenchmarkClient();
  const adapter = new BenchmarkAdapter(client);

  const comparison = await adapter.compareBenchmarks(['model-1', 'model-2'], 'mmlu');

  assertTruthy(comparison, 'Comparison should exist');
  assertEqual(comparison.benchmarkId, 'mmlu');
  assertTruthy(Array.isArray(comparison.results), 'Results should be an array');
  assertEqual(comparison.results.length, 2);
}

async function testBenchmarkAdapterNormalizesLeaderboardDates() {
  const client = new MockBenchmarkClient();
  const adapter = new BenchmarkAdapter(client);

  const leaderboard = await adapter.getLeaderboard('mmlu');

  assertInstanceOf(leaderboard.updatedAt, Date, 'updatedAt should be a Date');
}

// Run all tests
export async function runTests() {
  console.log('\n=== Adapter Tests ===\n');

  const tests = [
    // MarketplaceAdapter tests
    test('MarketplaceAdapter delegates listArtifacts correctly', testMarketplaceAdapterDelegatesListArtifacts),
    test('MarketplaceAdapter delegates getArtifact correctly', testMarketplaceAdapterDelegatesGetArtifact),
    test('MarketplaceAdapter delegates searchArtifacts correctly', testMarketplaceAdapterDelegatesSearchArtifacts),
    test('MarketplaceAdapter delegates getArtifactsByType correctly', testMarketplaceAdapterDelegatesGetArtifactsByType),
    test('MarketplaceAdapter normalizes date fields', testMarketplaceAdapterNormalizesDateFields),

    // AnalyticsAdapter tests
    test('AnalyticsAdapter delegates getEcosystemMetrics correctly', testAnalyticsAdapterDelegatesGetEcosystemMetrics),
    test('AnalyticsAdapter delegates getTrends correctly', testAnalyticsAdapterDelegatesGetTrends),
    test('AnalyticsAdapter delegates getUsageStats correctly', testAnalyticsAdapterDelegatesGetUsageStats),
    test('AnalyticsAdapter delegates correlateUsage correctly', testAnalyticsAdapterDelegatesCorrelateUsage),
    test('AnalyticsAdapter normalizes metrics structure', testAnalyticsAdapterNormalizesMetricsStructure),

    // BenchmarkAdapter tests
    test('BenchmarkAdapter delegates getLeaderboard correctly', testBenchmarkAdapterDelegatesGetLeaderboard),
    test('BenchmarkAdapter delegates getBenchmarkResults correctly', testBenchmarkAdapterDelegatesGetBenchmarkResults),
    test('BenchmarkAdapter delegates listBenchmarks correctly', testBenchmarkAdapterDelegatesListBenchmarks),
    test('BenchmarkAdapter delegates getRankings correctly', testBenchmarkAdapterDelegatesGetRankings),
    test('BenchmarkAdapter delegates compareBenchmarks correctly', testBenchmarkAdapterDelegatesCompareBenchmarks),
    test('BenchmarkAdapter normalizes leaderboard dates', testBenchmarkAdapterNormalizesLeaderboardDates),
  ];

  for (const testFn of tests) {
    await testFn();
  }

  console.log(`\nTests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}\n`);

  return { passed: testsPassed, failed: testsFailed };
}
