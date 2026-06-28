import { AuthGuard } from "@/components/auth/AuthGuard";
import { OperationsGuard } from "@/components/auth/OperationsGuard";
import { AppSidebar } from "@/components/dashboard/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OperationsGuard>
        <div className="flex h-[100dvh] bg-[#F3F4F6]">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          </div>
        </div>
      </OperationsGuard>
    </AuthGuard>
  );
}
