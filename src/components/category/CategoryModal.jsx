import React from 'react';
import { X, Layers, Save } from 'lucide-react';

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  onChange,
  editingId,
  submitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] p-6 sm:p-7 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-[#8C8275] hover:text-[#1A1817] hover:bg-[#EFECE6] transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-[#E8E3DA]">
          <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[#1A1817] tracking-tight">
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h3>
            <p className="text-xs text-[#78716C]">
              {editingId ? 'Update category details and status' : 'Add a new catalog category'}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
              Category Name <span className="text-[#9A2D2D]">*</span>
            </label>
            <input
              type="text"
              name="category_name"
              value={form.category_name}
              onChange={onChange}
              placeholder="e.g. Wedding Cards, Business Cards..."
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {editingId && (
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Category Status
              </label>
              <select
                name="category_status"
                value={form.category_status}
                onChange={onChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="mt-7 pt-4 border-t border-[#E8E3DA] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-[#FAF8F5] hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-[#C99C4B]" />
              <span>{submitting ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

