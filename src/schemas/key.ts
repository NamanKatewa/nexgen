import { z } from "zod";

export const submitKycSchema = z.object({
  document_type: z.string(),
  document_number: z.string(),
  document_image_url_1: z.string().url(),
  document_image_url_2: z.string().url(),
});

export type SubmitKycInput = z.infer<typeof submitKycSchema>;
