import { MainLayout } from "@/components/layout/main-layout";
import { CoreBridgeInterface } from "@/components/core-bridge-interface";

export default function Bridge() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <CoreBridgeInterface />
      </div>
    </MainLayout>
  );
}
