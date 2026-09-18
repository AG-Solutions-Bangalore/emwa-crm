import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Calendar, CheckCircle2, XCircle, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GalleryImageViewModal({
  isOpen,
  onClose,
  item,
  imageUrl,
  onEdit,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const handleCopyLink = () => {
    if (!imageUrl) return;
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    toast.success('Image link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const status = item.gallery_status || item.status || 'Active';
  const isActive = status === 'Active';
  const createdDate = item.created_at || item.createdDate || item.created_date || item.date || item.gallery_date || item.createdAt || item.updated_at || item.updatedAt || item.gallery_created_at || item.timestamp;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl overflow-hidden relative my-auto flex flex-col max-h-[90vh]">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold text-[#8C8275]">
              #{item.id}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                isActive
                  ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
                  : 'bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB]'
              }`}
            >
              {isActive ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {imageUrl && (
              <>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy direct image link"
                  className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#5C554B] transition cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-[#1E7E34]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#5C554B] transition cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] border border-[#E2DDD5] bg-white transition cursor-pointer shadow-2xs flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="bg-[#121110] flex items-center justify-center p-4 min-h-[300px] max-h-[70vh] overflow-auto">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Gallery item #${item.id}`}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="text-center text-[#8C8275] py-12">
              <p className="text-xs">Image unavailable</p>
            </div>
          )}
        </div>

        {/* Footer info & quick actions */}
        <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-between text-xs text-[#78716C]">
          <div className="flex items-center gap-4">
            {createdDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#8C8275]" />
                <span>
                  {new Date(createdDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Edit2 className="h-3 w-3 text-[#C99C4B]" />
                <span>Edit Photo</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
