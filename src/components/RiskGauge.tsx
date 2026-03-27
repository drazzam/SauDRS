'use client';

import { useState } from 'react';
import type { RiskBand, ConfidenceLevel } from '@/lib/types';

interface RiskGaugeProps {
  srs: number;
  band: RiskBand;
  probability: number;
  ci: [number, number];
  confidenceLevel: ConfidenceLevel;
}

export function RiskGauge({ srs, band, probability, ci, confidenceLevel }: RiskGaugeProps) {
  const [showDetails, setShowDetails] = useState(false);
  // SVG semicircular gauge
  const cx = 150, cy = 140, r = 110;
  const startAngle = Math.PI;
  const endAngle = 0;
  const scoreAngle = startAngle - (srs / 100) * Math.PI;

  const needleX = cx + r * 0.85 * Math.cos(scoreAngle);
  const needleY = cy - r * 0.85 * Math.sin(scoreAngle);

  // Color gradient stops for the arc
  const arcSegments = [
    { start: 0, end: 25, color: '#22C55E' },
    { start: 25, end: 40, color: '#86EFAC' },
    { start: 40, end: 56, color: '#FDE047' },
    { start: 56, end: 71, color: '#FB923C' },
    { start: 71, end: 83, color: '#EF4444' },
    { start: 83, end: 100, color: '#7F1D1D' },
  ];

  function arcPath(startPct: number, endPct: number): string {
    const s = Math.PI - (startPct / 100) * Math.PI;
    const e = Math.PI - (endPct / 100) * Math.PI;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy - r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy - r * Math.sin(e);
    const largeArc = Math.abs(s - e) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  return (
    <div className="flex flex-col items-center max-w-[300px] mx-auto w-full">
      <svg viewBox="0 0 300 180" className="w-full h-auto max-w-[300px]">
        {/* Background arc segments */}
        {arcSegments.map(seg => (
          <path
            key={seg.start}
            d={arcPath(seg.start, seg.end)}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeLinecap="butt"
            opacity={0.3}
          />
        ))}

        {/* Active arc up to score */}
        {arcSegments.filter(s => s.start < srs).map(seg => (
          <path
            key={`active-${seg.start}`}
            d={arcPath(seg.start, Math.min(seg.end, srs))}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeLinecap="butt"
          />
        ))}

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleX} y2={needleY}
          stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6" fill="#1E3A5F" />

        {/* Score labels */}
        <text x="30" y="155" fontSize="11" fill="#666" textAnchor="middle">0</text>
        <text x="270" y="155" fontSize="11" fill="#666" textAnchor="middle">100</text>
      </svg>

      {/* Score display */}
      <div className="text-center -mt-2">
        <div className="text-4xl sm:text-5xl font-bold" style={{ color: band.color }}>{srs}</div>
        <div className="text-xs sm:text-sm text-gray-500 mt-1">SauDRS Risk Score</div>
      </div>

      {/* Band badge */}
      <div
        className="mt-3 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold text-white"
        style={{ backgroundColor: band.color }}
      >
        {band.label}
      </div>

      {/* Probability */}
      <div className="mt-3 sm:mt-4 text-center">
        <div className="text-base sm:text-lg font-semibold text-gray-800">
          {(probability * 100).toFixed(1)}% <span className="text-xs sm:text-sm font-normal text-gray-500">2-year conversion risk</span>
        </div>
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-0.5 ${
            confidenceLevel === 'high' ? 'bg-green-100 text-green-700' :
            confidenceLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              confidenceLevel === 'high' ? 'bg-green-500' :
              confidenceLevel === 'medium' ? 'bg-amber-500' :
              'bg-red-500'
            }`} />
            {confidenceLevel === 'high' ? 'High' : confidenceLevel === 'medium' ? 'Moderate' : 'Low'} estimate reliability
          </span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[10px] sm:text-xs text-gray-400 hover:text-gray-600 mt-1 underline py-1 min-h-[32px]"
        >
          {showDetails ? 'Hide' : 'Show'} technical details
        </button>
        {showDetails && (
          <div className="text-[10px] text-gray-400 mt-1 bg-gray-50 rounded p-2">
            95% CI: {(ci[0] * 100).toFixed(1)}% – {(ci[1] * 100).toFixed(1)}%
            <br />Linear predictor: logit = {Math.log(Math.max(0.001, Math.min(0.999, probability)) / (1 - Math.max(0.001, Math.min(0.999, probability)))).toFixed(3)}
          </div>
        )}
      </div>
    </div>
  );
}
