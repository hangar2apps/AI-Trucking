import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#0B5FFF] text-white hover:bg-[#0847CC] shadow-sm disabled:opacity-50",
  secondary:
    "border border-[#0B5FFF] bg-white text-[#0B5FFF] hover:bg-[#E8F4FC] disabled:opacity-50",
  ghost: "text-[#0B5FFF] hover:bg-[#E8F4FC] disabled:opacity-50",
  danger:
    "bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-full",
  md: "px-5 py-2.5 text-sm rounded-full",
  lg: "px-8 py-3 text-sm rounded-full",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
