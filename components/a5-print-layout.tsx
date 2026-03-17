'use client';

import { Label, Language } from '@/lib/types';
import { LabelCard } from './label-card';

interface A5PrintLayoutProps {
  labels: Label[];
  languages: Language[];
  fieldVisibility?: Record<Language, { product: boolean, quantity: boolean }>;
}

export function A5PrintLayout({ labels, languages, fieldVisibility }: A5PrintLayoutProps) {
  return (
    <div className="w-full bg-slate-100 p-2 sm:p-8 flex flex-col items-center gap-8 print:bg-white print:p-0">
      {/* Each label gets its own A4 page with 2 copies (Top & Bottom) */}
      {labels.map((label) => (
        <div
          key={label.id}
          data-pdf-page
          className="bg-white shadow-none relative print:shadow-none print:border-0 overflow-hidden"
          style={{
            width: '210mm',
            height: '297mm',
            display: 'flex',
            flexDirection: 'column',
            padding: '5mm 8mm',
            boxSizing: 'border-box',
            pageBreakAfter: 'always',
            pageBreakInside: 'avoid',
            margin: '0 auto',
            position: 'relative'
          }}
        >
          {/* Top Label Folder/Container */}
          <div
            className="w-full relative flex flex-col items-center justify-center overflow-hidden"
            style={{ height: '140mm', boxSizing: 'border-box' }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden shadow-sm print:shadow-none">
              <LabelCard 
                label={label} 
                languages={languages} 
                fieldVisibility={fieldVisibility}
              />
            </div>
          </div>

          {/* Separation Line Only */}
          <div className="flex-1 w-full flex items-center justify-center relative min-h-[5mm]">
            <div className="w-full border-b border-dashed border-gray-300 print:border-gray-500"></div>
          </div>

          {/* Bottom Label Folder/Container */}
          <div
            className="w-full relative flex flex-col items-center justify-center overflow-hidden"
            style={{ height: '140mm', boxSizing: 'border-box' }}
          >

            <div className="w-full h-full rounded-lg overflow-hidden shadow-sm print:shadow-none">
              <LabelCard 
                label={label} 
                languages={languages} 
                fieldVisibility={fieldVisibility}
              />
            </div>
          </div>

        </div>
      ))}

    </div>
  );
}
