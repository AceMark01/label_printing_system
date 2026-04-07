'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Info, Keyboard } from 'lucide-react';
import { UserManagement } from '@/components/settings/user-management';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'User Management', icon: User, description: 'Manage accounts and access roles' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Login history and passwords' },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard, description: 'Quick print and navigation' },
    { id: 'about', label: 'System Info', icon: Info, description: 'Version and system status' },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Configure your labellings control panel</p>
      </div>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-8">
          <div className="flex flex-col gap-4">
            <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white/50 backdrop-blur">
              <CardContent className="p-2">
                <TabsList className="flex flex-col h-auto bg-transparent gap-1 p-0">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "w-full justify-start px-4 py-4 rounded-2xl flex flex-col items-start gap-0.5 transition-all duration-300",
                        "data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-100",
                        "hover:bg-slate-50 text-slate-500"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon className="w-4 h-4" />
                        <span className="font-black text-xs uppercase tracking-widest">{tab.label}</span>
                      </div>
                      <p className={cn(
                        "text-[9px] font-medium opacity-60 ml-7",
                        activeTab === tab.id ? "text-indigo-100" : "text-slate-400"
                      )}>
                        {tab.description}
                      </p>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <TabsContent value="users" className="mt-0 focus-visible:outline-none">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="security" className="mt-0 focus-visible:outline-none">
              <Card className="border-slate-200 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Security Settings</h3>
                  <p className="text-slate-500 font-bold text-xs max-w-xs mx-auto">Passwords and audit logs will be available in the next system update.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shortcuts" className="mt-0 focus-visible:outline-none">
                <Card className="border-slate-200 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                    <CardContent className="p-10 space-y-6">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                             <Keyboard className="w-5 h-5 text-indigo-600" />
                             Quick Shortcuts
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {[
                                 { key: 'Ctrl + P', desc: 'Instant print layout' },
                                 { key: 'Alt + S', desc: 'Sync master data' },
                                 { key: 'Alt + N', desc: 'New production label' },
                                 { key: '/', desc: 'Global search' }
                             ].map(s => (
                                 <div key={s.key} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                     <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{s.desc}</span>
                                     <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-indigo-600 shadow-sm">{s.key}</kbd>
                                 </div>
                             ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="about" className="mt-0 focus-visible:outline-none">
              <Card className="border-slate-200 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-12 text-center space-y-6">
                   <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto shadow-inner">
                      <img src="/logo1.png" className="w-12 h-12 object-contain" alt="Logo" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Acemark Labels</h3>
                      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Version 2.0.4 - Enterprise Edition</p>
                   </div>
                   <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-2">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Powered by</span>
                      <span className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400 tracking-[0.2em] animate-pulse uppercase">BOTIVATE</span>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
