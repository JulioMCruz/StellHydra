import { MainLayout } from "@/components/layout/main-layout";
import { BridgeInterface } from "@/components/bridge-interface";
import { AccountBalances } from "@/components/account-balances";

export default function Bridge() {
  return (
    <MainLayout>
      <div className="flex justify-center items-start min-h-full p-4 lg:p-6">
        <div className="w-full max-w-md lg:max-w-lg space-y-6">
          {/* Bridge Interface - Compact centered design */}
          <BridgeInterface />
        </div>
      </div>
    </MainLayout>
  );
}
