import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Save, AlertCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';

export default function GalleryModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPreviews, setSelectedPreviews] = useState([]);
  const [singlePreviewUrl, setSinglePreviewUrl] = useState(null);
  const [fileError, setFileError] = useState('');

  // Synchronize previews when modal opens or form changes
  useEffect(() => {
    if (isOpen) {
      setFileError('');
      if (editingId) {
        // Edit mode (single image)
        if (form.gallery_image instanceof File) {
          const objectUrl = URL.createObjectURL(form.gallery_image);
          setSinglePreviewUrl(objectUrl);
          return () => URL.revokeObjectURL(objectUrl);
        } else if (form.existing_image_url) {
          setSinglePreviewUrl(form.existing_image_url);
        } else {
          setSinglePreviewUrl(null);
        }
      } else {
        // Multi-image upload mode
        if (Array.isArray(form.gallery_images) && form.gallery_images.length > 0) {
          const previews = form.gallery_images.map((file) => ({
            file,
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            url: URL.createObjectURL(file),
            name: file.name,
            size: (file.size / 1024).toFixed(0),
          }));
          setSelectedPreviews(previews);

          return () => {
            previews.forEach((p) => URL.revokeObjectURL(p.url));
          };
        } else if (form.gallery_image instanceof File) {
          const singleObj = {
            file: form.gallery_image,
            id: `${form.gallery_image.name}-${form.gallery_image.lastModified}`,
            url: URL.createObjectURL(form.gallery_image),
            name: form.gallery_image.name,
            size: (form.gallery_image.size / 1024).toFixed(0),
          };
          setSelectedPreviews([singleObj]);
          return () => URL.revokeObjectURL(singleObj.url);
        } else {
          setSelectedPreviews([]);
        }
      }
    } else {
      setSelectedPreviews([]);
      setSinglePreviewUrl(null);
      setFileError('');
    }
  }, [isOpen, editingId, form.gallery_image, form.gallery_images, form.existing_image_url]);

  if (!isOpen) return null;

  const validateAndAddFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = [];
    let hasInvalidType = false;
    let hasOversized = false;

    Array.from(fileList).forEach((file) => {
      const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
      if (!isWebp) {
        hasInvalidType = true;
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        hasOversized = true;
        return;
      }
      validFiles.push(file);
    });

    if (hasInvalidType) {
      setFileError('Only WEBP images (.webp) are supported.');
    } else if (hasOversized) {
      setFileError('Some files exceed the 10MB limit and were skipped.');
    } else {
      setFileError('');
    }

    if (validFiles.length === 0) return;

    if (editingId) {
      // Single replacement in edit mode
      setForm((prev) => ({
        ...prev,
        gallery_image: validFiles[0],
      }));
    } else {
      // Append in multi-upload mode
      setForm((prev) => {
        const currentList = Array.isArray(prev.gallery_images) ? prev.gallery_images : [];
        const merged = [...currentList, ...validFiles];
        return {
          ...prev,
          gallery_images: merged,
          gallery_image: merged[0] || null,
        };
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setForm((prev) => {
      const currentList = Array.isArray(prev.gallery_images) ? prev.gallery_images : [];
      const updated = currentList.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        gallery_images: updated,
        gallery_image: updated[0] || null,
      };
    });
  };

  const handleClearAll = () => {
    setForm((prev) => ({
      ...prev,
      gallery_images: [],
      gallery_image: null,
      existing_image_url: null,
    }));
    setSelectedPreviews([]);
    setSinglePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleStatusChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, gallery_status: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!editingId) {
      const count = Array.isArray(form.gallery_images) ? form.gallery_images.length : form.gallery_image ? 1 : 0;
      if (count === 0) {
        setFileError('Please select at least one WEBP image to upload.');
        return;
      }
    }
    onSubmit(e);
  };

  const totalSelectedCount = editingId
    ? form.gallery_image || form.existing_image_url ? 1 : 0
    : Array.isArray(form.gallery_images) ? form.gallery_images.length : (form.gallery_image ? 1 : 0);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit Gallery Photo' : 'Upload Gallery Photos'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Update photo file or change display status' : 'Select and upload multiple high-resolution WEBP photos'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] border border-[#E2DDD5] bg-white transition cursor-pointer shadow-2xs flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,.webp"
            multiple={!editingId}
            className="hidden"
            onChange={(e) => validateAndAddFiles(e.target.files)}
          />

          {/* EDIT MODE (Single Image Preview) */}
          {editingId ? (
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Gallery Image
              </label>

              {singlePreviewUrl ? (
                <div className="relative rounded-xl border border-[#E2DDD5] bg-[#F7F4EE] p-3 overflow-hidden group">
                  <div className="flex items-center justify-center max-h-56 overflow-hidden rounded-lg bg-black/5">
                    <img
                      src={singlePreviewUrl}
                      alt="Gallery Preview"
                      className="max-h-52 w-auto object-contain rounded-lg shadow-2xs"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#78716C] truncate max-w-[240px]">
                      {form.gallery_image instanceof File ? form.gallery_image.name : 'Current Image'}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Replace WEBP Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all border-[#DDD7CD] bg-[#FAF8F5] hover:border-[#C99C4B] hover:bg-[#F7F4EE]"
                >
                  <Upload className="h-6 w-6 text-[#9E7432] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#1A1817]">Select Replacement WEBP Photo</p>
                  <p className="text-[11px] text-[#8C8275] mt-1">Supports WEBP only (Max 10MB)</p>
                </div>
              )}
            </div>
          ) : (
            /* CREATE MODE (Multiple Image Upload & Preview Grid) */
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#3D372E]">
                  Select Photos <span className="text-[#9A2D2D]">*</span>
                </label>
                {selectedPreviews.length > 0 && (
                  <span className="text-xs font-medium text-[#8C6527] bg-[#FBF4E8] px-2.5 py-0.5 rounded-full border border-[#F2E4C9]">
                    {selectedPreviews.length} {selectedPreviews.length === 1 ? 'photo' : 'photos'} selected
                  </span>
                )}
              </div>

              {selectedPreviews.length > 0 ? (
                <div className="space-y-3">
                  {/* Thumbnails Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 rounded-xl border border-[#E2DDD5] bg-[#F7F4EE]">
                    {selectedPreviews.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="relative group rounded-xl border border-[#E8E3DA] bg-white overflow-hidden shadow-2xs"
                      >
                        <div className="h-28 w-full bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
                          <img
                            src={item.url}
                            alt={item.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="p-2 flex items-center justify-between text-[11px] bg-white">
                          <div className="min-w-0 pr-1">
                            <p className="font-medium text-[#1A1817] truncate">{item.name}</p>
                            <p className="text-[10px] text-[#8C8275]">{item.size} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1 rounded-md text-[#9C9488] hover:text-[#9A2D2D] hover:bg-[#FDF0F0] transition cursor-pointer flex-shrink-0"
                            title="Remove photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Multi-action toolbar */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-semibold text-[#3D372E] transition cursor-pointer shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#8C6527]" />
                      <span>Add More Photos</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs text-[#9A2D2D] hover:underline cursor-pointer font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Dropzone */
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#C99C4B] bg-[#FBF7EE]'
                      : 'border-[#DDD7CD] bg-[#FAF8F5] hover:border-[#C99C4B] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EFE3] text-[#9E7432] mb-3 shadow-2xs">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#1A1817]">
                    Click to browse or drag and drop WEBP photos
                  </p>
                  <p className="text-[11px] text-[#8C8275] mt-1">
                    Select one or multiple photos (WEBP only, up to 10MB each)
                  </p>
                </div>
              )}
            </div>
          )}

          {fileError && (
            <div className="flex items-center gap-1.5 text-xs text-[#9A2D2D] bg-[#FDF0F0] border border-[#F6C8C8] p-2.5 rounded-xl">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
              Publication Status
            </label>
            <select
              name="gallery_status"
              value={form.gallery_status || 'Active'}
              onChange={handleStatusChange}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs cursor-pointer"
            >
              <option value="Active">Active (Visible in Gallery)</option>
              <option value="Inactive">Inactive (Hidden)</option>
            </select>
          </div>

          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-end gap-3 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-[#C99C4B]" />
              <span>
                {submitting
                  ? 'Uploading...'
                  : editingId
                  ? 'Update Photo'
                  : totalSelectedCount > 1
                  ? `Upload ${totalSelectedCount} Photos`
                  : 'Upload Photo'}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
