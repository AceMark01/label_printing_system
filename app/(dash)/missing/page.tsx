'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, Building2, Package, RefreshCw, Download } from 'lucide-react';

interface MissingTranslation {
  type: 'party' | 'product';
  english: string;
  hindi: string;
  odia: string;
  orderNo: string;
}

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function MissingTranslationsPage() {
  const [data, setData] = useState<{ parties: MissingTranslation[], products: MissingTranslation[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, { hi: string, od: string }>>({});

  const exportToCsv = (type: 'party' | 'product') => {
    if (!data) return;
    const items = type === 'party' ? data.parties : data.products;
    if (items.length === 0) {
      toast.info(`No missing ${type}s to export`);
      return;
    }

    const headers = type === 'party' 
      ? ['name_eng', 'name_hi', 'name_od'] 
      : ['item_name_eng', 'item_name_hi', 'item_name_od'];

    const csvContent = [
      headers.join(','),
      ...items.map(item => {
        // Wrap in quotes and handle existing quotes
        const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
        return [escape(item.english), escape(item.hindi || ''), escape(item.odia || '')].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `missing_${type}s_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${items.length} ${type}s to CSV`);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/labels/missing');
      if (!response.ok) throw new Error('Failed to fetch missing data');
      const res = await response.json();
      setData(res);
      
      // Initialize form state
      const newState: Record<string, { hi: string, od: string }> = {};
      res.parties.forEach((p: MissingTranslation) => {
        newState[`party-${p.english}`] = { hi: p.hindi || '', od: p.odia || '' };
      });
      res.products.forEach((p: MissingTranslation) => {
        newState[`product-${p.english}`] = { hi: p.hindi || '', od: p.odia || '' };
      });
      setFormState(newState);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (item: MissingTranslation) => {
    const key = `${item.type}-${item.english}`;
    const translations = formState[key];
    
    if (!translations.hi || !translations.od) {
      toast.warning('Please enter both Hindi and Odia translations before saving.');
      return;
    }

    setSaving(key);
    try {
      const response = await fetch('/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.type,
          data: {
            [item.type === 'party' ? 'name_eng' : 'item_name_eng']: item.english,
            [item.type === 'party' ? 'name_hi' : 'item_name_hi']: translations.hi,
            [item.type === 'party' ? 'name_od' : 'item_name_od']: translations.od,
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to save translation');
      
      toast.success(`Saved translation for: ${item.english}`);
      // Remove from list
      setData(prev => {
        if (!prev) return null;
        if (item.type === 'party') {
          return { ...prev, parties: prev.parties.filter(p => p.english !== item.english) };
        } else {
          return { ...prev, products: prev.products.filter(p => p.english !== item.english) };
        }
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 animate-pulse" />
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin absolute top-6 left-6" />
        </div>
        <p className="text-2xl font-bold text-slate-900">Scanning for missing translations...</p>
      </div>
    );
  }

  const isEmpty = (data?.parties.length === 0 && data?.products.length === 0);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-20 px-1 md:px-2 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 px-1">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Translation Sync</h1>
          <p className="hidden md:block text-slate-500 font-bold mt-3 text-lg">Fix or export untranslated master data records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" className="flex-1 md:flex-none h-10 md:h-11 px-4 md:px-5 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
            <TabsList className="bg-slate-100 p-1 rounded-xl h-12 w-full lg:w-auto">
                <TabsTrigger value="products" className="rounded-lg px-2 md:px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-2 flex-1 lg:flex-none">
                    <Package className="w-4 h-4" />
                    Products
                    <Badge variant="outline" className="ml-0.5 md:ml-1 bg-emerald-50 text-emerald-600 border-emerald-100 font-black h-5 px-1.5 text-[10px]">
                        {data?.products.length}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger value="parties" className="rounded-lg px-2 md:px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-2 flex-1 lg:flex-none">
                    <Building2 className="w-4 h-4" />
                    Parties
                    <Badge variant="outline" className="ml-0.5 md:ml-1 bg-indigo-50 text-indigo-600 border-indigo-100 font-black h-5 px-1.5 text-[10px]">
                        {data?.parties.length}
                    </Badge>
                </TabsTrigger>
            </TabsList>

            <div className="w-full lg:w-auto">
                <TabsContent value="products" className="m-0">
                    <Button onClick={() => exportToCsv('product')} className="w-full h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Products CSV
                    </Button>
                </TabsContent>
                <TabsContent value="parties" className="m-0">
                    <Button onClick={() => exportToCsv('party')} className="w-full h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Parties CSV
                    </Button>
                </TabsContent>
            </div>
        </div>

        <TabsContent value="products" className="mt-0 focus-visible:outline-none">
          {data?.products.length === 0 ? (
            <div className="py-20 md:py-24 text-center bg-emerald-50/20 rounded-3xl border border-dashed border-emerald-100 italic font-medium text-emerald-600 px-4">
                All products are correctly translated!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {data?.products.map((product) => (
                  <TranslationCard 
                    key={product.english} 
                    item={product} 
                    state={formState[`product-${product.english}`]} 
                    onChange={(val) => setFormState(prev => ({ ...prev, [`product-${product.english}`]: val }))}
                    onSave={() => handleSave(product)}
                    saving={saving === `product-${product.english}`}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="parties" className="mt-0 focus-visible:outline-none">
          {data?.parties.length === 0 ? (
            <div className="py-20 md:py-24 text-center bg-indigo-50/20 rounded-3xl border border-dashed border-indigo-100 italic font-medium text-indigo-600 px-4">
                All parties are correctly translated!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {data?.parties.map((party) => (
                  <TranslationCard 
                    key={party.english} 
                    item={party} 
                    state={formState[`party-${party.english}`]} 
                    onChange={(val) => setFormState(prev => ({ ...prev, [`party-${party.english}`]: val }))}
                    onSave={() => handleSave(party)}
                    saving={saving === `party-${party.english}`}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TranslationCard({ item, state, onChange, onSave, saving }: {
  item: MissingTranslation;
  state: { hi: string, od: string };
  onChange: (val: { hi: string, od: string }) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const isParty = item.type === 'party';

  return (
    <Card className="border-none shadow-sm hover:shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-indigo-600">
      <CardHeader className="bg-slate-50/40 p-4 pb-3">
        <div className="flex items-center justify-between gap-3">
           <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                isParty ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
              )}>
                {isParty ? <Building2 className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              </div>
              <h4 className="text-base font-bold text-slate-800 truncate leading-tight" title={item.english}>
                {item.english}
              </h4>
           </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="relative group/input">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase group-focus-within/input:text-indigo-400 transition-colors">HI</div>
             <Input 
                placeholder="नाम (हिंदी)" 
                className="h-10 pl-10 font-bold text-sm border-slate-100 focus:border-indigo-500/30 bg-slate-50/50 focus:bg-white transition-all rounded-lg"
                value={state?.hi || ''}
                onChange={(e) => onChange({ ...state, hi: e.target.value })}
             />
          </div>
          
          <div className="relative group/input text-blue-600">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase group-focus-within/input:text-blue-400 transition-colors">OD</div>
             <Input 
                placeholder="ନାମ (ଓଡ଼ିଆ)" 
                className="h-10 pl-10 font-bold text-sm border-slate-100 focus:border-blue-500/30 bg-slate-50/50 focus:bg-white transition-all rounded-lg"
                value={state?.od || ''}
                onChange={(e) => onChange({ ...state, od: e.target.value })}
             />
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        <Button 
          onClick={onSave}
          disabled={saving || !state?.hi || !state?.od}
          className={cn(
            "w-full h-10 rounded-lg font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] flex items-center gap-2",
            "bg-slate-900 hover:bg-indigo-600 text-white"
          )}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          {saving ? 'Processing...' : 'Sync Translation'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
