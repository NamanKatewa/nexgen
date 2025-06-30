import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

interface Base64File {
	data: string;
	name: string;
	type: string;
	size: number;
}

const s3 = new S3Client({
	region: env.S3_REGION,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
	},
});

export async function uploadFileToS3(
	file: Base64File,
	folder: string,
): Promise<string> {
	try {
		const base64Content = file.data.split(",")[1];

		if (!base64Content) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Invalid Base64 data for file: ${file.name}`,
			});
		}

		const fileBuffer = Buffer.from(base64Content, "base64");
		const fileName = `${folder}/${Date.now()}-${file.name}`;

		await s3.send(
			new PutObjectCommand({
				Bucket: env.S3_BUCKET_NAME,
				Key: fileName,
				Body: fileBuffer,
				ContentType: file.type,
			}),
		);
		return `https://${env.S3_BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${fileName}`;
	} catch (error) {
		console.error("Error uploadin file to S3:", error);
		if (error instanceof TRPCError) {
			throw error;
		}
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Failed to upload ${file.name} to S3`,
			cause: error,
		});
	}
}
