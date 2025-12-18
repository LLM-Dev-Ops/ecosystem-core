/**
 * SDK Tests
 * Tests verify that the SDK correctly delegates to client implementations
 * and provides a clean API surface for consumers
 */

import { EcosystemSDK, createEcosystemSDK } from '../src/sdk';
import { MockSDKMarketplaceClient, MockSDKAnalyticsClient, MockSDKBenchmarkClient } from './mocks';

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

// SDK Initialization Tests
async function testSDKInitialization() {
  const sdk = new EcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  assertTruthy(sdk, 'SDK should be created');
  assertTruthy(sdk.artifacts, 'SDK should have artifacts namespace');
  assertTruthy(sdk.benchmarks, 'SDK should have benchmarks namespace');
  assertTruthy(sdk.analytics, 'SDK should have analytics namespace');
  assertTruthy(sdk.ecosystem, 'SDK should have ecosystem namespace');
}

async function testSDKFactoryFunction() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  assertInstanceOf(sdk, EcosystemSDK, 'Factory should return EcosystemSDK instance');
}

// Artifacts Namespace Tests
async function testSDKArtifactsList() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const result = await sdk.artifacts.list();

  assertTruthy(result, 'Result should exist');
  assertTruthy(Array.isArray(result.items), 'Result should have items');
  assertEqual(result.total, 2);
  assertEqual(result.items.length, 2);
}

async function testSDKArtifactsListWithQuery() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const result = await sdk.artifacts.list({
    query: '',
    pagination: { page: 1, pageSize: 1 },
  });

  assertEqual(result.items.length, 1, 'Should respect pagination');
}

async function testSDKArtifactsSearch() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const result = await sdk.artifacts.search('template');

  assertTruthy(result, 'Result should exist');
  assertTruthy(result.items.length > 0, 'Should find matching items');
  assertTruthy(result.items[0].name.includes('Template'), 'Should match query');
}

async function testSDKArtifactsGet() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const artifact = await sdk.artifacts.get('mp-1');

  assertTruthy(artifact, 'Artifact should exist');
  assertEqual(artifact!.id, 'mp-1');
  assertEqual(artifact!.name, 'Test Prompt Template');
}

async function testSDKArtifactsSummarize() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const summary = await sdk.artifacts.summarize();

  assertTruthy(summary, 'Summary should exist');
  assertEqual(summary.totalCount, 2);
  assertTruthy(summary.byType, 'Should have type breakdown');
  assertTruthy(summary.bySource, 'Should have source breakdown');
  assertTruthy(Array.isArray(summary.recentlyAdded), 'Should have recently added items');
}

// Benchmarks Namespace Tests
async function testSDKBenchmarksList() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const benchmarks = await sdk.benchmarks.list();

  assertTruthy(Array.isArray(benchmarks), 'Benchmarks should be an array');
  assertTruthy(benchmarks.length > 0, 'Should have benchmarks');
  assertTruthy(benchmarks[0].id, 'Benchmark should have id');
  assertTruthy(benchmarks[0].name, 'Benchmark should have name');
}

async function testSDKBenchmarksLeaderboard() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const leaderboard = await sdk.benchmarks.leaderboard('mmlu');

  assertTruthy(leaderboard, 'Leaderboard should exist');
  assertEqual(leaderboard.benchmarkId, 'mmlu');
  assertTruthy(Array.isArray(leaderboard.entries), 'Should have entries');
}

async function testSDKBenchmarksRankings() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const rankings = await sdk.benchmarks.rankings('model-1');

  assertTruthy(Array.isArray(rankings), 'Rankings should be an array');
  assertTruthy(rankings.length > 0, 'Should have rankings');
  assertEqual(rankings[0].modelId, 'model-1');
}

async function testSDKBenchmarksCompare() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const comparison = await sdk.benchmarks.compare(['model-1'], 'mmlu');

  assertTruthy(comparison, 'Comparison should exist');
  assertEqual(comparison.benchmarkId, 'mmlu');
  assertTruthy(Array.isArray(comparison.models), 'Should have models array');
}

// Analytics Namespace Tests
async function testSDKAnalyticsMetrics() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const metrics = await sdk.analytics.metrics();

  assertTruthy(metrics, 'Metrics should exist');
  assertTruthy(metrics.usage, 'Should have usage data');
  assertEqual(metrics.usage.totalArtifacts, 250);
  assertEqual(metrics.usage.totalDownloads, 5000);
  assertEqual(metrics.usage.activeUsers, 500);
}

async function testSDKAnalyticsTrends() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const trends = await sdk.analytics.trends('downloads', 'daily');

  assertTruthy(Array.isArray(trends), 'Trends should be an array');
  assertTruthy(trends.length > 0, 'Should have trend data');
  assertEqual(trends[0].metric, 'downloads');
}

async function testSDKAnalyticsUsage() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const usage = await sdk.analytics.usage('artifact-1');

  assertTruthy(usage, 'Usage should exist');
  assertEqual(usage.artifactId, 'artifact-1');
  assertTruthy(typeof usage.downloads === 'number', 'Should have downloads');
  assertTruthy(typeof usage.views === 'number', 'Should have views');
}

// Ecosystem Namespace Tests
async function testSDKEcosystemOverview() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const overview = await sdk.ecosystem.overview();

  assertTruthy(overview, 'Overview should exist');
  assertTruthy(typeof overview.totalArtifacts === 'number', 'Should have total artifacts');
  assertTruthy(typeof overview.totalBenchmarks === 'number', 'Should have total benchmarks');
  assertTruthy(Array.isArray(overview.recentActivity), 'Should have recent activity');
  assertTruthy(overview.summary, 'Should have summary');
}

async function testSDKEcosystemTrending() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const trending = await sdk.ecosystem.trending();

  assertTruthy(trending, 'Trending should exist');
  assertTruthy(Array.isArray(trending.trending), 'Should have trending items');
  assertTruthy(trending.period, 'Should have period');
  assertTruthy(trending.criteria, 'Should have criteria');
}

async function testSDKEcosystemInsights() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const insights = await sdk.ecosystem.insights(['mp-1', 'mp-2']);

  assertTruthy(insights, 'Insights should exist');
  assertTruthy(Array.isArray(insights.artifacts), 'Should have artifacts');
  assertTruthy(Array.isArray(insights.commonPatterns), 'Should have common patterns');
  assertTruthy(Array.isArray(insights.recommendations), 'Should have recommendations');
}

// Integration Tests
async function testSDKNamespacesAreIndependent() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  // Should be able to call multiple namespaces without interference
  const [artifacts, metrics, benchmarks] = await Promise.all([
    sdk.artifacts.list(),
    sdk.analytics.metrics(),
    sdk.benchmarks.list(),
  ]);

  assertTruthy(artifacts, 'Artifacts call should succeed');
  assertTruthy(metrics, 'Metrics call should succeed');
  assertTruthy(benchmarks, 'Benchmarks call should succeed');
}

async function testSDKDelegatesCorrectly() {
  const sdk = createEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  // Verify that SDK delegates to the correct client methods
  const artifact = await sdk.artifacts.get('mp-1');
  const metrics = await sdk.analytics.metrics();
  const leaderboard = await sdk.benchmarks.leaderboard('mmlu');

  assertEqual(artifact!.id, 'mp-1', 'Should delegate to marketplace client');
  assertEqual(metrics.usage.totalArtifacts, 250, 'Should delegate to analytics client');
  assertEqual(leaderboard.benchmarkId, 'mmlu', 'Should delegate to benchmark client');
}

// Run all tests
export async function runTests() {
  console.log('\n=== SDK Tests ===\n');

  const tests = [
    // SDK initialization
    test('SDK initializes correctly', testSDKInitialization),
    test('SDK factory function works', testSDKFactoryFunction),

    // Artifacts namespace
    test('SDK artifacts.list works', testSDKArtifactsList),
    test('SDK artifacts.list respects pagination', testSDKArtifactsListWithQuery),
    test('SDK artifacts.search works', testSDKArtifactsSearch),
    test('SDK artifacts.get works', testSDKArtifactsGet),
    test('SDK artifacts.summarize works', testSDKArtifactsSummarize),

    // Benchmarks namespace
    test('SDK benchmarks.list works', testSDKBenchmarksList),
    test('SDK benchmarks.leaderboard works', testSDKBenchmarksLeaderboard),
    test('SDK benchmarks.rankings works', testSDKBenchmarksRankings),
    test('SDK benchmarks.compare works', testSDKBenchmarksCompare),

    // Analytics namespace
    test('SDK analytics.metrics works', testSDKAnalyticsMetrics),
    test('SDK analytics.trends works', testSDKAnalyticsTrends),
    test('SDK analytics.usage works', testSDKAnalyticsUsage),

    // Ecosystem namespace
    test('SDK ecosystem.overview works', testSDKEcosystemOverview),
    test('SDK ecosystem.trending works', testSDKEcosystemTrending),
    test('SDK ecosystem.insights works', testSDKEcosystemInsights),

    // Integration tests
    test('SDK namespaces are independent', testSDKNamespacesAreIndependent),
    test('SDK delegates correctly to clients', testSDKDelegatesCorrectly),
  ];

  for (const testFn of tests) {
    await testFn();
  }

  console.log(`\nTests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}\n`);

  return { passed: testsPassed, failed: testsFailed };
}
