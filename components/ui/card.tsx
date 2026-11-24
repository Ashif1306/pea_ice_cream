"use client";

/**
 * components/ui/card.tsx
 * Flexible card container for Pea Ice Cream.
 * Variants: default, elevated, flat.
 */

import React from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardVariant = "default" | "elevated" | "flat";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Add a hover lift effect */
  hoverable?: boolean;
  /** Make the card interactive (adds cursor-pointer) */
  interactive?: boolean;
  /** Remove internal padding */
  noPadding?: boolean;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<CardVariant, string> = {
  default: [
    "bg-white/90",
    "border border-pink-100",
    "shadow-sm",
  ].join(" "),

  elevated: [
    "bg-white",
    "border border-pink-100/50",
    "shadow-pink-sm",
  ].join(" "),

  flat: [
    "bg-pink-50/60",
    "border border-pink-100",
    "shadow-none",
  ].join(" "),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 pt-5 pb-3 font-fredoka text-brand-dark-blue", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 pt-3 pb-5 border-t border-pink-50 flex items-center gap-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  function Card(
    {
      variant = "default",
      hoverable = false,
      interactive = false,
      noPadding = false,
      className,
      children,
      ...props
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          // Base
          "rounded-2xl overflow-hidden",
          "transition-all duration-200",
          // Variant
          variantStyles[variant],
          // Optional padding (when no sub-components are used)
          !noPadding && "p-5",
          // Hover lift
          hoverable &&
            "hover:-translate-y-1 hover:shadow-pink-md active:translate-y-0 active:shadow-pink-sm",
          // Interactive
          interactive && "cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
