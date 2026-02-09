/**
 * Span Factory and Lifecycle Utilities
 *
 * Provides functions to create, complete, and fail execution spans.
 * Uses crypto.randomUUID for span ID generation.
 */

import { randomUUID } from 'crypto';
import {
  ExecutionSpan,
  CoreSpan,
  RepoSpan,
  AgentSpan,
  SpanArtifact,
  SpanEvidence,
  SpanStatus,
} from './types';

/**
 * Generate a new unique span ID.
 */
export function generateSpanId(): string {
  return randomUUID();
}

/**
 * Get the current time as an ISO-8601 string.
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Create a new Core-level span.
 */
export function createCoreSpan(
  name: string,
  parentSpanId: string | null = null
): CoreSpan {
  return {
    span_id: generateSpanId(),
    parent_span_id: parentSpanId,
    type: 'core',
    name,
    status: 'running',
    start_time: now(),
    end_time: null,
    artifacts: [],
    evidence: [],
    failure_reasons: [],
    metadata: {},
  };
}

/**
 * Create a new Repo-level span.
 */
export function createRepoSpan(
  repoName: string,
  parentSpanId: string
): RepoSpan {
  return {
    span_id: generateSpanId(),
    parent_span_id: parentSpanId,
    type: 'repo',
    name: `repo:${repoName}`,
    repo_name: repoName,
    status: 'running',
    start_time: now(),
    end_time: null,
    artifacts: [],
    evidence: [],
    failure_reasons: [],
    metadata: {},
  };
}

/**
 * Create a new Agent-level span.
 */
export function createAgentSpan(
  agentName: string,
  operation: string,
  parentSpanId: string
): AgentSpan {
  return {
    span_id: generateSpanId(),
    parent_span_id: parentSpanId,
    type: 'agent',
    name: `agent:${agentName}:${operation}`,
    agent_name: agentName,
    operation,
    status: 'running',
    start_time: now(),
    end_time: null,
    artifacts: [],
    evidence: [],
    failure_reasons: [],
    metadata: {},
  };
}

/**
 * Mark a span as completed successfully.
 * Returns a new span object (immutable update).
 */
export function completeSpan<T extends ExecutionSpan>(span: T): T {
  return {
    ...span,
    status: 'completed' as SpanStatus,
    end_time: now(),
  };
}

/**
 * Mark a span as failed with reasons.
 * Returns a new span object (immutable update).
 */
export function failSpan<T extends ExecutionSpan>(
  span: T,
  reasons: string[]
): T {
  return {
    ...span,
    status: 'failed' as SpanStatus,
    end_time: now(),
    failure_reasons: [...span.failure_reasons, ...reasons],
  };
}

/**
 * Attach an artifact to a span.
 * Returns a new span object (immutable update).
 */
export function attachArtifact<T extends ExecutionSpan>(
  span: T,
  artifact: Omit<SpanArtifact, 'produced_at'> & { produced_at?: string }
): T {
  const fullArtifact: SpanArtifact = {
    ...artifact,
    produced_at: artifact.produced_at || now(),
  };
  return {
    ...span,
    artifacts: [...span.artifacts, fullArtifact],
  };
}

/**
 * Attach evidence to a span.
 * Returns a new span object (immutable update).
 */
export function attachEvidence<T extends ExecutionSpan>(
  span: T,
  evidence: SpanEvidence
): T {
  return {
    ...span,
    evidence: [...span.evidence, evidence],
  };
}
