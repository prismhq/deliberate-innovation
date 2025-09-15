/**
 * Not-Not Generation Service
 *
 * Implements naive clustering of document embeddings and uses OpenAI to identify
 * "not-nots" based on Merrick Furst's authentic demand framework.
 */

import OpenAI from "openai";
import { env } from "~/env";

export interface DocumentWithEmbedding {
  id: string;
  title: string;
  text: string;
  embedding: number[];
  collectionId: string;
}

export interface DocumentCluster {
  centroid: number[];
  documents: DocumentWithEmbedding[];
  averageSimilarity: number;
  clusterIndex: number;
}

export interface NotNotCandidate {
  title: string;
  description: string;
  supportingDocuments: string[]; // document IDs
  clusterMetadata: {
    algorithm: string;
    generatedAt: string;
    documentCount: number;
    clusterCount: number;
    clusterStats: {
      averageSimilarity: number;
      clusterSizes: number[];
      clusterIndex: number;
    };
    generationParams: {
      similarityThreshold: number;
      minClusterSize: number;
    };
  };
}

export interface ClusteringResult {
  clusters: DocumentCluster[];
  totalDocuments: number;
  averageClusterSimilarity: number;
}

/**
 * Calculates cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Calculates the centroid (average) of a set of vectors
 */
function calculateCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];

  const dimensions = vectors[0]?.length ?? 0;
  const centroid = new Array(dimensions).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i]! += vector[i]!;
    }
  }

  for (let i = 0; i < dimensions; i++) {
    centroid[i]! /= vectors.length;
  }

  return centroid;
}

/**
 * Performs naive K-means clustering on documents using cosine similarity
 */
export function clusterDocuments(
  documents: DocumentWithEmbedding[],
  options: {
    similarityThreshold?: number;
    minClusterSize?: number;
  } = {}
): ClusteringResult {
  const { minClusterSize = 2 } = options;

  if (documents.length < 5) {
    throw new Error("Need at least 5 documents to perform clustering");
  }

  // Dynamic K selection: aim for 3-5 clusters
  const k = Math.min(Math.max(Math.floor(documents.length / 3), 2), 5);

  // Initialize centroids randomly by selecting k documents
  const initialCentroidIndices = new Set<number>();
  while (initialCentroidIndices.size < k) {
    initialCentroidIndices.add(Math.floor(Math.random() * documents.length));
  }

  const centroids = Array.from(initialCentroidIndices).map((i) => [
    ...documents[i]!.embedding,
  ]);
  const assignments = new Array(documents.length).fill(0);
  let changed = true;
  let iterations = 0;
  const maxIterations = 20;

  // K-means iterations
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Assign each document to nearest centroid
    for (let i = 0; i < documents.length; i++) {
      let bestCluster = 0;
      let bestSimilarity = cosineSimilarity(
        documents[i]!.embedding,
        centroids[0]!
      );

      for (let j = 1; j < k; j++) {
        const similarity = cosineSimilarity(
          documents[i]!.embedding,
          centroids[j]!
        );
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCluster = j;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterDocuments = documents.filter((_, i) => assignments[i] === j);
      if (clusterDocuments.length > 0) {
        centroids[j] = calculateCentroid(
          clusterDocuments.map((d) => d.embedding)
        );
      }
    }
  }

  // Build clusters with statistics
  const clusters: DocumentCluster[] = [];
  let totalSimilarity = 0;
  let validClusters = 0;

  for (let j = 0; j < k; j++) {
    const clusterDocs = documents.filter((_, i) => assignments[i] === j);

    if (clusterDocs.length >= minClusterSize) {
      // Calculate average intra-cluster similarity
      let clusterSimilaritySum = 0;
      let pairCount = 0;

      for (let x = 0; x < clusterDocs.length; x++) {
        for (let y = x + 1; y < clusterDocs.length; y++) {
          clusterSimilaritySum += cosineSimilarity(
            clusterDocs[x]!.embedding,
            clusterDocs[y]!.embedding
          );
          pairCount++;
        }
      }

      const averageSimilarity =
        pairCount > 0 ? clusterSimilaritySum / pairCount : 1.0;

      clusters.push({
        centroid: centroids[j] ?? [],
        documents: clusterDocs,
        averageSimilarity,
        clusterIndex: j,
      });

      totalSimilarity += averageSimilarity;
      validClusters++;
    }
  }

  return {
    clusters,
    totalDocuments: documents.length,
    averageClusterSimilarity:
      validClusters > 0 ? totalSimilarity / validClusters : 0,
  };
}

/**
 * System prompt for OpenAI to identify not-nots based on Merrick Furst's framework
 */
const NOT_NOT_SYSTEM_PROMPT = `You are an expert innovation analyst trained in Merrick Furst's "Deliberate Innovation" framework. Your task is to analyze clusters of documents to identify "not-nots" - situations where users "cannot not" engage with a solution due to authentic demand.

CRITICAL FRAMEWORK UNDERSTANDING:
A "not-not" exists when someone is put in a situation and they cannot not buy/use the solution. This is authentic demand - the opposite of customer indifference.

KEY PRINCIPLES:
1. Look for situations where behavior change is practically inevitable
2. Focus on contexts where NOT using the solution becomes harder than using it
3. Identify patterns where users must adopt due to situational forces (not just desire)
4. Distinguish authentic demand from normal pain points or preferences

EXAMPLES OF AUTHENTIC "NOT-NOTS":
- Bridge over river: workers cannot not use it once built (becomes default path)
- Hand-washing after germ theory: doctors cannot not wash hands (social/professional necessity)
- Index funds: fiduciaries cannot not consider them once they see performance data

ANALYZE FOR:
- Situational necessity (context forces adoption)
- Default behavior change (new solution becomes automatic choice)
- Social/professional unacceptability of alternatives
- Compelling evidence that makes alternatives feel wrong/incomplete

AVOID FLAGGING:
- Normal user preferences or conveniences
- Standard pain points that people tolerate
- Features users "like" but can live without
- Solutions to problems that don't create behavioral lock-in

Your response must be a JSON object with:
{
  "title": "Specific situation where users cannot not engage",
  "description": "Detailed explanation of why this represents authentic demand - what makes the alternative unthinkable/unacceptable",
  "confidence": 0.85,
  "reasoning": "Why this cluster represents a true not-not vs normal behavior"
}

If the cluster doesn't represent a clear not-not, return: {"title": null, "confidence": 0, "reasoning": "No authentic demand pattern detected"}`;

/**
 * Analyzes a document cluster using OpenAI to identify potential not-nots
 */
export async function analyzeClusterForNotNot(
  cluster: DocumentCluster
): Promise<NotNotCandidate | null> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is required for not-not generation");
  }

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  // Build analysis prompt from cluster documents
  const documentsText = cluster.documents
    .map(
      (doc) =>
        `Document: "${doc.title}"\nContent: ${doc.text.substring(0, 1000)}${doc.text.length > 1000 ? "..." : ""}\n`
    )
    .join("\n");

  const prompt = `Analyze this cluster of ${cluster.documents.length} related documents for authentic demand patterns ("not-nots"):

${documentsText}

Cluster Statistics:
- Average similarity: ${(cluster.averageSimilarity * 100).toFixed(1)}%
- Documents: ${cluster.documents.length} items

Based on Furst's framework, identify if this cluster reveals a situation where users "cannot not" engage with a solution.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: NOT_NOT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error("Failed to parse OpenAI response:", content);
      return null;
    }

    // Check if a valid not-not was identified
    if (!analysis.title || analysis.confidence < 0.5) {
      console.log(
        `Cluster ${cluster.clusterIndex} did not produce a valid not-not:`,
        analysis.reasoning
      );
      return null;
    }

    // Build the not-not candidate
    const notNotCandidate: NotNotCandidate = {
      title: analysis.title,
      description: analysis.description,
      supportingDocuments: cluster.documents.map((doc) => doc.id),
      clusterMetadata: {
        algorithm: "naive-kmeans",
        generatedAt: new Date().toISOString(),
        documentCount: cluster.documents.length,
        clusterCount: 1, // This represents one cluster
        clusterStats: {
          averageSimilarity: cluster.averageSimilarity,
          clusterSizes: [cluster.documents.length],
          clusterIndex: cluster.clusterIndex,
        },
        generationParams: {
          similarityThreshold: 0.7,
          minClusterSize: 2,
        },
      },
    };

    return notNotCandidate;
  } catch (error) {
    console.error("Error analyzing cluster for not-not:", error);
    throw new Error(
      `Failed to analyze cluster: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Main function to generate not-nots from a collection of documents
 */
export async function generateNotNotsFromDocuments(
  documents: DocumentWithEmbedding[]
): Promise<NotNotCandidate[]> {
  if (documents.length < 5) {
    console.log("Need at least 5 documents to generate not-nots");
    return [];
  }

  console.log(`Starting not-not generation for ${documents.length} documents`);

  // Filter out documents without embeddings
  const documentsWithEmbeddings = documents.filter(
    (doc) =>
      doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length > 0
  );

  if (documentsWithEmbeddings.length < 5) {
    throw new Error("Need at least 5 documents with valid embeddings");
  }

  // Perform clustering
  const clusteringResult = clusterDocuments(documentsWithEmbeddings, {
    similarityThreshold: 0.7,
    minClusterSize: 2,
  });

  console.log(`Generated ${clusteringResult.clusters.length} clusters`);

  // Analyze each cluster for not-nots
  const notNotCandidates: NotNotCandidate[] = [];

  for (const cluster of clusteringResult.clusters) {
    console.log(
      `Analyzing cluster ${cluster.clusterIndex} with ${cluster.documents.length} documents`
    );

    try {
      const notNot = await analyzeClusterForNotNot(cluster);
      if (notNot) {
        notNotCandidates.push(notNot);
        console.log(`Generated not-not: "${notNot.title}"`);
      }
    } catch (error) {
      console.error(
        `Failed to analyze cluster ${cluster.clusterIndex}:`,
        error
      );
      // Continue with other clusters even if one fails
    }
  }

  console.log(
    `Generated ${notNotCandidates.length} not-not candidates from ${clusteringResult.clusters.length} clusters`
  );
  return notNotCandidates;
}
