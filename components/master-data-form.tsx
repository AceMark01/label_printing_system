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
import { Building2, Package, Plus, Upload, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
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
        console.log('CSV Raw Data:', data);

        const mappedData = data.map(row => {
          // Priority Mapping: Exact schema matches first
          const eng = (
            row.name_eng || row.item_name_eng || 
            row.name || row.party || row.product || row.item || 
            row['english name'] || row['party name'] || row['product name'] || ''
          ).toString().trim();
          
          const hi = (
            row.name_hi || row.item_name_hi || 
            row.hindi || row.hi || row['hindi name'] || 
            row['party in hindi'] || row['item in hindi'] || ''
          ).toString().trim();
          
          const od = (
            row.name_od || row.item_name_od || 
            row.odia || row.od || row.or || row.oriya || 
            row['odia name'] || row['oriya name'] || row['party in oriya'] || 
            row['item in oriya'] || row['party in odia'] || ''
          ).toString().trim();

          if (type === 'party') {
            return {
              name_eng: eng,
              name_hi: hi,
              name_od: od,
            };
          } else {
            return {
              item_name_eng: eng,
              item_name_hi: hi,
              item_name_od: od,
            };
          }
        }).filter(item => (item.name_eng || item.item_name_eng || '').length >= 2);

        console.log('Mapped Data:', mappedData);

        if (mappedData.length === 0) {
          toast.error('No valid data found. Ensure your CSV has a "name_eng", "name", or "item_name_eng" column.');
          return;
        }

        setPendingImport({
            type,
            data: mappedData,
            isOpen: true
        });
        
        // Clear input
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
    const headers = ['name_eng', 'name_hi', 'name_od'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\nSample Name,नल नमूना,ନମୁନା ନାମ";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <Card className="w-full max-w-5xl mx-auto border-none shadow-xl bg-background/60 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
                <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    Master Data Management
                </CardTitle>
                <CardDescription>Add new parties or products with multi-language support (English, Hindi, Odia).</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="party" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
            <TabsTrigger value="party" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Building2 className="w-4 h-4 mr-2" />
              Party Master
            </TabsTrigger>
            <TabsTrigger value="product" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="w-4 h-4 mr-2" />
              Product Master
            </TabsTrigger>
          </TabsList>

          {/* Bulk Import Section - Fully Restored */}
          <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
                    <Upload className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-base font-black text-slate-900 leading-none">Bulk Data Import</h4>
                    <p className="text-xs text-slate-500 font-bold mt-2">Swiftly add multiple records via CSV file</p>
                </div>
             </div>
             <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        const activeTab = document.querySelector('[data-state="active"][role="tab"]')?.getAttribute('value') as any;
                        downloadSampleCsv(activeTab || 'party');
                    }}
                    className="h-10 text-[11px] font-black border-slate-200 text-slate-600 hover:bg-white rounded-xl w-full sm:w-auto px-5"
                >
                    <FileText className="w-3.5 h-3.5 mr-2" />
                    Sample Template
                </Button>
                <div className="relative w-full sm:w-auto">
                    <input 
                        type="file" 
                        accept=".csv" 
                        id="csv-upload"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                            const activeTab = document.querySelector('[data-state="active"][role="tab"]')?.getAttribute('value') as any;
                            handleCsvUpload(activeTab || 'party', e);
                        }}
                    />
                    <Button size="sm" className="h-10 text-[11px] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 rounded-xl w-full sm:w-auto px-5">
                        <Upload className="w-3.5 h-3.5 mr-2" />
                        Upload CSV
                    </Button>
                </div>
             </div>
          </div>

          <TabsContent value="party">
            <Form {...partyForm}>
              <form onSubmit={partyForm.handleSubmit(onPartySubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* English Names */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">EN</span>
                      English
                    </h3>
                    <FormField
                      control={partyForm.control}
                      name="name_eng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Party Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Aalok Book Depot" {...field} className="h-11 border-blue-100 focus:border-primary" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Hindi Names */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-600 mb-4 flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px]">HI</span>
                       Hindi
                    </h3>
                    <FormField
                      control={partyForm.control}
                      name="name_hi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>नाम (हिंदी)</FormLabel>
                          <FormControl>
                            <Input placeholder="आलोक बुक डिपो" {...field} className="h-11 border-orange-100 focus:border-orange-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Odia Names */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-4 flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">OD</span>
                       Odia
                    </h3>
                    <FormField
                      control={partyForm.control}
                      name="name_od"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ନାମ (ଓଡ଼ିଆ)</FormLabel>
                          <FormControl>
                            <Input placeholder="ଆଲୋକ ବୁକ୍ ଡିପୋ" {...field} className="h-11 border-blue-100 focus:border-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-muted/30">
                  <Button variant="outline" type="button" onClick={() => partyForm.reset()} className="h-11 px-8 rounded-xl">Clear</Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[160px] h-11 rounded-xl shadow-lg bg-gradient-to-r from-primary to-primary/80">
                    {isSubmitting ? 'Saving...' : 'Add Party'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="product">
            <Form {...productForm}>
              <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* English Name */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">EN</span>
                      English
                    </h3>
                    <FormField
                      control={productForm.control}
                      name="item_name_eng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Cash Register 1Q" {...field} className="h-11 border-blue-100 focus:border-primary" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Hindi Name */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-600 mb-4 flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px]">HI</span>
                       Hindi
                    </h3>
                    <FormField
                      control={productForm.control}
                      name="item_name_hi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>उत्पाद (हिंदी)</FormLabel>
                          <FormControl>
                            <Input placeholder="कैश रजिस्टर" {...field} className="h-11 border-orange-100 focus:border-orange-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Odia Name */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-4 flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">OD</span>
                       Odia
                    </h3>
                    <FormField
                      control={productForm.control}
                      name="item_name_od"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ଉତ୍ପାଦ (ଓଡ଼ିଆ)</FormLabel>
                          <FormControl>
                            <Input placeholder="କ୍ୟାସ୍ ରେଜିଷ୍ଟର" {...field} className="h-11 border-blue-100 focus:border-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-muted/30">
                  <Button variant="outline" type="button" onClick={() => productForm.reset()} className="h-11 px-8 rounded-xl">Clear</Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[160px] h-11 rounded-xl shadow-lg bg-gradient-to-r from-primary to-primary/80">
                    {isSubmitting ? 'Saving...' : 'Add Product'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    <AlertDialog open={pendingImport.isOpen} onOpenChange={(open) => setPendingImport(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className="max-w-md border-none shadow-2xl">
            <AlertDialogHeader>
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                    <FileText className="w-6 h-6" />
                </div>
                <AlertDialogTitle className="text-xl font-black text-slate-900">Confirm Your Import</AlertDialogTitle>
                <AlertDialogDescription asChild>
                    <div className="space-y-4 pt-2">
                        <p className="text-slate-600 font-medium leading-relaxed">
                            We found <span className="text-indigo-600 font-black">{pendingImport.data.length} records</span> in your file. 
                            Do you want to import them into the <span className="text-slate-900 font-bold uppercase tracking-tight">{pendingImport.type === 'party' ? 'Party Master' : 'Product Master'}</span>?
                        </p>
                        
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 overflow-hidden">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" />
                                Preview (First 3 Items)
                            </h5>
                            <div className="space-y-2">
                                {pendingImport.data.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200 last:border-0">
                                        <span className="font-bold text-slate-700 truncate max-w-[150px]">{item.name_eng}</span>
                                        <span className="text-[10px] text-slate-400 italic">... ready</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-[10px] text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-100 italic">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            Existing items with the same English name will be updated with these translations.
                        </div>
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-6">
                <AlertDialogCancel className="rounded-xl border-slate-200 h-11 px-6 font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={confirmImport}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    Yes, Import {pendingImport.data.length} Rows
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
