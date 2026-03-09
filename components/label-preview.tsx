'use client';

import { LabelCard } from './label-card';
import type { Label, Language } from '@/lib/types';

interface LabelPreviewProps {
  labels: Label[];
  languages: Language[];
}

export function LabelPreview({ labels, languages }: LabelPreviewProps) {
  if (labels.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          No labels to preview
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {labels.map((label) => (
          <div key={label.id} className="aspect-square">
            <LabelCard label={label} languages={languages} />
          </div>
        ))}
      </div>
    </div>
  );
}
