import { useState } from "react";
import { Sidebar } from "./sidebar";
import { WalletConnection } from "@/components/wallet-connection";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Menu, X } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Start with sidebar collapsed on mobile by default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col lg:flex-row">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-2 h-2 bg-stellar rounded-full animate-ping opacity-60" style={{ top: '20%', left: '10%', animationDelay: '0s' }}></div>
        <div className="absolute w-1 h-1 bg-ethereum rounded-full animate-ping opacity-60" style={{ top: '60%', left: '80%', animationDelay: '2s' }}></div>
        <div className="absolute w-3 h-3 bg-stellar rounded-full animate-pulse-slow opacity-40" style={{ top: '80%', left: '20%', animationDelay: '1s' }}></div>
        <div className="absolute w-1 h-1 bg-ethereum rounded-full animate-pulse-slow opacity-40" style={{ top: '30%', left: '70%', animationDelay: '3s' }}></div>
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Mobile Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-stellar to-ethereum rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">StellHydra</span>
            </div>
            
            {/* Mobile Sidebar Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2"
            >
              {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarCollapsed(true)}>
          <div className="absolute left-0 top-0 h-full w-80 max-w-[80vw]" onClick={(e) => e.stopPropagation()}>
            <Sidebar 
              isCollapsed={false} 
              onToggle={() => setSidebarCollapsed(true)} 
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="glass-card border-b border-white/10 sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-stellar to-ethereum rounded-lg flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold gradient-text">StellHydra</span>
                  <div className="text-xs text-muted-foreground">Cross-Chain Bridge</div>
                </div>
              </div>

              {/* Navigation */}
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

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="glass-card border-t border-white/10 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Powered by Stellar & Ethereum</span>
              <span>•</span>
              <span>Real-time routing data</span>
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