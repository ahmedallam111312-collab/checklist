"use client";

import React, { useId } from "react";
import Image from "next/image";
import { BRAND } from "@/config/brand";

interface LogoProps {
  name?: string;
  logoPath?: string | null;
  size?: number; // size of the SVG mark
  showName?: boolean;
  nameClassName?: string;
  className?: string;
  hideNameBelow360?: boolean;
}

export function Logo({
  name = BRAND.name,
  logoPath,
  size = 36,
  showName = true,
  nameClassName = "text-xl font-semibold tracking-tight",
  className = "",
  hideNameBelow360 = false,
}: LogoProps) {
  const rawId = useId();
  const gradId = `pn-bg-${rawId.replace(/:/g, "")}`;

  if (logoPath) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Image
          src={logoPath}
          alt={name}
          width={size}
          height={size}
          className="object-contain"
        />
        {showName && (
          <span
            lang="en"
            dir="ltr"
            className={`font-sans ${nameClassName} ${
              hideNameBelow360 ? "hidden min-[360px]:inline" : ""
            }`}
          >
            {name}
          </span>
        )}
      </div>
    );
  }

  // Parse two-tone if CamelCase (e.g. Prof + Nurse)
  const camelMatch = name.match(/^([A-Z][a-z]+)([A-Z][a-z0-9]+)$/);
  const part1 = camelMatch ? camelMatch[1] : name;
  const part2 = camelMatch ? camelMatch[2] : null;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-hidden={showName ? "true" : undefined}
        aria-label={showName ? undefined : name}
        className="shrink-0 drop-shadow-sm select-none"
      >
        <title>{name}</title>
        <defs>
          <linearGradient
            id={gradId}
            x1="8"
            y1="4"
            x2="58"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#17446a" />
            <stop offset="1" stopColor="#07182a" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
        <rect
          x="0.75"
          y="0.75"
          width="62.5"
          height="62.5"
          rx="15.25"
          fill="none"
          stroke="#1f4466"
          strokeWidth="1.5"
        />
        <path
          d="M49 11v8M45 15h8"
          stroke="#b4c7d6"
          strokeOpacity="0.7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M8 34H19L24 20L31 46L37 26L41 34H56"
          fill="none"
          stroke="#00d2ff"
          strokeOpacity="0.22"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 34H19L24 20L31 46L37 26L41 34H56"
          fill="none"
          stroke="#00d2ff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="56" cy="34" r="3.2" fill="#7be7ff" />
      </svg>

      {showName && (
        <span
          lang="en"
          dir="ltr"
          className={`font-sans ${nameClassName} ${
            hideNameBelow360 ? "hidden min-[360px]:inline" : ""
          }`}
        >
          {part2 ? (
            <>
              <span className="text-[var(--color-text)]">{part1}</span>
              <span className="text-[var(--color-primary)]">{part2}</span>
            </>
          ) : (
            <span className="text-[var(--color-text)]">{name}</span>
          )}
        </span>
      )}
    </div>
  );
}
