/**
 * Embedding service for generating vector embeddings using OpenAI
 * Based on prism-v2 implementation
 */

import OpenAI from "openai";

/**
 * Configuration for the embedding client
 */
export interface EmbeddingClientConfig {
  /**
   * The API key for OpenAI authentication
   */
  apiKey: string;

  /**
   * Optional organization ID for OpenAI
   */
  organizationId?: string;
}

/**
 * Class for generating embeddings using OpenAI
 */
export class EmbeddingClient {
  private openai: OpenAI;

  /**
   * Creates a new embedding client
   *
   * @param config - Configuration for the client
   */
  constructor(config: EmbeddingClientConfig) {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organizationId,
    });
  }

  /**
   * Generates an embedding for the provided text
   *
   * @param text - Text to generate embedding for
   * @returns Vector embedding
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-large",
        input: text,
        encoding_format: "float",
      });

      return response.data[0]?.embedding ?? [];
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }
}

/**
 * Create a singleton instance of the embedding client
 */
let embeddingClientInstance: EmbeddingClient | null = null;

/**
 * Initialize the embedding client with configuration
 *
 * @param config - Configuration for the embedding client
 */
export function initializeEmbeddingClient(config: EmbeddingClientConfig): void {
  embeddingClientInstance = new EmbeddingClient(config);
}

/**
 * Get the embedding client instance
 *
 * @returns The embedding client instance
 * @throws Error if the client is not initialized
 */
export function getEmbeddingClient(): EmbeddingClient {
  if (!embeddingClientInstance) {
    throw new Error(
      "Embedding client not initialized. Call initializeEmbeddingClient() first with your API key."
    );
  }
  return embeddingClientInstance;
}

/**
 * Generate an embedding for text using the singleton client
 *
 * @param text - Text to embed
 * @returns Vector embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return getEmbeddingClient().generateEmbedding(text);
}
