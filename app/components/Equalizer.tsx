'use client';

import React, { useEffect, useRef } from 'react';

interface EqualizerProps {
  frequencies: number[];
  isVertical?: boolean;
  isMobile?: boolean;
}

// Color gradient from green (bottom, index 0) to red (top, last index)
const getPositionColor = (position: number): string => {
  // position: 0 (green) to 1 (red) through yellow
  let r, g, b;
  
  if (position < 0.5) {
    // Green to Yellow: increase red, keep green
    const t = position * 2; // 0 to 1
    r = Math.round(34 + (255 - 34) * t);
    g = 197; // keep green constant
    b = 0;
  } else {
    // Yellow to Red: decrease green, keep red
    const t = (position - 0.5) * 2; // 0 to 1
    r = 255;
    g = Math.round(197 * (1 - t));
    b = 0;
  }
  
  return `${r}, ${g}, ${b}`;
};

export const Equalizer: React.FC<EqualizerProps> = ({
  frequencies,
  isVertical = true,
  isMobile = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Interpolate frequencies to match display bars
  const displayFrequencies = React.useMemo(() => {
    const barCount = 10; // 10 bars for both mobile and desktop
    if (frequencies.length === 0) {
      return Array(barCount).fill(0);
    }

    const interpolated = [];
    for (let i = 0; i < barCount; i++) {
      const index = (i / barCount) * (frequencies.length - 1);
      const floor = Math.floor(index);
      const ceil = Math.ceil(index);
      const weight = index - floor;

      if (floor === ceil) {
        interpolated.push(frequencies[floor]);
      } else {
        interpolated.push(
          frequencies[floor] * (1 - weight) + frequencies[ceil] * weight
        );
      }
    }
    return interpolated;
  }, [frequencies]);

  // Compute simple stats for verification (avg and peak)
  const stats = React.useMemo(() => {
    if (!displayFrequencies || displayFrequencies.length === 0) return { avg: 0, peak: 0 };
    let sum = 0;
    let peak = 0;
    for (const v of displayFrequencies) {
      sum += v;
      if (v > peak) peak = v;
    }
    const avg = sum / displayFrequencies.length;
    return { avg, peak };
  }, [displayFrequencies]);

  return (
    <div
      ref={containerRef}
      className={`flex items-end justify-center gap-2 p-4 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 ${
        isVertical
          ? isMobile ? 'flex-col h-full w-full max-w-full' : 'flex-col h-[500px] w-full'
          : 'flex-row h-96 w-full'
      }`}
      style={isMobile && isVertical ? { flexDirection: 'column-reverse' } : undefined}
    >
      {displayFrequencies.map((freq, index) => {
        const normalizedFreq = Math.min(freq / 255, 1);
        const heightPercent = normalizedFreq * 100;
        
        // Color based on position from bottom (0) to top (1) - same for both mobile and desktop
        const positionRatio = index / Math.max(displayFrequencies.length - 1, 1);
        const colorRgb = getPositionColor(positionRatio);
        
        // For horizontal layout, each bar gets an explicit width percentage
        const wrapperStyle = isVertical
          ? undefined
          : { width: `${100 / displayFrequencies.length}%` } as React.CSSProperties;

        return (
          <div
            key={index}
            className={`relative overflow-hidden transition-all duration-75 ease-out ${
              isVertical ? 'w-full flex-1 h-full flex-col-reverse' : 'h-full'
            }`}
            style={wrapperStyle}
          >
            {/* Background bar */}
            <div className={`absolute inset-0 bg-gradient-to-t from-slate-700 to-slate-600`} />

            {/* Animated frequency bar with bottom-to-top growth and fade effect */}
            {isVertical ? (
              <div
                className={`absolute transition-all duration-75 ease-out w-full`}
                style={{
                  ...(isMobile ? { bottom: 0 } : { top: 0 }),
                  left: 0,
                  right: 0,
                  height: `${heightPercent}%`,
                  background: isMobile
                    ? `linear-gradient(to bottom, rgba(${colorRgb}, 0.2), rgba(${colorRgb}, 0.6) 50%, rgb(${colorRgb}))`
                    : `linear-gradient(to top, rgba(${colorRgb}, 0.2), rgba(${colorRgb}, 0.6) 50%, rgb(${colorRgb}))`,
                  boxShadow: `0 0 20px rgba(${colorRgb}, 0.8), inset 0 0 10px rgba(${colorRgb}, 0.4)`,
                  flexFlow: 'column-reverse !important', 
                }}
              />
            ) : (
              <div
                className={`absolute left-0 top-0 bottom-0 transition-all duration-75 ease-out h-full`}
                style={{
                  width: `${heightPercent}%`,
                  background: `linear-gradient(to right, rgba(${colorRgb}, 0.2), rgba(${colorRgb}, 0.6) 50%, rgb(${colorRgb}))`,
                  boxShadow: `0 0 20px rgba(${colorRgb}, 0.8), inset 0 0 10px rgba(${colorRgb}, 0.4)`,
                }}
              />
            )}

            {/* Circular dot at the top/end - removed */}
          </div>
        );
      })}
    </div>
  );
};
