import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import TemplateModal from '../components/template/TemplateModal';
import TemplatePreviewModal from '../components/template/TemplatePreviewModal';
import Pagination from '../components/common/Pagination';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
} from '../services/templateApi';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  LayoutTemplate,
  Mail,
  MessageSquare,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Code2,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.templates?.data)) return response.templates.data;
  if (Array.isArray(response?.templates)) return response.templates;
  if (Array.isArray(response?.template)) return response.template;
  return [];
}

const initialForm = {
  template_name: '',
  template_type: 'Email',
  template_id: '',
  template_url: '',
  template_design: '',
  template_status: 'Active',
};

export default function TemplatePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Email' | 'WhatsApp'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Inactive'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  /* ── 1. GET /template with pagination ── */
  const fetchTemplateList = async (page = currentPage, query = searchQuery, type = typeFilter, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(type !== 'All' ? { template_type: type, type } : {}),
        ...(status !== 'All' ? { status } : {}),
      };

      const res = await getTemplates(params);
      const list = extractList(res);
      setItems(list);

      // Automatically enrich list with full details if backend list endpoint omitted template_url
      if (Array.isArray(list) && list.length > 0) {
        Promise.all(
          list.map(async (tmpl) => {
            const hasUrl =
              tmpl?.template_url ||
              tmpl?.url ||
              tmpl?.template_link ||
              tmpl?.link ||
              tmpl?.preview_url;
            if (tmpl?.id && !hasUrl) {
              try {
                const detailRes = await getTemplateById(tmpl.id);
                const detail = detailRes?.data || detailRes?.template || detailRes;
                if (detail) {
                  return { ...tmpl, ...detail };
                }
              } catch (e) {
                // Ignore individual detail fetch failure
              }
            }
            return tmpl;
          })
        ).then((enrichedList) => {
          setItems((prev) =>
            prev.map((it) => {
              const match = enrichedList.find((e) => e && e.id === it.id);
              return match ? { ...it, ...match } : it;
            })
          );
        });
      }

      // Pagination metadata
      const paginationObj = res?.data?.data ? res?.data : res;
      const total = paginationObj?.total ?? list.length;
      const lastPage = paginationObj?.last_page ?? Math.max(1, Math.ceil(total / (paginationObj?.per_page || 10)));
      const curr = paginationObj?.current_page ?? page;
      const per = paginationObj?.per_page ?? 10;

      setTotalCount(total);
      setTotalPages(lastPage);
      setCurrentPage(curr);
      setPerPage(per);
      setFrom(paginationObj?.from ?? (total > 0 ? (curr - 1) * per + 1 : 0));
      setTo(paginationObj?.to ?? Math.min(curr * per, total));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch templates.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplateList(currentPage, searchQuery, typeFilter, statusFilter);
  }, [currentPage, typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchTemplateList(1, searchQuery, typeFilter, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchTemplateList(newPage, searchQuery, typeFilter, statusFilter);
    }
  };

  /* ── 2. CREATE (POST /template) & UPDATE (PUT /template/{id}) ── */
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    setEditingId(item.id);
    setIsModalOpen(true);

    const type = item.template_type || 'Email';
    const name = item.template_name || item.name || '';
    const templateId = type === 'Email' ? name : (item.template_id || item.id || name);

    setForm({
      template_name: name,
      template_type: type,
      template_id: templateId,
      template_url: item.template_url || '',
      template_design: item.template_design || item.design || '',
      template_status: item.template_status || item.status || 'Active',
    });

    try {
      const res = await getTemplateById(item.id);
      const freshData = res?.data || res?.template || res;
      if (freshData) {
        const fType = freshData.template_type || type;
        const fName = freshData.template_name || name;
        const fTemplateId = fType === 'Email' ? fName : (freshData.template_id || fName);

        setForm({
          template_name: fName,
          template_type: fType,
          template_id: fTemplateId,
          template_url: freshData.template_url || '',
          template_design: freshData.template_design || freshData.design || '',
          template_status: freshData.template_status || freshData.status || 'Active',
        });
      }
    } catch (err) {
      // Use existing values
    }
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        // PUT /template/{id}
        await updateTemplate(editingId, form);
        toast.success('Template updated successfully.');
        setItems((prev) =>
          prev.map((it) => (it.id === editingId ? { ...it, ...form } : it))
        );
      } else {
        // POST /template
        await createTemplate(form);
        toast.success('Template created successfully.');
      }

      setIsModalOpen(false);
      setForm(initialForm);
      fetchTemplateList(currentPage, searchQuery, typeFilter, statusFilter);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save template.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. PATCH /templates/{id}/status ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.template_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, template_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateTemplateStatus(id, nextStatus);
      toast.success(`Template #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, template_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update template status.';
      toast.error(msg);
    }
  };

  /* ── 4. Preview Modal ── */
  const handleOpenPreview = async (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
    try {
      const res = await getTemplateById(item.id);
      const freshData = res?.data || res?.template || res;
      if (freshData) {
        setPreviewItem((prev) => ({ ...prev, ...freshData }));
      }
    } catch (err) {
      // Fallback to existing item
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = totalCount || items.length;
    let emailCount = 0;
    let whatsappCount = 0;
    let activeCount = 0;

    items.forEach((it) => {
      const type = it.template_type || it.type || 'Email';
      if (type === 'Email') emailCount++;
      else if (type === 'WhatsApp') whatsappCount++;
      const st = it.template_status || it.status || 'Active';
      if (st === 'Active') activeCount++;
    });

    return { total, emailCount, whatsappCount, activeCount };
  }, [items, totalCount]);

  // Client-side filtering fallback to ensure filters always work accurately
  const displayItems = useMemo(() => {
    return items.filter((item) => {
      const type = item.template_type || item.type || 'Email';
      if (typeFilter !== 'All' && type.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      const status = item.template_status || item.status || 'Active';
      if (statusFilter !== 'All' && status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = String(item.template_name || item.name || '').toLowerCase();
        const templateId = String(item.template_id || item.id || '').toLowerCase();
        if (!name.includes(q) && !templateId.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [items, typeFilter, statusFilter, searchQuery]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Template Library" />

        <main className="flex-1 p-5 md:p-7 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#E8E3DA] text-[#9E7432] shadow-2xs">
                  <LayoutTemplate className="h-4 w-4" />
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#1A1817] tracking-tight">
                  Campaign Templates
                </h2>
              </div>
              <p className="text-xs text-[#7A7369] mt-1">
                Manage reusable Email HTML designs and WhatsApp messaging templates.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchTemplateList(currentPage, searchQuery, typeFilter, statusFilter)}
                title="Refresh templates"
                className="p-2.5 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#9E7432]' : ''}`} />
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Create Template</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">Total Templates</p>
                <h3 className="text-xl font-bold text-[#1A1817] mt-0.5">{stats.total}</h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">Email HTML</p>
                <h3 className="text-xl font-bold text-[#9E7432] mt-0.5">{stats.emailCount}</h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#FAF8F5] text-[#9E7432] border border-[#E8E3DA] flex items-center justify-center">
                <Mail className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">WhatsApp</p>
                <h3 className="text-xl font-bold text-[#1E7E34] mt-0.5">{stats.whatsappCount}</h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">Active (Live)</p>
                <h3 className="text-xl font-bold text-[#1A1817] mt-0.5">{stats.activeCount}</h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#F5EFE3] text-[#78716C] border border-[#E8E3DA] flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E8E3DA] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by name or ID..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
              />
            </form>

            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              
              {/* Type Filter */}
              <div className="inline-flex rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] p-0.5">
                {['All', 'Email', 'WhatsApp'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setTypeFilter(type);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      typeFilter === type
                        ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                        : 'text-[#5C554B] hover:text-[#1A1817]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="inline-flex rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] p-0.5">
                {['All', 'Active', 'Inactive'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      statusFilter === status
                        ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                        : 'text-[#5C554B] hover:text-[#1A1817]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Templates Table View */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading templates...</p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <LayoutTemplate className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No templates found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || typeFilter !== 'All' || statusFilter !== 'All'
                  ? 'No templates match your search or filter options.'
                  : 'Start building your template library for marketing newsletters and WhatsApp notifications.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Create First Template</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] font-semibold text-[#5C554B]">
                      <th className="px-5 py-3 w-14">#</th>
                      <th className="px-5 py-3">Template Name</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Template ID</th>
                      <th className="px-5 py-3">URL / Link</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {displayItems.map((item, index) => {
                      const id = item.id;
                      const name = item.template_name || item.name || 'Untitled Template';
                      const type = item.template_type || 'Email';
                      const isEmail = type === 'Email';
                      const templateId = item.template_id || item.id;
                      const url =
                        item.template_url ||
                        item.url ||
                        item.template_link ||
                        item.link ||
                        item.template_preview_url ||
                        item.preview_url ||
                        item.webview_url;
                      const status = item.template_status || item.status || 'Active';
                      const isActive = status === 'Active';
                      const rowNumber = (currentPage - 1) * perPage + index + 1;

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                          
                          {/* Name */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-lg border font-mono text-xs font-bold flex-shrink-0 ${
                                  isEmail
                                    ? 'bg-[#FBF4E8] text-[#9E7432] border-[#F2E4C9]'
                                    : 'bg-[#EBF7EE] text-[#1E7E34] border-[#C3E6CB]'
                                }`}
                              >
                                {isEmail ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                              </div>
                              <span className="font-semibold text-xs text-[#1A1817]">{name}</span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isEmail
                                  ? 'bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9]'
                                  : 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
                              }`}
                            >
                              {type}
                            </span>
                          </td>

                          {/* Template ID */}
                          <td className="px-5 py-3.5 font-mono text-xs text-[#78716C] max-w-[150px] truncate">
                            {templateId}
                          </td>

                          {/* URL */}
                          <td className="px-5 py-3.5 max-w-[180px] truncate">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#9E7432] hover:underline truncate"
                              >
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{url}</span>
                              </a>
                            ) : (
                              <span className="text-[#8C8275]">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              title="Click to toggle status"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                                isActive
                                  ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] hover:bg-[#D4EDDA]'
                                  : 'bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB] hover:bg-[#F8D7DA]'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E7E34]' : 'bg-[#9A2D2D]'}`}
                              />
                              {status}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(item)}
                                title="Live Preview"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Template"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-[#9E7432]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                perPage={perPage}
                onPageChange={handlePageChange}
                from={from}
                to={to}
              />
            </div>
          )}

        </main>
      </div>

      {/* Add / Edit Template Modal */}
      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        editingId={editingId}
        submitting={submitting}
      />

      {/* Live Preview Modal */}
      <TemplatePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        onEdit={(it) => handleOpenEditModal(it)}
      />
    </div>
  );
}
