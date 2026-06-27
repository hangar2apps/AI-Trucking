import Link from "next/link";
import { PRODUCT_NAME, TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  inverted?: boolean;
}

const sizes = {
  sm: { box: "h-8 w-8 text-[10px] rounded-md", title: "text-base", tag: "text-[10px]" },
  md: { box: "h-9 w-9 text-xs rounded-lg", title: "text-lg", tag: "text-[10px]" },
  lg: { box: "h-11 w-11 text-sm rounded-xl", title: "text-xl", tag: "text-xs" },
};

export function Logo({
  href = "/survey/1",
  size = "md",
  showTagline = false,
  className,
  inverted = false,
}: LogoProps) {
  const s = sizes[size];
  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-[#0B5FFF] font-bold text-white shadow-sm",
          s.box
        )}
      >
        AT
      </div>
      <div className="min-w-0">
        <span
          className={cn(
            "block truncate font-semibold tracking-tight",
            s.title,
            inverted ? "text-white" : "text-[#1A2B4A]"
          )}
        >
          {PRODUCT_NAME}
        </span>
        {showTagline && (
          <span
            className={cn(
              "block truncate font-normal",
              s.tag,
              inverted ? "text-white/70" : "text-[#6B7280]"
            )}
          >
            {TAGLINE}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }
  return content;
}
