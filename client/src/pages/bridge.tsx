import { BridgeInterface } from "@/components/bridge-interface-new";
import { MainLayout } from "@/components/layout/main-layout";
import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runAllFusionTests } from "@/lib/test-cross-chain-fusion";

export default function Bridge() {
	const [showMobileRouteInfo, setShowMobileRouteInfo] = useState(false);
	const [testResults, setTestResults] = useState<any>(null);
	const [isTesting, setIsTesting] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
							{/* Test Section */}
							<Card className="mb-6">
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
							</Card>

							{/* Bridge Interface */}
							<BridgeInterface
								showMobileRouteInfo={showMobileRouteInfo}
								setShowMobileRouteInfo={setShowMobileRouteInfo}
							/>
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
