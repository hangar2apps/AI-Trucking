"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { testimonials } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function TestimonialSidebar() {
  const [index, setIndex] = useState(0);
  const t = testimonials[index];

  return (
    <aside className="hidden w-[340px] shrink-0 flex-col justify-between bg-[#E8F4FC] p-8 lg:flex xl:w-[400px]">
      <div>
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#0B5FFF]/20 text-lg font-semibold text-[#0B5FFF]">
          {t.avatar}
        </div>
        <blockquote className="font-serif text-lg leading-relaxed text-[#1A2B4A]">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <p className="mt-6 text-xs font-bold tracking-wide text-[#1A2B4A] uppercase">
          {t.name}, {t.title}
        </p>
      </div>
      <div className="flex justify-end gap-2">
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
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-[#0B5FFF] text-white hover:bg-[#0847CC]"
          )}
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
