"use client";

import { useRef, useEffect } from "react";
import type { RoseCurveVariant } from "@/lib/azure-voices";

interface RoseCurveIconProps {
  variant: RoseCurveVariant;
  size?: number;
  className?: string;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const PARTICLE_COUNT = 36;
const BASE_RADIUS = 7;
const DETAIL_AMPLITUDE = 3;
const CURVE_SCALE = 3.9;
const PULSE_DURATION_MS = 4200;

const RoseCurveIcon = ({ variant, size = 20, className }: RoseCurveIconProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.innerHTML = "";

    const group = document.createElementNS(SVG_NS, "g");
    svg.appendChild(group);

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "5.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("opacity", "0.1");
    path.setAttribute("fill", "none");
    group.appendChild(path);

    const particles = Array.from({ length: PARTICLE_COUNT }, () => {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("fill", "currentColor");
      group.appendChild(c);
      return c;
    });

    const getPoint = (progress: number, detailScale: number) => {
      const t = progress * Math.PI * 2;
      const n = variant.petalCount;
      const x = BASE_RADIUS * Math.cos(t) - DETAIL_AMPLITUDE * detailScale * Math.cos(n * t);
      const y = BASE_RADIUS * Math.sin(t) - DETAIL_AMPLITUDE * detailScale * Math.sin(n * t);
      return { x: 50 + x * CURVE_SCALE, y: 50 + y * CURVE_SCALE };
    };

    const getDetailScale = (time: number) => {
      const a = ((time % PULSE_DURATION_MS) / PULSE_DURATION_MS) * Math.PI * 2;
      return 0.52 + ((Math.sin(a + 0.55) + 1) / 2) * 0.48;
    };

    const norm = (p: number) => ((p % 1) + 1) % 1;

    const buildPath = (ds: number) =>
      Array.from({ length: 361 }, (_, i) => {
        const pt = getPoint(i / 360, ds);
        return `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
      }).join(" ");

    const startedAt = performance.now();

    const render = (now: number) => {
      const time = now - startedAt;
      const progress = (time % variant.durationMs) / variant.durationMs;
      const ds = getDetailScale(time);
      const rotation = -((time % variant.rotationDurationMs) / variant.rotationDurationMs) * 360;

      group.setAttribute("transform", `rotate(${rotation} 50 50)`);
      path.setAttribute("d", buildPath(ds));

      particles.forEach((node, i) => {
        const tailOffset = i / (PARTICLE_COUNT - 1);
        const pt = getPoint(norm(progress - tailOffset * variant.trailSpan), ds);
        const fade = Math.pow(1 - tailOffset, 0.56);
        node.setAttribute("cx", pt.x.toFixed(2));
        node.setAttribute("cy", pt.y.toFixed(2));
        node.setAttribute("r", (0.9 + fade * 2.7).toFixed(2));
        node.setAttribute("opacity", (0.04 + fade * 0.96).toFixed(3));
      });

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [variant]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0 }}
    />
  );
};

export default RoseCurveIcon;
