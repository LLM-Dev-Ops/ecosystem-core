/**
 * ArtifactService - Thin glue service for artifact operations
 * Delegates all operations to marketplace adapter
 */

import {
  IMarketplaceAdapter,
  MarketplaceItem,
  SearchQuery,
  SearchResult,
} from '../types';

/**
 * Summary of artifacts by type (service layer)
 */
export interface ServiceArtifactSummary {
  type: string;
  count: number;
  items: MarketplaceItem[];
}

/**
 * Artifact service that coordinates marketplace adapter
 */
export class ArtifactService {
  constructor(private readonly marketplaceAdapter: IMarketplaceAdapter) {}

  /**
   * List shared artifacts with optional query
   * Delegates directly to marketplace adapter
   */
  async listSharedArtifacts(query?: SearchQuery): Promise<SearchResult<MarketplaceItem>> {
    return this.marketplaceAdapter.listArtifacts(query || { query: '' });
  }

  /**
   * Search artifacts by query string
   * Delegates directly to marketplace adapter
   */
  async searchArtifacts(query: string): Promise<SearchResult<MarketplaceItem>> {
    return this.marketplaceAdapter.searchArtifacts(query);
  }

  /**
   * Get detailed information about a specific artifact
   * Delegates directly to marketplace adapter
   */
  async getArtifactDetails(id: string): Promise<MarketplaceItem | null> {
    return this.marketplaceAdapter.getArtifact(id);
  }

  /**
   * Summarize artifacts by type
   * Aggregates marketplace listing into summary format
   */
  async summarizeArtifacts(type?: string): Promise<ServiceArtifactSummary[]> {
    // Get artifacts by type or all artifacts
    let items: MarketplaceItem[];

    if (type) {
      // Use getArtifactsByType for specific type
      items = await this.marketplaceAdapter.getArtifactsByType(type);
    } else {
      // Use listArtifacts for all types
      const result = await this.marketplaceAdapter.listArtifacts({ query: '' });
      items = result.items;
    }

    // Group by type
    const summaryMap = new Map<string, MarketplaceItem[]>();

    for (const item of items) {
      const itemType = item.type;
      if (!summaryMap.has(itemType)) {
        summaryMap.set(itemType, []);
      }
      summaryMap.get(itemType)!.push(item);
    }

    // Convert to summary array
    return Array.from(summaryMap.entries()).map(([type, items]) => ({
      type,
      count: items.length,
      items,
    }));
  }
}
