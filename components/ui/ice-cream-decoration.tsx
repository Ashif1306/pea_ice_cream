"use client";

/**
 * components/ui/ice-cream-decoration.tsx
 * Cheerful SVG ice-cream decorations.
 * Respects prefers-reduced-motion via CSS class.
 */

import React from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IceCreamVariant = "scoop" | "cone" | "popsicle";

export interface IceCreamDecorationProps {
  /** Which decoration to render */
  variant?: IceCreamVariant;
  /** Size in pixels (renders as a square SVG) */
  size?: number;
  /** Fill colour of the scoop / pop */
  color?: string;
  /** Fill colour of the cone / stick */
  accentColor?: string;
  /** Tailwind className overrides */
  className?: string;
  /** Additional animation class (ignored when prefers-reduced-motion) */
  animationClass?: string;
  /** aria-label for accessibility */
  ariaLabel?: string;
}

// ─── Scoop SVG ────────────────────────────────────────────────────────────────

function ScoopSVG({
  color = "#FF6B9D",
  accentColor = "#FFD700",
}: {
  color?: string;
  accentColor?: string;
}) {
  return (
    <>
      {/* Bowl / cup */}
      <ellipse cx="50" cy="68" rx="30" ry="10" fill={accentColor} opacity="0.7" />
      <path
        d="M20 68 Q25 92 50 92 Q75 92 80 68 Z"
        fill={accentColor}
        opacity="0.85"
      />
      {/* Main scoop */}
      <circle cx="50" cy="45" r="28" fill={color} />
      {/* Highlight */}
      <circle cx="40" cy="36" r="8" fill="white" opacity="0.25" />
      {/* Sprinkles */}
      <rect x="38" y="30" width="6" height="2.5" rx="1.25" fill="#fff" opacity="0.6" transform="rotate(-30 41 31)" />
      <rect x="52" y="38" width="6" height="2.5" rx="1.25" fill="#fff" opacity="0.6" transform="rotate(20 55 39)" />
      <rect x="44" y="50" width="6" height="2.5" rx="1.25" fill="#fff" opacity="0.5" transform="rotate(-10 47 51)" />
      {/* Cherry on top */}
      <circle cx="50" cy="17" r="6" fill="#e53e3e" />
      <path d="M50 17 Q55 10 58 6" stroke="#4CAF50" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  );
}

// ─── Cone SVG ─────────────────────────────────────────────────────────────────

function ConeSVG({
  color = "#FFB3D1",
  accentColor = "#D4A054",
}: {
  color?: string;
  accentColor?: string;
}) {
  return (
    <>
      {/* Cone */}
      <path
        d="M28 60 L50 95 L72 60 Z"
        fill={accentColor}
      />
      {/* Cone cross-hatch */}
      <line x1="35" y1="60" x2="47" y2="92" stroke="#b8863e" strokeWidth="1.5" opacity="0.5" />
      <line x1="43" y1="60" x2="51" y2="93" stroke="#b8863e" strokeWidth="1.5" opacity="0.5" />
      <line x1="57" y1="60" x2="53" y2="93" stroke="#b8863e" strokeWidth="1.5" opacity="0.5" />
      <line x1="30" y1="68" x2="70" y2="68" stroke="#b8863e" strokeWidth="1.5" opacity="0.4" />
      <line x1="32" y1="76" x2="68" y2="76" stroke="#b8863e" strokeWidth="1.5" opacity="0.3" />
      {/* Two scoops */}
      <circle cx="38" cy="46" r="20" fill="#FF6B9D" />
      <circle cx="62" cy="46" r="20" fill={color} />
      {/* Top scoop */}
      <circle cx="50" cy="28" r="20" fill="#FFD700" opacity="0.9" />
      {/* Highlights */}
      <circle cx="44" cy="22" r="6" fill="white" opacity="0.2" />
      <circle cx="34" cy="40" r="5" fill="white" opacity="0.2" />
    </>
  );
}

// ─── Popsicle SVG ────────────────────────────────────────────────────────────

function PopsicleSVG({
  color = "#4CAF50",
  accentColor = "#D4A054",
}: {
  color?: string;
  accentColor?: string;
}) {
  return (
    <>
      {/* Stick */}
      <rect x="44" y="70" width="12" height="28" rx="4" fill={accentColor} />
      {/* Body */}
      <rect x="22" y="15" width="56" height="62" rx="20" fill={color} />
      {/* Bite mark */}
      <circle cx="78" cy="22" r="12" fill="#fff9fb" />
      {/* Stripe */}
      <rect x="22" y="38" width="56" height="12" rx="0" fill="white" opacity="0.2" />
      {/* Highlight */}
      <ellipse cx="36" cy="26" rx="8" ry="12" fill="white" opacity="0.15" />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function IceCreamDecoration({
  variant = "scoop",
  size = 80,
  color,
  accentColor,
  className,
  animationClass,
  ariaLabel,
}: IceCreamDecorationProps) {
  const defaultColors: Record<IceCreamVariant, { color: string; accentColor: string }> = {
    scoop:     { color: "#FF6B9D", accentColor: "#FFD700" },
    cone:      { color: "#FFB3D1", accentColor: "#D4A054" },
    popsicle:  { color: "#4CAF50", accentColor: "#D4A054" },
  };

  const resolvedColor = color ?? defaultColors[variant].color;
  const resolvedAccent = accentColor ?? defaultColors[variant].accentColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel ?? "dekorasi es krim"}
      role="img"
      className={cn(
        "select-none",
        // animationClass is CSS-class based so prefers-reduced-motion
        // (via tailwind plugin) will collapse it automatically
        animationClass,
        className
      )}
    >
      {variant === "scoop" && (
        <ScoopSVG color={resolvedColor} accentColor={resolvedAccent} />
      )}
      {variant === "cone" && (
        <ConeSVG color={resolvedColor} accentColor={resolvedAccent} />
      )}
      {variant === "popsicle" && (
        <PopsicleSVG color={resolvedColor} accentColor={resolvedAccent} />
      )}
    </svg>
  );
}
