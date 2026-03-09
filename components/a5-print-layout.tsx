'use client';

import { Label, Language } from '@/lib/types';
import { LabelCard } from './label-card';

interface A5PrintLayoutProps {
  labels: Label[];
  languages: Language[];
}

export function A5PrintLayout({ labels, languages }: A5PrintLayoutProps) {
  return (
    <div className="w-full bg-white p-4">
      {/* A4 Page Container - Will hold 4 A5 labels (2x2 grid) */}
      <div className="space-y-4">
        {Array.from({ length: Math.ceil(labels.length / 4) }).map((_, pageIdx) => (
          <div
            key={pageIdx}
            className="bg-white border-2 border-gray-300"
            style={{
              width: '210mm',
              height: '297mm',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '4mm',
              padding: '10mm',
              pageBreakAfter: 'always',
              pageBreakInside: 'avoid'
            }}
          >
            {labels.slice(pageIdx * 4, (pageIdx + 1) * 4).map((label) => (
              <div
                key={label.id}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                className="print:break-inside-avoid"
              >
                <div style={{ width: '100%', height: '100%' }} className="scale-75 origin-top-left">
                  <LabelCard label={label} languages={languages} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
