import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="bg-[#0F172A] px-4 py-2 text-center text-xs text-white sm:text-sm">
      <span>Learn more about our latest innovations </span>
      <Link href="/demo" className="font-medium underline underline-offset-2 hover:text-[#93C5FD]">
        Read the blog here →
      </Link>
    </div>
  );
}
