import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Pagination from '../components/common/Pagination';
import StatsSummaryBar from '../components/common/StatsSummaryBar';
import useDebounce from '../hooks/useDebounce';
import { 
  getBlogs, 
  updateBlogStatus 
} from '../services/blogApi';
import { 
  Plus, 
  Search, 
  Edit2, 
  Eye,
  RefreshCw, 
  FileText, 
  Image as ImageIcon,
  Star,
  Home,
  CheckCircle2,
  XCircle,
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

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function BlogPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [imageBaseUrl, setImageBaseUrl] = useState('https://agsdemo.in/ckapi/public/assets/images/blog_images/');

  const debouncedSearch = useDebounce(searchQuery, 350);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  /* ── 1. GET /blog with pagination ── */
  const fetchBlogs = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, blog_status: status } : {}),
      };

      const res = await getBlogs(params);
      const list = extractList(res);
      setItems(list);

      // Extract image base URL from API response
      if (Array.isArray(res?.image_url)) {
        const blogImg = res.image_url.find((img) => img.image_for?.toLowerCase() === 'blog');
        if (blogImg?.image_url) {
          setImageBaseUrl(blogImg.image_url);
        }
      }

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
    fetchBlogs(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchBlogs(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchBlogs(newPage, debouncedSearch, statusFilter);
    }
  };

  /* ── 2. PATCH /blogs/{id}/status ── */
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

  // Metrics
  const activeCount = useMemo(() => {
    return items.filter((item) => {
      const s = String(item.blog_status || item.status || '').toLowerCase();
      return s === 'active' || s === '1';
    }).length;
  }, [items]);

  const inactiveCount = useMemo(() => {
    return items.filter((item) => {
      const s = String(item.blog_status || item.status || '').toLowerCase();
      return s === 'inactive' || s === '0';
    }).length;
  }, [items]);

  const blogStats = useMemo(() => [
    {
      label: 'Total Articles',
      value: totalCount || items.length,
      icon: FileText,
      color: 'emerald',
      filterValue: 'All',
      subtext: 'Published & draft posts',
    },
    {
      label: 'Active Posts',
      value: activeCount,
      icon: CheckCircle2,
      color: 'amber',
      filterValue: 'Active',
      subtext: 'Live on marketing website',
    },
    {
      label: 'Inactive / Drafts',
      value: inactiveCount,
      icon: XCircle,
      color: 'rose',
      filterValue: 'Inactive',
      subtext: 'Unpublished articles',
    },
  ], [items, totalCount, activeCount, inactiveCount]);

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
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => navigate('/blog/create')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>New Article</span>
              </button>
            </div>
          </div>

          {/* Stats Summary Cards */}
          <StatsSummaryBar
            stats={blogStats}
            activeFilter={statusFilter}
            onSelectFilter={(filter) => {
              setStatusFilter(filter);
              setCurrentPage(1);
            }}
          />

          {/* Search & Filter Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs placeholder-[#9C9488]"
              />
            </form>
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
                        const title = item.blog_title || item.blog_meta_title || item.title || item.name || 'Untitled Article';
                        const rawSlug = item.blog_slug || item.slug || item.url_slug || item.article_slug || item.url || '';
                        const slug = rawSlug && rawSlug !== '—' ? rawSlug : slugify(title);
                        const rawImg = item.blog_banner_image || item.banner_image || item.image || item.banner_image_url;
                        const cleanBase = imageBaseUrl.endsWith('/') ? imageBaseUrl : `${imageBaseUrl}/`;
                        const image = rawImg
                          ? (rawImg.startsWith('data:') || rawImg.startsWith('blob:')
                              ? rawImg
                              : rawImg.startsWith('http')
                                ? `${rawImg}${rawImg.includes('?') ? '&' : '?'}t=${item.updated_at ? new Date(item.updated_at).getTime() : index}`
                                : `${cleanBase}${rawImg.startsWith('/') ? rawImg.slice(1) : rawImg}?t=${item.updated_at ? new Date(item.updated_at).getTime() : index}`)
                          : null;
                        const status = item.blog_status || item.status || 'Active';
                        const isFeatured = String(item.blog_featured) === '1' || item.blog_featured === 'Active' || item.blog_featured === true || String(item.featured) === '1';
                        const isFront = String(item.blog_front) === '1' || item.blog_front === 'Active' || item.blog_front === true || String(item.front) === '1' || String(item.is_home) === '1';
                        const isActive = status === 'Active';
                        const date = 
                          item.blog_created_date ||
                          item.blog_updated_date ||
                          item.created_at ||
                          item.createdAt ||
                          item.created_date ||
                          item.createdDate ||
                          item.date ||
                          item.blog_date ||
                          item.publish_date ||
                          item.published_at ||
                          item.publishedAt ||
                          item.post_date ||
                          item.added_on ||
                          item.updated_at ||
                          item.updatedAt;
                        const formattedDate = formatDate(date) || formatDate(new Date());
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
                                  <button
                                    onClick={() => navigate(`/blog/view/${id}`)}
                                    className="text-xs font-medium text-[#1A1817] hover:text-[#C99C4B] transition text-left block truncate cursor-pointer"
                                  >
                                    {title}
                                  </button>
                                  {(item.blog_short_description || item.short_description) && (
                                    <span className="text-[11px] text-[#8C8275] block truncate mt-0.5">
                                      {item.blog_short_description || item.short_description}
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
                              {formattedDate}
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
                                  onClick={() => navigate(`/blog/view/${id}`)}
                                  title="View Article Overview"
                                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] transition cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => navigate(`/blog/edit/${id}`)}
                                  title="Edit Article"
                                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] transition cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
