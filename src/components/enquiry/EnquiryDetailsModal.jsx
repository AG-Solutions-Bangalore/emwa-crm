import React from 'react';
import { X, MessageSquare, Clock } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') {
    return 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC]';
  }
  if (s === 'processing') {
    return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
  }
  if (s === 'cancel' || s === 'cancelled') {
    return 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8]';
  }
  return 'bg-[#FEF6E9] text-[#9A6218] border-[#FAD8A5]';
}

export default function EnquiryDetailsModal({ isOpen, onClose, enquiry, loading }) {
  const { hasEmail, hasWhatsApp } = useAuthContext();
  if (!isOpen) return null;

  const status = enquiry?.enquiryStatus || enquiry?.enquiry_status || enquiry?.status || 'Pending';
  const name = enquiry?.enquiryFullName || enquiry?.full_name || enquiry?.name || 'N/A';
  const mobile = enquiry?.enquiryMobile || enquiry?.mobile || 'N/A';
  const email = enquiry?.enquiryEmail || enquiry?.email || 'N/A';
  const message = enquiry?.enquiryMessage || enquiry?.message || 'No additional message.';
  const occasion = enquiry?.occasion || enquiry?.occasion_name || enquiry?.enquiryOccasion || 'N/A';
  const weddingDate = enquiry?.enquiryWeddingDate || enquiry?.wedding_date || enquiry?.weddingDate;
  const createdAt = enquiry?.created_at || enquiry?.createdDate || enquiry?.enquiryCreatedDate;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                Enquiry #{enquiry?.id || ''}
              </h3>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border mt-0.5 ${getStatusBadge(status)}`}>
                {status}
              </span>
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {loading ? (
            <div className="py-12 text-center text-[#78716C]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A1817] border-t-transparent mx-auto mb-2" />
              <span className="text-xs">Fetching enquiry details...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Customer Name</span>
                  <span className="font-semibold text-[#1A1817] text-sm">{name}</span>
                </div>

                {hasWhatsApp ? (
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                    <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Mobile</span>
                    <span className="font-semibold text-[#1A1817] text-sm">{mobile}</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                    <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Occasion / Event</span>
                    <span className="font-semibold text-[#1A1817] text-sm">{occasion}</span>
                  </div>
                )}
              </div>

              {hasWhatsApp ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {hasEmail && (
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                      <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Email</span>
                      <span className="font-semibold text-[#1A1817] text-sm break-all">{email}</span>
                    </div>
                  )}

                  <div className={`p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA] ${!hasEmail ? 'col-span-2' : ''}`}>
                    <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Occasion / Event</span>
                    <span className="font-semibold text-[#1A1817] text-sm">{occasion}</span>
                  </div>
                </div>
              ) : hasEmail ? (
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Email</span>
                  <span className="font-semibold text-[#1A1817] text-sm break-all">{email}</span>
                </div>
              ) : null}

              {weddingDate && (
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Event / Wedding Date</span>
                  <span className="font-semibold text-[#1A1817] text-sm">{formatDate(weddingDate)}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Customer Message</span>
                <p className="text-[#3D372E] text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
              </div>

              {createdAt && (
                <div className="flex items-center gap-1.5 text-[#8C8275] text-xs pt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Submitted on {formatDate(createdAt)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex justify-end rounded-b-2xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

