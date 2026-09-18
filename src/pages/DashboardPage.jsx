import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
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
  Layers3
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
      setData(res?.data || res || {});
      if (isManual) {
        toast.success('Dashboard refreshed.');
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

  // Primary Metrics
  const stats = useMemo(() => {
    return {
      contacts: getCount(['contacts_count', 'contact_count', 'total_contacts', 'contacts', 'totalContacts']),
      groups: getCount(['groups_count', 'group_count', 'total_groups', 'groups', 'totalGroups']),
      whatsappCampaigns: getCount(['whatsapp_campaigns_count', 'whats_app_campaign_count', 'whatsapp_campaigns', 'total_whatsapp_campaigns', 'whatsappCampaigns']),
      emailCampaigns: getCount(['email_campaigns_count', 'email_campaign_count', 'email_campaigns', 'total_email_campaigns', 'emailCampaigns']),
      pipelines: getCount(['pipelines_count', 'pipeline_count', 'total_pipelines', 'pipelines', 'totalPipelines']),
      templates: getCount(['templates_count', 'template_count', 'total_templates', 'templates', 'totalTemplates']),
      enquiries: getCount(['enquiries_count', 'enquiry_count', 'total_enquiries', 'enquiries', 'totalEnquiries']),
      categories: getCount(['categories_count', 'category_count', 'total_categories', 'categories', 'totalCategories']),
      blogs: getCount(['blogs_count', 'blog_count', 'total_blogs', 'blogs', 'totalBlogs']),
      clients: getCount(['clients_count', 'client_count', 'total_clients', 'clients', 'totalClients']),
      testimonials: getCount(['testimonials_count', 'testimonial_count', 'total_testimonials', 'testimonials', 'totalTestimonials']),
      holidays: getCount(['holidays_count', 'holiday_count', 'total_holidays', 'holidays', 'totalHolidays']),
    };
  }, [data]);

  const primaryCards = [
    {
      title: 'WhatsApp Broadcasts',
      count: stats.whatsappCampaigns,
      label: 'Campaigns Launched',
      icon: Send,
      route: '/whatsapp-campaign',
    },
    {
      title: 'Email Broadcasts',
      count: stats.emailCampaigns,
      label: 'Campaigns Scheduled',
      icon: MailCheck,
      route: '/email-campaign',
    },
    {
      title: 'Target Contacts',
      count: stats.contacts,
      label: 'Audience Directory',
      icon: Users,
      route: '/contact',
    },
    {
      title: 'Automation Pipelines',
      count: stats.pipelines,
      label: 'Active Flows',
      icon: Workflow,
      route: '/pipeline',
    },
  ];

  const secondaryCards = [
    { label: 'Contact Groups', count: stats.groups, icon: Boxes, route: '/group' },
    { label: 'Message Templates', count: stats.templates, icon: LayoutTemplate, route: '/template' },
    { label: 'Customer Enquiries', count: stats.enquiries, icon: MessageSquareText, route: '/enquiry' },
    { label: 'Product Categories', count: stats.categories, icon: Layers, route: '/category' },
    { label: 'Published Blogs', count: stats.blogs, icon: FileText, route: '/blog' },
    { label: 'Clients & Partners', count: stats.clients, icon: Building2, route: '/client' },
    { label: 'Testimonials', count: stats.testimonials, icon: Quote, route: '/testimonial' },
    { label: 'Holiday Calendars', count: stats.holidays, icon: CalendarDays, route: '/holiday' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Dashboard Overview" />

        <main className="flex-1 p-6 md:p-8 space-y-6">
          {/* Top Banner / Welcome Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#1A1817] p-6 text-[#FAF8F5] shadow-lg border border-[#2E2A27]">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#C99C4B]/20 px-3 py-1 text-xs font-semibold text-[#C99C4B] border border-[#C99C4B]/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>EMWA Marketing Automation Hub</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAF8F5]">
                  Welcome back, {user?.name || user?.username || 'Administrator'}!
                </h1>
                <p className="text-xs sm:text-sm text-[#A89F91] leading-relaxed">
                  Monitor campaign deliveries, pipeline stages, audience engagement, and customer touchpoints across all channels in real time.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start md:self-center">
                <button
                  type="button"
                  onClick={() => fetchDashboard(true)}
                  disabled={refreshing || loading}
                  className="flex items-center gap-2 rounded-xl border border-[#3E3833] bg-[#2A2522] px-4 py-2 text-xs font-semibold text-[#FAF8F5] hover:bg-[#38322E] transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-[#C99C4B] ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Sync Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/whatsapp-campaign')}
                  className="flex items-center gap-2 rounded-xl bg-[#C99C4B] px-4 py-2 text-xs font-bold text-[#1A1817] hover:bg-[#D6A856] transition shadow-xs cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>New Broadcast</span>
                </button>
              </div>
            </div>

            {/* Decorative background gradients */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#C99C4B]/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-[#C99C4B]/5 blur-3xl pointer-events-none" />
          </div>

          {/* Primary 4 Campaign & Contact Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {primaryCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(card.route)}
                  className="group relative overflow-hidden rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A1817] text-[#C99C4B] shadow-2xs group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#8C8275] group-hover:text-[#1A1817] transition-colors">
                      View <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <p className="text-2xl font-bold text-[#1A1817] tracking-tight">
                      {loading ? '—' : card.count}
                    </p>
                    <p className="text-sm font-bold text-[#1A1817] mt-0.5">{card.title}</p>
                    <p className="text-xs text-[#8C8275]">{card.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secondary Modules Overview Grid */}
          <div>
            <div className="mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1817] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#C99C4B]" />
                System Resources & Modules
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {secondaryCards.map((mod, idx) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => navigate(mod.route)}
                    className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-[#E8E3DA] bg-white hover:bg-[#FAF8F5] hover:border-[#C99C4B]/40 transition shadow-2xs cursor-pointer group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF8F5] group-hover:bg-[#1A1817] text-[#8C8275] group-hover:text-[#C99C4B] transition shadow-2xs mb-1.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-base font-bold text-[#1A1817] leading-none">
                      {loading ? '—' : mod.count}
                    </span>
                    <span className="text-xs font-medium text-[#8C8275] mt-1 line-clamp-1">
                      {mod.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions & Recent Summary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Quick Action Shortcuts */}
            <div className="rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1A1817] flex items-center gap-2 mb-1">
                  <PlusCircle className="h-4 w-4 text-[#C99C4B]" />
                  Quick Actions
                </h3>
                <p className="text-xs text-[#8C8275] mb-3.5">
                  Direct shortcuts to create campaigns, contacts, or pipelines
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/whatsapp-campaign')}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] hover:bg-[#1A1817] hover:text-[#FAF8F5] text-xs font-semibold text-[#1A1817] transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Send className="h-4 w-4 text-[#C99C4B]" />
                      <span>Launch WhatsApp Campaign</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#8C8275] group-hover:text-[#C99C4B] transition" />
                  </button>

                  <button
                    onClick={() => navigate('/email-campaign')}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] hover:bg-[#1A1817] hover:text-[#FAF8F5] text-xs font-semibold text-[#1A1817] transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <MailCheck className="h-4 w-4 text-[#C99C4B]" />
                      <span>Create Email Campaign</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#8C8275] group-hover:text-[#C99C4B] transition" />
                  </button>

                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] hover:bg-[#1A1817] hover:text-[#FAF8F5] text-xs font-semibold text-[#1A1817] transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-[#C99C4B]" />
                      <span>Import / Add Contact</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#8C8275] group-hover:text-[#C99C4B] transition" />
                  </button>

                  <button
                    onClick={() => navigate('/pipeline')}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] hover:bg-[#1A1817] hover:text-[#FAF8F5] text-xs font-semibold text-[#1A1817] transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Workflow className="h-4 w-4 text-[#C99C4B]" />
                      <span>Configure Marketing Pipeline</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#8C8275] group-hover:text-[#C99C4B] transition" />
                  </button>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-[#E8E3DA] flex items-center justify-between text-xs text-[#8C8275]">
                <span>Status: Fully Connected</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#2D5A34]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Online
                </span>
              </div>
            </div>

            {/* Campaign Pipeline Status & Automation Health */}
            <div className="rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-2xs lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1817] flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#C99C4B]" />
                      Campaign Delivery & Automation Health
                    </h3>
                    <p className="text-xs text-[#8C8275]">Delivery schedules and trigger readiness</p>
                  </div>
                  <span className="text-xs font-semibold text-[#C99C4B] bg-[#C99C4B]/10 px-2.5 py-1 rounded-full border border-[#C99C4B]/20">
                    Active System
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                  <div className="rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#1A1817]">WhatsApp Flow Engine</span>
                      <span className="text-xs font-bold text-[#2D5A34] bg-[#EBF3EC] px-2 py-0.5 rounded-full">
                        Ready
                      </span>
                    </div>
                    <p className="text-xs text-[#8C8275] leading-relaxed">
                      Automated sequence intervals and holiday skipping logic are actively monitoring campaign schedules.
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-xs text-[#1A1817] font-semibold">
                      <span>Total Active Broadcasts</span>
                      <span className="text-[#C99C4B] font-bold">{stats.whatsappCampaigns}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#1A1817]">Email Delivery Engine</span>
                      <span className="text-xs font-bold text-[#2D5A34] bg-[#EBF3EC] px-2 py-0.5 rounded-full">
                        Ready
                      </span>
                    </div>
                    <p className="text-xs text-[#8C8275] leading-relaxed">
                      Email templates and audience recipient batches are queued and dispatched on execution dates.
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-xs text-[#1A1817] font-semibold">
                      <span>Total Active Broadcasts</span>
                      <span className="text-[#C99C4B] font-bold">{stats.emailCampaigns}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Info banner */}
              <div className="mt-3.5 rounded-xl border border-[#E8E3DA] bg-white p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1817] text-[#C99C4B] font-bold text-xs">
                    {companyInfo?.company_short || 'AGS'}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1817] text-xs">{companyInfo?.company_name || 'AG Solutions'}</p>
                    <p className="text-xs text-[#8C8275]">
                      {companyInfo?.company_email || 'info@ag-solutions.in'} • {companyInfo?.company_place || 'Bangalore'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-xs font-semibold text-[#C99C4B] hover:text-[#1A1817] transition cursor-pointer"
                >
                  Settings →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
