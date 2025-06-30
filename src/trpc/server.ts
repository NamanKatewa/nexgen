import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cookies, headers } from "next/headers";
import { cache } from "react";

import { type AppRouter, createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createQueryClient } from "./query-client";

const createContext = cache(async () => {
	const heads = new Headers(await headers());
	heads.set("x-trpc-source", "rsc");

	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	if (token) {
		heads.set("authorization", `Bearer ${token}`);
	}

	return createTRPCContext({
		headers: heads,
		req: new Request("http://localhost"),
	});
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
	caller,
	getQueryClient,
);
