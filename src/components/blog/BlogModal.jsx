import React, { useState, useEffect } from 'react';
import { X, Save, Image, Sparkles, Upload, FileText, Globe, Check } from 'lucide-react';
import { getActiveCategories } from '../../services/categoryApi';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function BlogModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
}) {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch active categories for dropdown
      getActiveCategories()
        .then((res) => {
          const list = res?.data?.data || res?.data || res?.categories || res || [];
          if (Array.isArray(list)) setCategories(list);
        })
        .catch(() => {});
      
      // Set existing image preview if editing
      if (form.banner_image_url) {
        setPreviewImage(form.banner_image_url);
      } else {
        setPreviewImage(null);
      }
    }
  }, [isOpen, form.banner_image_url]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked ? '1' : '0' }));
    } else {
      setForm((prev) => {
        const next = { ...prev, [name]: value };
        // Auto-generate slug on new blogs if user types title
        if (name === 'blog_title' && !editingId && !prev.manualSlug) {
          next.blog_slug = slugify(value);
        }
        return next;
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, blog_banner_image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleGenerateSlug = () => {
    setForm((prev) => ({
      ...prev,
      blog_slug: slugify(prev.blog_title || ''),
      manualSlug: true,
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit Article' : 'Create New Article'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Update blog article details, media, and SEO' : 'Publish a new blog post to your portal'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8C8275] hover:text-[#1A1817] hover:bg-[#EFECE6] transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#E8E3DA] bg-[#FAF8F5]/50">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'general'
                ? 'border-[#1A1817] text-[#1A1817] font-semibold'
                : 'border-transparent text-[#78716C] hover:text-[#1A1817]'
            }`}
          >
            General & Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`pb-2.5 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'media'
                ? 'border-[#1A1817] text-[#1A1817] font-semibold'
                : 'border-transparent text-[#78716C] hover:text-[#1A1817]'
            }`}
          >
            Banner Image
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`pb-2.5 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'seo'
                ? 'border-[#1A1817] text-[#1A1817] font-semibold'
                : 'border-transparent text-[#78716C] hover:text-[#1A1817]'
            }`}
          >
            SEO & Visibility
          </button>
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: GENERAL & CONTENT */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Article Title <span className="text-[#9A2D2D]">*</span>
                </label>
                <input
                  type="text"
                  name="blog_title"
                  value={form.blog_title || ''}
                  onChange={handleChange}
                  placeholder="e.g. Top 10 Luxury Wedding Card Trends of 2026..."
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#3D372E]">
                      URL Slug <span className="text-[#9A2D2D]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="text-xs text-[#8C6527] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Sparkles className="h-3 w-3" />
                      Auto Slug
                    </button>
                  </div>
                  <input
                    type="text"
                    name="blog_slug"
                    value={form.blog_slug || ''}
                    onChange={handleChange}
                    placeholder="top-10-luxury-wedding-cards..."
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Category
                  </label>
                  <select
                    name="blog_categories_ids"
                    value={form.blog_categories_ids || ''}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((cat) => {
                      const id = cat.id;
                      const name = cat.category_name || cat.categories || cat.name || `Category #${id}`;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Short Summary / Excerpt
                </label>
                <textarea
                  name="blog_short_description"
                  rows={2}
                  value={form.blog_short_description || ''}
                  onChange={handleChange}
                  placeholder="Brief synopsis displayed on card previews and search results..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Full Article Body
                </label>
                <textarea
                  name="blog_description"
                  rows={6}
                  value={form.blog_description || ''}
                  onChange={handleChange}
                  placeholder="Write the full content of your blog post here..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BANNER IMAGE */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Banner Image
                </label>
                <div className="border-2 border-dashed border-[#E2DDD5] rounded-2xl p-6 text-center bg-[#FAF8F5] hover:bg-[#F5F2EB] transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  {previewImage ? (
                    <div className="space-y-2">
                      <img
                        src={previewImage}
                        alt="Banner Preview"
                        className="h-40 w-full max-w-sm mx-auto object-cover rounded-xl border border-[#E8E3DA] shadow-xs"
                      />
                      <p className="text-xs text-[#8C6527] font-medium">
                        Click or drag a new image to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <div className="h-11 w-11 rounded-xl bg-white border border-[#E2DDD5] flex items-center justify-center mx-auto text-[#9C9488]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-[#1A1817]">Upload Banner Image</p>
                      <p className="text-xs text-[#8C8275]">Supports PNG, JPG, WEBP (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Banner Image Alt Text
                </label>
                <input
                  type="text"
                  name="blog_banner_image_alt"
                  value={form.blog_banner_image_alt || ''}
                  onChange={handleChange}
                  placeholder="Accessible description of the image for SEO..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SEO & VISIBILITY */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Meta Keywords (SEO)
                </label>
                <input
                  type="text"
                  name="blog_meta_keywords"
                  value={form.blog_meta_keywords || ''}
                  onChange={handleChange}
                  placeholder="wedding cards, invitations, luxury stationery..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Publication Status
                  </label>
                  <select
                    name="blog_status"
                    value={form.blog_status || 'Active'}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                  >
                    <option value="Active">Active (Published)</option>
                    <option value="Inactive">Inactive (Draft/Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Search Engine Indexing
                  </label>
                  <select
                    name="blog_index"
                    value={String(form.blog_index ?? '1')}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                  >
                    <option value="1">Index (Search visible)</option>
                    <option value="0">No-Index (Hidden from Google)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] cursor-pointer hover:bg-[#F5F2EB] transition">
                  <input
                    type="checkbox"
                    name="blog_featured"
                    checked={String(form.blog_featured) === '1' || form.blog_featured === true || form.blog_featured === 'Active'}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-[#DDD7CD] text-[#1A1817] focus:ring-[#C99C4B] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-xs text-[#1A1817] block">Featured Article</span>
                    <span className="text-xs text-[#8C8275]">Pin to featured spotlight section</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] cursor-pointer hover:bg-[#F5F2EB] transition">
                  <input
                    type="checkbox"
                    name="blog_front"
                    checked={String(form.blog_front) === '1' || form.blog_front === true || form.blog_front === 'Active'}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-[#DDD7CD] text-[#1A1817] focus:ring-[#C99C4B] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-xs text-[#1A1817] block">Show on Homepage</span>
                    <span className="text-xs text-[#8C8275]">Display on main website landing page</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#E8E3DA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {['general', 'media', 'seo'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`h-2 w-7 rounded-full transition-all ${
                    activeTab === tab ? 'bg-[#1A1817]' : 'bg-[#E2DDD5]'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-medium text-[#4A443D] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
              >
                <Save className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>{submitting ? 'Saving...' : editingId ? 'Update Article' : 'Publish Article'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
