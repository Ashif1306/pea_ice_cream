"use client";

/**
 * components/home/hero-dividers.tsx
 * 
 * Artisanal SVG bottom dividers for the Pea Ice Cream Hero Section.
 * Supports multiple selectable styles configurable from the admin dashboard:
 * - melting-wave (Gelombang Meleleh Lembut - default)
 * - ice-drips (Tetesan Lelehan Es Krim)
 * - cloud-puffs (Gumpalan Scoop Bulat)
 * - layered-swirl (Pusaran Ganda Bertingkat)
 * - zigzag-waffle (Gerigi Cone Waffle)
 * - smooth-curve (Lengkungan Mewah Minimalis)
 * - dripping-scallop (Kubah Kerang Retro)
 * - flat-clean (Garis Bersih Modern)
 */

import React from "react";
import { BottomDividerEffect } from "@/lib/banners-data";

interface HeroBottomDividerProps {
  effect?: BottomDividerEffect;
  color: string;
  className?: string;
}

export function HeroBottomDivider({ effect = "melting-wave", color, className = "" }: HeroBottomDividerProps) {
  if (effect === "flat-clean") {
    return (
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 pointer-events-none select-none border-b-2 border-white/30 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-20 pointer-events-none select-none ${className}`}
      style={{ marginBottom: "-1px" }}
      aria-hidden="true"
    >
      {effect === "melting-wave" && (
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(38px, 6vw, 75px)" }}
        >
          {/* Main melting wave */}
          <path
            d="M0,45 C180,45 240,15 360,15 C480,15 540,55 660,55 C780,55 840,20 960,20 C1080,20 1140,50 1260,50 C1380,50 1410,30 1440,35 L1440,90 L0,90 Z"
            fill={color}
          />
          {/* Secondary depth wave */}
          <path
            d="M0,60 C200,45 400,65 600,50 C800,35 1000,60 1200,48 C1350,42 1410,55 1440,55 L1440,90 L0,90 Z"
            fill={color}
            opacity="0.45"
          />
        </svg>
      )}

      {effect === "ice-drips" && (
        <svg
          viewBox="0 0 1440 110"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(46px, 7.5vw, 92px)" }}
        >
          {/* Main drip layer */}
          <path
            d="M0,35 Q40,35 60,65 Q70,85 85,85 Q100,85 110,65 Q130,35 180,35 Q230,35 250,75 Q265,102 285,102 Q305,102 320,75 Q340,35 410,35 Q470,35 490,60 Q500,78 515,78 Q530,78 540,60 Q560,35 630,35 Q690,35 710,80 Q725,105 745,105 Q765,105 780,80 Q800,35 870,35 Q930,35 950,70 Q960,88 975,88 Q990,88 1000,70 Q1020,35 1090,35 Q1150,35 1170,80 Q1185,104 1205,104 Q1225,104 1240,80 Q1260,35 1330,35 Q1385,35 1440,35 L1440,110 L0,110 Z"
            fill={color}
          />
          {/* Background gentle depth wave */}
          <path
            d="M0,52 Q120,40 240,50 Q360,60 480,48 Q600,38 720,52 Q840,62 960,46 Q1080,36 1200,50 Q1320,60 1440,48 L1440,110 L0,110 Z"
            fill={color}
            opacity="0.38"
          />
        </svg>
      )}

      {effect === "cloud-puffs" && (
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(38px, 6vw, 76px)" }}
        >
          <path
            d="M0,60 C40,22 100,22 140,60 C180,22 240,22 280,60 C320,22 380,22 420,60 C460,22 520,22 560,60 C600,22 660,22 700,60 C740,22 800,22 840,60 C880,22 940,22 980,60 C1020,22 1080,22 1120,60 C1160,22 1220,22 1260,60 C1300,22 1360,22 1400,60 C1420,42 1430,48 1440,55 L1440,90 L0,90 Z"
            fill={color}
          />
        </svg>
      )}

      {effect === "layered-swirl" && (
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(42px, 6.8vw, 86px)" }}
        >
          <path
            d="M0,35 C320,95 620,10 940,65 C1180,100 1340,30 1440,45 L1440,100 L0,100 Z"
            fill={color}
          />
          <path
            d="M0,60 C260,20 600,90 960,35 C1180,5 1360,65 1440,60 L1440,100 L0,100 Z"
            fill={color}
            opacity="0.45"
          />
        </svg>
      )}

      {effect === "zigzag-waffle" && (
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(30px, 4.8vw, 62px)" }}
        >
          <path
            d="M0,45 L45,18 L90,45 L135,18 L180,45 L225,18 L270,45 L315,18 L360,45 L405,18 L450,45 L495,18 L540,45 L585,18 L630,45 L675,18 L720,45 L765,18 L810,45 L855,18 L900,45 L945,18 L990,45 L1035,18 L1080,45 L1125,18 L1170,45 L1215,18 L1260,45 L1305,18 L1350,45 L1395,18 L1440,45 L1440,80 L0,80 Z"
            fill={color}
          />
        </svg>
      )}

      {effect === "smooth-curve" && (
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(34px, 5.2vw, 70px)" }}
        >
          <path
            d="M0,60 Q720,5 1440,60 L1440,80 L0,80 Z"
            fill={color}
          />
        </svg>
      )}

      {effect === "dripping-scallop" && (
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(32px, 5vw, 66px)" }}
        >
          <path
            d="M0,35 Q30,65 60,35 Q90,65 120,35 Q150,65 180,35 Q210,65 240,35 Q270,65 300,35 Q330,65 360,35 Q390,65 420,35 Q450,65 480,35 Q510,65 540,35 Q570,65 600,35 Q630,65 660,35 Q690,65 720,35 Q750,65 780,35 Q810,65 840,35 Q870,65 900,35 Q930,65 960,35 Q990,65 1020,35 Q1050,65 1080,35 Q1110,65 1140,35 Q1170,65 1200,35 Q1230,65 1260,35 Q1290,65 1320,35 Q1350,65 1380,35 Q1410,65 1440,35 L1440,80 L0,80 Z"
            fill={color}
          />
        </svg>
      )}
    </div>
  );
}

/**
 * Crisp mini vector thumbnail for admin selection cards
 */
export function DividerMiniPreview({
  effect,
  color = "#FF6B9D",
  fillColor = "#FFF6D6",
}: {
  effect: BottomDividerEffect;
  color?: string;
  fillColor?: string;
}) {
  return (
    <div
      className="w-full h-14 rounded-lg overflow-hidden relative flex flex-col justify-end shadow-inner"
      style={{ background: color }}
    >
      <div className="absolute top-1.5 left-2 text-[10px] font-bold text-white/80 font-nunito uppercase tracking-wider">
        Hero Section
      </div>
      
      {effect === "flat-clean" && (
        <div className="w-full h-3 bg-white/90 border-t border-white/60" />
      )}

      {effect === "melting-wave" && (
        <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="w-full h-7 block">
          <path d="M0,20 C40,20 60,6 90,6 C120,6 140,24 170,24 C200,24 220,8 250,8 C275,8 290,14 300,16 L300,40 L0,40 Z" fill={fillColor} />
          <path d="M0,28 C50,22 100,30 150,24 C200,18 250,28 300,24 L300,40 L0,40 Z" fill={fillColor} opacity="0.5" />
        </svg>
      )}

      {effect === "ice-drips" && (
        <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="w-full h-8 block">
          <path d="M0,12 Q15,12 25,24 Q30,32 35,32 Q40,32 45,24 Q55,12 75,12 Q95,12 105,28 Q112,38 120,38 Q128,38 135,28 Q145,12 170,12 Q185,12 195,26 Q200,34 206,34 Q212,34 218,26 Q228,12 255,12 Q270,12 280,30 Q286,38 292,38 Q296,38 300,30 L300,40 L0,40 Z" fill={fillColor} />
        </svg>
      )}

      {effect === "cloud-puffs" && (
        <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="w-full h-7 block">
          <path d="M0,24 C15,8 35,8 50,24 C65,8 85,8 100,24 C115,8 135,8 150,24 C165,8 185,8 200,24 C215,8 235,8 250,24 C265,8 285,8 300,24 L300,40 L0,40 Z" fill={fillColor} />
        </svg>
      )}

      {effect === "layered-swirl" && (
        <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="w-full h-7 block">
          <path d="M0,14 C70,38 140,4 210,24 C260,38 285,12 300,16 L300,40 L0,40 Z" fill={fillColor} />
          <path d="M0,24 C60,8 140,36 220,14 C270,2 290,26 300,24 L300,40 L0,40 Z" fill={fillColor} opacity="0.45" />
        </svg>
      )}

      {effect === "zigzag-waffle" && (
        <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="w-full h-6 block">
          <path d="M0,22 L15,8 L30,22 L45,8 L60,22 L75,8 L90,22 L105,8 L120,22 L135,8 L150,22 L165,8 L180,22 L195,8 L210,22 L225,8 L240,22 L255,8 L270,22 L285,8 L300,22 L300,40 L0,40 Z" fill={fillColor} />
        </svg>
      )}

      {effect === "smooth-curve" && (
        <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="w-full h-6 block">
          <path d="M0,26 Q150,4 300,26 L300,40 L0,40 Z" fill={fillColor} />
        </svg>
      )}

      {effect === "dripping-scallop" && (
        <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="w-full h-6 block">
          <path d="M0,14 Q15,28 30,14 Q45,28 60,14 Q75,28 90,14 Q105,28 120,14 Q135,28 150,14 Q165,28 180,14 Q195,28 210,14 Q225,28 240,14 Q255,28 270,14 Q285,28 300,14 L300,40 L0,40 Z" fill={fillColor} />
        </svg>
      )}
    </div>
  );
}
