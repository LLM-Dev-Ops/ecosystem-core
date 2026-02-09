/**
 * Execution Graph Type Definitions
 *
 * Types for hierarchical, machine-verifiable execution spans
 * conforming to the agentics-execution-engine contract.
 *
 * Invariant:
 *   Execution
 *     └─ Core (this repo)
 *         └─ Repo (invoked)
 *             └─ Agent (executed)
 */

/**
 * Span type discriminator for the execution hierarchy.
 */
export type SpanType = 'core' | 'repo' | 'agent';

/**
 * Execution status for a span.
 */
export type SpanStatus = 'running' | 'completed' | 'failed';

/**
 * A single execution span in the hierarchical execution graph.
 *
 * Every span tracks:
 * - Its place in the hierarchy via parent_span_id
 * - Timing via start_time / end_time
 * - Artifacts and evidence produced
 * - Failure reasons when applicable
 */
export interface ExecutionSpan {
  /** Unique identifier for this span */
  span_id: string;

  /** Parent span ID establishing causal hierarchy. Null only for root spans. */
  parent_span_id: string | null;

  /** Discriminator for the span level in the hierarchy */
  type: SpanType;

  /** Human-readable name for this span */
  name: string;

  /** Current execution status */
  status: SpanStatus;

  /** ISO-8601 timestamp when execution started */
  start_time: string;

  /** ISO-8601 timestamp when execution ended. Null while running. */
  end_time: string | null;

  /** Artifacts produced by this span, attached at the lowest possible level */
  artifacts: SpanArtifact[];

  /** Machine-verifiable evidence references */
  evidence: SpanEvidence[];

  /** Failure reasons when status is 'failed' */
  failure_reasons: string[];

  /** Additional metadata for this span */
  metadata: Record<string, unknown>;
}

/**
 * Core-specific span extending ExecutionSpan with core-level fields.
 */
export interface CoreSpan extends ExecutionSpan {
  type: 'core';
}

/**
 * Repo-specific span extending ExecutionSpan with repo identification.
 */
export interface RepoSpan extends ExecutionSpan {
  type: 'repo';
  /** Name of the invoked repository */
  repo_name: string;
}

/**
 * Agent-specific span extending ExecutionSpan with agent identification.
 */
export interface AgentSpan extends ExecutionSpan {
  type: 'agent';
  /** Name of the agent that executed */
  agent_name: string;
  /** Name of the operation performed */
  operation: string;
}

/**
 * Artifact attached to a span.
 * Must include a stable identifier or reference.
 */
export interface SpanArtifact {
  /** Stable identifier for this artifact */
  id: string;
  /** Artifact type (plan, mapping, config, export, report, etc.) */
  type: string;
  /** Human-readable name */
  name: string;
  /** Artifact content or reference */
  content: unknown;
  /** ISO-8601 timestamp when the artifact was produced */
  produced_at: string;
}

/**
 * Machine-verifiable evidence reference attached to a span.
 * Must be an ID, hash, or URI — never inferred or synthesized.
 */
export interface SpanEvidence {
  /** Type of evidence (id, hash, uri) */
  type: 'id' | 'hash' | 'uri';
  /** The evidence value */
  value: string;
  /** Description of what this evidence proves */
  description: string;
}

/**
 * Validation failure describing a specific invariant violation.
 */
export interface ValidationFailure {
  /** The span_id where the violation was detected */
  span_id: string;
  /** Which invariant was violated */
  rule: string;
  /** Human-readable failure description */
  message: string;
}

/**
 * The complete, hierarchical execution graph.
 *
 * Properties:
 * - Fully hierarchical (parent_span_id chains)
 * - Append-only (spans are never removed or rewritten)
 * - Preserves causal ordering via parent_span_id
 * - JSON-serializable without loss of structure
 */
export interface ExecutionGraph {
  /** All spans in the execution, in causal/append order */
  spans: ExecutionSpan[];
}

/**
 * The result of a Core execution.
 *
 * Returned on success, partial failure, and total failure.
 * The execution graph is always present regardless of outcome.
 */
export interface CoreExecutionResult {
  /** Whether the core execution succeeded */
  success: boolean;

  /** The core-level span ID */
  core_span_id: string;

  /** The complete execution graph with all spans */
  execution_graph: ExecutionGraph;

  /** Validation failures if any invariants were violated */
  validation_failures: ValidationFailure[];

  /** Overall failure reasons (empty on success) */
  failure_reasons: string[];

  /** The operation result data, if execution succeeded */
  result: unknown;
}

/**
 * Context passed to invoked repos so they can create properly-parented spans.
 */
export interface InvocationContext {
  /** The parent span ID that repo spans should reference */
  parent_span_id: string;

  /** The core span ID for the overall execution */
  core_span_id: string;
}

/**
 * Expected return type from an invoked repo.
 * Repos must return their spans including at least one agent-level span.
 */
export interface RepoExecutionResult {
  /** Spans produced by this repo invocation */
  spans: ExecutionSpan[];

  /** The repo-level span ID */
  repo_span_id: string;

  /** The operation result */
  result: unknown;
}
