import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import StatsSummaryBar from '../components/common/StatsSummaryBar';
import { getDashboardData } from '../services/dashboardApi';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import {
  Users,
  Boxes,
  Layers,
  Workflow,
  LayoutTemplate,
  Send,
  MailCheck,
  MessageSquareText,
  FileText,
  Building2,
  Quote,
  CalendarDays,
  RefreshCw,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  PlusCircle,
  BarChart3,
  Activity,
  Image as ImageIcon,
  Mail,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { companyInfo } = useAppContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getDashboardData();
      const payload = res?.data || res || {};
      setData(payload);
      if (isManual) {
        toast.success('Dashboard data refreshed.');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load real-time dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Helper to safely extract metric counts from varied backend response structures
  const getCount = (keys, fallback = 0) => {
    if (!data) return fallback;
    for (const k of keys) {
      if (data[k] !== undefined && data[k] !== null) {
        if (typeof data[k] === 'number') return data[k];
        if (typeof data[k] === 'string' && !isNaN(Number(data[k]))) return Number(data[k]);
        if (Array.isArray(data[k])) return data[k].length;
        if (typeof data[k] === 'object' && data[k]?.count !== undefined) return data[k].count;
        if (typeof data[k] === 'object' && data[k]?.total !== undefined) return data[k].total;
      }
    }
    return fallback;
  };

  // Primary Metrics parsed from GET /dashboard
  const templateCount = getCount(['template_count', 'templates_count', 'templates', 'total_templates']);
  const enquiryCount = getCount(['enquiry_count', 'enquiries_count', 'enquiries', 'total_enquiries']);
  const newsletterCount = getCount(['newsletter_count', 'newsletters_count', 'newsletters', 'newsletter', 'total_newsletters']);

  // Stats Summary Bar Cards matching the CRM system design
  const dashboardStats = useMemo(() => [
    {
      label: 'Message Templates',
      value: templateCount,
      icon: LayoutTemplate,
      color: 'emerald',
      filterValue: 'template',
    },
    {
      label: 'Customer Enquiries',
      value: enquiryCount,
      icon: MessageSquareText,
      color: 'amber',
      filterValue: 'enquiry',
    },
    {
      label: 'Newsletter Subscribers',
      value: newsletterCount,
      icon: Mail,
      color: 'rose',
      filterValue: 'newsletter',
    },
  ], [templateCount, enquiryCount, newsletterCount]);

  const allModules = [
    { label: 'Categories', icon: Layers, route: '/category', desc: 'Taxonomy' },
    { label: 'Groups', icon: Boxes, route: '/group', desc: 'Segments' },
    { label: 'Contacts', icon: Users, route: '/contact', desc: 'Directory' },
    { label: 'Holidays', icon: CalendarDays, route: '/holiday', desc: 'Calendar' },
    { label: 'Templates', icon: LayoutTemplate, route: '/template', desc: `${templateCount} active` },
    { label: 'Pipelines', icon: Workflow, route: '/pipeline', desc: 'Flows' },
    { label: 'WhatsApp', icon: Send, route: '/whatsapp-campaign', desc: 'Broadcasts' },
    { label: 'Email Campaigns', icon: MailCheck, route: '/email-campaign', desc: 'Sequences' },
    { label: 'Blogs', icon: FileText, route: '/blog', desc: 'Articles' },
    { label: 'Gallery', icon: ImageIcon, route: '/gallery', desc: 'Media' },
    { label: 'FAQs', icon: HelpCircle, route: '/faq', desc: 'Knowledge' },
    { label: 'Testimonials', icon: Quote, route: '/testimonial', desc: 'Reviews' },
    { label: 'Clients', icon: Building2, route: '/client', desc: 'Partners' },
    { label: 'Company', icon: Building2, route: '/company', desc: 'Enterprise' },
    { label: 'Enquiries', icon: MessageSquareText, route: '/enquiry', desc: `${enquiryCount} leads` },
    { label: 'Newsletter', icon: Mail, route: '/newsletter', desc: `${newsletterCount} emails` },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Dashboard" />

        <main className="flex-1 p-4 sm:p-5 max-w-7xl w-full flex flex-col justify-start gap-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDashboard(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing || loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Live API Stats Summary Cards */}
          <StatsSummaryBar
            stats={dashboardStats}
            onSelectFilter={(filter) => {
              if (filter === 'template') navigate('/template');
              else if (filter === 'enquiry') navigate('/enquiry');
              else if (filter === 'newsletter') navigate('/newsletter');
            }}
          />

          {/* CRM Quick Access Grid */}
          <div className="bg-white rounded-xl border border-[#E8E3DA] p-3.5 sm:p-4 shadow-2xs">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[11px] uppercase font-bold text-[#78716C] tracking-wider flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-[#C99C4B]" />
                <span>Quick Access Modules</span>
              </h2>
              <span className="text-[10.5px] text-[#8C8275]">15 Active Modules</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
              {allModules.map((mod, idx) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => navigate(mod.route)}
                    className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] hover:bg-white hover:shadow-xs transition-all duration-150 cursor-pointer group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white border border-[#E8E3DA] text-[#9E7432] group-hover:bg-[#1A1817] group-hover:text-[#FAF8F5] group-hover:border-[#1A1817] transition-all shadow-2xs shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-[#1A1817] block truncate">
                        {mod.label}
                      </span>
                      <span className="text-[10px] text-[#8C8275] block truncate">
                        {mod.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
