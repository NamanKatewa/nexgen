import logger from "~/lib/logger";

export const fileToBase64 = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			logger.info(`Successfully converted file ${file.name} to Base64`);
			resolve(reader.result as string);
		};
		reader.onerror = (error) => {
			logger.error("Error converting file to Base64", {
				error,
				fileName: file.name,
			});
			reject(error);
		};
	});
};
