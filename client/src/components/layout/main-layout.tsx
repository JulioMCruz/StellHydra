import { useState } from "react";
import { CoreSidebar } from "./core-sidebar";
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
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">


      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Mobile Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">StellHydra</span>
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
        <CoreSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarCollapsed(true)}>
          <div className="absolute left-0 top-0 h-full w-80 max-w-[80vw]" onClick={(e) => e.stopPropagation()}>
            <CoreSidebar 
              isCollapsed={false} 
              onToggle={() => setSidebarCollapsed(true)} 
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">StellHydra</span>
                  <div className="text-xs text-gray-500">Cross-Chain Bridge</div>
                </div>
              </div>

              <WalletConnection />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="hidden lg:block bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
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