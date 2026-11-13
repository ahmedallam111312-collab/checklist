"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Activity, Heart } from "lucide-react";
import { BRAND } from "@/config/brand";

interface HeroScrollSceneProps {
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroCta?: string;
  tagline?: string;
  siteName?: string;
  procedureCount?: number | null;
}

export function HeroScrollScene({
  heroEyebrow = BRAND.heroEyebrow,
  heroTitle = BRAND.heroTitle,
  heroDescription = BRAND.heroDescription,
  heroCta = BRAND.heroCta,
  tagline = BRAND.tagline,
  siteName = BRAND.name,
  procedureCount = null,
}: HeroScrollSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinWrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const waveformPathRef = useRef<SVGPathElement>(null);
  const chipHRRef = useRef<HTMLDivElement>(null);
  const chipSpO2Ref = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLAnchorElement>(null);

  const [hrVal, setHrVal] = useState<number>(72);
  const [spo2Val, setSpo2Val] = useState<number>(98);

  useEffect(() => {
    let ctx: any = null;
    let observer: IntersectionObserver | null = null;
    let visibilityHandler: (() => void) | null = null;

    async function initMotion() {
      if (typeof window === "undefined") return;

      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get("mode");
      const scrollPercentParam = urlParams.get("scroll_percent");

      const prefersReduced =
        modeParam === "reduced-motion" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const nav = navigator as any;
      const isLowTier =
        modeParam === "lite" ||
        window.innerWidth < 300 ||
        (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
        (nav.deviceMemory && nav.deviceMemory <= 4) ||
        (nav.connection && nav.connection.saveData);

      // Keep identical end-state DOM for reduced-motion or lite mode
      if ((prefersReduced || isLowTier) && scrollPercentParam === null) {
        return;
      }

      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      (window as any).ScrollTrigger = ScrollTrigger;
      (window as any).gsap = gsap;

      const isRTL =
        document.documentElement.dir === "rtl" ||
        document.documentElement.getAttribute("dir") === "rtl";
      const rotateYDir = isRTL ? 1 : -1;

      const path = waveformPathRef.current;
      const pathLength = path ? path.getTotalLength() : 600;

      if (path) {
        path.style.strokeDasharray = `${pathLength}`;
        path.style.strokeDashoffset = `${pathLength}`;
      }

      ctx = gsap.context(() => {
        const isMobile = window.innerWidth < 1024;
        const pinDistance = isMobile ? "90%" : "100%";

        const tl = gsap.timeline(
          scrollPercentParam === null
            ? {
                scrollTrigger: {
                  trigger: pinWrapperRef.current,
                  start: "top top",
                  end: `+=${pinDistance}`,
                  pin: true,
                  scrub: 0.6,
                  invalidateOnRefresh: true,
                  onUpdate: (self) => {
                    const p = self.progress;
                    setHrVal(Math.round(60 + p * 12));
                    setSpo2Val(Math.round(92 + p * 6));
                  },
                },
              }
            : { paused: true }
        );

        // 1. Stage 3D rotation and scale (Progress 0 to 1)
        tl.fromTo(
          stageRef.current,
          {
            rotateY: rotateYDir * 30,
            rotateX: 14,
            translateZ: -120,
            scale: 0.9,
          },
          {
            rotateY: 0,
            rotateX: 0,
            translateZ: 0,
            scale: 1.0,
            ease: "none",
          },
          0
        );

        // 2. Rose Glow intensity
        tl.fromTo(
          glowRef.current,
          { opacity: 0.25 },
          { opacity: 0.85, ease: "none" },
          0
        );

        // 3. Waveform stroke draws between progress 0.2 and 0.8
        if (path) {
          tl.fromTo(
            path,
            { strokeDashoffset: pathLength },
            { strokeDashoffset: 0, ease: "power1.inOut" },
            0.2
          );
        }

        // 4. Parallax drift for floating readout chips
        tl.fromTo(
          chipHRRef.current,
          { x: rotateYDir * -16, y: -8 },
          { x: 0, y: 0, ease: "none" },
          0
        );

        tl.fromTo(
          chipSpO2Ref.current,
          { x: rotateYDir * 16, y: 8 },
          { x: 0, y: 0, ease: "none" },
          0
        );

        // 5. CTA stays visible from initial SSR render (opacity always 1)
        if (ctaBtnRef.current) {
          tl.fromTo(
            ctaBtnRef.current,
            { y: 2 },
            { y: 0, ease: "none" },
            0.8
          );
        }

        if (scrollPercentParam !== null) {
          const targetProgress =
            Math.max(0, Math.min(100, parseFloat(scrollPercentParam))) / 100;
          tl.progress(targetProgress);
          tl.pause();
          setHrVal(Math.round(60 + targetProgress * 12));
          setSpo2Val(Math.round(92 + targetProgress * 6));
          if (path) {
            const waveP = Math.max(0, Math.min(1, (targetProgress - 0.2) / 0.6));
            path.style.strokeDashoffset = `${pathLength * (1 - waveP)}`;
          }
        }
      }, containerRef);

      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) {
          ScrollTrigger.getAll().forEach((t) => t.disable(false));
        } else {
          ScrollTrigger.getAll().forEach((t) => t.enable());
        }
      });

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      visibilityHandler = () => {
        if (document.visibilityState === "hidden") {
          ScrollTrigger.getAll().forEach((t) => t.disable(false));
        } else {
          ScrollTrigger.getAll().forEach((t) => t.enable());
        }
      };
      document.addEventListener("visibilitychange", visibilityHandler);
    }

    initMotion();

    return () => {
      if (ctx) ctx.revert();
      if (observer) observer.disconnect();
      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
      }
    };
  }, []);

  const hasCount = typeof procedureCount === "number";

  return (
    <div
      ref={containerRef}
      className="bg-grad-hero surface-navy relative w-full overflow-hidden border-b-[3px] border-rose text-white"
      data-testid="hero-scroll-container"
    >
      <div ref={pinWrapperRef} className="w-full">
        <section className="mx-auto max-w-[70rem] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Hero Text Column (Always opaque in SSR HTML) */}
            <div className="lg:col-span-6 text-start space-y-5">
              <div className="flex flex-col items-start gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose/30 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-light backdrop-blur-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-light animate-pulse" aria-hidden="true" />
                  <span>Cairo University • Faculty of Nursing</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted-navy">
                  {heroEyebrow}
                </p>
              </div>

              <h1 className="type-display font-bold text-white leading-tight">
                {heroTitle.includes(siteName) ? (
                  <>
                    {heroTitle.split(siteName)[0]}
                    <span className="inline-block text-rose-light">
                      {siteName}
                    </span>
                    {heroTitle.split(siteName)[1]}
                  </>
                ) : (
                  heroTitle
                )}
              </h1>

              <p className="type-body max-w-xl leading-relaxed text-text-muted-navy">
                {heroDescription}
              </p>

              {/* Tagline in rose-light */}
              <p className="text-sm font-semibold tracking-wide text-rose-light">
                {tagline}
              </p>

              {/* Primary Rose CTA */}
              <div className="pt-2">
                <Link
                  ref={ctaBtnRef}
                  href="/procedures"
                  data-testid="hero-explore-cta"
                  className="btn-rose-cta squircle-pill type-button inline-flex min-h-[52px] items-center justify-center gap-3 px-8 text-base font-bold text-navy"
                >
                  <span>{heroCta}</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>

              {/* Institutional Department Notice & CC Rights */}
              <div className="mt-8 border-t border-rose/30 pt-4 text-xs">
                <p className="font-semibold text-white">
                  Department of Critical Care and Emergency Nursing
                </p>
                <p className="mt-0.5 text-text-muted-navy">
                  Faculty of Nursing, Cairo University • Licensed under CC BY-NC-ND 4.0
                </p>
              </div>
            </div>

            {/* 3D ECG Monitor Column (~55% of column at 1280px, vertically centered) */}
            <div
              className="lg:col-span-6 flex items-center justify-center py-4"
              style={{ perspective: "1000px" }}
              aria-hidden="true"
            >
              <div
                ref={stageRef}
                className="relative w-full max-w-[340px] sm:max-w-[370px] lg:w-[55%] lg:min-w-[290px] lg:max-w-[350px] aspect-[4/3] select-none"
                style={{
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                }}
                data-testid="hero-3d-stage"
              >
                {/* Layer 1: Soft Rose Radial Glow */}
                <div
                  ref={glowRef}
                  className="pointer-events-none absolute inset-0 -m-8 rounded-full bg-rose/25 blur-3xl transition-opacity duration-300"
                  style={{ transform: "translateZ(-40px)" }}
                />

                {/* Layer 2: Navy/Plum Glass Monitor Housing */}
                <div
                  className="card-navy-rose squircle-card absolute inset-0 flex flex-col overflow-hidden border border-rose/45 p-3.5 shadow-card-soft"
                  style={{ transform: "translateZ(0px)" }}
                >
                  {/* Top Bezel Status Bar */}
                  <div className="flex items-center justify-between border-b border-rose/35 px-1.5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-rose animate-ping" />
                      <span className="font-latin text-xs font-bold uppercase tracking-wider text-rose-light">
                        LEAD II
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-latin text-[11px] font-medium text-rose-light">
                      <Activity className="h-3.5 w-3.5 text-rose-light" />
                      <span>25mm/s</span>
                    </div>
                  </div>

                  {/* Layer 3: Navy/Plum Monitor Glass Screen */}
                  <div
                    className="relative mt-2.5 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-rose/30 bg-logo-navy/90"
                    style={{
                      transform: "translateZ(20px)",
                      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(200, 116, 117, 0.14) 0%, transparent 78%),
                                        linear-gradient(to right, rgba(234, 178, 179, 0.1) 1px, transparent 1px),
                                        linear-gradient(to bottom, rgba(234, 178, 179, 0.1) 1px, transparent 1px)`,
                      backgroundSize: "100% 100%, 20px 20px, 20px 20px",
                    }}
                  >
                    {/* Subtle ECG Grid Watermark */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
                      <Heart className="h-16 w-16 text-rose-light" />
                    </div>

                    {/* Layer 4: Rose ECG Waveform Path */}
                    <svg
                      viewBox="0 0 400 120"
                      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                      style={{ transform: "translateZ(40px)" }}
                    >
                      <defs>
                        <filter
                          id="ecg-glow"
                          x="-20%"
                          y="-20%"
                          width="140%"
                          height="140%"
                        >
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <path
                        d="M0 60 H70 L85 25 L105 95 L125 45 L138 68 L150 60 H230 L245 25 L265 95 L285 45 L298 68 L310 60 H400"
                        fill="none"
                        stroke="var(--color-rose)"
                        strokeOpacity="0.22"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        ref={waveformPathRef}
                        data-testid="hero-ecg-path"
                        d="M0 60 H70 L85 25 L105 95 L125 45 L138 68 L150 60 H230 L245 25 L265 95 L285 45 L298 68 L310 60 H400"
                        fill="none"
                        stroke="var(--color-rose)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#ecg-glow)"
                      />

                      <circle cx="310" cy="60" r="4" fill="var(--color-rose-light)" />
                    </svg>

                    {/* Layer 5: Floating Vitals Readout Chips */}
                    <div
                      ref={chipHRRef}
                      className="absolute right-3 top-3 flex items-center gap-2 rounded-xl border border-rose/45 bg-navy/90 px-3 py-1.5 shadow-lg backdrop-blur-sm"
                      style={{ transform: "translateZ(70px)" }}
                    >
                      <Heart className="h-4 w-4 text-rose-light animate-pulse" />
                      <div className="flex flex-col text-right font-latin">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-light">
                          HR
                        </span>
                        <span className="text-base font-bold leading-none text-white tabular-nums">
                          {hrVal}
                        </span>
                      </div>
                    </div>

                    <div
                      ref={chipSpO2Ref}
                      className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-rose/45 bg-navy/90 px-3 py-1.5 shadow-lg backdrop-blur-sm"
                      style={{ transform: "translateZ(70px)" }}
                    >
                      <Activity className="h-3.5 w-3.5 text-rose-light" />
                      <div className="flex flex-col text-left font-latin">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-light">
                          SpO2
                        </span>
                        <span className="text-base font-bold leading-none text-white tabular-nums">
                          {spo2Val}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
