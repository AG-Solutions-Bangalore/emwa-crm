import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Mail, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  Loader2, 
  RefreshCw, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Send
} from 'lucide-react';
import { 
  getEmailCampaigns, 
  createEmailCampaign, 
  updateEmailCampaign, 
  updateEmailCampaignStatus, 
  deleteEmailCampaign,
  getEmailCampaignById
} from '../services/emailCampaignApi';
import EmailCampaignModal from '../components/campaign/EmailCampaignModal';
import EmailCampaignViewModal from '../components/campaign/EmailCampaignViewModal';
import toast from 'react-hot-toast';

export default function EmailCampaignPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCampaigns(currentPage);
  }, [currentPage]);

  const fetchCampaigns = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getEmailCampaigns({ page, search: search.trim() });
      
      let list = [];
      if (Array.isArray(res)) {
        list = res;
        setTotalPages(1);
        setTotalCount(res.length);
      } else if (res?.data && Array.isArray(res.data)) {
        list = res.data;
        setTotalPages(res.last_page || res.meta?.last_page || 1);
        setTotalCount(res.total || res.meta?.total || res.data.length);
      } else if (res?.campaigns && Array.isArray(res.campaigns)) {
        list = res.campaigns;
        setTotalPages(res.last_page || 1);
        setTotalCount(res.total || res.campaigns.length);
      }
      setCampaigns(list);
    } catch (err) {
      console.error('Failed to load email campaigns:', err);
      toast.error('Failed to load email campaigns.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCampaigns(1);
  };

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setModalOpen(true);
  };

  const handleOpenEdit = async (campaign) => {
    try {
      // If detailed data needed
      const detailed = await getEmailCampaignById(campaign.id);
      setEditingCampaign(detailed?.data || detailed || campaign);
    } catch {
      setEditingCampaign(campaign);
    }
    setModalOpen(true);
  };

  const handleOpenView = async (campaign) => {
    try {
      const detailed = await getEmailCampaignById(campaign.id);
      setViewCampaign(detailed?.data || detailed || campaign);
    } catch {
      setViewCampaign(campaign);
    }
    setViewModalOpen(true);
  };

  const handleSaveCampaign = async (formData) => {
    if (editingCampaign) {
      await updateEmailCampaign(editingCampaign.id, formData);
      toast.success('Email campaign updated successfully.');
    } else {
      await createEmailCampaign(formData);
      toast.success('Email campaign created successfully.');
    }
    fetchCampaigns(currentPage);
  };

  const handleStatusChange = async (id, newStatus) => {
    setStatusUpdatingId(id);
    try {
      await updateEmailCampaignStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, email_campaign_status: newStatus, status: newStatus } : c
        )
      );
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update campaign status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteEmailCampaign(deleteConfirmId);
      toast.success('Campaign deleted successfully.');
      setDeleteConfirmId(null);
      fetchCampaigns(currentPage);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete campaign.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch = 
        !search ||
        (c.email_campaign_name && c.email_campaign_name.toLowerCase().includes(search.toLowerCase())) ||
        (c.email_campaign_subject && c.email_campaign_subject.toLowerCase().includes(search.toLowerCase())) ||
        (c.name && c.name.toLowerCase().includes(search.toLowerCase()));

      const st = String(c.email_campaign_status || c.status || 'Pending').toLowerCase();
      const matchesStatus = 
        statusFilter === 'All' || 
        (statusFilter === 'Pending' && st === 'pending') ||
        (statusFilter === 'Sent' && st === 'sent') ||
        (statusFilter === 'Hold' && st === 'hold');

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = campaigns.length;
    let pending = 0;
    let sent = 0;
    let hold = 0;

    campaigns.forEach((c) => {
      const st = String(c.email_campaign_status || c.status || 'Pending').toLowerCase();
      if (st === 'sent') sent++;
      else if (st === 'hold') hold++;
      else pending++;
    });

    return { total, pending, sent, hold };
  }, [campaigns]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Email Campaigns" />

        <main className="flex-1 p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#1A1817] flex items-center gap-2.5">
                <Mail className="h-6 w-6 text-[#C99C4B]" />
                Email Campaigns
              </h1>
              <p className="text-xs text-[#8C8275] mt-0.5">
                Schedule broadcast marketing emails, track executions, and manage recipient audiences
              </p>
            </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCampaigns(currentPage)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#E8E3DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#5C554B] hover:bg-[#FAF8F5] transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#C99C4B]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[#1A1817] px-4 py-2 text-xs font-semibold text-[#FAF8F5] hover:bg-[#2E2A27] transition shadow-2xs cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#C99C4B]" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#E8E3DA] bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-[#8C8275] uppercase tracking-wider">Total Broadcasts</p>
          <p className="text-xl font-bold text-[#1A1817] mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-[#E8E3DA] bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-[#8C8275] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#C99C4B]" /> Pending
          </p>
          <p className="text-xl font-bold text-[#8C6D23] mt-1">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-[#E8E3DA] bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-[#8C8275] uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#2D5A34]" /> Sent
          </p>
          <p className="text-xl font-bold text-[#2D5A34] mt-1">{stats.sent}</p>
        </div>
        <div className="rounded-2xl border border-[#E8E3DA] bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-[#8C8275] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-[#8F4E24]" /> On Hold
          </p>
          <p className="text-xl font-bold text-[#8F4E24] mt-1">{stats.hold}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#E8E3DA]/50 p-1 rounded-xl w-full sm:w-auto">
          {['All', 'Pending', 'Sent', 'Hold'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#1A1817] text-[#FAF8F5] shadow-2xs'
                  : 'text-[#5C554B] hover:text-[#1A1817]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search email campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E8E3DA] bg-white pl-9 pr-3.5 py-2 text-xs text-[#1A1817] placeholder:text-[#8C8275]/60 outline-none transition focus:border-[#C99C4B] focus:ring-2 focus:ring-[#C99C4B]/20"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8C8275]" />
        </form>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-[#E8E3DA] bg-white overflow-hidden shadow-2xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#C99C4B] mb-2" />
            <p className="text-xs font-semibold text-[#1A1817]">Loading email campaigns...</p>
            <p className="text-[11px] text-[#8C8275]">Please wait a moment</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA] text-[#8C8275] mb-3">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#1A1817]">No email campaigns found</h3>
            <p className="text-xs text-[#8C8275] mt-1 max-w-sm">
              {search || statusFilter !== 'All'
                ? 'No campaigns match your active search or status filters.'
                : 'Get started by creating your first broadcast marketing email campaign.'}
            </p>
            {!search && statusFilter === 'All' && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 flex items-center gap-2 rounded-xl bg-[#1A1817] px-4 py-2 text-xs font-semibold text-[#FAF8F5] hover:bg-[#2E2A27] transition shadow-2xs cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Create Campaign</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5]/80 text-[11px] font-semibold text-[#8C8275] uppercase tracking-wider">
                  <th className="py-3 px-4">Campaign & Subject</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Schedule Date</th>
                  <th className="py-3 px-4">Holidays</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3DA] text-xs">
                {filteredCampaigns.map((camp) => {
                  const name = camp.email_campaign_name || camp.name || 'Unnamed Campaign';
                  const subject = camp.email_campaign_subject || camp.subject || '—';
                  const date = camp.email_campaign_date || camp.date || '—';
                  const holiday = camp.email_campaign_holiday || camp.holiday || 'Yes';
                  const status = camp.email_campaign_status || camp.status || 'Pending';
                  const templateName = camp.template?.template_name || camp.template_name || (camp.email_campaign_template_id ? `Tmpl #${camp.email_campaign_template_id}` : '—');
                  const isStatusLoading = statusUpdatingId === camp.id;

                  return (
                    <tr key={camp.id} className="hover:bg-[#FAF8F5]/50 transition">
                      {/* Name & Subject */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-[#1A1817] truncate">{name}</div>
                        <div className="text-[11px] text-[#8C8275] truncate mt-0.5" title={subject}>
                          {subject}
                        </div>
                      </td>

                      {/* Template */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] px-2.5 py-1 text-[11px] font-medium text-[#1A1817]">
                          <FileText className="h-3 w-3 text-[#C99C4B]" />
                          <span className="truncate max-w-[140px]">{templateName}</span>
                        </span>
                      </td>

                      {/* Scheduled Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#1A1817]">
                          <Calendar className="h-3.5 w-3.5 text-[#8C8275]" />
                          {date}
                        </span>
                      </td>

                      {/* Holiday logic */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          holiday === 'Yes' ? 'bg-[#FAF8F5] border border-[#E8E3DA] text-[#5C554B]' : 'bg-[#EBF3EC] text-[#2D5A34]'
                        }`}>
                          {holiday === 'Yes' ? 'Skip Holiday' : 'Ignore Holiday'}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={status}
                            disabled={isStatusLoading}
                            onChange={(e) => handleStatusChange(camp.id, e.target.value)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold outline-none transition cursor-pointer disabled:opacity-50 ${
                              String(status).toLowerCase() === 'sent'
                                ? 'border-[#D0E2D4] bg-[#EBF3EC] text-[#2D5A34]'
                                : String(status).toLowerCase() === 'hold'
                                ? 'border-[#F1D5C4] bg-[#FBF0EA] text-[#8F4E24]'
                                : 'border-[#E8E3DA] bg-[#FAF8F5] text-[#8C6D23]'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Sent">Sent</option>
                            <option value="Hold">Hold</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenView(camp)}
                            title="View Overview"
                            className="p-1.5 text-[#8C8275] hover:text-[#1A1817] hover:bg-[#FAF8F5] rounded-lg transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(camp.id)}
                            title="Delete Campaign"
                            className="p-1.5 text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FBEAEA] rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E8E3DA] px-4 py-3 bg-[#FAF8F5]/60 text-xs">
            <span className="text-[#8C8275]">
              Page <span className="font-semibold text-[#1A1817]">{currentPage}</span> of{' '}
              <span className="font-semibold text-[#1A1817]">{totalPages}</span> ({totalCount} campaigns)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E8E3DA] bg-white text-[#5C554B] hover:bg-[#FAF8F5] disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#E8E3DA] bg-white text-[#5C554B] hover:bg-[#FAF8F5] disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Create/Edit Modal */}
      <EmailCampaignModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCampaign(null);
        }}
        onSubmit={handleSaveCampaign}
        initialData={editingCampaign}
        isEditing={!!editingCampaign}
      />

      {/* Campaign View Details Modal */}
      <EmailCampaignViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewCampaign(null);
        }}
        campaign={viewCampaign}
        onSubDeleted={() => {
          fetchCampaigns(currentPage);
          if (viewCampaign) {
            handleOpenView(viewCampaign);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#FAF8F5] p-6 shadow-2xl border border-[#E8E3DA]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#9A2D2D] mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#1A1817]">Delete Email Campaign?</h3>
            <p className="mt-1.5 text-xs text-[#8C8275] leading-relaxed">
              Are you sure you want to delete this email campaign? This will halt scheduled broadcasts and delete related records.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="rounded-xl border border-[#E8E3DA] bg-white px-4 py-2 text-xs font-semibold text-[#5C554B] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-[#9A2D2D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7D2424] transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}
