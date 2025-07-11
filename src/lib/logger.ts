const getTimestamp = () => {
	return new Date().toISOString();
};

const formatLog = (level: string, message: string, details?: unknown) => {
	let logMessage = `[${getTimestamp()}] [${level.toUpperCase()}] - ${message}`;
	if (details) {
		logMessage += `\n${JSON.stringify(details, null, 2)}`;
	}
	return logMessage;
};

const logger = {
	info: (message: string, details?: unknown) => {
		console.log("\x1b[36m%s\x1b[0m", formatLog("INFO", message, details)); // Cyan
	},
	warn: (message: string, details?: unknown) => {
		console.warn("\x1b[33m%s\x1b[0m", formatLog("WARN", message, details)); // Yellow
	},
	error: (message: string, details?: unknown) => {
		console.error("\x1b[31m%s\x1b[0m", formatLog("ERROR", message, details)); // Red
	},
	debug: (message: string, details?: unknown) => {
		if (process.env.NODE_ENV !== "production") {
			console.debug("\x1b[90m%s\x1b[0m", formatLog("DEBUG", message, details)); // Gray
		}
	},
};

export default logger;
