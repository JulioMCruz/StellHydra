import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Missing utility functions referenced in the codebase
export function getRandomBytes32(): string {
	const array = new Uint8Array(32);
	if (typeof window !== "undefined" && window.crypto) {
		window.crypto.getRandomValues(array);
	} else {
		// Fallback for environments without crypto
		for (let i = 0; i < 32; i++) {
			array[i] = Math.floor(Math.random() * 256);
		}
	}
	return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
		""
	);
}

export function formatAddress(address: string): string {
	if (!address) return "";
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAmount(amount: string, decimals: number = 6): string {
	const num = parseFloat(amount);
	if (isNaN(num)) return "0";
	return num.toFixed(decimals);
}

export function validateAddress(address: string): boolean {
	// Basic validation for Ethereum addresses
	if (address.startsWith("0x") && address.length === 42) {
		return /^[0-9a-fA-F]+$/.test(address.slice(2));
	}
	// Basic validation for Stellar addresses
	if (address.length === 56 && !address.startsWith("0x")) {
		return /^[A-Z0-9]+$/.test(address);
	}
	return false;
}

export function calculateSlippage(
	amount: string,
	slippagePercent: number
): string {
	const num = parseFloat(amount);
	if (isNaN(num)) return "0";
	const slippage = num * (slippagePercent / 100);
	return (num - slippage).toString();
}

export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}
