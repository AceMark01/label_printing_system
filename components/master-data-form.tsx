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
import { Building2, Package, Plus } from 'lucide-react';

const partySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  name_hi: z.string().optional(),
  name_od: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  city_hi: z.string().optional(),
  city_od: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(2, 'Product Name is required'),
  name_hi: z.string().optional(),
  name_od: z.string().optional(),
});

export default function MasterDataForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partyForm = useForm<z.infer<typeof partySchema>>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: '',
      name_hi: '',
      name_od: '',
      city: '',
      city_hi: '',
      city_od: '',
    },
  });

  const productForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      name_hi: '',
      name_od: '',
    },
  });

  async function onPartySubmit(values: z.infer<typeof partySchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'party', data: values }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to add party');
      toast.success('Party added successfully');
      partyForm.reset();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onProductSubmit(values: z.infer<typeof productSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'product', data: values }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Failed to add product');
      toast.success('Product added successfully');
      productForm.reset();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
              New Party
            </TabsTrigger>
            <TabsTrigger value="product" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="w-4 h-4 mr-2" />
              New Product
            </TabsTrigger>
          </TabsList>

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
                      name="name"
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
                    <FormField
                      control={partyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Fingeshwar" {...field} className="h-11 border-blue-100 focus:border-primary" />
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
                    <FormField
                      control={partyForm.control}
                      name="city_hi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>शहर (हिंदी)</FormLabel>
                          <FormControl>
                            <Input placeholder="फिंगेश्वर" {...field} className="h-11 border-orange-100 focus:border-orange-500" />
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
                    <FormField
                      control={partyForm.control}
                      name="city_od"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ସହର (ଓଡ଼ିଆ)</FormLabel>
                          <FormControl>
                            <Input placeholder="ଫିଙ୍ଗେଶ୍ୱର" {...field} className="h-11 border-blue-100 focus:border-blue-500" />
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
                      name="name"
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
                      name="name_hi"
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
                      name="name_od"
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
  );
}
