import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get API base URL from environment or default to current origin
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function throwIfResNotOk(res: Response) {
	if (!res.ok) {
		const text = (await res.text()) || res.statusText;
		throw new Error(`${res.status}: ${text}`);
	}
}

export async function apiRequest(
	method: string,
	url: string,
	data?: unknown | undefined
): Promise<Response> {
	// Prepend API base URL if configured
	const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

	const res = await fetch(fullUrl, {
		method,
		headers: data ? { "Content-Type": "application/json" } : {},
		body: data ? JSON.stringify(data) : undefined,
		credentials: "include",
	});

	await throwIfResNotOk(res);
	return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
	on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
	({ on401: unauthorizedBehavior }) =>
	async ({ queryKey }) => {
		const fullUrl = queryKey.join("/") as string;
		const url = fullUrl.startsWith("http")
			? fullUrl
			: `${API_BASE_URL}${fullUrl}`;

		const res = await fetch(url, {
			credentials: "include",
		});

		if (unauthorizedBehavior === "returnNull" && res.status === 401) {
			return null;
		}

		await throwIfResNotOk(res);
		return await res.json();
	};

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryFn: getQueryFn({ on401: "throw" }),
			refetchInterval: false,
			refetchOnWindowFocus: false,
			staleTime: Infinity,
			retry: false,
		},
		mutations: {
			retry: false,
		},
	},
});
