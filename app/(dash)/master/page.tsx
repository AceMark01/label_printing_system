'use client';

import MasterDataForm from '@/components/master-data-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, Building2, Package } from 'lucide-react';

export default function MasterPage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Management Center</h1>
          <p className="text-slate-500 font-bold mt-3 text-lg">Maintain your database of accounts, parties, and products.</p>
        </div>
      </div>

      <div className="w-full">
        <MasterDataForm />
      </div>
    </div>
  );
}
