import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import GalleryModal from '../components/gallery/GalleryModal';
import GalleryImageViewModal from '../components/gallery/GalleryImageViewModal';
import Pagination from '../components/common/Pagination';
import { useAppContext } from '../context/AppContext';
import {
  getGalleries,
  getGalleryById,
  createGallery,
  updateGallery,
  updateGalleryStatus,
} from '../services/galleryApi';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Eye,
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.gallery?.data)) return response.gallery.data;
  if (Array.isArray(response?.gallery)) return response.gallery;
  if (Array.isArray(response?.galleries?.data)) return response.galleries.data;
  if (Array.isArray(response?.galleries)) return response.galleries;
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
  gallery_image: null,
  gallery_images: [],
  gallery_status: 'Active',
  existing_image_url: null,
};

export default function GalleryPage() {
  const { imageUrlConfig, noImageUrl } = useAppContext();

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

  // Dynamic base gallery images URL prefix from API response
  const [apiGalleryBaseUrl, setApiGalleryBaseUrl] = useState(null);

  const galleryBaseUrl = useMemo(() => {
    if (apiGalleryBaseUrl) return apiGalleryBaseUrl;
    const found = (imageUrlConfig || []).find(
      (i) =>
        i?.image_for?.toLowerCase() === 'gallery' ||
        i?.image_for?.toLowerCase() === 'galleries' ||
        i?.image_for?.toLowerCase() === 'gallery_image' ||
        i?.image_for?.toLowerCase() === 'gallery_images'
    );
    return found?.image_url || 'https://easemarketing.in/emwaapi/public/assets/images/gallerys_images/';
  }, [apiGalleryBaseUrl, imageUrlConfig]);

  // Resolve full image URL helper
  const resolveImageUrl = (imageVal, itemObj = null) => {
    const targetObj = typeof imageVal === 'object' && imageVal !== null ? imageVal : itemObj;
    const rawVal = typeof imageVal === 'string' ? imageVal : (targetObj?.gallery_image || targetObj?.image || targetObj?.file_name);
    
    if (!rawVal) return noImageUrl || '';
    if (rawVal.startsWith('http://') || rawVal.startsWith('https://') || rawVal.startsWith('data:') || rawVal.startsWith('blob:')) {
      return rawVal;
    }

    const baseUrl = targetObj?.gallery_url || targetObj?.image_url || galleryBaseUrl;
    const cleanBase = String(baseUrl).replace(/\/$/, '');
    return `${cleanBase}/${String(rawVal).replace(/^\//, '')}`;
  };

  /* ── 1. GET /gallery with pagination ── */
  const fetchGalleryList = async (page = currentPage, query = searchQuery, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, gallery_status: status } : {}),
      };

      const res = await getGalleries(params);
      const list = extractList(res);
      setItems(list);

      // Extract image base URL from API response
      if (Array.isArray(res?.image_url)) {
        const found = res.image_url.find(
          (img) =>
            img.image_for?.toLowerCase() === 'gallery' ||
            img.image_for?.toLowerCase() === 'galleries' ||
            img.image_for?.toLowerCase() === 'gallery_image' ||
            img.image_for?.toLowerCase() === 'gallery_images'
        );
        if (found?.image_url) {
          setApiGalleryBaseUrl(found.image_url);
        }
      }

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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch gallery images.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryList(currentPage, searchQuery, statusFilter);
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchGalleryList(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchGalleryList(newPage, searchQuery, statusFilter);
    }
  };

  /* ── 2. CREATE (POST /gallery) & UPDATE (PUT /gallery/{id}) ── */
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    setEditingId(item.id);
    setIsModalOpen(true);

    const imageField = item.gallery_image || item.image || item.photo || item.gallery || item.file_name || item.gallery_photo || item.image_name;
    const currentStatus = item.gallery_status || item.status || 'Active';

    setForm({
      gallery_image: null,
      gallery_images: [],
      gallery_status: currentStatus,
      existing_image_url: resolveImageUrl(imageField),
    });

    try {
      const res = await getGalleryById(item.id);
      const freshData = res?.data || res?.gallery || res;
      if (freshData) {
        const freshImage = freshData.gallery_image || freshData.image || freshData.photo || freshData.gallery || freshData.file_name || freshData.gallery_photo || freshData.image_name;
        const freshStatus = freshData.gallery_status || freshData.status || currentStatus;
        setForm({
          gallery_image: null,
          gallery_images: [],
          gallery_status: freshStatus,
          existing_image_url: resolveImageUrl(freshImage),
        });
      }
    } catch (err) {
      // Keep state from table item
    }
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        // PUT /gallery/{id}
        await updateGallery(editingId, form);
        toast.success('Gallery photo updated successfully.');
      } else {
        // POST /gallery (supports multiple photo batch upload)
        const filesToUpload = Array.isArray(form.gallery_images) && form.gallery_images.length > 0
          ? form.gallery_images
          : form.gallery_image
          ? [form.gallery_image]
          : [];

        if (filesToUpload.length === 0) {
          toast.error('Please select at least one WEBP photo.');
          setSubmitting(false);
          return;
        }

        if (filesToUpload.length === 1) {
          await createGallery({
            gallery_image: filesToUpload[0],
            gallery_status: form.gallery_status,
          });
          toast.success('Gallery photo uploaded successfully.');
        } else {
          let successCount = 0;
          let failCount = 0;

          for (const file of filesToUpload) {
            try {
              await createGallery({
                gallery_image: file,
                gallery_status: form.gallery_status,
              });
              successCount++;
            } catch (err) {
              failCount++;
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} photos to gallery.${failCount > 0 ? ` (${failCount} failed)` : ''}`);
          } else {
            toast.error('Failed to upload photos.');
          }
        }
      }

      setIsModalOpen(false);
      setForm(initialForm);
      fetchGalleryList(currentPage, searchQuery, statusFilter);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save gallery photo.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. PATCH /gallerys/{id}/status ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.gallery_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, gallery_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateGalleryStatus(id, nextStatus);
      toast.success(`Photo #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, gallery_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update photo status.';
      toast.error(msg);
    }
  };

  /* ── 4. Preview Modal ── */
  const handleOpenPreview = (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
  };

  // Client-side filtering ensures selected status filter is strictly honored
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const status = String(item.gallery_status || item.status || 'Active').trim().toLowerCase();
      if (statusFilter === 'Active') return status === 'active';
      if (statusFilter === 'Inactive') return status === 'inactive';
      return true;
    });
  }, [items, statusFilter]);

  // Statistics for header metrics
  const stats = useMemo(() => {
    const total = totalCount || items.length;
    const active = items.filter((it) => String(it.gallery_status || it.status || 'Active').trim().toLowerCase() === 'active').length;
    const inactive = items.filter((it) => String(it.gallery_status || it.status || '').trim().toLowerCase() === 'inactive').length;
    return { total, active, inactive };
  }, [items, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Gallery Management" />

        <main className="flex-1 p-5 md:p-7 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Page Top Banner / Title & Primary Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#E8E3DA] text-[#9E7432] shadow-2xs">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#1A1817] tracking-tight">
                  Media Gallery
                </h2>
              </div>
              <p className="text-xs text-[#7A7369] mt-1">
                Upload and manage high-resolution portfolio images, banners, and showcase photos.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchGalleryList(currentPage, searchQuery, statusFilter)}
                title="Refresh gallery list"
                className="p-2.5 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#9E7432]' : ''}`} />
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Upload Photos</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">Total Photos</p>
                <h3 className="text-xl font-bold text-[#1A1817] mt-0.5">{stats.total}</h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">Active (Live)</p>
                <h3 className="text-xl font-bold text-[#1E7E34] mt-0.5">{stats.active}</h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8E3DA] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#8C8275] uppercase">Inactive (Hidden)</p>
                <h3 className="text-xl font-bold text-[#9A2D2D] mt-0.5">{stats.inactive}</h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB] flex items-center justify-center">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Search, Filter Tabs & View Toggle Controls */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E8E3DA] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gallery by ID or keyword..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
              />
            </form>

            {/* Filter Tabs & View Switcher */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              
              {/* Status Filter Tabs */}
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

              {/* View Mode Toggle (Grid / Table) */}
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
              <p className="text-xs font-medium text-[#78716C]">Loading gallery images...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <ImageIcon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No gallery photos found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? `No photos match '${statusFilter}' status filter. Try switching tabs or clearing your search.`
                  : 'Your gallery is currently empty. Start uploading showcase images to present to your customers.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Upload First Photo</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW ── */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {filteredItems.map((item, index) => {
                  const imageField = item.gallery_image || item.image || item.photo || item.gallery || item.file_name || item.gallery_photo || item.image_name;
                  const imageUrl = resolveImageUrl(imageField, item);
                  const status = item.gallery_status || item.status || 'Active';
                  const isActive = status === 'Active';
                  const date = item.created_at || item.createdDate || item.date;

                  return (
                    <div
                      key={item.id || index}
                      className="group bg-white rounded-xl border border-[#E8E3DA] overflow-hidden shadow-2xs hover:shadow-md hover:border-[#C99C4B]/50 transition-all duration-200 flex flex-col"
                    >
                      {/* Image Thumbnail with Overlay Hover Actions */}
                      <div className="relative aspect-4/3 bg-[#F7F4EE] overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Gallery #${item.id}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = noImageUrl || '';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#9E7432] bg-[#FBF4E8]">
                            <ImageIcon className="h-8 w-8 opacity-50" />
                          </div>
                        )}

                        {/* Hover Overlay Controls (Quick Preview & Edit) */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(item)}
                            title="Quick Preview"
                            className="p-2 rounded-full bg-white/90 hover:bg-white text-[#1A1817] shadow-md transition transform hover:scale-110 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Photo"
                            className="p-2 rounded-full bg-white/90 hover:bg-white text-[#1A1817] shadow-md transition transform hover:scale-110 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4 text-[#9E7432]" />
                          </button>
                        </div>

                        {/* Status Badge in Top Left */}
                        <div className="absolute top-2.5 left-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-xs backdrop-blur-xs transition cursor-pointer ${
                              isActive
                                ? 'bg-white/95 text-[#1E7E34] border border-[#C3E6CB]'
                                : 'bg-white/95 text-[#9A2D2D] border border-[#F5C6CB]'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E7E34]' : 'bg-[#9A2D2D]'}`}
                            />
                            {status}
                          </button>
                        </div>

                        {/* ID Tag in Top Right */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="font-mono text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded shadow-xs backdrop-blur-xs">
                            #{item.id}
                          </span>
                        </div>
                      </div>

                      {/* Card Info Footer */}
                      <div className="p-3 bg-white flex items-center justify-between border-t border-[#F0ECE3] text-[11px] text-[#78716C]">
                        <span className="truncate max-w-[140px]">
                          {date ? formatDate(date) : `Photo #${item.id}`}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1 rounded hover:bg-[#FAF8F5] text-[#5C554B] hover:text-[#1A1817] transition cursor-pointer"
                            title="Edit Photo"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#9E7432]" />
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
                      <th className="px-4 py-3 w-28">Preview</th>
                      <th className="px-4 py-3">Item ID</th>
                      <th className="px-4 py-3">Created Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {filteredItems.map((item, index) => {
                      const imageField = item.gallery_image || item.image || item.photo || item.gallery || item.file_name || item.gallery_photo || item.image_name;
                      const imageUrl = resolveImageUrl(imageField, item);
                      const status = item.gallery_status || item.status || 'Active';
                      const isActive = status === 'Active';
                      const rowNumber = (currentPage - 1) * perPage + index + 1;
                      const date = item.created_at || item.createdDate || item.date;

                      return (
                        <tr key={item.id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                          
                          {/* Image Preview */}
                          <td className="px-4 py-3">
                            <div
                              onClick={() => handleOpenPreview(item)}
                              className="h-10 w-16 rounded-lg bg-[#F7F4EE] border border-[#E8E3DA] overflow-hidden cursor-pointer hover:border-[#C99C4B] transition flex items-center justify-center group"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`#${item.id}`}
                                  className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.src = noImageUrl || '';
                                  }}
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-[#9E7432]" />
                              )}
                            </div>
                          </td>

                          {/* Item ID */}
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1A1817]">
                            #{item.id}
                          </td>

                          {/* Created Date */}
                          <td className="px-4 py-3 text-[#78716C]">
                            {formatDate(date)}
                          </td>

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

                          {/* Action Buttons (View & Edit only) */}
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(item)}
                                title="View Full Photo"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Photo"
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
              <div className="bg-white border-t border-[#E8E3DA] p-3">
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
          )}

        </main>
      </div>

      {/* Add / Edit Gallery Modal */}
      <GalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        editingId={editingId}
        submitting={submitting}
      />

      {/* Lightbox / Preview Modal */}
      <GalleryImageViewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        imageUrl={previewItem ? resolveImageUrl(previewItem.gallery_image || previewItem.image || previewItem.photo || previewItem.gallery || previewItem.file_name || previewItem.gallery_photo || previewItem.image_name) : ''}
        onEdit={(it) => handleOpenEditModal(it)}
      />
    </div>
  );
}
