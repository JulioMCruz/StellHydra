import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NetworkSelectorProps {
	selectedNetwork: string;
	onNetworkSelect: (network: string) => void;
	label?: string;
}

export function NetworkSelector({
	selectedNetwork,
	onNetworkSelect,
	label,
}: NetworkSelectorProps) {
	const networks = [
		{
			id: "stellar",
			name: "Stellar",
			color: "bg-stellar",
			logo: "/stellar-logo.webp",
			description: "Stellar Network",
		},
		{
			id: "sepolia",
			name: "Sepolia",
			color: "bg-ethereum",
			logo: "/ethereum-logo.svg",
			description: "Ethereum Testnet",
		},
		{
			id: "ethereum",
			name: "Ethereum",
			color: "bg-ethereum",
			logo: "/ethereum-logo.svg",
			description: "Ethereum Mainnet",
		},
	];

	const currentNetwork =
		networks.find((network) => network.id === selectedNetwork) ||
		networks[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="flex items-center space-x-2 glass-card px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all"
				>
					<div
						className={`w-5 h-5 rounded-full ${currentNetwork.color} flex items-center justify-center`}
					>
						{currentNetwork.logo ? (
							<img
								src={currentNetwork.logo}
								alt={currentNetwork.name}
								className="w-3 h-3 object-contain"
							/>
						) : (
							<span className="text-xs font-bold text-white">
								{currentNetwork.name.slice(0, 2)}
							</span>
						)}
					</div>
					<span className="font-medium text-sm">
						{currentNetwork.name}
					</span>
					<ChevronDown className="w-3 h-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48 bg-background/95 backdrop-blur-sm border-white/10">
				{networks.map((network) => (
					<DropdownMenuItem
						key={network.id}
						onClick={() => onNetworkSelect(network.id)}
						className="focus:bg-stellar/20 focus:text-white cursor-pointer"
					>
						<div className="flex items-center space-x-3 w-full">
							<div
								className={`w-6 h-6 rounded-full ${network.color} flex items-center justify-center`}
							>
								{network.logo ? (
									<img
										src={network.logo}
										alt={network.name}
										className="w-4 h-4 object-contain"
									/>
								) : (
									<span className="text-xs font-bold text-white">
										{network.name.slice(0, 2)}
									</span>
								)}
							</div>
							<div className="flex-1">
								<div className="font-medium text-white">
									{network.name}
								</div>
								<div className="text-xs text-muted-foreground">
									{network.description}
								</div>
							</div>
						</div>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
