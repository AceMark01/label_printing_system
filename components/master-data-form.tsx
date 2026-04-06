'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building2, Package, Plus, Upload, Download, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

const partySchema = z.object({
  name_eng: z.string().min(2, 'Name is required'),
  name_hi: z.string().optional(),
  name_od: z.string().optional(),
});

const productSchema = z.object({
  item_name_eng: z.string().min(2, 'Product Name is required'),
  item_name_hi: z.string().optional(),
  item_name_od: z.string().optional(),
});

export default function MasterDataForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    type: 'party' | 'product';
    data: any[];
    isOpen: boolean;
  }>({ type: 'party', data: [], isOpen: false });

  const partyForm = useForm<z.infer<typeof partySchema>>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name_eng: '',
      name_hi: '',
      name_od: '',
    },
  });

  const productForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      item_name_eng: '',
      item_name_hi: '',
      item_name_od: '',
    },
  });

  async function onPartySubmit(values: z.infer<typeof partySchema> | z.infer<typeof partySchema>[]) {
    setIsSubmitting(true);
    const dataArray = Array.isArray(values) ? values : [values];
    try {
      const response = await fetch('/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'party', data: dataArray }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to add party');
      toast.success(dataArray.length > 1 ? `${dataArray.length} Parties imported successfully` : 'Party added successfully');
      partyForm.reset();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onProductSubmit(values: z.infer<typeof productSchema> | z.infer<typeof productSchema>[]) {
    setIsSubmitting(true);
    const dataArray = Array.isArray(values) ? values : [values];
    try {
      const response = await fetch('/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'product', data: dataArray }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to add product');
      toast.success(dataArray.length > 1 ? `${dataArray.length} Products imported successfully` : 'Product added successfully');
      productForm.reset();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCsvUpload = (type: 'party' | 'product', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        const data = results.data as any[];
        const mappedData = data.map(row => {
          // Normalize row keys to remove any special chars/spaces for deep matching
          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              const normalizedKey = key.toLowerCase().trim();
              if (row[normalizedKey] !== undefined && row[normalizedKey] !== null) return row[normalizedKey];
              // Also check strictly joined version (e.g. "productname")
              const joinedKey = normalizedKey.replace(/\s+/g, '');
              if (row[joinedKey] !== undefined && row[joinedKey] !== null) return row[joinedKey];
            }
            return '';
          };

          const eng = getVal([
            'name_eng', 'item_name_eng', 'name', 'party', 'product', 'item', 
            'english name', 'party name', 'product name', 'item name', 'productname', 'itemname'
          ]).toString().trim();
          
          const hi = getVal([
            'name_hi', 'item_name_hi', 'hindi', 'hi', 'hindi name', 
            'party in hindi', 'item in hindi', 'name hindi', 'item hindi'
          ]).toString().trim();
          
          const od = getVal([
            'name_od', 'item_name_od', 'odia', 'od', 'or', 'oriya', 
            'odia name', 'oriya name', 'party in oriya', 'item in oriya', 
            'party in odia', 'item in odia', 'name odia', 'name oriya'
          ]).toString().trim();

          if (type === 'party') {
            return { name_eng: eng, name_hi: hi, name_od: od };
          } else {
            return { item_name_eng: eng, item_name_hi: hi, item_name_od: od };
          }
        }).filter(item => {
          const mainVal = type === 'party' ? (item as any).name_eng : (item as any).item_name_eng;
          return (mainVal || '').toString().trim().length >= 2;
        });

        if (mappedData.length === 0) {
          toast.error('No valid data found. Ensure your CSV has a "name_eng" or "item_name_eng" column.');
          return;
        }

        setPendingImport({ type, data: mappedData, isOpen: true });
        e.target.value = '';
      },
      error: (err) => {
        toast.error(`CSV Parse Error: ${err.message}`);
      }
    });
  };

  const confirmImport = () => {
    if (pendingImport.type === 'party') onPartySubmit(pendingImport.data);
    else onProductSubmit(pendingImport.data);
    setPendingImport(prev => ({ ...prev, isOpen: false }));
  };

  const downloadSampleCsv = (type: 'party' | 'product') => {
    const headers = type === 'party' ? ['name_eng', 'name_hi', 'name_od'] : ['item_name_eng', 'item_name_hi', 'item_name_od'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\nSample Name,नल नमूना,ନମୁନା ନାମ";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [activeTab, setActiveTab] = useState('party');

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-20 px-2 max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6 mb-10">
            <TabsList className="bg-slate-100 p-1 rounded-xl h-11 w-full lg:w-auto">
                <TabsTrigger value="party" className="rounded-lg px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all flex items-center gap-2 flex-1 lg:flex-none">
                    <Building2 className="w-4 h-4" />
                    Parties
                </TabsTrigger>
                <TabsTrigger value="product" className="rounded-lg px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all flex items-center gap-2 flex-1 lg:flex-none">
                    <Package className="w-4 h-4" />
                    Products
                </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
                <Button 
                    variant="outline" 
                    onClick={() => {
                        downloadSampleCsv(activeTab as any);
                    }}
                    className="h-11 px-5 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2"
                >
                    <FileText className="w-4 h-4" />
                    Sample CSV
                </Button>

                <div className="relative">
                    <input 
                        type="file" 
                        accept=".csv" 
                        id="csv-upload"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                            handleCsvUpload(activeTab as any, e);
                        }}
                    />
                    <Button className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-900/10 flex items-center gap-2 transition-all">
                        <Upload className="w-4 h-4" />
                        Bulk Upload CSV
                    </Button>
                </div>
            </div>
        </div>

        <TabsContent value="party" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-right-3 duration-500">
          <Form {...partyForm}>
            <form onSubmit={partyForm.handleSubmit(onPartySubmit)} className="space-y-8">
              <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden p-8 rounded-3xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest bg-indigo-50 w-fit px-3 py-1 rounded-full">
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                       English Name
                    </div>
                    <FormField
                      control={partyForm.control}
                      name="name_eng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter English name..." {...field} className="h-12 border-slate-100 focus:border-indigo-500/30 bg-slate-50/50 focus:bg-white transition-all rounded-xl font-bold" />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-[10px] uppercase tracking-widest bg-orange-50 w-fit px-3 py-1 rounded-full">
                       <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                       Hindi Name
                    </div>
                    <FormField
                      control={partyForm.control}
                      name="name_hi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">नाम (हिंदी)</FormLabel>
                          <FormControl>
                            <Input placeholder="हिंदी में नाम लिखें..." {...field} className="h-12 border-slate-100 focus:border-orange-500/30 bg-slate-50/50 focus:bg-white transition-all rounded-xl font-bold text-lg" />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-full">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                       Odia Name
                    </div>
                    <FormField
                      control={partyForm.control}
                      name="name_od"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">ନାମ (ଓଡ଼ିଆ)</FormLabel>
                          <FormControl>
                            <Input placeholder="ଓଡ଼ିଆରେ ନାମ ଲେଖନ୍ତୁ..." {...field} className="h-12 border-slate-100 focus:border-blue-500/30 bg-slate-50/50 focus:bg-white transition-all rounded-xl font-bold text-lg" />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-12 pt-8 border-t border-slate-50">
                  <Button variant="ghost" type="button" onClick={() => partyForm.reset()} className="h-12 px-8 rounded-xl font-bold text-slate-400 hover:text-slate-600">Clear Form</Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[200px] h-12 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-wider text-[11px] shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-2 text-xs">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Master Party
                  </Button>
                </div>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="product" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-right-3 duration-500">
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-8">
              <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden p-8 rounded-3xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-full">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                       English Product
                    </div>
                    <FormField
                      control={productForm.control}
                      name="item_name_eng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product name..." {...field} className="h-12 border-slate-100 focus:border-emerald-500/30 bg-slate-50/50 focus:bg-white transition-all rounded-xl font-bold" />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-[10px] uppercase tracking-widest bg-orange-50 w-fit px-3 py-1 rounded-full">
                       <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                       Hindi Name
                    </div>
                    <FormField
                      control={productForm.control}
                      name="item_name_hi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">उत्पाद (हिंदी)</FormLabel>
                          <FormControl>
                            <Input placeholder="हिंदी में नाम लिखें..." {...field} className="h-12 border-slate-100 focus:border-orange-500/30 bg-slate-50/50 focus:bg-white transition-all rounded-xl font-bold text-lg" />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-full">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                       Odia Name
                    </div>
                    <FormField
                      control={productForm.control}
                      name="item_name_od"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">ଉତ୍ପାଦ (ଓଡ଼ିଆ)</FormLabel>
                          <FormControl>
                            <Input placeholder="ଓଡ଼ିଆରେ ନାମ ଲେଖନ୍ତୁ..." {...field} className="h-12 border-slate-100 focus:border-blue-500/30 bg-slate-50/50 focus:bg-white transition-all rounded-xl font-bold text-lg" />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-12 pt-8 border-t border-slate-50">
                  <Button variant="ghost" type="button" onClick={() => productForm.reset()} className="h-12 px-8 rounded-xl font-bold text-slate-400 hover:text-slate-600">Clear Form</Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[200px] h-12 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase tracking-wider text-[11px] shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all flex items-center gap-2 text-xs">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Master Product
                  </Button>
                </div>
              </Card>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <AlertDialog open={pendingImport.isOpen} onOpenChange={(open) => setPendingImport(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className="max-w-md border-none shadow-2xl rounded-[2rem] p-8">
            <AlertDialogHeader>
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 shadow-sm border border-indigo-100">
                    <FileText className="w-8 h-8" />
                </div>
                <AlertDialogTitle className="text-2xl font-black text-slate-900 leading-tight">Confirm Bulk Import</AlertDialogTitle>
                <div className="space-y-6 pt-2">
                    <p className="text-slate-600 font-bold leading-relaxed">
                        We matched <span className="text-indigo-600 font-black">{pendingImport.data.length} valid records</span> from your CSV file. 
                    </p>
                    
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 overflow-hidden">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Data Preview
                        </h5>
                        <div className="space-y-3">
                            {pendingImport.data.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                                    <span className="font-black text-slate-700 truncate max-w-[180px]">{item.name_eng || item.item_name_eng}</span>
                                    <Badge variant="outline" className="text-[9px] font-bold bg-white text-slate-400 px-1.5 h-5">READY</Badge>
                                </div>
                            ))}
                            {pendingImport.data.length > 3 && (
                                <p className="text-[10px] text-center text-slate-400 font-bold pt-2">+{pendingImport.data.length - 3} more records...</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3 text-[11px] text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100/50 font-bold italic">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                        Duplicate English names will be automatically updated with these new translations.
                    </div>
                </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-8 gap-3">
                <AlertDialogCancel className="rounded-xl border-slate-200 h-12 px-6 font-bold text-slate-500 hover:bg-slate-50 transition-colors mt-0">Discard</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={confirmImport}
                    className="rounded-xl bg-slate-900 hover:bg-indigo-600 text-white h-12 px-10 font-black uppercase tracking-wider text-xs shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                    Confirm Import
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
