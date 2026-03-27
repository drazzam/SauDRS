'use client';

import { useState } from 'react';
import type { ShapValue, GroupContribution } from '@/lib/types';

interface ShapChartProps {
  shapValues: ShapValue[];
  groupContributions: GroupContribution[];
  maxFeatures?: number;
}

function RiskBar({ label, value, maxAbs }: { label: string; value: number; maxAbs: number }) {
  const pct = Math.min((value / maxAbs) * 100, 100);
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
      <div className="w-24 sm:w-44 text-right text-gray-600 truncate flex-shrink-0" title={label}>
        {label}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="h-5 sm:h-6 rounded-sm bg-red-500"
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
      <div className="w-14 sm:w-16 text-right flex-shrink-0">
        <span className="text-red-600 font-medium">+{value.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function ShapChart({ shapValues, groupContributions, maxFeatures = 8 }: ShapChartProps) {
  const [view, setView] = useState<'groups' | 'individual'>('groups');

  // Only risk-increasing items (already filtered in predict.ts, but double-check)
  const riskGroups = groupContributions.filter(g => g.totalShap > 0);
  const riskIndividual = shapValues.filter(sv => sv.shap > 0).slice(0, maxFeatures);

  if (riskGroups.length === 0 && riskIndividual.length === 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-4">
        No significant risk-increasing factors identified for this patient.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-700">Key Risk Factors</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setView('groups')}
            className={`text-[10px] sm:text-xs px-2.5 py-1.5 rounded min-h-[32px] ${view === 'groups' ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-500'}`}
          >By Domain</button>
          <button
            onClick={() => setView('individual')}
            className={`text-[10px] sm:text-xs px-2.5 py-1.5 rounded min-h-[32px] ${view === 'individual' ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-500'}`}
          >Individual</button>
        </div>
      </div>

      {view === 'groups' ? (
        <>
          {(() => {
            const maxAbs = Math.max(...riskGroups.map(g => g.totalShap), 0.01);
            return riskGroups.map(g => (
              <RiskBar key={g.group} label={g.group} value={g.totalShap} maxAbs={maxAbs} />
            ));
          })()}
          <p className="text-[9px] text-gray-400 mt-2">
            Showing risk-increasing contributions by clinical domain. Higher values indicate stronger contribution to predicted risk.
          </p>
        </>
      ) : (
        <>
          {(() => {
            const maxAbs = Math.max(...riskIndividual.map(v => v.shap), 0.01);
            return riskIndividual.map(sv => (
              <RiskBar key={sv.feature} label={sv.displayName} value={sv.shap} maxAbs={maxAbs} />
            ));
          })()}
          <p className="text-[9px] text-gray-400 mt-2">
            Showing top individual risk-increasing features. Some correlated features are shown only in the domain view.
          </p>
        </>
      )}
    </div>
  );
}
