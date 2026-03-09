'use client';

import { forwardRef } from 'react';
import { LabelCard } from './label-card';
import type { Label, Language } from '@/lib/types';

interface PrintLayoutProps {
  labels: Label[];
  languages: Language[];
}

export const PrintLayout = forwardRef<HTMLDivElement, PrintLayoutProps>(
  ({ labels, languages }, ref) => {
    return (
      <div ref={ref} className="bg-white">
        {/* Print styles */}
        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .print-page {
              page-break-after: always;
              margin: 0;
              padding: 0;
              break-inside: avoid;
            }
          }
        `}</style>

        {/* A4 pages with 2 columns */}
        {Array.from({ length: Math.ceil(labels.length / 4) }).map((_, pageIdx) => (
          <div key={pageIdx} className="print-page w-[210mm] h-[297mm] p-8 mx-auto bg-white">
            <div className="grid grid-cols-2 gap-6 h-full">
              {labels
                .slice(pageIdx * 4, (pageIdx + 1) * 4)
                .map((label) => (
                  <div key={label.id} className="flex items-center justify-center">
                    <LabelCard label={label} languages={languages} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

PrintLayout.displayName = 'PrintLayout';
