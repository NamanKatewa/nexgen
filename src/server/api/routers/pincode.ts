import { z } from "zod";
import { getPincodeDetails } from "../../../lib/pincode-utils";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const pincodeRouter = createTRPCRouter({
	getCityState: publicProcedure
		.input(z.object({ pincode: z.string().length(6) }))
		.query(async ({ input }) => {
			const details = await getPincodeDetails(input.pincode);
			if (details) {
				return { city: details.city, state: details.state };
			}
			return null;
		}),
});
