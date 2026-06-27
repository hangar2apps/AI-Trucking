import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";

export function Header() {
  return (
    <header className="border-b border-[#E5E7EB] bg-white px-6 py-4">
      <Link href="/survey/1" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B5FFF] text-sm font-bold text-white">
          a
        </div>
        <span className="text-xl font-semibold tracking-tight text-[#1A2B4A]">
          {PRODUCT_NAME}
        </span>
      </Link>
    </header>
  );
}
