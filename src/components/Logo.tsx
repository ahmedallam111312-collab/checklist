import React from "react";
import Image from "next/image";
import { BRAND } from "@/config/brand";

export type LogoVariant =
  | "chip"
  | "reversed"
  | "light"
  | "mark"
  | "mark-reversed";

const VARIANT_ASSETS: Record<
  LogoVariant,
  { src: string; width: number; height: number }
> = {
  chip: {
    src: "/brand/critical-ease-logo-chip.png",
    width: 1003,
    height: 548,
  },
  reversed: {
    src: "/brand/critical-ease-logo-reversed.png",
    width: 929,
    height: 474,
  },
  light: {
    src: "/brand/critical-ease-logo.png",
    width: 929,
    height: 474,
  },
  mark: {
    src: "/brand/critical-ease-mark.png",
    width: 434,
    height: 374,
  },
  "mark-reversed": {
    src: "/brand/critical-ease-mark-reversed.png",
    width: 434,
    height: 374,
  },
};

interface LogoProps {
  variant?: LogoVariant;
  name?: string;
  logoPath?: string | null;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export function Logo({
  variant = "light",
  name = BRAND.name,
  logoPath,
  width,
  height,
  priority = false,
  className = "",
  sizes,
}: LogoProps) {
  const asset = VARIANT_ASSETS[variant];
  const src = logoPath || asset.src;
  const resolvedWidth = width ?? asset.width;
  const resolvedHeight = height ?? asset.height;

  return (
    <Image
      src={src}
      alt={name}
      width={resolvedWidth}
      height={resolvedHeight}
      priority={priority}
      sizes={sizes}
      className={`object-contain select-none ${className}`}
    />
  );
}
