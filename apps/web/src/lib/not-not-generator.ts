/**
 * Not-Not Generation Service
 *
 * Generates NotNots for individual documents based on Merrick Furst's authentic demand framework.
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

export interface NotNotCandidate {
  title: string;
  description: string;
  documentId: string;
  metadata: {
    algorithm: string;
    generatedAt: string;
    generationParams: {
      model: string;
      temperature: number;
    };
  };
}

/**
 * System prompt for OpenAI to identify not-nots based on Merrick Furst's framework
 */
const NOT_NOT_SYSTEM_PROMPT = `You are an expert innovation analyst trained in Merrick Furst's "Deliberate Innovation" framework. Your task is to analyze individual documents to identify potential "not-nots" - situations where users "cannot not" engage with a solution due to authentic demand.

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

Your response must be a JSON array of 0-3 potential not-nots found in the document:
[
  {
    "title": "Specific situation where users cannot not engage",
    "description": "Detailed explanation of why this represents authentic demand - what makes the alternative unthinkable/unacceptable",
    "confidence": 0.85,
    "reasoning": "Why this represents a true not-not vs normal behavior"
  }
]

If the document doesn't contain clear not-nots, return: []`;

/**
 * Analyzes a single document using OpenAI to identify potential not-nots
 */
export async function analyzeDocumentForNotNots(
  document: DocumentWithEmbedding
): Promise<NotNotCandidate[]> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is required for not-not generation");
  }

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const prompt = `Analyze this document for authentic demand patterns ("not-nots"):

Document: "${document.title}"
Content: ${document.text.substring(0, 2000)}${document.text.length > 2000 ? "..." : ""}

Based on Furst's framework, identify 0-3 potential not-not situations where users "cannot not" engage with a solution.`;

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
    let analyses: any[];
    try {
      analyses = JSON.parse(content);
    } catch {
      console.error("Failed to parse OpenAI response:", content);
      return [];
    }

    if (!Array.isArray(analyses)) {
      console.error("Expected array response from OpenAI:", content);
      return [];
    }

    // Filter and build not-not candidates
    const notNotCandidates: NotNotCandidate[] = analyses
      .filter((analysis) => analysis.title && analysis.confidence >= 0.5)
      .map((analysis) => ({
        title: analysis.title,
        description: analysis.description,
        documentId: document.id,
        metadata: {
          algorithm: "single-document-analysis",
          generatedAt: new Date().toISOString(),
          generationParams: {
            model: "gpt-4",
            temperature: 0.2,
          },
        },
      }));

    return notNotCandidates;
  } catch (error) {
    console.error("Error analyzing document for not-nots:", error);
    throw new Error(
      `Failed to analyze document: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Main function to generate not-nots from a collection of documents
 */
export async function generateNotNotsFromDocuments(
  documents: DocumentWithEmbedding[]
): Promise<NotNotCandidate[]> {
  if (documents.length === 0) {
    console.log("No documents provided for not-not generation");
    return [];
  }

  console.log(`Starting not-not generation for ${documents.length} documents`);

  // Filter out documents without embeddings
  const documentsWithEmbeddings = documents.filter(
    (doc) =>
      doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length > 0
  );

  console.log(
    `\n🤖 Starting OpenAI analysis of ${documentsWithEmbeddings.length} documents`
  );

  // Analyze each document for not-nots
  const allNotNotCandidates: NotNotCandidate[] = [];

  for (const document of documentsWithEmbeddings) {
    console.log(
      `\n🧠 Analyzing document "${document.title}" for not-not patterns...`
    );

    try {
      const notNots = await analyzeDocumentForNotNots(document);
      if (notNots.length > 0) {
        allNotNotCandidates.push(...notNots);
        console.log(
          `✨ Generated ${notNots.length} not-not(s) for "${document.title}"`
        );
        notNots.forEach((notNot) => {
          console.log(`   💡 "${notNot.title}"`);
        });
      } else {
        console.log(
          `❌ No valid not-nots found for document "${document.title}"`
        );
      }
    } catch (error) {
      console.error(`Failed to analyze document "${document.title}":`, error);
      // Continue with other documents even if one fails
    }
  }

  console.log(
    `Generated ${allNotNotCandidates.length} not-not candidates from ${documentsWithEmbeddings.length} documents`
  );
  return allNotNotCandidates;
}

/**
 * Generate not-nots for a single document (useful when a document is added)
 */
export async function generateNotNotsForDocument(
  document: DocumentWithEmbedding
): Promise<NotNotCandidate[]> {
  console.log(`Generating not-nots for single document: "${document.title}"`);

  if (
    !document.embedding ||
    !Array.isArray(document.embedding) ||
    document.embedding.length === 0
  ) {
    console.log(
      "Document does not have valid embedding, skipping not-not generation"
    );
    return [];
  }

  return await analyzeDocumentForNotNots(document);
}
