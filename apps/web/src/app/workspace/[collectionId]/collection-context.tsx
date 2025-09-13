"use client";

import { createContext, useContext } from "react";
import type { Collection, CollectionMember, Document } from "@prism/db";

type CollectionWithMembers = Collection & {
  collectionMembers?: CollectionMember[];
  documents?: Document[];
};

interface CollectionContextType {
  isLoading: boolean;
  error: unknown;
  collection: CollectionWithMembers | undefined;
}

export const CollectionContext = createContext<CollectionContextType | null>(
  null
);

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useCollection must be used within CollectionProvider");
  }
  return context;
};
