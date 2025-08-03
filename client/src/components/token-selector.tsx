import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TokenSelectorProps {
	selectedToken: string;
	onTokenSelect: (token: string) => void;
	network: string;
}

export function TokenSelector({
	selectedToken,
	onTokenSelect,
	network,
}: TokenSelectorProps) {
	const getTokens = () => {
		if (network === "stellar") {
			return [
				{
					symbol: "XLM",
					name: "Stellar Lumens",
					color: "bg-stellar",
					logo: "/stellar-logo.webp",
				},
				{ symbol: "USDC", name: "USD Coin", color: "bg-blue-500" },
				{ symbol: "yXLM", name: "yXLM", color: "bg-yellow-500" },
			];
		} else if (network === "sepolia") {
			return [
				{
					symbol: "ETH",
					name: "Ethereum",
					color: "bg-ethereum",
					logo: "/ethereum-logo.svg",
				},
				{ symbol: "USDC", name: "USD Coin", color: "bg-blue-500" },
				{ symbol: "WETH", name: "Wrapped ETH", color: "bg-purple-500" },
			];
		} else if (network === "ethereum") {
			return [
				{
					symbol: "ETH",
					name: "Ethereum",
					color: "bg-ethereum",
					logo: "/ethereum-logo.svg",
				},
				{ symbol: "USDC", name: "USD Coin", color: "bg-blue-500" },
				{ symbol: "WETH", name: "Wrapped ETH", color: "bg-purple-500" },
				{ symbol: "USDT", name: "Tether", color: "bg-green-500" },
			];
		} else {
			return [
				{
					symbol: "ETH",
					name: "Ethereum",
					color: "bg-ethereum",
					logo: "/ethereum-logo.svg",
				},
				{ symbol: "USDC", name: "USD Coin", color: "bg-blue-500" },
				{ symbol: "WETH", name: "Wrapped ETH", color: "bg-purple-500" },
			];
		}
	};

	const tokens = getTokens();
	const currentToken =
		tokens.find((token) => token.symbol === selectedToken) || tokens[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="flex items-center space-x-2 glass-card px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all"
				>
					<div
						className={`w-6 h-6 rounded-full ${currentToken.color} flex items-center justify-center`}
					>
						{currentToken.logo ? (
							<img
								src={currentToken.logo}
								alt={currentToken.symbol}
								className="w-4 h-4 object-contain"
							/>
						) : (
							<span className="text-xs font-bold text-white">
								{currentToken.symbol.slice(0, 2)}
							</span>
						)}
					</div>
					<span className="font-medium">{currentToken.symbol}</span>
					<ChevronDown className="w-3 h-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48 bg-background/95 backdrop-blur-sm border-white/10">
				{tokens.map((token) => (
					<DropdownMenuItem
						key={token.symbol}
						onClick={() => onTokenSelect(token.symbol)}
						className="focus:bg-stellar/20 focus:text-white cursor-pointer"
					>
						<div className="flex items-center space-x-3 w-full">
							<div
								className={`w-6 h-6 rounded-full ${token.color} flex items-center justify-center`}
							>
								{token.logo ? (
									<img
										src={token.logo}
										alt={token.symbol}
										className="w-4 h-4 object-contain"
									/>
								) : (
									<span className="text-xs font-bold text-white">
										{token.symbol.slice(0, 2)}
									</span>
								)}
							</div>
							<div className="flex-1">
								<div className="font-medium text-white">
									{token.symbol}
								</div>
								<div className="text-xs text-muted-foreground">
									{token.name}
								</div>
							</div>
						</div>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
