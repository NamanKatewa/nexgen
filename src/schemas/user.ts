import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  mobile_number: z.string().min(10).max(15),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  client_id: z.string().optional(),
  user_type: z.enum(["Client", "Admin", "Employee"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
