import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import BlogModal from '../components/blog/BlogModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import Pagination from '../components/common/Pagination';
import { 
  getBlogs, 
  getBlogById, 
  createBlog, 
  updateBlog, 
  updateBlogStatus, 
  deleteBlog 
} from '../services/blogApi';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Image as ImageIcon,
  Star,
  Home,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.blogs?.data)) return response.blogs.data;
  if (Array.isArray(response?.blogs)) return response.blogs;
  if (Array.isArray(response?.blog)) return response.blog;
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
  blog_title: '',
  blog_slug: '',
  blog_short_description: '',
  blog_description: '',
  blog_categories_ids: '',
  blog_banner_image: null,
  blog_banner_image_alt: '',
  blog_meta_keywords: '',
  blog_status: 'Active',
  blog_index: '1',
  blog_front: '0',
  blog_featured: '0',
  banner_image_url: null,
};

export default function BlogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── 1. GET /blog with pagination ── */
  const fetchBlogs = async (page = currentPage, query = searchQuery, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status } : {}),
      };

      const res = await getBlogs(params);
      const list = extractList(res);
      setItems(list);

      // Extract pagination metadata
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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch blogs.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(currentPage, searchQuery, statusFilter);
  }, [currentPage, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchBlogs(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchBlogs(newPage, searchQuery, statusFilter);
    }
  };

  /* ── 2. CREATE (POST /blog) & UPDATE (PUT /blog/{id}) ── */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.blog_title.trim()) {
      toast.error('Article title is required.');
      return;
    }
    if (!form.blog_slug.trim()) {
      toast.error('Article URL slug is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await updateBlog(editingId, form);
        toast.success(res?.message || 'Blog updated successfully.');
      } else {
        const res = await createBlog(form);
        toast.success(res?.message || 'Blog published successfully.');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setForm(initialForm);
      fetchBlogs(currentPage, searchQuery, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save blog post.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. EDIT (GET /blog/{id}) ── */
  const handleOpenEdit = async (id) => {
    try {
      const res = await getBlogById(id);
      const data = res?.data?.data || res?.data || res?.blog || res || {};
      setEditingId(id);
      setForm({
        blog_title: data?.blog_title || data?.title || '',
        blog_slug: data?.blog_slug || data?.slug || '',
        blog_short_description: data?.blog_short_description || data?.short_description || '',
        blog_description: data?.blog_description || data?.description || '',
        blog_categories_ids: data?.blog_categories_ids || data?.category_id || '',
        blog_banner_image: null,
        blog_banner_image_alt: data?.blog_banner_image_alt || data?.banner_image_alt || '',
        blog_meta_keywords: data?.blog_meta_keywords || data?.meta_keywords || '',
        blog_status: data?.blog_status || data?.status || 'Active',
        blog_index: String(data?.blog_index ?? '1'),
        blog_front: String(data?.blog_front ?? '0'),
        blog_featured: String(data?.blog_featured ?? '0'),
        banner_image_url: data?.blog_banner_image || data?.banner_image || null,
      });
      setIsModalOpen(true);
    } catch (err) {
      const fallback = items.find((i) => i.id === id);
      setEditingId(id);
      setForm({
        blog_title: fallback?.blog_title || fallback?.title || '',
        blog_slug: fallback?.blog_slug || fallback?.slug || '',
        blog_short_description: fallback?.blog_short_description || fallback?.short_description || '',
        blog_description: fallback?.blog_description || fallback?.description || '',
        blog_categories_ids: fallback?.blog_categories_ids || fallback?.category_id || '',
        blog_banner_image: null,
        blog_banner_image_alt: fallback?.blog_banner_image_alt || fallback?.banner_image_alt || '',
        blog_meta_keywords: fallback?.blog_meta_keywords || fallback?.meta_keywords || '',
        blog_status: fallback?.blog_status || fallback?.status || 'Active',
        blog_index: String(fallback?.blog_index ?? '1'),
        blog_front: String(fallback?.blog_front ?? '0'),
        blog_featured: String(fallback?.blog_featured ?? '0'),
        banner_image_url: fallback?.blog_banner_image || fallback?.banner_image || null,
      });
      setIsModalOpen(true);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  /* ── 4. PATCH /blogs/{id}/status ── */
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, blog_status: nextStatus, status: nextStatus }
          : item
      )
    );

    try {
      const res = await updateBlogStatus(id, nextStatus);
      toast.success(res?.message || `Article set to ${nextStatus}.`);
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, blog_status: currentStatus, status: currentStatus }
            : item
        )
      );
      toast.error(err?.response?.data?.message || 'Unable to update status.');
    }
  };

  /* ── 5. DELETE /blog/{id} ── */
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await deleteBlog(deletingId);
      toast.success(res?.message || 'Blog deleted successfully.');
      setItems((prev) => prev.filter((item) => item.id !== deletingId));
      setDeleteModalOpen(false);
      fetchBlogs(currentPage, searchQuery, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete blog.');
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Blog Management" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Blog Articles
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Create, edit, and curate marketing articles, SEO metadata, and visibility
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchBlogs(currentPage, searchQuery, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-xs font-medium text-[#4A443D] shadow-2xs transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-medium shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>New Article</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs placeholder-[#9C9488]"
              />
            </form>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#78716C]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white shadow-2xs transition cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

          </div>

          {/* Blogs Table Card */}
          <div className="bg-white rounded-xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-[#78716C]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A1817] border-t-transparent mx-auto mb-2" />
                <p className="text-xs font-medium">Loading articles...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-14 text-center text-[#78716C]">
                <div className="h-10 w-10 rounded-xl bg-[#F7F4EE] flex items-center justify-center mx-auto mb-2.5 text-[#9C9488]">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#1A1817]">No blog articles found</p>
                <p className="text-xs text-[#8C8275] mt-0.5">
                  {searchQuery ? 'No article matches your search keyword' : 'Click "New Article" to publish your first blog post'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#3D372E]">
                    <thead className="bg-[#F7F4EE] border-b border-[#E8E3DA] text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5 w-14">#</th>
                        <th className="px-4 py-2.5">Article</th>
                        <th className="px-4 py-2.5">Slug</th>
                        <th className="px-4 py-2.5">Badges</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE3]">
                      {items.map((item, index) => {
                        const id = item.id;
                        const title = item.blog_title || item.title || 'Untitled Article';
                        const slug = item.blog_slug || item.slug || '—';
                        const image = item.blog_banner_image || item.banner_image;
                        const status = item.blog_status || item.status || 'Active';
                        const isFeatured = String(item.blog_featured) === '1' || item.blog_featured === 'Active';
                        const isFront = String(item.blog_front) === '1' || item.blog_front === 'Active';
                        const isActive = status === 'Active';
                        const date = item.created_at || item.createdDate || item.date;
                        const rowNumber = (currentPage - 1) * perPage + index + 1;

                        return (
                          <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                            
                            {/* Article Details & Image Thumbnail */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={title}
                                    className="h-8 w-12 rounded-lg object-cover border border-[#E8E3DA] flex-shrink-0"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="h-8 w-12 rounded-lg bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
                                    <ImageIcon className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="min-w-0 max-w-xs">
                                  <span className="text-xs font-medium text-[#1A1817] block truncate">{title}</span>
                                  {item.blog_short_description && (
                                    <span className="text-[11px] text-[#8C8275] block truncate mt-0.5">
                                      {item.blog_short_description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Slug */}
                            <td className="px-4 py-3 font-mono text-xs text-[#78716C] max-w-[150px] truncate">
                              /{slug}
                            </td>

                            {/* Visibility Badges */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {isFeatured && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium" title="Featured Article">
                                    <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                    <span>Featured</span>
                                  </span>
                                )}
                                {isFront && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-medium" title="Shown on Homepage">
                                    <Home className="h-2.5 w-2.5 text-indigo-600" />
                                    <span>Home</span>
                                  </span>
                                )}
                                {!isFeatured && !isFront && (
                                  <span className="text-xs text-[#9C9488]">Standard</span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-xs text-[#78716C] whitespace-nowrap">
                              {formatDate(date)}
                            </td>

                            {/* Status Pill & Quick Toggle */}
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleStatus(id, status)}
                                title={`Click to mark ${isActive ? 'Inactive' : 'Active'}`}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC] hover:bg-[#DFF0E1]'
                                    : 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8] hover:bg-[#FBE4E4]'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E6B34]' : 'bg-[#9A2D2D]'}`} />
                                <span>{status}</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEdit(id)}
                                  title="Edit Article"
                                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] transition cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setDeletingId(id);
                                    setDeleteModalOpen(true);
                                  }}
                                  title="Delete Article"
                                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#9A2D2D] hover:bg-[#FDF0F0] transition cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Server Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  perPage={perPage}
                  from={from}
                  to={to}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>

        </main>
      </div>

      {/* Create / Edit Blog Modal */}
      <BlogModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        editingId={editingId}
        submitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Blog Article"
        message="Are you sure you want to delete this blog post? This will remove the article from your website."
        submitting={deleting}
      />
    </div>
  );
}
