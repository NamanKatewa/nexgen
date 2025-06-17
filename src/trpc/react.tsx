"use client";

import { useMemo } from "react";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchStreamLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import SuperJSON from "superjson";

import type { AppRouter } from "~/server/api/root";
import { createQueryClient } from "./query-client";

// Singleton QueryClient on client side
let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  clientQueryClientSingleton ??= createQueryClient();
  return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const trpcClient = useMemo(
    () =>
      api.createClient({
        links: [
          loggerLink({
            enabled: (op) =>
              process.env.NODE_ENV === "development" ||
              (op.direction === "down" && op.result instanceof Error),
          }),
          httpBatchStreamLink({
            transformer: SuperJSON,
            url: `${getBaseUrl()}/api/trpc`,
            headers: () => {
              const headers = new Headers();
              headers.set("x-trpc-source", "nextjs-react");

              if (typeof window !== "undefined") {
                const token = localStorage.getItem("token");
                if (token) {
                  headers.set("authorization", `Bearer ${token}`);
                }
              }

              return headers;
            },
          }),
        ],
      }),
    [] // Ensures trpcClient is only created once per mount
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
