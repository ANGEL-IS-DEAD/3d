"use client";

// The nav wordmark. Text is read from `brand.wordmark` in site.config.ts.
//
// To use an image logo instead, swap the inner <span> for a Next <Image>:
//
//   import Image from "next/image";
//   <Image src="/logo.svg" alt={brand.name} width={120} height={28} priority />
//
import Link from "next/link";
import { brand } from "@/site.config";

interface LogoProps {
  size?: "md" | "lg";
}

const sizes = {
  md: { fontSize: "1.45rem" },
  lg: { fontSize: "2.6rem" },
};

export default function LogoPlaceholder({ size = "md" }: LogoProps) {
  const s = sizes[size];

  return (
    <Link href="/" className="block no-underline" aria-label={`${brand.name} — home`}>
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 400,
          fontSize: s.fontSize,
          fontStyle: "italic",
          letterSpacing: "0.01em",
          color: "#ffffff",
          lineHeight: 1,
          display: "block",
        }}
      >
        {brand.wordmark}
      </span>
    </Link>
  );
}
