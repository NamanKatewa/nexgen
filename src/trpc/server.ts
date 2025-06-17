import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers, cookies } from "next/headers";
import { cache } from "react";

import { type AppRouter, createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createQueryClient } from "./query-client";

// Cached headers + cookies → context setup
const createContext = cache(async () => {
  const heads = new Headers(await headers());

  heads.set("x-trpc-source", "rsc");

  const token = (await cookies()).get("token")?.value;
  if (token) {
    heads.set("authorization", `Bearer ${token}`);
  }

  return createTRPCContext({ headers: heads });
});

// Cached QueryClient
const getQueryClient = cache(() => createQueryClient());

// Cached tRPC caller
const caller = createCaller(createContext);

// Hydration helpers
export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
);
