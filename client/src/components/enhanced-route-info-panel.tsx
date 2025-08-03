import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	Route,
	Zap,
	Shield,
	Clock,
	TrendingUp,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Info,
} from "lucide-react";
import { FusionPlusRouteComparison, BridgeSimulation } from "@/lib/types";

interface EnhancedRouteInfoPanelProps {
	simulation: BridgeSimulation | null;
	routeComparison: FusionPlusRouteComparison | null;
	isSimulating: boolean;
	onExecute: () => void;
	isExecuting: boolean;
	fusionHealth?: boolean;
	optimalRoute: "fusion" | "stellhydra";
}

export function EnhancedRouteInfoPanel({
	simulation,
	routeComparison,
	isSimulating,
	onExecute,
	isExecuting,
	fusionHealth = false,
	optimalRoute,
}: EnhancedRouteInfoPanelProps) {
	if (isSimulating) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Route className="h-5 w-5" />
						Finding Optimal Route...
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<Progress value={33} className="w-full" />
						<p className="text-sm text-muted-foreground">
							Analyzing Fusion+ and StellHydra routes...
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!simulation) {
		return null;
	}

	const isFusionOptimal = optimalRoute === "fusion";
	const isStellHydraOptimal = optimalRoute === "stellhydra";

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Route className="h-5 w-5" />
					Route Comparison
					{isFusionOptimal && (
						<Badge variant="secondary" className="ml-auto">
							<Zap className="h-3 w-3 mr-1" />
							Fusion+ Optimal
						</Badge>
					)}
					{isStellHydraOptimal && (
						<Badge variant="secondary" className="ml-auto">
							<Shield className="h-3 w-3 mr-1" />
							StellHydra Optimal
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Route Comparison */}
				{routeComparison && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Fusion+ Route */}
						<Card
							className={`border-2 ${
								isFusionOptimal
									? "border-green-500 bg-green-50 dark:bg-green-950"
									: "border-gray-200"
							}`}
						>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Zap className="h-4 w-4" />
										<span className="font-semibold">
											1inch Fusion+
										</span>
									</div>
									{routeComparison.fusionRoute ? (
										<CheckCircle className="h-4 w-4 text-green-500" />
									) : (
										<XCircle className="h-4 w-4 text-red-500" />
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-2">
								{routeComparison.fusionRoute ? (
									<>
										<div className="flex justify-between text-sm">
											<span>Estimated Output:</span>
											<span className="font-mono">
												{
													routeComparison.fusionRoute
														.estimatedOutput
												}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Gas Estimate:</span>
											<span className="font-mono">
												{
													routeComparison.fusionRoute
														.gasEstimate
												}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Price Impact:</span>
											<span className="font-mono">
												{(
													routeComparison.fusionRoute
														.priceImpact * 100
												).toFixed(2)}
												%
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Status:</span>
											<Badge
												variant={
													fusionHealth
														? "default"
														: "destructive"
												}
												className="text-xs"
											>
												{fusionHealth
													? "Healthy"
													: "Unavailable"}
											</Badge>
										</div>
										<div className="flex justify-between text-sm">
											<span>Preset:</span>
											<span className="font-mono">
												{
													routeComparison.fusionRoute
														.presetType
												}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Secrets Count:</span>
											<span className="font-mono">
												{
													routeComparison.fusionRoute
														.secretsCount
												}
											</span>
										</div>
									</>
								) : (
									<p className="text-sm text-muted-foreground">
										Fusion+ route unavailable
									</p>
								)}
							</CardContent>
						</Card>

						{/* StellHydra Route */}
						<Card
							className={`border-2 ${
								isStellHydraOptimal
									? "border-blue-500 bg-blue-50 dark:bg-blue-950"
									: "border-gray-200"
							}`}
						>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Shield className="h-4 w-4" />
										<span className="font-semibold">
											StellHydra
										</span>
									</div>
									{routeComparison.stellhydraRoute ? (
										<CheckCircle className="h-4 w-4 text-green-500" />
									) : (
										<XCircle className="h-4 w-4 text-red-500" />
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-2">
								{routeComparison.stellhydraRoute ? (
									<>
										<div className="flex justify-between text-sm">
											<span>Estimated Output:</span>
											<span className="font-mono">
												{
													routeComparison
														.stellhydraRoute
														.estimatedOutput
												}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Gas Estimate:</span>
											<span className="font-mono">
												{
													routeComparison
														.stellhydraRoute
														.gasEstimate
												}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Price Impact:</span>
											<span className="font-mono">
												{(
													routeComparison
														.stellhydraRoute
														.priceImpact * 100
												).toFixed(2)}
												%
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Status:</span>
											<Badge
												variant="default"
												className="text-xs"
											>
												Available
											</Badge>
										</div>
									</>
								) : (
									<p className="text-sm text-muted-foreground">
										StellHydra route unavailable
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				)}

				{/* Performance Metrics */}
				{routeComparison && (
					<div className="space-y-3">
						<h4 className="font-semibold">Performance Metrics</h4>
						<div className="grid grid-cols-3 gap-4 text-sm">
							<div className="text-center p-3 bg-muted rounded-lg">
								<div className="font-semibold">
									{routeComparison.performanceMetrics
										.estimatedTime / 1000}
									s
								</div>
								<div className="text-xs text-muted-foreground">
									Est. Time
								</div>
							</div>
							<div className="text-center p-3 bg-muted rounded-lg">
								<div className="font-semibold">
									{
										routeComparison.performanceMetrics
											.estimatedCost
									}
								</div>
								<div className="text-xs text-muted-foreground">
									Est. Cost
								</div>
							</div>
							<div className="text-center p-3 bg-muted rounded-lg">
								<div className="font-semibold">
									{(
										routeComparison.performanceMetrics
											.successRate * 100
									).toFixed(1)}
									%
								</div>
								<div className="text-xs text-muted-foreground">
									Success Rate
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Optimal Route Reason */}
				{routeComparison && (
					<div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
						<Info className="h-4 w-4 text-blue-500" />
						<span className="text-sm">
							<strong>Reason:</strong> {routeComparison.reason}
						</span>
					</div>
				)}

				{/* Simulation Details */}
				<div className="space-y-3">
					<h4 className="font-semibold">Transaction Details</h4>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div className="flex justify-between">
							<span>From Amount:</span>
							<span className="font-mono">
								{simulation.fromAmount}
							</span>
						</div>
						<div className="flex justify-between">
							<span>To Amount:</span>
							<span className="font-mono">
								{simulation.toAmount}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Rate:</span>
							<span className="font-mono">{simulation.rate}</span>
						</div>
						<div className="flex justify-between">
							<span>Fee:</span>
							<span className="font-mono">{simulation.fee}</span>
						</div>
						<div className="flex justify-between">
							<span>DEX Source:</span>
							<span className="font-mono">
								{simulation.dexSource}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Estimated Time:</span>
							<span className="font-mono">
								{simulation.estimatedTime}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Price Impact:</span>
							<span className="font-mono">
								{simulation.priceImpact}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Minimum Received:</span>
							<span className="font-mono">
								{simulation.minimumReceived}
							</span>
						</div>
						{simulation.gasEstimate && (
							<div className="flex justify-between">
								<span>Gas Estimate:</span>
								<span className="font-mono">
									{simulation.gasEstimate}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Fusion+ Route Details */}
				{simulation.fusionRoute && (
					<div className="space-y-3">
						<h4 className="font-semibold flex items-center gap-2">
							<Zap className="h-4 w-4" />
							Fusion+ Route Details
						</h4>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="flex justify-between">
								<span>Protocols:</span>
								<span className="font-mono">
									{simulation.fusionRoute.protocols.join(
										", "
									)}
								</span>
							</div>
							<div className="flex justify-between">
								<span>DEX Aggregator:</span>
								<span className="font-mono">
									{simulation.fusionRoute.dexAggregator}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Slippage Tolerance:</span>
								<span className="font-mono">
									{simulation.fusionRoute.slippageTolerance}%
								</span>
							</div>
							<div className="flex justify-between">
								<span>Preset Type:</span>
								<span className="font-mono">
									{simulation.fusionRoute.presetType}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Secrets Count:</span>
								<span className="font-mono">
									{simulation.fusionRoute.secretsCount}
								</span>
							</div>
							{simulation.fusionRoute.deadline && (
								<div className="flex justify-between">
									<span>Deadline:</span>
									<span className="font-mono">
										{new Date(
											simulation.fusionRoute.deadline
										).toLocaleTimeString()}
									</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Warning for Fusion Issues */}
				{isFusionOptimal && !fusionHealth && (
					<div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
						<AlertTriangle className="h-4 w-4 text-yellow-600" />
						<span className="text-sm text-yellow-800 dark:text-yellow-200">
							Fusion+ service may be experiencing issues.
							Transaction will fallback to StellHydra if needed.
						</span>
					</div>
				)}

				{/* Execute Button */}
				<Button
					onClick={onExecute}
					disabled={isExecuting}
					className="w-full"
					size="lg"
				>
					{isExecuting ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
							Executing Bridge...
						</>
					) : (
						<>
							<TrendingUp className="h-4 w-4 mr-2" />
							Execute Bridge
						</>
					)}
				</Button>

				{/* Route Selection Info */}
				<div className="text-xs text-muted-foreground text-center">
					{isFusionOptimal
						? "Using 1inch Fusion+ for optimal routing and gas efficiency"
						: "Using StellHydra for reliable cross-chain bridging"}
				</div>
			</CardContent>
		</Card>
	);
}
