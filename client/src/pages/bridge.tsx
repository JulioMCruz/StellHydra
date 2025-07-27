import { WalletConnection } from "@/components/wallet-connection";
import { BridgeInterface } from "@/components/bridge-interface";
import { PriceComparison } from "@/components/price-comparison";
import { AccountBalances } from "@/components/account-balances";
import { TransactionStatus } from "@/components/transaction-status";
import { ArrowRightLeft, Shield, BarChart3, Wallet, History, Settings, TrendingUp } from "lucide-react";

export default function Bridge() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-2 h-2 bg-stellar rounded-full animate-ping opacity-60" style={{ top: '20%', left: '10%', animationDelay: '0s' }}></div>
        <div className="absolute w-1 h-1 bg-ethereum rounded-full animate-ping opacity-60" style={{ top: '60%', left: '80%', animationDelay: '2s' }}></div>
        <div className="absolute w-3 h-3 bg-stellar rounded-full animate-pulse-slow opacity-40" style={{ top: '80%', left: '20%', animationDelay: '1s' }}></div>
        <div className="absolute w-1 h-1 bg-ethereum rounded-full animate-pulse-slow opacity-40" style={{ top: '30%', left: '70%', animationDelay: '3s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-stellar to-ethereum rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">StellarBridge</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-white hover:text-stellar transition-colors">Bridge</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors">Portfolio</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors">History</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors">Analytics</a>
            </nav>

            <WalletConnection />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Bridge Interface */}
          <div className="lg:col-span-8">
            <BridgeInterface />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <PriceComparison />
            <AccountBalances />
            <TransactionStatus />
          </div>
        </div>

        {/* Mobile Market Stats */}
        <div className="lg:hidden mt-8">
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-stellar" />
              Market Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-stellar">$0.99</div>
                <div className="text-sm text-muted-foreground">XLM/USD</div>
                <div className="text-xs text-green-400 mt-1">+2.4%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-ethereum">$2,501</div>
                <div className="text-sm text-muted-foreground">ETH/USD</div>
                <div className="text-xs text-red-400 mt-1">-0.8%</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-white/10 z-50">
        <div className="grid grid-cols-4 gap-1 p-4">
          <button className="flex flex-col items-center space-y-1 text-stellar">
            <ArrowRightLeft className="w-5 h-5" />
            <span className="text-xs">Bridge</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-white transition-colors">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Portfolio</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-white transition-colors">
            <History className="w-5 h-5" />
            <span className="text-xs">History</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
