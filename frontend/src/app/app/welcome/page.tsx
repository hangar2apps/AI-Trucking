"use client";

import Link from "next/link";
import { Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { MARKET_SURVEY_URL, PRODUCT_NAME } from "@/lib/brand";
import { useAuthStore } from "@/stores/auth-store";

export default function WelcomePendingPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <>
      <PageHeader
        title="Account created"
        description="Your workspace is ready — fleet operations will appear here once provisioned."
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <Card className="mx-auto max-w-2xl">
          <CardBody className="space-y-6 p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F4FC]">
              <Clock className="h-6 w-6 text-[#0B5FFF]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A2B4A]">
                Operations not available yet
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                Hi {user?.name ?? "there"} — your {PRODUCT_NAME} account is active. Live fleet
                data (loads, map, trucks) comes from the operations API and is shared across
                provisioned pilot accounts — not from your signup form alone.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                New sign-ups land here until we flip{" "}
                <code className="rounded bg-[#F3F4F6] px-1">operations_available</code> on your
                profile. If you were invited before launch, sign out and sign back in — or ask us
                to enable your account.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-[#4B5563]">
              <li className="flex gap-2">
                <span className="font-medium text-[#1A2B4A]">Dashboard & analytics</span>
                <span>— available after operations go live</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-[#1A2B4A]">Intelligence & live map</span>
                <span>— routes, weather, and fleet map when provisioned</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-[#1A2B4A]">AI Assistant</span>
                <span>— customer email drafts tied to your loads</span>
              </li>
            </ul>
            <div className="flex flex-col gap-3 border-t border-[#E5E7EB] pt-6 sm:flex-row">
              <Link href={MARKET_SURVEY_URL} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="secondary" className="w-full gap-2">
                  <Mail className="h-4 w-4" />
                  Contact us
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Back to home
                </Button>
              </Link>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => void logout().then(() => window.location.assign("/login"))}
              >
                Sign out
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
