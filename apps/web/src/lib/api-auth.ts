import type { NextRequest } from "next/server";
import { db } from "@prism/db";

export interface ApiAuthResult {
  success: boolean;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  error?: string;
}

export async function validateApiKey(
  request: NextRequest
): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Missing or invalid Authorization header. Expected: Bearer pk_...",
    };
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

  if (!apiKey.startsWith("pk_")) {
    return {
      success: false,
      error: "Invalid API key format. API keys must start with 'pk_'",
    };
  }

  try {
    // Find organization with this API key
    const organizations = await db.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        apiKeys: true,
      },
    });

    for (const org of organizations) {
      for (const keyString of org.apiKeys) {
        try {
          const metadata = JSON.parse(keyString);
          if (metadata.key === apiKey) {
            return {
              success: true,
              organization: {
                id: org.id,
                name: org.name,
                slug: org.slug!,
              },
            };
          }
        } catch {
          // Skip malformed API key entries
          continue;
        }
      }
    }

    return {
      success: false,
      error: "Invalid API key",
    };
  } catch (error) {
    console.error("Error validating API key:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}
