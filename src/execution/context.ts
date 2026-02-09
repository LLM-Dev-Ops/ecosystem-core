/**
 * Execution Context
 *
 * Manages the span hierarchy during a Core execution.
 * Collects spans from all levels (core, repo, agent) and
 * assembles the final ExecutionGraph.
 */

import {
  ExecutionSpan,
  CoreSpan,
  RepoSpan,
  AgentSpan,
  ExecutionGraph,
  CoreExecutionResult,
  InvocationContext,
  ValidationFailure,
} from './types';
import {
  createCoreSpan,
  createRepoSpan,
  createAgentSpan,
  completeSpan,
  failSpan,
} from './spans';
import { validateExecutionGraph } from './validator';

/**
 * ExecutionContext manages the lifecycle of an execution graph
 * for a single Core invocation.
 *
 * Usage:
 *   const ctx = new ExecutionContext('ecosystem-core', parentSpanId);
 *   const repoSpan = ctx.startRepoSpan('marketplace');
 *   const agentSpan = ctx.startAgentSpan(repoSpan.span_id, 'marketplace-agent', 'list');
 *   ctx.completeAgentSpan(agentSpan.span_id);
 *   ctx.completeRepoSpan(repoSpan.span_id);
 *   const result = ctx.finalize(operationResult);
 */
export class ExecutionContext {
  private coreSpan: CoreSpan;
  private spans: ExecutionSpan[] = [];

  constructor(coreName: string, parentSpanId: string | null = null) {
    this.coreSpan = createCoreSpan(coreName, parentSpanId);
    this.spans.push(this.coreSpan);
  }

  /**
   * Get the core span ID for this execution.
   */
  get coreSpanId(): string {
    return this.coreSpan.span_id;
  }

  /**
   * Create an InvocationContext for passing to invoked repos.
   */
  getInvocationContext(): InvocationContext {
    return {
      parent_span_id: this.coreSpan.span_id,
      core_span_id: this.coreSpan.span_id,
    };
  }

  /**
   * Start a new repo-level span as a child of the core span.
   */
  startRepoSpan(repoName: string): RepoSpan {
    const span = createRepoSpan(repoName, this.coreSpan.span_id);
    this.spans.push(span);
    return span;
  }

  /**
   * Start a new agent-level span as a child of a repo span.
   */
  startAgentSpan(
    parentRepoSpanId: string,
    agentName: string,
    operation: string
  ): AgentSpan {
    const span = createAgentSpan(agentName, operation, parentRepoSpanId);
    this.spans.push(span);
    return span;
  }

  /**
   * Mark a repo span as completed.
   */
  completeRepoSpan(spanId: string): void {
    this.updateSpan(spanId, s => completeSpan(s));
  }

  /**
   * Mark a repo span as failed.
   */
  failRepoSpan(spanId: string, reasons: string[]): void {
    this.updateSpan(spanId, s => failSpan(s, reasons));
  }

  /**
   * Mark an agent span as completed.
   */
  completeAgentSpan(spanId: string): void {
    this.updateSpan(spanId, s => completeSpan(s));
  }

  /**
   * Mark an agent span as failed.
   */
  failAgentSpan(spanId: string, reasons: string[]): void {
    this.updateSpan(spanId, s => failSpan(s, reasons));
  }

  /**
   * Ingest spans returned from an invoked repo.
   * Spans are appended without modification (no flattening, renaming, or re-parenting).
   */
  ingestRepoSpans(spans: ExecutionSpan[]): void {
    for (const span of spans) {
      this.spans.push(span);
    }
  }

  /**
   * Attach an artifact to a specific span by ID.
   */
  attachArtifactToSpan(
    spanId: string,
    artifact: { id: string; type: string; name: string; content: unknown }
  ): void {
    this.updateSpan(spanId, s => ({
      ...s,
      artifacts: [
        ...s.artifacts,
        { ...artifact, produced_at: new Date().toISOString() },
      ],
    }));
  }

  /**
   * Attach evidence to a specific span by ID.
   */
  attachEvidenceToSpan(
    spanId: string,
    evidence: { type: 'id' | 'hash' | 'uri'; value: string; description: string }
  ): void {
    this.updateSpan(spanId, s => ({
      ...s,
      evidence: [...s.evidence, evidence],
    }));
  }

  /**
   * Finalize the execution and produce a CoreExecutionResult.
   *
   * This:
   * 1. Completes or fails the core span
   * 2. Validates the execution graph
   * 3. Returns the full result with graph, even on failure
   */
  finalize(operationResult: unknown): CoreExecutionResult {
    const graph: ExecutionGraph = { spans: this.spans };
    const validationFailures = validateExecutionGraph(graph);
    const isValid = validationFailures.length === 0;

    // Determine core span failure reasons
    const coreFailureReasons: string[] = [];

    if (!isValid) {
      coreFailureReasons.push(
        ...validationFailures.map(f => `[${f.rule}] ${f.message}`)
      );
    }

    // Check for any failed child spans
    const failedChildren = this.spans.filter(
      s => s.span_id !== this.coreSpan.span_id && s.status === 'failed'
    );
    if (failedChildren.length > 0) {
      coreFailureReasons.push(
        `${failedChildren.length} child span(s) failed`
      );
    }

    // Update core span status
    const success = coreFailureReasons.length === 0;
    if (success) {
      this.updateSpan(this.coreSpan.span_id, s => completeSpan(s));
    } else {
      this.updateSpan(this.coreSpan.span_id, s => failSpan(s, coreFailureReasons));
    }

    // Rebuild graph with updated spans
    const finalGraph: ExecutionGraph = { spans: this.spans };

    return {
      success,
      core_span_id: this.coreSpan.span_id,
      execution_graph: finalGraph,
      validation_failures: validationFailures,
      failure_reasons: coreFailureReasons,
      result: operationResult,
    };
  }

  /**
   * Update a span in-place by its ID.
   */
  private updateSpan(
    spanId: string,
    updater: (span: ExecutionSpan) => ExecutionSpan
  ): void {
    const index = this.spans.findIndex(s => s.span_id === spanId);
    if (index !== -1) {
      this.spans[index] = updater(this.spans[index]);
    }
  }
}
