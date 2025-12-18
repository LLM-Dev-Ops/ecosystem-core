# LLM-Ecosystem-Core Test Suite

This directory contains comprehensive tests for the LLM-Ecosystem-Core library, verifying that the glue logic works correctly with mock clients.

## Test Structure

### 1. `mocks/index.ts` - Mock Implementations

Contains mock client implementations that return predictable test data:

- **MockMarketplaceClient**: Implements `IMarketplaceClient` for adapter tests
- **MockAnalyticsClient**: Implements `IAnalyticsClient` for adapter tests
- **MockBenchmarkClient**: Implements `IBenchmarkClient` for adapter tests
- **MockSDKMarketplaceClient**: Implements SDK `IMarketplaceClient` for SDK tests
- **MockSDKAnalyticsClient**: Implements SDK `IAnalyticsClient` for SDK tests
- **MockSDKBenchmarkClient**: Implements SDK `IBenchmarkClient` for SDK tests

Each mock returns realistic test data to verify that adapters and SDK correctly delegate operations.

### 2. `adapters.test.ts` - Adapter Tests

Tests verify that all adapters correctly delegate to their respective clients:

#### MarketplaceAdapter Tests (5 tests)
- ✓ Delegates `listArtifacts` correctly
- ✓ Delegates `getArtifact` correctly
- ✓ Delegates `searchArtifacts` correctly
- ✓ Delegates `getArtifactsByType` correctly
- ✓ Normalizes date fields properly

#### AnalyticsAdapter Tests (5 tests)
- ✓ Delegates `getEcosystemMetrics` correctly
- ✓ Delegates `getTrends` correctly
- ✓ Delegates `getUsageStats` correctly
- ✓ Delegates `correlateUsage` correctly
- ✓ Normalizes metrics structure

#### BenchmarkAdapter Tests (6 tests)
- ✓ Delegates `getLeaderboard` correctly
- ✓ Delegates `getBenchmarkResults` correctly
- ✓ Delegates `listBenchmarks` correctly
- ✓ Delegates `getRankings` correctly
- ✓ Delegates `compareBenchmarks` correctly
- ✓ Normalizes leaderboard dates

### 3. `sdk.test.ts` - SDK Tests

Tests verify that the SDK provides a clean API and delegates correctly:

#### SDK Initialization Tests (2 tests)
- ✓ SDK initializes correctly
- ✓ SDK factory function works

#### Artifacts Namespace Tests (5 tests)
- ✓ `artifacts.list` works
- ✓ `artifacts.list` respects pagination
- ✓ `artifacts.search` works
- ✓ `artifacts.get` works
- ✓ `artifacts.summarize` works

#### Benchmarks Namespace Tests (4 tests)
- ✓ `benchmarks.list` works
- ✓ `benchmarks.leaderboard` works
- ✓ `benchmarks.rankings` works
- ✓ `benchmarks.compare` works

#### Analytics Namespace Tests (3 tests)
- ✓ `analytics.metrics` works
- ✓ `analytics.trends` works
- ✓ `analytics.usage` works

#### Ecosystem Namespace Tests (3 tests)
- ✓ `ecosystem.overview` works
- ✓ `ecosystem.trending` works
- ✓ `ecosystem.insights` works

#### Integration Tests (2 tests)
- ✓ SDK namespaces are independent
- ✓ SDK delegates correctly to clients

### 4. `index.ts` - Test Runner

Main test runner that executes all test suites and reports results.

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Adapter Tests Only
```bash
npm run test:adapters
```

### Run SDK Tests Only
```bash
npm run test:sdk
```

## Test Framework

The tests use a simple assertion-based testing framework with no external dependencies:

```typescript
function test(name: string, fn: () => void | Promise<void>)
function assertEqual(actual: unknown, expected: unknown, message?: string)
function assertTruthy(value: unknown, message?: string)
function assertInstanceOf(value: unknown, type: any, message?: string)
```

This lightweight approach ensures:
- No test framework dependency overhead
- Clear, readable test code
- Fast execution
- Easy debugging

## Test Coverage

**Total: 35 tests**
- 16 adapter tests (covering all 3 adapters)
- 19 SDK tests (covering all 4 namespaces)

All tests verify that the glue logic correctly:
1. Delegates operations to the appropriate client methods
2. Normalizes responses to ecosystem types
3. Handles data transformation (e.g., Date conversions)
4. Provides clean, organized API surfaces

## Mock Data

The mocks provide realistic test data:

### Marketplace Items
- 2 marketplace items (prompt and model types)
- Complete with metadata, tags, downloads, ratings

### Analytics Data
- Ecosystem metrics with usage statistics
- Trend data with time series values
- Top artifacts with scores

### Benchmark Data
- 2 benchmarks (MMLU, HellaSwag)
- Leaderboard entries with rankings
- Model results across benchmarks

## Philosophy

These tests follow the "thin glue" philosophy of LLM-Ecosystem-Core:

- **No Business Logic**: Tests verify delegation, not implementation
- **Mock Clients**: External systems are mocked with predictable data
- **Type Safety**: All tests verify proper type transformations
- **Clear Assertions**: Each test has clear, specific assertions

## Extending Tests

To add new tests:

1. Add test data to relevant mock client in `mocks/index.ts`
2. Create test function following naming pattern: `testComponentDelegatesOperation`
3. Add test to the test array in the appropriate test file
4. Run tests to verify

Example:
```typescript
async function testNewFeature() {
  const client = new MockClient();
  const adapter = new Adapter(client);

  const result = await adapter.newMethod();

  assertTruthy(result, 'Result should exist');
  assertEqual(result.property, expectedValue);
}

// Add to tests array
test('Adapter delegates newMethod correctly', testNewFeature)
```
