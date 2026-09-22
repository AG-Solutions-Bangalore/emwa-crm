import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import ClientModal from '../components/client/ClientModal';
import ClientViewModal from '../components/client/ClientViewModal';
import Pagination from '../components/common/Pagination';
import StatsSummaryBar from '../components/common/StatsSummaryBar';
import useDebounce from '../hooks/useDebounce';
import { useAppContext } from '../context/AppContext';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  updateClientStatus,
} from '../services/clientApi';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  Building2,
  Eye,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Layers,
  Image,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.clients?.data)) return response.clients.data;
  if (Array.isArray(response?.clients)) return response.clients;
  if (Array.isArray(response?.client)) return response.client;
  return [];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const initialForm = {
  clients_name: '',
  clients_image: null,
  clients_status: 'Active',
  existing_image_url: null,
};

export default function ClientPage() {
  const { imageUrlConfig, noImageUrl } = useAppContext();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const debouncedSearch = useDebounce(searchQuery, 350);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(12);
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

  // Base client images URL prefix
  const clientBaseUrl = useMemo(() => {
    const found = (imageUrlConfig || []).find(
      (i) =>
        i?.image_for?.toLowerCase() === 'client' ||
        i?.image_for?.toLowerCase() === 'clients' ||
        i?.image_for?.toLowerCase() === 'client_image' ||
        i?.image_for?.toLowerCase() === 'client_images'
    );
    return found?.image_url || 'https://easemarketing.in/emwaapi/public/assets/images/client_images/';
  }, [imageUrlConfig]);

  const resolveImageUrl = (imageVal) => {
    if (!imageVal) return noImageUrl || '';
    if (typeof imageVal !== 'string') return '';
    if (imageVal.startsWith('http://') || imageVal.startsWith('https://') || imageVal.startsWith('data:')) {
      return imageVal;
    }
    const cleanBase = clientBaseUrl.replace(/\/$/, '');
    return `${cleanBase}/${imageVal.replace(/^\//, '')}`;
  };

  /* ── 1. GET /client with pagination ── */
  const fetchClientList = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, clients_status: status } : {}),
      };

      const res = await getClients(params);
      const list = extractList(res);
      setItems(list);

      // Pagination metadata
      const paginationObj = res?.data?.data ? res?.data : res;
      const total = paginationObj?.total ?? list.length;
      const lastPage = paginationObj?.last_page ?? Math.max(1, Math.ceil(total / (paginationObj?.per_page || 12)));
      const curr = paginationObj?.current_page ?? page;
      const per = paginationObj?.per_page ?? 12;

      setTotalCount(total);
      setTotalPages(lastPage);
      setCurrentPage(curr);
      setPerPage(per);
      setFrom(paginationObj?.from ?? (total > 0 ? (curr - 1) * per + 1 : 0));
      setTo(paginationObj?.to ?? Math.min(curr * per, total));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch clients.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientList(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchClientList(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchClientList(newPage, debouncedSearch, statusFilter);
    }
  };

  /* ── 2. CREATE (POST /client) & UPDATE (PUT /client/{id}) ── */
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    setEditingId(item.id);
    setIsModalOpen(true);

    const imageField = item.clients_image || item.client_image || item.image || item.file_name;
    const name = item.clients_name || item.client_name || item.name || '';
    const status = item.clients_status || item.status || 'Active';

    setForm({
      clients_name: name,
      clients_image: null,
      clients_status: status,
      existing_image_url: resolveImageUrl(imageField),
    });

    // Optionally fetch fresh item by ID (GET /client/{id})
    try {
      const res = await getClientById(item.id);
      const freshData = res?.data || res?.client || res;
      if (freshData) {
        const freshImage = freshData.clients_image || freshData.client_image || freshData.image;
        const freshName = freshData.clients_name || freshData.client_name || freshData.name || name;
        const freshStatus = freshData.clients_status || freshData.status || status;

        setForm({
          clients_name: freshName,
          clients_image: null,
          clients_status: freshStatus,
          existing_image_url: resolveImageUrl(freshImage),
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
        // PUT /client/{id}
        await updateClient(editingId, form);
        toast.success('Client updated successfully.');
      } else {
        // POST /client
        await createClient(form);
        toast.success('Client added successfully.');
      }

      setIsModalOpen(false);
      setForm(initialForm);
      fetchClientList(currentPage, searchQuery, statusFilter);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save client.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. PATCH /clients/{id}/status ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.clients_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, clients_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateClientStatus(id, nextStatus);
      toast.success(`Client #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, clients_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update client status.';
      toast.error(msg);
    }
  };

  /* ── 4. Preview Modal ── */
  const handleOpenPreview = (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
  };

  // Filtered items based on statusFilter tab
  const displayedItems = useMemo(() => {
    if (statusFilter === 'All') return items;
    return items.filter((it) => {
      const st = String(it.clients_status || it.status || 'Active').toLowerCase();
      return st === statusFilter.toLowerCase();
    });
  }, [items, statusFilter]);

  // Metrics
  const clientStats = useMemo(() => {
    const total = totalCount || items.length;
    const active = items.filter((it) => (it.clients_status || it.status || 'Active').toLowerCase() === 'active' || (it.clients_status || it.status) === '1').length;
    const inactive = items.filter((it) => (it.clients_status || it.status || '').toLowerCase() === 'inactive' || (it.clients_status || it.status) === '0').length;
    return [
      {
        label: 'Total Client Logos',
        value: total,
        icon: Building2,
        color: 'emerald',
        filterValue: 'All',
        subtext: 'Partner brand portfolio',
      },
      {
        label: 'Active Logos',
        value: active,
        icon: CheckCircle2,
        color: 'amber',
        filterValue: 'Active',
        subtext: 'Visible in brand showcase',
      },
      {
        label: 'Inactive Logos',
        value: inactive,
        icon: XCircle,
        color: 'rose',
        filterValue: 'Inactive',
        subtext: 'Hidden from public view',
      },
    ];
  }, [items, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Clients & Partners" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Clients & Partner Logos
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Manage client partner brand logos showcased on the website
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchClientList(currentPage, searchQuery, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Add Client Logo</span>
              </button>
            </div>
          </div>

          {/* Unique Stats Summary Cards */}
          <StatsSummaryBar
            stats={clientStats}
            activeFilter={statusFilter}
            onSelectFilter={(filter) => {
              setStatusFilter(filter);
              setCurrentPage(1);
            }}
          />

          {/* Search & Filter Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client or company name..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {/* View Mode Toggle */}
              <div className="inline-flex rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                      : 'text-[#5C554B] hover:text-[#1A1817]'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Table View"
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                      : 'text-[#5C554B] hover:text-[#1A1817]'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading client logos...</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No client partners found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? 'No clients match your filter criteria. Try adjusting your query or status tab.'
                  : 'You have not added any client logos yet. Upload your partner and client brand logos.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Add First Client</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW ── */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {displayedItems.map((item, index) => {
                  const id = item.id;
                  const name = item.clients_name || item.client_name || item.name || 'Client Partner';
                  const imageField = item.clients_image || item.client_image || item.image || item.file_name;
                  const imageUrl = resolveImageUrl(imageField);
                  const status = item.clients_status || item.status || 'Active';
                  const isActive = status === 'Active';
                  const date = item.created_at || item.createdDate || item.date;

                  return (
                    <div
                      key={id || index}
                      className="group bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      {/* Logo Display Box */}
                      <div className="relative aspect-4/3 bg-[#FAF8F5] flex items-center justify-center p-4 border-b border-[#F0ECE3] overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={name}
                            className="max-h-20 max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.currentTarget.src = noImageUrl || '';
                            }}
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-[#9E7432] opacity-40" />
                        )}

                        {/* Top ID Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="font-mono text-[10px] font-semibold bg-white/90 text-[#78716C] px-1.5 py-0.5 rounded shadow-2xs border border-[#E8E3DA]">
                            #{id}
                          </span>
                        </div>
                      </div>

                      {/* Card Content & Actions */}
                      <div className="p-3.5 space-y-2.5 bg-white">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#1A1817] truncate" title={name}>
                            {name}
                          </h4>

                          {/* Quick Status Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer flex-shrink-0 ${
                              isActive
                                ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
                                : 'bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB]'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E7E34]' : 'bg-[#9A2D2D]'}`}
                            />
                            {status}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#8C8275] pt-2 border-t border-[#F0ECE3]">
                          <span>{formatDate(date)}</span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(item)}
                              className="p-1 rounded hover:bg-[#FAF8F5] text-[#5C554B] hover:text-[#1A1817] transition cursor-pointer"
                              title="Preview Logo"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1 rounded hover:bg-[#FAF8F5] text-[#5C554B] hover:text-[#9E7432] transition cursor-pointer"
                              title="Edit Client"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="bg-white rounded-xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
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
            </div>
          ) : (
            /* ── TABLE VIEW ── */
            <div className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] font-semibold text-[#5C554B]">
                      <th className="px-4 py-3 w-14">#</th>
                      <th className="px-4 py-3 w-28">Logo</th>
                      <th className="px-4 py-3">Client / Partner Name</th>
                      <th className="px-4 py-3">Added Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {displayedItems.map((item, index) => {
                      const id = item.id;
                      const name = item.clients_name || item.client_name || item.name || 'Client Partner';
                      const imageField = item.clients_image || item.client_image || item.image || item.file_name;
                      const imageUrl = resolveImageUrl(imageField);
                      const status = item.clients_status || item.status || 'Active';
                      const isActive = status === 'Active';
                      const rowNumber = (currentPage - 1) * perPage + index + 1;
                      const date = item.created_at || item.createdDate || item.date;

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                          
                          {/* Logo Preview */}
                          <td className="px-4 py-3">
                            <div
                              onClick={() => handleOpenPreview(item)}
                              className="h-9 w-16 rounded-lg bg-[#FAF8F5] border border-[#E8E3DA] p-1 overflow-hidden cursor-pointer hover:border-[#C99C4B] transition flex items-center justify-center group"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={name}
                                  className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.src = noImageUrl || '';
                                  }}
                                />
                              ) : (
                                <Building2 className="h-4 w-4 text-[#9E7432]" />
                              )}
                            </div>
                          </td>

                          {/* Client Name */}
                          <td className="px-4 py-3 font-semibold text-[#1A1817]">
                            {name}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 text-[#8C8275]">{formatDate(date)}</td>

                          {/* Status Pill Toggle */}
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(item)}
                                title="View Logo"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Client"
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

      {/* Add / Edit Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        editingId={editingId}
        submitting={submitting}
      />

      {/* View Client Modal */}
      <ClientViewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        imageUrl={previewItem ? resolveImageUrl(previewItem.clients_image || previewItem.client_image || previewItem.image || previewItem.file_name) : ''}
        onEdit={(it) => handleOpenEditModal(it)}
      />
    </div>
  );
}
