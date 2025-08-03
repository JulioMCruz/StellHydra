import { BridgeInterface } from "@/components/bridge-interface-new";
import { AtomicSwapInterface } from "@/components/atomic-swap-interface";
import { MainLayout } from "@/components/layout/main-layout";
import { Sidebar } from "@/components/layout/sidebar";
import { WalletGuide } from "@/components/wallet-guide";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runAllFusionTests } from "@/lib/test-cross-chain-fusion";
import { useWallet } from "@/hooks/use-wallet";

export default function Bridge() {
	const [showMobileRouteInfo, setShowMobileRouteInfo] = useState(false);
	const [testResults, setTestResults] = useState<any>(null);
	const [isTesting, setIsTesting] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [showInterfacePreview, setShowInterfacePreview] = useState(false);
	const { stellarWallet, sepoliaWallet } = useWallet();
	
	// Debug wallet state  
	console.log("Bridge page - Stellar wallet state:", stellarWallet);
	console.log("Bridge page - Sepolia wallet state:", sepoliaWallet);
	
	const hasWallets = stellarWallet.isConnected || sepoliaWallet.isConnected;

	const handleTestFusion = async () => {
		setIsTesting(true);
		try {
			const results = await runAllFusionTests();
			setTestResults(results);
			console.log("Test results:", results);
		} catch (error) {
			console.error("Test failed:", error);
			setTestResults({
				error: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsTesting(false);
		}
	};

	return (
		<MainLayout>
			<div className="flex h-screen">
				<Sidebar
					isCollapsed={isSidebarCollapsed}
					onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
				/>
				<div className="flex-1 flex flex-col">
					<div className="flex-1 overflow-auto">
						<div className="container mx-auto p-6">
							{!hasWallets && !showInterfacePreview ? (
								/* Wallet Setup Guide when no wallets connected */
								<div className="space-y-6">
									<div className="text-center space-y-2">
										<h1 className="text-3xl font-bold gradient-text">Welcome to StellHydra</h1>
										<p className="text-muted-foreground">Connect your wallets to start cross-chain bridging</p>
									</div>
									
									{/* Preview Interface Button */}
									<div className="text-center">
										<Button
											onClick={() => setShowInterfacePreview(true)}
											className="mb-4 bg-gradient-to-r from-stellar to-ethereum hover:from-stellar/80 hover:to-ethereum/80 text-white"
										>
											👀 Preview Bridge Interface
										</Button>
										<p className="text-sm text-muted-foreground">
											Take a look at the interface before setting up your wallets
										</p>
									</div>
									
									<WalletGuide />
								</div>
							) : (
								<div>
									{/* Back to Wallet Guide Button (only show in preview mode when no wallets connected) */}
									{!hasWallets && showInterfacePreview && (
										<div className="mb-6 text-center">
											<Button
												onClick={() => setShowInterfacePreview(false)}
												variant="outline"
												className="mb-2"
											>
												← Back to Wallet Setup
											</Button>
											<p className="text-sm text-muted-foreground">
												This is a preview. Connect wallets to use the bridge.
											</p>
										</div>
									)}
									
									{/* Test Section */}
									{/* <Card className="mb-6">
										<CardHeader>
											<CardTitle>
												🧪 Cross-Chain Fusion+ Test
											</CardTitle>
										</CardHeader>
										<CardContent>
											<Button
												onClick={handleTestFusion}
												disabled={isTesting}
												className="mb-4"
											>
												{isTesting
													? "Testing..."
													: "Test Cross-Chain Fusion+"}
											</Button>

											{testResults && (
												<div className="mt-4 p-4 bg-gray-100 rounded-lg">
													<h3 className="font-semibold mb-2">
														Test Results:
													</h3>
													<pre className="text-sm overflow-auto">
														{JSON.stringify(
															testResults,
															null,
															2
														)}
													</pre>
												</div>
											)}
										</CardContent>
									</Card> */}

									{/* Bridge Interface with Tabs */}
									<Tabs defaultValue="bridge" className="w-full">
										<TabsList className="grid w-full grid-cols-2 mb-6">
											<TabsTrigger value="bridge" className="flex items-center gap-2">
												🌉 Standard Bridge
											</TabsTrigger>
											<TabsTrigger value="atomic-swap" className="flex items-center gap-2">
												🔐 Atomic Swap
											</TabsTrigger>
										</TabsList>
										
										<TabsContent value="bridge">
											<BridgeInterface
												showMobileRouteInfo={showMobileRouteInfo}
												setShowMobileRouteInfo={setShowMobileRouteInfo}
											/>
										</TabsContent>
										
										<TabsContent value="atomic-swap">
											<AtomicSwapInterface />
										</TabsContent>
									</Tabs>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
