/**
 * Marketplace Adapter Demo
 *
 * This example demonstrates how to use the marketplace adapter with a mock client.
 * The adapter is simulator-compatible and works with any client implementing IMarketplaceClient.
 */

import {
  createMarketplaceAdapter,
  IMarketplaceClient,
} from '../src/adapters/marketplace.adapter';
import { MarketplaceItem, SearchQuery, SearchResult } from '../src/types';

/**
 * Simple mock client for demonstration
 */
class SimpleMockClient implements IMarketplaceClient {
  private items: MarketplaceItem[] = [
    {
      id: 'item-1',
      name: 'Test Artifact',
      type: 'prompt',
      source: 'marketplace',
      description: 'A test artifact',
      metadata: {},
      createdAt: new Date('2024-01-01'),
    },
  ];

  async listArtifacts(query: SearchQuery): Promise<SearchResult<MarketplaceItem>> {
    return {
      items: this.items,
      total: this.items.length,
      page: query.pagination?.page ?? 1,
      pageSize: query.pagination?.pageSize ?? 10,
      hasMore: false,
    };
  }

  async getArtifact(id: string): Promise<MarketplaceItem | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async searchArtifacts(
    query: string,
    filters?: Record<string, unknown>
  ): Promise<SearchResult<MarketplaceItem>> {
    const filtered = this.items.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
    );

    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      pageSize: 10,
      hasMore: false,
    };
  }

  async getArtifactsByType(type: string): Promise<MarketplaceItem[]> {
    return this.items.filter((item) => item.type === type);
  }
}

/**
 * Demo function showing adapter usage
 */
async function demo() {
  // Create a mock client
  const mockClient = new SimpleMockClient();

  // Create adapter with the mock client
  const adapter = createMarketplaceAdapter(mockClient);

  console.log('=== Marketplace Adapter Demo ===\n');

  // Test 1: List artifacts
  console.log('1. List artifacts:');
  const listResult = await adapter.listArtifacts({ query: '' });
  console.log(`   Found ${listResult.total} items`);
  console.log(`   First item: ${listResult.items[0]?.name}\n`);

  // Test 2: Get artifact by ID
  console.log('2. Get artifact by ID:');
  const artifact = await adapter.getArtifact('item-1');
  console.log(`   Artifact: ${artifact?.name}`);
  console.log(`   Type: ${artifact?.type}\n`);

  // Test 3: Search artifacts
  console.log('3. Search artifacts:');
  const searchResult = await adapter.searchArtifacts('test');
  console.log(`   Found ${searchResult.total} matching items\n`);

  // Test 4: Get artifacts by type
  console.log('4. Get artifacts by type:');
  const promptArtifacts = await adapter.getArtifactsByType('prompt');
  console.log(`   Found ${promptArtifacts.length} prompt artifacts\n`);

  console.log('=== Demo Complete ===');
}

// Run demo if this file is executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export { demo };
