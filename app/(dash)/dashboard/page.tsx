'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Printer, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  PlusCircle,
  TrendingDown,
  ChevronRight,
  History,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { fetchTicTakData } from '@/lib/data-api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    printed: 0,
    remaining: 0
  });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Use a more optimized way to get counts
        const [printedRes, totalRes] = await Promise.all([
           supabase.from('labels').select('*', { count: 'exact', head: true }),
           fetch('/api/labels?countOnly=true&includeProcessed=true').then(res => res.json())
        ]);
        
        const totalCount = totalRes.count || 0;
        const printed = printedRes.count || 0;
        
        setStats({
          total: totalCount,
          printed: printed,
          remaining: Math.max(0, totalCount - printed)
        });

        const { data: history } = await supabase
          .from('labels')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        setRecentHistory(history || []);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard Central</h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">Real-time tracking of your labeling operations.</p>
        </div>
        <div className="flex items-center gap-3">
           <Link href="/orders">
            <Button className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/20 group transition-all active:scale-95">
              Launch Print Job
              <PlusCircle className="w-4.5 h-4.5 ml-2.5 group-hover:rotate-90 transition-transform duration-300" />
            </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Inventory Sync" 
          value={stats.total.toLocaleString()} 
          icon={<Box className="w-5 h-5 text-blue-600" />} 
          label="Total Records Available"
          delay="delay-75"
        />
        <StatCard 
          title="Successful Prints" 
          value={stats.printed.toLocaleString()} 
          icon={<Printer className="w-5 h-5 text-emerald-600" />} 
          label="Confirmed History"
          delay="delay-150"
        />
        <StatCard 
          title="Total Remaining" 
          value={stats.remaining.toLocaleString()} 
          icon={<Clock className="w-5 h-5 text-amber-500" />} 
          label="Pending Dispatch"
          delay="delay-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 md:col-span-3 border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-md">
          <CardHeader className="p-7 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 bg-white/80">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                <History className="w-4 h-4 text-slate-400" />
              </div>
              Recent Activity Log
            </CardTitle>
            <Link href="/history">
              <Button variant="ghost" className="font-bold text-sm h-10 px-5 rounded-xl hover:bg-slate-100 text-indigo-600">
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse text-sm">Syncing latest logs...</p>
              </div>
            ) : recentHistory.length > 0 ? (
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar bg-white/50">
                {recentHistory.map((item, idx) => (
                  <div key={idx} className="p-6 hover:bg-white transition-all duration-300 flex items-center justify-between group border-l-4 border-transparent hover:border-indigo-500">
                    <div className="flex items-center gap-6 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all shadow-sm">
                        <Box className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-lg leading-tight truncate">{item.account_name}</p>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{item.product_name}</span>
                           <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{item.city}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                       <div className="text-right whitespace-nowrap hidden sm:block">
                          <p className="text-sm font-black text-slate-900">{new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                       </div>
                       <div className="w-14 h-14 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:border-indigo-100 transition-all">
                          <p className="text-xl font-black text-slate-900">{item.actual_qty}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Units</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center bg-white">
                <Box className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                <p className="text-slate-400 font-bold italic">Your journey begins here. No labels printed yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, label, delay }: { title: string, value: string, icon: any, label: string, delay: string }) {
  return (
    <Card className={cn(
      "border border-slate-200 shadow-sm rounded-3xl bg-white hover:border-indigo-500/30 transition-all duration-500 group animate-in fade-in slide-in-from-bottom-4 fill-mode-both",
      delay
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-2 space-y-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:rotate-12 transition-all duration-500">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <CardTitle className="text-4xl font-black text-slate-900 tracking-tighter">{value}</CardTitle>
        <div className="flex items-center gap-2 mt-3">
           <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Package(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16.5 9.4 7.5 4.21" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    )
  }

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
