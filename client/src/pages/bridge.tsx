import { MainLayout } from "@/components/layout/main-layout";
import { BridgeInterface } from "@/components/bridge-interface";
import { AccountBalances } from "@/components/account-balances";

export default function Bridge() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Bridge Interface - Now on the right side */}
        <BridgeInterface />
        
        {/* Account Balances */}
        <AccountBalances />
      </div>
    </MainLayout>
  );
}
