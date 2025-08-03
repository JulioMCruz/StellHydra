import { RelayerConfig } from "../config";

interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	context?: any;
	error?: Error;
}

class Logger {
	private config: RelayerConfig;
	private logLevels = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
	};

	constructor(config: RelayerConfig) {
		this.config = config;
	}

	private shouldLog(level: string): boolean {
		const currentLevel =
			this.logLevels[
				this.config.logLevel as keyof typeof this.logLevels
			] || 1;
		const messageLevel =
			this.logLevels[level as keyof typeof this.logLevels] || 1;
		return messageLevel >= currentLevel;
	}

	private formatLog(
		level: string,
		message: string,
		context?: any,
		error?: Error
	): string {
		const timestamp = new Date().toISOString();
		const logEntry: LogEntry = {
			timestamp,
			level: level.toUpperCase(),
			message,
			context,
			error,
		};

		let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

		if (context) {
			formatted += ` | Context: ${JSON.stringify(context)}`;
		}

		if (error) {
			formatted += ` | Error: ${error.message}`;
			if (error.stack) {
				formatted += ` | Stack: ${error.stack}`;
			}
		}

		return formatted;
	}

	private log(
		level: string,
		message: string,
		context?: any,
		error?: Error
	): void {
		if (!this.shouldLog(level)) {
			return;
		}

		const formatted = this.formatLog(level, message, context, error);

		switch (level) {
			case "debug":
				console.debug(formatted);
				break;
			case "info":
				console.info(formatted);
				break;
			case "warn":
				console.warn(formatted);
				break;
			case "error":
				console.error(formatted);
				break;
			default:
				console.log(formatted);
		}
	}

	debug(message: string, context?: any): void {
		this.log("debug", message, context);
	}

	info(message: string, context?: any): void {
		this.log("info", message, context);
	}

	warn(message: string, context?: any): void {
		this.log("warn", message, context);
	}

	error(message: string, error?: Error, context?: any): void {
		this.log("error", message, context, error);
	}

	// Specialized logging methods for relayer operations
	bridgeEvent(event: string, bridgeId: string, context?: any): void {
		this.info(`Bridge Event: ${event}`, { bridgeId, ...context });
	}

	escrowEvent(event: string, escrowId: string, context?: any): void {
		this.info(`Escrow Event: ${event}`, { escrowId, ...context });
	}

	fusionEvent(event: string, orderHash: string, context?: any): void {
		this.info(`Fusion Event: ${event}`, { orderHash, ...context });
	}

	transactionEvent(
		event: string,
		txHash: string,
		chain: string,
		context?: any
	): void {
		this.info(`Transaction Event: ${event}`, { txHash, chain, ...context });
	}

	healthCheck(status: any): void {
		this.debug("Health Check", status);
	}

	performance(operation: string, duration: number, context?: any): void {
		this.debug(`Performance: ${operation}`, {
			duration: `${duration}ms`,
			...context,
		});
	}
}

// Create a default logger instance
let defaultLogger: Logger;

export const createLogger = (config: RelayerConfig): Logger => {
	defaultLogger = new Logger(config);
	return defaultLogger;
};

export const logger = {
	debug: (message: string, context?: any) =>
		defaultLogger?.debug(message, context),
	info: (message: string, context?: any) =>
		defaultLogger?.info(message, context),
	warn: (message: string, context?: any) =>
		defaultLogger?.warn(message, context),
	error: (message: string, error?: Error, context?: any) =>
		defaultLogger?.error(message, error, context),
	bridgeEvent: (event: string, bridgeId: string, context?: any) =>
		defaultLogger?.bridgeEvent(event, bridgeId, context),
	escrowEvent: (event: string, escrowId: string, context?: any) =>
		defaultLogger?.escrowEvent(event, escrowId, context),
	fusionEvent: (event: string, orderHash: string, context?: any) =>
		defaultLogger?.fusionEvent(event, orderHash, context),
	transactionEvent: (
		event: string,
		txHash: string,
		chain: string,
		context?: any
	) => defaultLogger?.transactionEvent(event, txHash, chain, context),
	healthCheck: (status: any) => defaultLogger?.healthCheck(status),
	performance: (operation: string, duration: number, context?: any) =>
		defaultLogger?.performance(operation, duration, context),
};
