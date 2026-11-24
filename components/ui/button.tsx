"use client";

/**
 * components/ui/button.tsx
 * Reusable button component for Pea Ice Cream.
 * Always rounded-full (oval). Mobile-first, ceria, accessible.
 */

import React from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    // Pink gradient background
    "bg-gradient-to-r from-brand-pink to-brand-pink-light",
    "text-white font-semibold",
    "shadow-pink-sm hover:shadow-pink-md active:shadow-pink-sm",
    "hover:from-[#e55a8b] hover:to-brand-pink",
    "active:scale-[0.97]",
    "disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none",
    "transition-all duration-200",
  ].join(" "),

  secondary: [
    "bg-white border-2 border-brand-pink",
    "text-brand-pink font-semibold",
    "hover:bg-pink-50 active:bg-pink-100",
    "active:scale-[0.97]",
    "disabled:border-gray-200 disabled:text-gray-400",
    "transition-all duration-200",
  ].join(" "),

  ghost: [
    "bg-transparent",
    "text-brand-dark-blue font-medium",
    "hover:bg-pink-50 active:bg-pink-100",
    "active:scale-[0.97]",
    "disabled:text-gray-400",
    "transition-all duration-200",
  ].join(" "),

  danger: [
    "bg-gradient-to-r from-red-500 to-rose-400",
    "text-white font-semibold",
    "shadow-sm hover:shadow-md",
    "hover:from-red-600 hover:to-rose-500",
    "active:scale-[0.97]",
    "disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none",
    "transition-all duration-200",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-sm gap-1.5",
  md: "h-11 px-6 text-base gap-2",
  lg: "h-13 px-8 text-lg gap-2.5",
};

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center",
          "rounded-full", // Always oval
          "select-none whitespace-nowrap",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          // Variant + size
          variantStyles[variant],
          sizeStyles[size],
          // Full width
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {/* Left icon or spinner */}
        {loading ? (
          <Spinner
            className={cn(
              size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
            )}
          />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}

        {/* Label */}
        {children && (
          <span className={cn(loading && "opacity-80")}>{children}</span>
        )}

        {/* Right icon */}
        {!loading && rightIcon ? (
          <span className="flex-shrink-0">{rightIcon}</span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = "Button";
