/**
 * Execution Engine Instrumentation
 *
 * Provides hierarchical, machine-verifiable execution spans
 * for the agentics-execution-engine contract.
 *
 * Exports:
 * - Types: ExecutionSpan, ExecutionGraph, CoreExecutionResult, etc.
 * - Spans: Factory functions and lifecycle utilities
 * - Validator: Graph validation against invariants
 * - Context: Execution context for managing span hierarchy
 * - InstrumentedSDK: Span-emitting wrapper around EcosystemSDK
 */

// Types
export {
  SpanType,
  SpanStatus,
  ExecutionSpan,
  CoreSpan,
  RepoSpan,
  AgentSpan,
  SpanArtifact,
  SpanEvidence,
  ValidationFailure,
  ExecutionGraph,
  CoreExecutionResult,
  InvocationContext,
  RepoExecutionResult,
} from './types';

// Span utilities
export {
  generateSpanId,
  now,
  createCoreSpan,
  createRepoSpan,
  createAgentSpan,
  completeSpan,
  failSpan,
  attachArtifact,
  attachEvidence,
} from './spans';

// Validator
export {
  validateExecutionGraph,
  isValidExecutionGraph,
} from './validator';

// Execution context
export { ExecutionContext } from './context';

// Instrumented SDK
export {
  InstrumentedSDKConfig,
  InstrumentedEcosystemSDK,
  createInstrumentedEcosystemSDK,
} from './instrumented-sdk';
