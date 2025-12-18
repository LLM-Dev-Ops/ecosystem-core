/**
 * Core type definitions for LLM Ecosystem Core
 * These types represent thin glue to external systems
 */

/**
 * Base artifact in the LLM ecosystem
 */
export interface EcosystemArtifact {
  id: string;
  name: string;
  type: string;
  source: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

/**
 * Marketplace item extending ecosystem artifact with marketplace-specific fields
 */
export interface MarketplaceItem extends EcosystemArtifact {
  description?: string;
  author?: string;
  version?: string;
  downloads?: number;
  rating?: number;
  price?: number;
  tags?: string[];
  license?: string;
  repository?: string;
  publishedAt?: Date;
  updatedAt?: Date;
}

/**
 * Result from a benchmark evaluation
 */
export interface BenchmarkResult {
  id: string;
  modelId: string;
  benchmarkId: string;
  score: number;
  rank?: number;
  metadata: Record<string, any>;
  evaluatedAt?: Date;
}

/**
 * Leaderboard entry for a benchmark
 */
export interface LeaderboardEntry {
  modelId: string;
  modelName: string;
  score: number;
  rank: number;
  metadata?: Record<string, any>;
}

/**
 * Benchmark leaderboard containing ranked entries
 */
export interface BenchmarkLeaderboard {
  benchmarkId: string;
  benchmarkName?: string;
  entries: LeaderboardEntry[];
  updatedAt: Date;
}

/**
 * Analytics trend data point
 */
export interface TrendDataPoint {
  timestamp: Date;
  value: number;
}

/**
 * Analytics trend for a specific metric
 */
export interface AnalyticsTrend {
  metric: string;
  values: TrendDataPoint[];
  period: string;
  source: string;
}

/**
 * Top artifact in ecosystem metrics
 */
export interface TopArtifact {
  id: string;
  name: string;
  type: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Aggregated ecosystem metrics
 */
export interface EcosystemMetrics {
  usage: {
    totalArtifacts: number;
    totalDownloads: number;
    activeUsers: number;
    [key: string]: any;
  };
  trends: AnalyticsTrend[];
  topArtifacts: TopArtifact[];
  lastUpdated?: Date;
}

/**
 * Pagination configuration
 */
export interface Pagination {
  page: number;
  pageSize: number;
  offset?: number;
}

/**
 * Search filters
 */
export interface SearchFilters {
  type?: string | string[];
  source?: string | string[];
  tags?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  [key: string]: any;
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  pagination?: Pagination;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generic search result wrapper
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore?: boolean;
}

// Export adapter interfaces
export * from './adapters';
