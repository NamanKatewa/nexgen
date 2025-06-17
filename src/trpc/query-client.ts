import {
  QueryClient,
  defaultShouldDehydrateQuery,
  type Query,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

// Memoized SuperJSON handlers to avoid redefinition
const serialize = SuperJSON.serialize;
const deserialize = SuperJSON.deserialize;

// Reuse predicate function instead of inline recreation
const shouldDehydrateQuery = (query: Query) =>
  defaultShouldDehydrateQuery(query) || query.state.status === "pending";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
      },
      dehydrate: {
        serializeData: serialize,
        shouldDehydrateQuery,
      },
      hydrate: {
        deserializeData: deserialize,
      },
    },
  });
