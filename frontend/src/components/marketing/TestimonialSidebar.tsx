"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { testimonials } from "@/lib/brand";
import { cn } from "@/lib/utils";

function TestimonialCard({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const t = testimonials[index];

  return (
    <div className={cn("flex flex-col justify-between", className)}>
      <div>
        <Quote className="mb-4 h-8 w-8 text-[#0B5FFF]/40" />
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B5FFF]/15 text-sm font-semibold text-[#0B5FFF]">
          {t.avatar}
        </div>
        <blockquote className="font-serif text-base leading-relaxed text-[#1A2B4A] sm:text-lg">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <p className="mt-5 text-xs font-bold tracking-wide text-[#1A2B4A] uppercase">
          {t.name}
        </p>
        <p className="text-xs text-[#6B7280]">{t.title}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0B5FFF]/30 text-[#0B5FFF] hover:bg-white"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B5FFF] text-white hover:bg-[#0847CC]"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function TestimonialSidebar() {
  return (
    <aside className="hidden w-[min(100%,22rem)] shrink-0 bg-[#E8F4FC] p-6 lg:block xl:w-[26rem] xl:p-10">
      <TestimonialCard />
    </aside>
  );
}

export function TestimonialMobile() {
  return (
    <div className="border-t border-[#E5E7EB] bg-[#E8F4FC] p-6 lg:hidden">
      <TestimonialCard />
    </div>
  );
}
