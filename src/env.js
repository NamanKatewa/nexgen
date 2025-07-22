import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		BASE_URL: z.string().url(),
		JWT_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		DATABASE_URL: z.string().url(),
		DIRECT_URL: z.string().url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		S3_REGION: z.string(),
		S3_ACCESS_KEY_ID: z.string(),
		S3_SECRET_ACCESS_KEY: z.string(),
		S3_BUCKET_NAME: z.string(),
		EMAIL_USER: z.string(),
		EMAIL_PASSWORD: z.string(),
		IMB_TOKEN: z.string(),
		IMB_API_URL: z.string().url(),
		SHIPWAY_USERNAME: z.string().email(),
		SHIPWAY_PASSWORD: z.string(),
		SHIPWAY_HASH: z.string(),
	},

	client: {},

	runtimeEnv: {
		BASE_URL: process.env.BASE_URL,
		JWT_SECRET: process.env.JWT_SECRET,
		DATABASE_URL: process.env.DATABASE_URL,
		DIRECT_URL: process.env.DIRECT_URL,
		NODE_ENV: process.env.NODE_ENV,
		S3_REGION: process.env.S3_REGION,
		S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
		S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
		EMAIL_USER: process.env.EMAIL_USER,
		EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
		IMB_TOKEN: process.env.IMB_TOKEN,
		IMB_API_URL: process.env.IMB_API_URL,
		SHIPWAY_USERNAME: process.env.SHIPWAY_USERNAME,
		SHIPWAY_PASSWORD: process.env.SHIPWAY_PASSWORD,
		SHIPWAY_HASH: process.env.SHIPWAY_HASH,
	},

	skipValidation: !!process.env.SKIP_ENV_VALIDATION,

	emptyStringAsUndefined: true,
});
