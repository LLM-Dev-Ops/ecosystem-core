/**
 * Marketplace Adapter - THIN GLUE LOGIC ONLY
 *
 * This adapter provides a normalized interface to marketplace clients.
 * It does NOT implement marketplace mechanics, scoring, or caching.
 * All operations are delegated to the injected IMarketplaceClient.
 */

import {
  MarketplaceItem,
  SearchQuery,
  SearchResult,
} from '../types';

/**
 * Client interface that external marketplace implementations must satisfy.
 * The adapter delegates all operations to implementations of this interface.
 */
export interface IMarketplaceClient {
  /**
   * List artifacts based on a structured search query
   */
  listArtifacts(query: SearchQuery): Promise<SearchResult<MarketplaceItem>>;

  /**
   * Get a specific artifact by ID
   */
  getArtifact(id: string): Promise<MarketplaceItem | null>;

  /**
   * Search artifacts by text query with optional filters
   */
  searchArtifacts(
    query: string,
    filters?: Record<string, unknown>
  ): Promise<SearchResult<MarketplaceItem>>;

  /**
   * Get all artifacts of a specific type
   */
  getArtifactsByType(type: string): Promise<MarketplaceItem[]>;
}

/**
 * Adapter interface for marketplace operations.
 * This is the public API exposed by the ecosystem core.
 */
export interface IMarketplaceAdapter {
  /**
   * List artifacts based on a structured search query
   */
  listArtifacts(query: SearchQuery): Promise<SearchResult<MarketplaceItem>>;

  /**
   * Get a specific artifact by ID
   */
  getArtifact(id: string): Promise<MarketplaceItem | null>;

  /**
   * Search artifacts by text query with optional filters
   */
  searchArtifacts(
    query: string,
    filters?: Record<string, unknown>
  ): Promise<SearchResult<MarketplaceItem>>;

  /**
   * Get all artifacts of a specific type
   */
  getArtifactsByType(type: string): Promise<MarketplaceItem[]>;
}

/**
 * MarketplaceAdapter implementation - THIN GLUE LOGIC ONLY
 *
 * This class delegates ALL operations to the injected client.
 * It provides normalization of responses to ecosystem types but does not:
 * - Implement marketplace logic
 * - Implement scoring algorithms
 * - Implement caching mechanisms
 * - Add business logic beyond type normalization
 */
export class MarketplaceAdapter implements IMarketplaceAdapter {
  constructor(private readonly client: IMarketplaceClient) {}

  /**
   * List artifacts based on a structured search query.
   * Delegates to client and ensures response conforms to ecosystem types.
   */
  async listArtifacts(query: SearchQuery): Promise<SearchResult<MarketplaceItem>> {
    const result = await this.client.listArtifacts(query);
    return this.normalizeSearchResult(result);
  }

  /**
   * Get a specific artifact by ID.
   * Delegates to client and ensures response conforms to ecosystem types.
   */
  async getArtifact(id: string): Promise<MarketplaceItem | null> {
    const artifact = await this.client.getArtifact(id);
    return artifact ? this.normalizeMarketplaceItem(artifact) : null;
  }

  /**
   * Search artifacts by text query with optional filters.
   * Delegates to client and ensures response conforms to ecosystem types.
   */
  async searchArtifacts(
    query: string,
    filters?: Record<string, unknown>
  ): Promise<SearchResult<MarketplaceItem>> {
    const result = await this.client.searchArtifacts(query, filters);
    return this.normalizeSearchResult(result);
  }

  /**
   * Get all artifacts of a specific type.
   * Delegates to client and ensures response conforms to ecosystem types.
   */
  async getArtifactsByType(type: string): Promise<MarketplaceItem[]> {
    const artifacts = await this.client.getArtifactsByType(type);
    return artifacts.map((artifact) => this.normalizeMarketplaceItem(artifact));
  }

  /**
   * Normalize a search result to ensure it conforms to ecosystem types.
   * This includes normalizing Date fields and ensuring required properties exist.
   */
  private normalizeSearchResult(
    result: SearchResult<MarketplaceItem>
  ): SearchResult<MarketplaceItem> {
    return {
      items: result.items.map((item) => this.normalizeMarketplaceItem(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    };
  }

  /**
   * Normalize a marketplace item to ensure it conforms to ecosystem types.
   * This includes converting date strings to Date objects if needed.
   */
  private normalizeMarketplaceItem(item: MarketplaceItem): MarketplaceItem {
    return {
      ...item,
      createdAt: this.ensureDate(item.createdAt),
      publishedAt: item.publishedAt ? this.ensureDate(item.publishedAt) : undefined,
      updatedAt: item.updatedAt ? this.ensureDate(item.updatedAt) : undefined,
    };
  }

  /**
   * Ensure a value is a Date object.
   * If it's a string, parse it. If it's already a Date, return as-is.
   */
  private ensureDate(value: Date | string): Date {
    if (value instanceof Date) {
      return value;
    }
    return new Date(value);
  }
}

/**
 * Factory function to create a marketplace adapter instance.
 * This is the recommended way to instantiate the adapter.
 *
 * @param client - The marketplace client implementation to use
 * @returns A configured marketplace adapter instance
 *
 * @example
 * ```typescript
 * const mockClient: IMarketplaceClient = {
 *   listArtifacts: async (query) => ({ items: [], total: 0, page: 1, pageSize: 10 }),
 *   getArtifact: async (id) => null,
 *   searchArtifacts: async (query, filters) => ({ items: [], total: 0, page: 1, pageSize: 10 }),
 *   getArtifactsByType: async (type) => [],
 * };
 *
 * const adapter = createMarketplaceAdapter(mockClient);
 * ```
 */
export function createMarketplaceAdapter(client: IMarketplaceClient): IMarketplaceAdapter {
  return new MarketplaceAdapter(client);
}
