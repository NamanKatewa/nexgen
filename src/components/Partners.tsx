"use client";

import { forwardRef, memo, useRef } from "react";
import { cn } from "~/lib/utils";
import { AnimatedBeam } from "~/components/magicui/animated-beam";
import { HyperText } from "~/components/magicui/hyper-text";
import Image from "next/image";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex items-center justify-center rounded-full bg-blue-50 p-1 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105",
        className
      )}
      style={{ width: "100px", height: "100px" }}
    >
      {children}
    </div>
  );
});
Circle.displayName = "Circle";

const Partners = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Declare refs individually to follow React rules of hooks
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);
  const ref4 = useRef<HTMLDivElement>(null);
  const ref5 = useRef<HTMLDivElement>(null);
  const ref6 = useRef<HTMLDivElement>(null);
  const ref7 = useRef<HTMLDivElement>(null);

  const images = [
    { src: "/partners/delhivery.png", alt: "delhivery", ref: ref1 },
    {
      src: "/partners/shadowfax.png",
      alt: "shadowfax",
      ref: ref2,
      invert: true,
    },
    { src: "/partners/ekart.png", alt: "ekart", ref: ref3 },
    { src: "/logo.png", alt: "logo", ref: ref4, border: true },
    { src: "/partners/ecomexpress.png", alt: "ecomexpress", ref: ref5 },
    { src: "/partners/xpressbees.png", alt: "xpressbees", ref: ref6 },
    { src: "/partners/amazon-shipping.png", alt: "amazon-shipping", ref: ref7 },
  ];

  const beams = [
    { from: ref1, to: ref4, curvature: -60, endYOffset: -8 },
    { from: ref2, to: ref4, curvature: -60, endYOffset: -8 },
    { from: ref3, to: ref4, curvature: 60, endYOffset: 8 },
    { from: ref5, to: ref4, curvature: -60, endYOffset: -8, reverse: true },
    { from: ref6, to: ref4, curvature: -60, endYOffset: -8, reverse: true },
    { from: ref7, to: ref4, curvature: 60, endYOffset: 8, reverse: true },
  ];

  return (
    <section className="my-20 flex flex-col items-center">
      <HyperText className="text-center text-2xl font-bold tracking-tight drop-shadow-sm text-blue-950">
        Our Trusted Partners
      </HyperText>

      <div
        ref={containerRef}
        className="relative mx-auto flex h-[500px] w-full max-w-4xl items-center justify-center overflow-hidden rounded-3xl p-8"
      >
        <div className="flex size-full max-h-[300px] flex-col items-stretch justify-between gap-10">
          {/* Left row */}
          <div className="flex flex-row items-center justify-between">
            <Circle ref={ref1}>
              <Image
                src={images[0]!.src}
                alt={images[0]!.alt}
                width={80}
                height={80}
                className="rounded-full object-contain p-1"
                loading="lazy"
              />
            </Circle>
            <Circle ref={ref5}>
              <Image
                src={images[4]!.src}
                alt={images[4]!.alt}
                width={80}
                height={80}
                className="rounded-full object-contain p-1"
                loading="lazy"
              />
            </Circle>
          </div>

          {/* Middle row */}
          <div className="flex flex-row items-center justify-between">
            <Circle ref={ref2}>
              <Image
                src={images[1]!.src}
                alt={images[1]!.alt}
                width={80}
                height={80}
                className="rounded-full object-contain p-1 invert"
                loading="lazy"
              />
            </Circle>
            <Circle ref={ref4} className="border-2 border-primary/20">
              <Image
                src={images[3]!.src}
                alt={images[3]!.alt}
                width={90}
                height={90}
                className="rounded-full object-contain p-1"
                priority
              />
            </Circle>
            <Circle ref={ref6}>
              <Image
                src={images[5]!.src}
                alt={images[5]!.alt}
                width={80}
                height={80}
                className="rounded-full object-contain p-1"
                loading="lazy"
              />
            </Circle>
          </div>

          {/* Right row */}
          <div className="flex flex-row items-center justify-between">
            <Circle ref={ref3}>
              <Image
                src={images[2]!.src}
                alt={images[2]!.alt}
                width={80}
                height={80}
                className="rounded-full object-contain p-1"
                loading="lazy"
              />
            </Circle>
            <Circle ref={ref7}>
              <Image
                src={images[6]!.src}
                alt={images[6]!.alt}
                width={80}
                height={80}
                className="rounded-full object-contain p-1"
                loading="lazy"
              />
            </Circle>
          </div>
        </div>

        {/* Render Beams */}
        {beams.map((beam, idx) => (
          <AnimatedBeam
            key={idx}
            containerRef={containerRef}
            fromRef={beam.from}
            toRef={beam.to}
            curvature={beam.curvature}
            endYOffset={beam.endYOffset}
            reverse={beam.reverse}
            pathWidth={4}
          />
        ))}
      </div>
    </section>
  );
});
Partners.displayName = "Partners";

export default Partners;
