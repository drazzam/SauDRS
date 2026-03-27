'use client';

import { useState, useCallback } from 'react';
import type { PredictionResult, PatientInput } from '@/lib/types';

interface PDFDownloadButtonProps {
  result: PredictionResult;
  input: PatientInput;
}

/**
 * Lazy-loads @react-pdf/renderer only when the user clicks "Download PDF".
 * This keeps the heavy library (~500KB) out of the critical bundle.
 */
export function PDFDownloadButton({ result, input }: PDFDownloadButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      // Dynamic imports — only loaded on demand
      const [{ pdf }, { ClinicalReport }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ClinicalReport'),
      ]);

      const doc = <ClinicalReport result={result} input={input} />;
      const blob = await pdf(doc).toBlob();

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `SauDRS_Report_${date}_SRS${result.srs}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('PDF generation failed. Results are still visible on screen.');
    } finally {
      setGenerating(false);
    }
  }, [result, input]);

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={generating}
        className="w-full rounded-lg border border-[#1E3A5F] px-4 py-2.5 text-sm font-semibold
                   text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating PDF...
          </span>
        ) : (
          'Download Clinical Report (PDF)'
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
