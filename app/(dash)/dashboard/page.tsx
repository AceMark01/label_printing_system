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
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { fetchTicTakData } from '@/lib/google-sheets';

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
        const { count: printedCount } = await supabase
          .from('labels')
          .select('*', { count: 'exact', head: true });
        
        const paginated = await fetchTicTakData(1, 1, { includeProcessed: true });
        const totalCount = paginated.meta.total || 0;
        const printed = printedCount || 0;
        
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Track your printing performance and recent activities.</p>
        </div>
        <div className="flex items-center gap-3">
           <Link href="/orders">
            <Button className="h-11 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm group transition-all">
              New Print Job
              <PlusCircle className="w-4 h-4 ml-2" />
            </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Orders" 
          value={stats.total.toLocaleString()} 
          icon={<Box className="w-5 h-5 text-blue-600" />} 
          trend="up"
          label="Total available in API"
        />
        <StatCard 
          title="Labels Printed" 
          value={stats.printed.toLocaleString()} 
          icon={<Printer className="w-5 h-5 text-emerald-600" />} 
          trend="up"
          label="Confirmed print history"
        />
        <StatCard 
          title="Pending Print" 
          value={stats.remaining.toLocaleString()} 
          icon={<Clock className="w-5 h-5 text-slate-400" />} 
          trend="down"
          label="Remaining for today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 md:col-span-3 border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Recent Activity Log
            </CardTitle>
            <Link href="/history">
              <Button variant="outline" size="sm" className="font-bold text-xs h-8 px-3 rounded-md border-slate-200 hover:bg-slate-50">
                View Full History <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentHistory.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                {recentHistory.map((item, idx) => (
                  <div key={idx} className="p-4 px-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                        <Box className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 leading-tight truncate">{item.account_name}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-2">
                           {item.product_name} • {item.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right whitespace-nowrap hidden sm:block">
                          <p className="text-xs font-bold text-slate-900">{new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">{new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                       </div>
                       <div className="w-12 text-center bg-slate-50 rounded-lg py-1.5 border border-slate-100">
                          <p className="text-xs font-black text-slate-900">{item.actual_qty}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Qty</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <Box className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-medium italic">Your recent print history will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, label }: any) {
  return (
    <Card className="border border-slate-200 shadow-sm rounded-xl bg-white hover:border-indigo-200 transition-colors group">
      <CardHeader className="flex flex-row items-center justify-between p-5 pb-2 space-y-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">{value}</CardTitle>
        <p className="text-[10px] font-medium text-slate-400 mt-1.5">{label}</p>
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
