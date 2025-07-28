import { ArrowRightLeft } from "lucide-react";
import { WalletConnection } from "@/components/wallet-connection";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-2 h-2 bg-stellar rounded-full animate-ping opacity-60" style={{ top: '20%', left: '10%', animationDelay: '0s' }}></div>
        <div className="absolute w-1 h-1 bg-ethereum rounded-full animate-ping opacity-60" style={{ top: '60%', left: '80%', animationDelay: '2s' }}></div>
        <div className="absolute w-3 h-3 bg-stellar rounded-full animate-pulse-slow opacity-40" style={{ top: '80%', left: '20%', animationDelay: '1s' }}></div>
        <div className="absolute w-1 h-1 bg-ethereum rounded-full animate-pulse-slow opacity-40" style={{ top: '30%', left: '70%', animationDelay: '3s' }}></div>
      </div>

      {/* Single Responsive Header */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/stellhydra-logo.svg" alt="StellHydra" className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xl font-bold gradient-text">StellHydra</span>
                <div className="hidden lg:block text-xs text-muted-foreground">Cross-Chain Bridge</div>
              </div>
            </div>

            {/* Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-white hover:text-stellar transition-colors text-sm font-medium">Bridge</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors text-sm">Portfolio</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors text-sm">Analytics</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors text-sm">Docs</a>
            </nav>

            <WalletConnection />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

      {/* Content Area */}
      <main className="flex-1 overflow-auto bg-background/50">
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-card border-t border-white/10 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Powered by Stellar & Ethereum</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Real-time routing data</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live API Connection</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}