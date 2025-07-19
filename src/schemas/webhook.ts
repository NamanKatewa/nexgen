import { z } from "zod";

export const webhookSchema = z.object({
	hash: z.string(),
	status_feed: z.array(
		z.object({
			order_id: z.string(),
			awbno: z.string(),
			phone: z.string(),
			first_name: z.string(),
			last_name: z.string(),
			country_code: z.string().optional(),
			pickupdate: z.string().optional(),
			current_status_desc: z.string(),
			current_status: z.string(),
			from: z.string().optional(),
			to: z.string().optional(),
			status_time: z.string(),
			order_data: z.string().optional(),
			carrier: z.string(),
			carrier_id: z.string(),
			tracking_url: z.string().optional(),
			scans: z
				.array(
					z.object({
						time: z.string(),
						status: z.string(),
						location: z.string(),
					}),
				)
				.optional(),
		}),
	),
});
