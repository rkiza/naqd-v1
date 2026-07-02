"use client";

import dynamic from "next/dynamic";
import type { ComponentType, CSSProperties } from "react";

export type GrainientProps = {
  className?: string;
  style?: CSSProperties;
  color1?: string;
  color2?: string;
  color3?: string;
  timeSpeed?: number;
  colorBalance?: number;
  warpStrength?: number;
  warpFrequency?: number;
  warpSpeed?: number;
  warpAmplitude?: number;
  blendAngle?: number;
  blendSoftness?: number;
  rotationAmount?: number;
  noiseScale?: number;
  grainAmount?: number;
  grainScale?: number;
  grainAnimated?: boolean;
  contrast?: number;
  gamma?: number;
  saturation?: number;
  centerX?: number;
  centerY?: number;
  zoom?: number;
};

/**
 * Client-only wrapper around the react-bits Grainient WebGL background (ogl).
 * Loaded without SSR since it renders to a canvas.
 */
const Grainient = dynamic(() => import("./Grainient/Grainient"), {
  ssr: false,
  loading: () => null,
}) as ComponentType<GrainientProps>;

export default Grainient;
