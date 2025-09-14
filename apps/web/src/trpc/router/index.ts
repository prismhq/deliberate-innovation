import { organizationRouter } from "./organization";
import { collectionsRouter } from "./collection";
import { documentRouter } from "./document";
import { situationDiagramsRouter } from "./situationDiagrams";
import { createCallerFactory, createTRPCRouter } from "~/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  organization: organizationRouter,
  collections: collectionsRouter,
  document: documentRouter,
  situationDiagrams: situationDiagramsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
