import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import TestimonialModal from '../components/testimonial/TestimonialModal';
import TestimonialViewModal from '../components/testimonial/TestimonialViewModal';
import Pagination from '../components/common/Pagination';
import {
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  updateTestimonialStatus,
} from '../services/testimonialApi';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  Quote,
  Star,
  Eye,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  User,
  Tag,
  ThumbsUp,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.testimonials?.data)) return response.testimonials.data;
  if (Array.isArray(response?.testimonials)) return response.testimonials;
  if (Array.isArray(response?.testimonial)) return response.testimonial;
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
  testimonial_for: '',
  testimonial_client_name: '',
  testimonial_description: '',
  testimonial_rating: '5',
  testimonial_status: 'Active',
};

export default function TestimonialPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

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

  /* ── 1. GET /testimonial with pagination ── */
  const fetchTestimonials = async (page = currentPage, query = searchQuery, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status } : {}),
      };

      const res = await getTestimonials(params);
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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch testimonials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials(currentPage, searchQuery, statusFilter);
  }, [currentPage, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchTestimonials(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchTestimonials(newPage, searchQuery, statusFilter);
    }
  };

  /* ── 2. CREATE (POST /testimonial) & UPDATE (PUT /testimonial/{id}) ── */
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    setEditingId(item.id);
    setIsModalOpen(true);

    setForm({
      testimonial_for: item.testimonial_for || item.category || '',
      testimonial_client_name: item.testimonial_client_name || item.client_name || item.name || '',
      testimonial_description: item.testimonial_description || item.description || item.comment || '',
      testimonial_rating: String(item.testimonial_rating || item.rating || '5'),
      testimonial_status: item.testimonial_status || item.status || 'Active',
    });

    // Optionally fetch fresh detail by ID (GET /testimonial/{id})
    try {
      const res = await getTestimonialById(item.id);
      const freshData = res?.data || res?.testimonial || res;
      if (freshData) {
        setForm({
          testimonial_for: freshData.testimonial_for || item.testimonial_for || '',
          testimonial_client_name: freshData.testimonial_client_name || item.testimonial_client_name || '',
          testimonial_description: freshData.testimonial_description || item.testimonial_description || '',
          testimonial_rating: String(freshData.testimonial_rating || item.testimonial_rating || '5'),
          testimonial_status: freshData.testimonial_status || item.testimonial_status || 'Active',
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
        // PUT /testimonial/{id}
        await updateTestimonial(editingId, form);
        toast.success('Testimonial updated successfully.');
      } else {
        // POST /testimonial
        await createTestimonial(form);
        toast.success('Testimonial added successfully.');
      }

      setIsModalOpen(false);
      setForm(initialForm);
      fetchTestimonials(currentPage, searchQuery, statusFilter);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save testimonial.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. PATCH /testimonials/{id}/status ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.testimonial_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, testimonial_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateTestimonialStatus(id, nextStatus);
      toast.success(`Review #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, testimonial_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update review status.';
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
      const st = String(it.testimonial_status || it.status || 'Active').toLowerCase();
      return st === statusFilter.toLowerCase();
    });
  }, [items, statusFilter]);

  // Metrics calculation
  const stats = useMemo(() => {
    const total = totalCount || items.length;
    let sumRating = 0;
    let fiveStarCount = 0;
    let activeCount = 0;
    let validRatings = 0;

    items.forEach((it) => {
      const r = Number(it.testimonial_rating || it.rating);
      if (!isNaN(r) && r > 0) {
        sumRating += r;
        validRatings++;
        if (r >= 5) fiveStarCount++;
      }
      const st = it.testimonial_status || it.status || 'Active';
      if (st === 'Active') activeCount++;
    });

    const avgRating = validRatings > 0 ? (sumRating / validRatings).toFixed(1) : '5.0';

    return { total, avgRating, fiveStarCount, activeCount };
  }, [items, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Testimonials Management" />

        <main className="flex-1 p-5 md:p-7 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#E8E3DA] text-[#9E7432] shadow-2xs">
                  <Quote className="h-4 w-4" />
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#1A1817] tracking-tight">
                  Client Reviews & Testimonials
                </h2>
              </div>
              <p className="text-xs text-[#7A7369] mt-1">
                Collect and manage authentic customer ratings, feedback, and website reviews.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchTestimonials(currentPage, searchQuery, statusFilter)}
                title="Refresh reviews list"
                className="p-2.5 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#9E7432]' : ''}`} />
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Add Testimonial</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">Total Reviews</p>
                <h3 className="text-xl font-bold text-[#1A1817] mt-0.5">{stats.total}</h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center">
                <Quote className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">Average Rating</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <h3 className="text-xl font-bold text-[#D4A038]">{stats.avgRating}</h3>
                  <Star className="h-4 w-4 fill-[#D4A038] text-[#D4A038]" />
                </div>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#FFF9E6] text-[#D4A038] border border-[#FCE8AE] flex items-center justify-center">
                <Award className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">5-Star Reviews</p>
                <h3 className="text-xl font-bold text-[#1E7E34] mt-0.5">{stats.fiveStarCount}</h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] flex items-center justify-center">
                <ThumbsUp className="h-4 w-4" />
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

          {/* Search, Filter Tabs & View Switcher */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E8E3DA] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client name, category or review..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
              />
            </form>

            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              
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

              {/* View Mode Toggle */}
              <div className="inline-flex rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-md transition cursor-pointer ${
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
                  className={`p-1.5 rounded-md transition cursor-pointer ${
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
              <p className="text-xs font-medium text-[#78716C]">Loading client reviews...</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <Quote className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No testimonials found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? 'No reviews match your current filters. Try adjusting your query or status tab.'
                  : 'You have not added any testimonials yet. Add your customer feedback to showcase social proof.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Add First Testimonial</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW ── */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedItems.map((item, index) => {
                  const id = item.id;
                  const clientName = item.testimonial_client_name || item.client_name || item.name || 'Anonymous';
                  const category = item.testimonial_for || item.category || 'General';
                  const rating = Number(item.testimonial_rating || item.rating || 5);
                  const description = item.testimonial_description || item.description || item.comment || '';
                  const status = item.testimonial_status || item.status || 'Active';
                  const isActive = status === 'Active';
                  const date = item.created_at || item.createdDate || item.date;

                  return (
                    <div
                      key={id || index}
                      className="group bg-white rounded-2xl border border-[#E8E3DA] p-5 shadow-2xs hover:shadow-md hover:border-[#C99C4B]/50 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Card Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1817] text-[#FAF8F5] text-xs font-bold shadow-2xs flex-shrink-0">
                              {clientName[0]?.toUpperCase() || 'C'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#1A1817] truncate">
                                {clientName}
                              </h4>
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8C8275] truncate">
                                <Tag className="h-2.5 w-2.5 text-[#9E7432]" />
                                {category}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
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

                        {/* Star Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= rating
                                ? 'fill-[#D4A038] text-[#D4A038]'
                                : 'text-[#DDD7CD] fill-transparent'
                              }`}
                            />
                          ))}
                          <span className="font-mono text-[11px] font-bold text-[#8C8275] ml-1">
                            {rating}.0
                          </span>
                        </div>

                        {/* Review Quote Text */}
                        <div className="relative">
                          <p className="text-xs text-[#4A443D] leading-relaxed line-clamp-3 italic">
                            "{description}"
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-4 pt-3 border-t border-[#F0ECE3] flex items-center justify-between text-[11px] text-[#8C8275]">
                        <span>{formatDate(date)}</span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(item)}
                            className="p-1.5 rounded-lg hover:bg-[#FAF8F5] text-[#5C554B] hover:text-[#1A1817] transition cursor-pointer"
                            title="Read Full Review"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg hover:bg-[#FAF8F5] text-[#5C554B] hover:text-[#9E7432] transition cursor-pointer"
                            title="Edit Testimonial"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
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
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Category / Page</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3 max-w-xs">Review Snippet</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {displayedItems.map((item, index) => {
                      const id = item.id;
                      const clientName = item.testimonial_client_name || item.client_name || item.name || 'Anonymous';
                      const category = item.testimonial_for || item.category || 'General';
                      const rating = Number(item.testimonial_rating || item.rating || 5);
                      const description = item.testimonial_description || item.description || item.comment || '';
                      const status = item.testimonial_status || item.status || 'Active';
                      const isActive = status === 'Active';
                      const rowNumber = (currentPage - 1) * perPage + index + 1;
                      const date = item.created_at || item.createdDate || item.date;

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                          
                          {/* Client */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1817] text-[#FAF8F5] text-[11px] font-bold">
                                {clientName[0]?.toUpperCase() || 'C'}
                              </div>
                              <span className="font-semibold text-[#1A1817]">{clientName}</span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3 text-[#5C554B]">
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD5] text-[11px]">
                              {category}
                            </span>
                          </td>

                          {/* Star Rating */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-[#D4A038] text-[#D4A038]" />
                              <span className="font-mono font-bold text-[#1A1817]">{rating}.0</span>
                            </div>
                          </td>

                          {/* Snippet */}
                          <td className="px-4 py-3 text-[#78716C] max-w-xs truncate italic">
                            "{description}"
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
                                title="Read Review"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Review"
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

      {/* Add / Edit Testimonial Modal */}
      <TestimonialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        editingId={editingId}
        submitting={submitting}
      />

      {/* View Testimonial Modal */}
      <TestimonialViewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        onEdit={(it) => handleOpenEditModal(it)}
      />
    </div>
  );
}
