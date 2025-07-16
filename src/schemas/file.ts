import { z } from "zod";

export const base64FileSchema = z.object({
	data: z.string().min(1, "File data is required"),
	name: z.string().min(1, "File name is required"),
	type: z.string().min(1, "File type is required"),
	size: z.number().max(10 * 1024 * 1024, "Max file size is 10MB."), // Increased to 10MB for general files
});

export type TFileSchema = z.infer<typeof base64FileSchema>;
