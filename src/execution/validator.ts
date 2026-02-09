/**
 * Execution Graph Validator
 *
 * Enforces the hierarchical invariants required by agentics-execution-engine:
 *
 *   Execution
 *     └─ Core (this repo)
 *         └─ Repo (invoked)
 *             └─ Agent (executed)
 *
 * If any level is missing, execution MUST be treated as invalid.
 */

import {
  ExecutionSpan,
  ExecutionGraph,
  ValidationFailure,
} from './types';

/**
 * Validate an execution graph against all required invariants.
 *
 * Returns an array of validation failures. Empty array means valid.
 */
export function validateExecutionGraph(graph: ExecutionGraph): ValidationFailure[] {
  const failures: ValidationFailure[] = [];
  const spanMap = new Map<string, ExecutionSpan>();
  const childrenByParent = new Map<string, ExecutionSpan[]>();

  // Index all spans
  for (const span of graph.spans) {
    spanMap.set(span.span_id, span);
    if (span.parent_span_id) {
      const children = childrenByParent.get(span.parent_span_id) || [];
      children.push(span);
      childrenByParent.set(span.parent_span_id, children);
    }
  }

  // Find core spans
  const coreSpans = graph.spans.filter(s => s.type === 'core');

  if (coreSpans.length === 0) {
    failures.push({
      span_id: 'graph',
      rule: 'core_span_required',
      message: 'Execution graph must contain at least one core-level span',
    });
    return failures;
  }

  for (const coreSpan of coreSpans) {
    // Rule: Core must have repo-level child spans
    const repoChildren = (childrenByParent.get(coreSpan.span_id) || [])
      .filter(s => s.type === 'repo');

    if (repoChildren.length === 0) {
      failures.push({
        span_id: coreSpan.span_id,
        rule: 'core_must_have_repo_children',
        message: `Core span "${coreSpan.name}" has no repo-level child spans`,
      });
    }

    // Rule: Each repo span must have agent-level child spans
    for (const repoSpan of repoChildren) {
      const agentChildren = (childrenByParent.get(repoSpan.span_id) || [])
        .filter(s => s.type === 'agent');

      if (agentChildren.length === 0) {
        failures.push({
          span_id: repoSpan.span_id,
          rule: 'repo_must_have_agent_children',
          message: `Repo span "${repoSpan.name}" has no agent-level child spans`,
        });
      }
    }
  }

  // Rule: Every non-core span with a parent_span_id must reference an existing span.
  // Core spans may reference an external parent from the calling execution engine.
  for (const span of graph.spans) {
    if (
      span.parent_span_id &&
      !spanMap.has(span.parent_span_id) &&
      span.type !== 'core'
    ) {
      failures.push({
        span_id: span.span_id,
        rule: 'valid_parent_reference',
        message: `Span "${span.name}" references non-existent parent_span_id "${span.parent_span_id}"`,
      });
    }
  }

  // Rule: Spans must not be self-referencing
  for (const span of graph.spans) {
    if (span.parent_span_id === span.span_id) {
      failures.push({
        span_id: span.span_id,
        rule: 'no_self_reference',
        message: `Span "${span.name}" references itself as parent`,
      });
    }
  }

  // Rule: Evidence must be machine-verifiable (non-empty type and value)
  for (const span of graph.spans) {
    for (const evidence of span.evidence) {
      if (!evidence.value || evidence.value.trim() === '') {
        failures.push({
          span_id: span.span_id,
          rule: 'evidence_must_be_verifiable',
          message: `Span "${span.name}" has evidence with empty value`,
        });
      }
    }
  }

  // Rule: Artifacts must have stable identifiers
  for (const span of graph.spans) {
    for (const artifact of span.artifacts) {
      if (!artifact.id || artifact.id.trim() === '') {
        failures.push({
          span_id: span.span_id,
          rule: 'artifact_must_have_id',
          message: `Span "${span.name}" has artifact without stable identifier`,
        });
      }
    }
  }

  return failures;
}

/**
 * Check if an execution graph is valid (has no validation failures).
 */
export function isValidExecutionGraph(graph: ExecutionGraph): boolean {
  return validateExecutionGraph(graph).length === 0;
}
