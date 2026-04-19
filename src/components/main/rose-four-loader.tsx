"use client";

import { useEffect, useState } from "react";

const RoseFourLoader = () => {
  const particleCount = 78;
  const trailSpan = 0.32;
  const durationMs = 5400;
  const rotationDurationMs = 28000;
  const pulseDurationMs = 4500;
  const strokeWidth = 4.6;
  const roseA = 9.2;
  const roseABoost = 0.6;
  const roseBreathBase = 0.72;
  const roseBreathBoost = 0.28;
  const roseScale = 3.25;
  const steps = 480;
  const size = 56;
  const center = 50;

  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    let frame: number;

    const animate = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, []);

  function normalizeProgress(progress: number): number {
    return ((progress % 1) + 1) % 1;
  }

  function getDetailScale(time: number): number {
    const pulseProgress = (time % pulseDurationMs) / pulseDurationMs;
    const pulseAngle = pulseProgress * Math.PI * 2;
    return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
  }

  function getRotation(time: number): number {
    return -((time % rotationDurationMs) / rotationDurationMs) * 360;
  }

  function point(
    progress: number,
    detailScale: number,
  ): { x: number; y: number } {
    const t = progress * Math.PI * 2;
    const a = roseA + detailScale * roseABoost;
    const r =
      a * (roseBreathBase + detailScale * roseBreathBoost) * Math.cos(4 * t);

    return {
      x: center + Math.cos(t) * r * roseScale,
      y: center + Math.sin(t) * r * roseScale,
    };
  }

  function buildPath(detailScale: number): string {
    return Array.from({ length: steps + 1 }, (_, index) => {
      const pt = point(index / steps, detailScale);
      return `${index === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }).join(" ");
  }

  function getParticle(
    index: number,
    progress: number,
    detailScale: number,
  ): { x: number; y: number; radius: number; opacity: number } {
    const tailOffset = index / (particleCount - 1);
    const pt = point(
      normalizeProgress(progress - tailOffset * trailSpan),
      detailScale,
    );
    const fade = Math.pow(1 - tailOffset, 0.56);

    return {
      x: pt.x,
      y: pt.y,
      radius: 0.9 + fade * 2.7,
      opacity: 0.04 + fade * 0.96,
    };
  }

  const startedAt = now - (now % durationMs);
  const time = now - startedAt;
  const progress = (time % durationMs) / durationMs;
  const detailScale = getDetailScale(now);
  const rotation = getRotation(now);
  const pathD = buildPath(detailScale);
  const particles = Array.from({ length: particleCount }, (_, i) =>
    getParticle(i, progress, detailScale),
  );

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{
        display: "block",
        color: "#8B5CF6",
        transform: `rotate(${rotation}deg)`,
      }}
      aria-hidden="true"
    >
      <g>
        <path
          d={pathD}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.1}
          fill="none"
        />
        {particles.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.radius}
            fill="currentColor"
            opacity={p.opacity}
          />
        ))}
      </g>
    </svg>
  );
};

export default RoseFourLoader;
