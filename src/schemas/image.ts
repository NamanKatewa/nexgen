import { z } from "zod";

export const base64ImageSchema = z.object({
	data: z.string().startsWith("data:image/", "Invalid image data format"),
	name: z.string().min(1, "File name is required"),
	type: z.string().startsWith("image/", "Invalid file type"),
	size: z.number().max(5 * 1024 * 1024, "Max file size is 5MB."),
});

export type TImageSchema = z.infer<typeof base64ImageSchema>;
