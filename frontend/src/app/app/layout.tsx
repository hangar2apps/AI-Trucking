import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppHeader, AppSidebar } from "@/components/dashboard/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-[100dvh] bg-[#F3F4F6]">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
