"use client";

import dynamic from "next/dynamic";
import type { ComponentType, CSSProperties } from "react";

export type ColorBendsProps = {
  className?: string;
  style?: CSSProperties;
  colors?: string[];
  speed?: number;
  scale?: number;
  rotation?: number;
  transparent?: boolean;
  autoRotate?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
  iterations?: number;
  intensity?: number;
  bandWidth?: number;
};

/**
 * Client-only wrapper around the react-bits ColorBends WebGL background
 * (three.js). Loaded without SSR since it renders to a canvas. The `.jsx`
 * source is untyped, so we assert the public prop surface here.
 */
const ColorBends = dynamic(() => import("./ColorBends/ColorBends"), {
  ssr: false,
  loading: () => null,
}) as ComponentType<ColorBendsProps>;

export default ColorBends;
