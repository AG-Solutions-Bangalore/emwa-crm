import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { Clock } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Dashboard Overview" />

        <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
          <div className="max-w-md w-full text-center bg-white p-10 rounded-2xl border border-[#E8E3DA] shadow-[0_4px_24px_-4px_rgba(30,25,20,0.06)]">
            <div className="h-14 w-14 rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center mx-auto mb-4">
              <Clock className="h-7 w-7" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#1A1817] mb-2 tracking-tight">
              Dashboard Overview
            </h2>
            <p className="text-xs text-[#7A7369] leading-relaxed">
              Real-time sales, order stats, enquiry counts, and card analytics will be populated once the dashboard statistics API is connected.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

