/**
 * Execution Engine Instrumentation Tests
 *
 * Verifies that the execution span system satisfies all invariants
 * required by agentics-execution-engine.
 */

import {
  ExecutionContext,
  InstrumentedEcosystemSDK,
  createInstrumentedEcosystemSDK,
  validateExecutionGraph,
  isValidExecutionGraph,
  createCoreSpan,
  createRepoSpan,
  createAgentSpan,
  completeSpan,
  failSpan,
  attachArtifact,
  attachEvidence,
  CoreExecutionResult,
  ExecutionGraph,
  ExecutionSpan,
} from '../src/execution';

import {
  MockSDKMarketplaceClient,
  MockSDKAnalyticsClient,
  MockSDKBenchmarkClient,
} from './mocks';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.log(`✗ ${message}`);
    failed++;
  }
}

// ============================================================================
// Span Factory Tests
// ============================================================================

async function testSpanFactories() {
  console.log('\n--- Span Factory Tests ---\n');

  // Core span creation
  const core = createCoreSpan('test-core');
  assert(core.type === 'core', 'createCoreSpan sets type to core');
  assert(core.status === 'running', 'createCoreSpan sets status to running');
  assert(core.parent_span_id === null, 'createCoreSpan has null parent by default');
  assert(core.span_id.length > 0, 'createCoreSpan generates a span_id');
  assert(core.start_time.length > 0, 'createCoreSpan records start_time');
  assert(core.end_time === null, 'createCoreSpan has null end_time initially');

  // Core span with parent
  const coreWithParent = createCoreSpan('child-core', 'parent-123');
  assert(
    coreWithParent.parent_span_id === 'parent-123',
    'createCoreSpan accepts parent_span_id'
  );

  // Repo span creation
  const repo = createRepoSpan('marketplace', core.span_id);
  assert(repo.type === 'repo', 'createRepoSpan sets type to repo');
  assert(repo.repo_name === 'marketplace', 'createRepoSpan sets repo_name');
  assert(
    repo.parent_span_id === core.span_id,
    'createRepoSpan links to parent core span'
  );

  // Agent span creation
  const agent = createAgentSpan('marketplace-agent', 'list', repo.span_id);
  assert(agent.type === 'agent', 'createAgentSpan sets type to agent');
  assert(agent.agent_name === 'marketplace-agent', 'createAgentSpan sets agent_name');
  assert(agent.operation === 'list', 'createAgentSpan sets operation');
  assert(
    agent.parent_span_id === repo.span_id,
    'createAgentSpan links to parent repo span'
  );

  // Complete span
  const completed = completeSpan(core);
  assert(completed.status === 'completed', 'completeSpan sets status to completed');
  assert(completed.end_time !== null, 'completeSpan sets end_time');
  assert(core.status === 'running', 'completeSpan is immutable (original unchanged)');

  // Fail span
  const failed_span = failSpan(core, ['test error']);
  assert(failed_span.status === 'failed', 'failSpan sets status to failed');
  assert(
    failed_span.failure_reasons.includes('test error'),
    'failSpan records failure reasons'
  );
  assert(failed_span.end_time !== null, 'failSpan sets end_time');

  // Attach artifact
  const withArtifact = attachArtifact(agent, {
    id: 'art-1',
    type: 'report',
    name: 'Test Report',
    content: { data: 'test' },
  });
  assert(withArtifact.artifacts.length === 1, 'attachArtifact adds artifact');
  assert(
    withArtifact.artifacts[0].id === 'art-1',
    'attachArtifact preserves artifact id'
  );
  assert(
    withArtifact.artifacts[0].produced_at.length > 0,
    'attachArtifact sets produced_at'
  );

  // Attach evidence
  const withEvidence = attachEvidence(agent, {
    type: 'id',
    value: 'evidence-123',
    description: 'Test evidence',
  });
  assert(withEvidence.evidence.length === 1, 'attachEvidence adds evidence');
  assert(
    withEvidence.evidence[0].value === 'evidence-123',
    'attachEvidence preserves evidence value'
  );
}

// ============================================================================
// Validator Tests
// ============================================================================

async function testValidator() {
  console.log('\n--- Validator Tests ---\n');

  // Valid graph: core → repo → agent
  const validGraph: ExecutionGraph = {
    spans: [
      {
        span_id: 'core-1',
        parent_span_id: null,
        type: 'core',
        name: 'test-core',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
      {
        span_id: 'repo-1',
        parent_span_id: 'core-1',
        type: 'repo',
        name: 'repo:marketplace',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
      {
        span_id: 'agent-1',
        parent_span_id: 'repo-1',
        type: 'agent',
        name: 'agent:marketplace-agent:list',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
    ],
  };

  const validFailures = validateExecutionGraph(validGraph);
  assert(validFailures.length === 0, 'Valid core→repo→agent graph passes validation');
  assert(isValidExecutionGraph(validGraph), 'isValidExecutionGraph returns true for valid graph');

  // Invalid: core with no repo children
  const noRepoGraph: ExecutionGraph = {
    spans: [
      {
        span_id: 'core-1',
        parent_span_id: null,
        type: 'core',
        name: 'test-core',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
    ],
  };

  const noRepoFailures = validateExecutionGraph(noRepoGraph);
  assert(noRepoFailures.length > 0, 'Graph without repo children fails validation');
  assert(
    noRepoFailures.some((f) => f.rule === 'core_must_have_repo_children'),
    'Failure identifies missing repo children rule'
  );

  // Invalid: repo with no agent children
  const noAgentGraph: ExecutionGraph = {
    spans: [
      {
        span_id: 'core-1',
        parent_span_id: null,
        type: 'core',
        name: 'test-core',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
      {
        span_id: 'repo-1',
        parent_span_id: 'core-1',
        type: 'repo',
        name: 'repo:marketplace',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
    ],
  };

  const noAgentFailures = validateExecutionGraph(noAgentGraph);
  assert(noAgentFailures.length > 0, 'Graph without agent children fails validation');
  assert(
    noAgentFailures.some((f) => f.rule === 'repo_must_have_agent_children'),
    'Failure identifies missing agent children rule'
  );

  // Invalid: no core span at all
  const noCoreGraph: ExecutionGraph = { spans: [] };
  const noCoreFailures = validateExecutionGraph(noCoreGraph);
  assert(noCoreFailures.length > 0, 'Graph without core span fails validation');
  assert(
    noCoreFailures.some((f) => f.rule === 'core_span_required'),
    'Failure identifies missing core span rule'
  );

  // Invalid: orphan parent reference
  const orphanGraph: ExecutionGraph = {
    spans: [
      {
        span_id: 'core-1',
        parent_span_id: null,
        type: 'core',
        name: 'test-core',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
      {
        span_id: 'repo-1',
        parent_span_id: 'nonexistent',
        type: 'repo',
        name: 'repo:orphan',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
    ],
  };

  const orphanFailures = validateExecutionGraph(orphanGraph);
  assert(
    orphanFailures.some((f) => f.rule === 'valid_parent_reference'),
    'Orphan parent reference detected by validator'
  );

  // Invalid: empty evidence value
  const emptyEvidenceGraph: ExecutionGraph = {
    spans: [
      {
        span_id: 'core-1',
        parent_span_id: null,
        type: 'core',
        name: 'test-core',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [{ type: 'id', value: '', description: 'empty' }],
        failure_reasons: [],
        metadata: {},
      },
      {
        span_id: 'repo-1',
        parent_span_id: 'core-1',
        type: 'repo',
        name: 'repo:test',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
      {
        span_id: 'agent-1',
        parent_span_id: 'repo-1',
        type: 'agent',
        name: 'agent:test:op',
        status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        artifacts: [],
        evidence: [],
        failure_reasons: [],
        metadata: {},
      },
    ],
  };

  const evidenceFailures = validateExecutionGraph(emptyEvidenceGraph);
  assert(
    evidenceFailures.some((f) => f.rule === 'evidence_must_be_verifiable'),
    'Empty evidence value detected by validator'
  );
}

// ============================================================================
// Execution Context Tests
// ============================================================================

async function testExecutionContext() {
  console.log('\n--- ExecutionContext Tests ---\n');

  // Basic context creation
  const ctx = new ExecutionContext('ecosystem-core');
  assert(ctx.coreSpanId.length > 0, 'ExecutionContext generates core span ID');

  // Invocation context
  const invCtx = ctx.getInvocationContext();
  assert(
    invCtx.parent_span_id === ctx.coreSpanId,
    'InvocationContext parent_span_id matches core span'
  );
  assert(
    invCtx.core_span_id === ctx.coreSpanId,
    'InvocationContext core_span_id matches core span'
  );

  // Full lifecycle: start repo → start agent → complete agent → complete repo → finalize
  const repo = ctx.startRepoSpan('marketplace');
  assert(repo.type === 'repo', 'startRepoSpan creates repo span');
  assert(
    repo.parent_span_id === ctx.coreSpanId,
    'Repo span parent is core span'
  );

  const agent = ctx.startAgentSpan(repo.span_id, 'marketplace-agent', 'list');
  assert(agent.type === 'agent', 'startAgentSpan creates agent span');
  assert(
    agent.parent_span_id === repo.span_id,
    'Agent span parent is repo span'
  );

  ctx.completeAgentSpan(agent.span_id);
  ctx.completeRepoSpan(repo.span_id);

  const result = ctx.finalize({ items: [] });
  assert(result.success, 'Finalize succeeds with valid hierarchy');
  assert(result.validation_failures.length === 0, 'No validation failures on valid graph');
  assert(
    result.execution_graph.spans.length === 3,
    'Graph contains core + repo + agent = 3 spans'
  );

  // Verify span types in graph
  const types = result.execution_graph.spans.map((s) => s.type);
  assert(types.includes('core'), 'Graph contains core span');
  assert(types.includes('repo'), 'Graph contains repo span');
  assert(types.includes('agent'), 'Graph contains agent span');

  // Verify hierarchy
  const coreSpan = result.execution_graph.spans.find((s) => s.type === 'core')!;
  const repoSpan = result.execution_graph.spans.find((s) => s.type === 'repo')!;
  const agentSpan = result.execution_graph.spans.find((s) => s.type === 'agent')!;
  assert(repoSpan.parent_span_id === coreSpan.span_id, 'Repo parent is core');
  assert(agentSpan.parent_span_id === repoSpan.span_id, 'Agent parent is repo');

  // All spans completed
  assert(coreSpan.status === 'completed', 'Core span is completed');
  assert(repoSpan.status === 'completed', 'Repo span is completed');
  assert(agentSpan.status === 'completed', 'Agent span is completed');
}

async function testExecutionContextFailure() {
  console.log('\n--- ExecutionContext Failure Tests ---\n');

  // Failed agent propagates failure
  const ctx = new ExecutionContext('ecosystem-core');
  const repo = ctx.startRepoSpan('analytics');
  const agent = ctx.startAgentSpan(repo.span_id, 'analytics-agent', 'get_metrics');

  ctx.failAgentSpan(agent.span_id, ['Connection timeout']);
  ctx.failRepoSpan(repo.span_id, ['Agent failed']);

  const result = ctx.finalize(null);
  assert(!result.success, 'Finalize fails when child spans failed');
  assert(result.failure_reasons.length > 0, 'Failure reasons are populated');
  assert(
    result.execution_graph.spans.length === 3,
    'Graph is returned even on failure'
  );

  // Core span is marked failed
  const coreSpan = result.execution_graph.spans.find((s) => s.type === 'core')!;
  assert(coreSpan.status === 'failed', 'Core span marked failed on child failure');
}

async function testExecutionContextArtifactsAndEvidence() {
  console.log('\n--- ExecutionContext Artifacts & Evidence Tests ---\n');

  const ctx = new ExecutionContext('ecosystem-core');
  const repo = ctx.startRepoSpan('marketplace');
  const agent = ctx.startAgentSpan(repo.span_id, 'marketplace-agent', 'list');

  // Attach artifact at agent level (lowest possible)
  ctx.attachArtifactToSpan(agent.span_id, {
    id: 'result-set-1',
    type: 'export',
    name: 'artifact-list',
    content: { count: 10 },
  });

  // Attach evidence at agent level
  ctx.attachEvidenceToSpan(agent.span_id, {
    type: 'id',
    value: 'marketplace:list:result-set-1',
    description: 'Result set from marketplace listing',
  });

  ctx.completeAgentSpan(agent.span_id);
  ctx.completeRepoSpan(repo.span_id);

  const result = ctx.finalize({ items: [] });
  const agentSpan = result.execution_graph.spans.find((s) => s.type === 'agent')!;

  assert(agentSpan.artifacts.length === 1, 'Artifact attached at agent level');
  assert(
    agentSpan.artifacts[0].id === 'result-set-1',
    'Artifact has stable identifier'
  );
  assert(agentSpan.evidence.length === 1, 'Evidence attached at agent level');
  assert(
    agentSpan.evidence[0].type === 'id',
    'Evidence is machine-verifiable'
  );
}

// ============================================================================
// Instrumented SDK Tests
// ============================================================================

async function testInstrumentedSDK() {
  console.log('\n--- InstrumentedSDK Tests ---\n');

  const sdk = createInstrumentedEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
    coreName: 'ecosystem-core',
    parentSpanId: 'engine-parent-001',
  });

  // Test artifacts.list
  const listResult = await sdk.artifacts.list();
  assert(listResult.success, 'artifacts.list returns successful result');
  assert(listResult.result !== null, 'artifacts.list has operation result');
  assert(
    listResult.execution_graph.spans.length === 3,
    'artifacts.list produces core→repo→agent (3 spans)'
  );
  assert(
    listResult.validation_failures.length === 0,
    'artifacts.list graph passes validation'
  );

  // Verify parent chain
  const coreSpan = listResult.execution_graph.spans.find((s) => s.type === 'core')!;
  assert(
    coreSpan.parent_span_id === 'engine-parent-001',
    'Core span references engine parent span'
  );

  // Test artifacts.search
  const searchResult = await sdk.artifacts.search('test');
  assert(searchResult.success, 'artifacts.search succeeds');
  assert(
    searchResult.execution_graph.spans.some((s) => s.type === 'agent'),
    'artifacts.search has agent span'
  );

  // Test artifacts.get
  const getResult = await sdk.artifacts.get('mp-1');
  assert(getResult.success, 'artifacts.get succeeds');
  assert(getResult.result !== null, 'artifacts.get returns item');

  // Test benchmarks.list
  const bmListResult = await sdk.benchmarks.list();
  assert(bmListResult.success, 'benchmarks.list succeeds');

  // Test benchmarks.leaderboard
  const lbResult = await sdk.benchmarks.leaderboard('mmlu');
  assert(lbResult.success, 'benchmarks.leaderboard succeeds');

  // Test analytics.metrics
  const metricsResult = await sdk.analytics.metrics();
  assert(metricsResult.success, 'analytics.metrics succeeds');

  // Test analytics.trends
  const trendsResult = await sdk.analytics.trends('downloads', 'daily');
  assert(trendsResult.success, 'analytics.trends succeeds');

  // Test analytics.usage
  const usageResult = await sdk.analytics.usage('mp-1');
  assert(usageResult.success, 'analytics.usage succeeds');
}

async function testInstrumentedSDKEcosystem() {
  console.log('\n--- InstrumentedSDK Ecosystem Operations Tests ---\n');

  const sdk = createInstrumentedEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  // ecosystem.overview — multi-repo operation
  const overviewResult = await sdk.ecosystem.overview();
  assert(overviewResult.success, 'ecosystem.overview succeeds');

  // Should have multiple repo spans (analytics, marketplace, benchmark)
  const repoSpans = overviewResult.execution_graph.spans.filter(
    (s) => s.type === 'repo'
  );
  assert(
    repoSpans.length === 3,
    'ecosystem.overview has 3 repo spans (analytics, marketplace, benchmark)'
  );

  // Each repo should have an agent child
  const agentSpans = overviewResult.execution_graph.spans.filter(
    (s) => s.type === 'agent'
  );
  assert(
    agentSpans.length === 3,
    'ecosystem.overview has 3 agent spans (one per repo)'
  );

  // Total spans: 1 core + 3 repo + 3 agent = 7
  assert(
    overviewResult.execution_graph.spans.length === 7,
    'ecosystem.overview produces 7 total spans'
  );

  // ecosystem.trending — single-repo
  const trendingResult = await sdk.ecosystem.trending();
  assert(trendingResult.success, 'ecosystem.trending succeeds');
  assert(
    trendingResult.execution_graph.spans.length === 3,
    'ecosystem.trending produces 3 spans'
  );
}

async function testInstrumentedSDKGraphInvariants() {
  console.log('\n--- InstrumentedSDK Graph Invariants Tests ---\n');

  const sdk = createInstrumentedEcosystemSDK({
    marketplaceClient: new MockSDKMarketplaceClient(),
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const result = await sdk.artifacts.list();

  // Invariant: fully hierarchical
  const graph = result.execution_graph;
  for (const span of graph.spans) {
    if (span.type !== 'core') {
      assert(
        span.parent_span_id !== null,
        `Non-core span "${span.name}" has parent_span_id`
      );
      const parent = graph.spans.find((s) => s.span_id === span.parent_span_id);
      assert(
        parent !== undefined,
        `Parent of "${span.name}" exists in the graph`
      );
    }
  }

  // Invariant: JSON-serializable
  const serialized = JSON.stringify(result);
  const deserialized = JSON.parse(serialized);
  assert(
    deserialized.execution_graph.spans.length === graph.spans.length,
    'Execution graph survives JSON roundtrip without loss'
  );

  // Invariant: causal ordering via parent_span_id
  const spanIds = new Set<string>();
  let orderingValid = true;
  for (const span of graph.spans) {
    if (span.parent_span_id !== null && !spanIds.has(span.parent_span_id)) {
      // Parent should appear before child in append order
      // (unless it's the core's parent from the calling engine)
      if (graph.spans.some((s) => s.span_id === span.parent_span_id)) {
        orderingValid = false;
      }
    }
    spanIds.add(span.span_id);
  }
  assert(orderingValid, 'Spans preserve causal ordering');

  // Invariant: execution graph returned on success
  assert(
    result.execution_graph !== undefined && result.execution_graph !== null,
    'Execution graph present on success'
  );

  // Invariant: core_span_id set
  assert(result.core_span_id.length > 0, 'core_span_id is set in result');
  assert(
    graph.spans.some((s) => s.span_id === result.core_span_id),
    'core_span_id references existing span in graph'
  );
}

async function testInstrumentedSDKFailureSemantics() {
  console.log('\n--- InstrumentedSDK Failure Semantics Tests ---\n');

  // Create SDK with a client that will throw
  const failingClient = {
    list: async () => { throw new Error('Connection refused'); },
    search: async () => { throw new Error('Connection refused'); },
    get: async () => { throw new Error('Connection refused'); },
    summarize: async () => { throw new Error('Connection refused'); },
  };

  const sdk = createInstrumentedEcosystemSDK({
    marketplaceClient: failingClient as any,
    analyticsClient: new MockSDKAnalyticsClient(),
    benchmarkClient: new MockSDKBenchmarkClient(),
  });

  const result = await sdk.artifacts.list();

  // Execution graph MUST be returned on failure
  assert(
    result.execution_graph !== undefined,
    'Execution graph returned on failure'
  );
  assert(
    result.execution_graph.spans.length > 0,
    'Execution graph has spans on failure'
  );

  // Failed agent span should exist
  const agentSpan = result.execution_graph.spans.find((s) => s.type === 'agent');
  assert(agentSpan !== undefined, 'Agent span exists on failure');
  assert(agentSpan!.status === 'failed', 'Agent span is marked failed');
  assert(
    agentSpan!.failure_reasons.length > 0,
    'Agent span has failure reasons'
  );

  // Core span should be failed
  const coreSpan = result.execution_graph.spans.find((s) => s.type === 'core');
  assert(coreSpan!.status === 'failed', 'Core span is failed on child failure');

  // Result should indicate failure
  assert(!result.success, 'Result indicates failure');
  assert(result.failure_reasons.length > 0, 'Result has failure reasons');
}

// ============================================================================
// Test Runner
// ============================================================================

export async function runTests(): Promise<{ passed: number; failed: number }> {
  passed = 0;
  failed = 0;

  await testSpanFactories();
  await testValidator();
  await testExecutionContext();
  await testExecutionContextFailure();
  await testExecutionContextArtifactsAndEvidence();
  await testInstrumentedSDK();
  await testInstrumentedSDKEcosystem();
  await testInstrumentedSDKGraphInvariants();
  await testInstrumentedSDKFailureSemantics();

  console.log(`\nTests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  runTests().then(({ failed: f }) => {
    if (f > 0) process.exit(1);
  });
}
