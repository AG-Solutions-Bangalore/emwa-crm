import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  perPage = 10,
  onPageChange,
  from,
  to,
}) {
  if (totalPages <= 1 && totalCount <= perPage) return null;

  const startEntry = from ?? (totalCount > 0 ? (currentPage - 1) * perPage + 1 : 0);
  const endEntry = to ?? Math.min(currentPage * perPage, totalCount);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#0D0F18]/90 border-t border-[#1F2438] text-xs text-[#94A3B8]">
      
      {/* Entry counter text */}
      <div>
        Showing <span className="font-semibold text-[#00F0FF]">{startEntry}</span> to{' '}
        <span className="font-semibold text-[#00F0FF]">{endEntry}</span> of{' '}
        <span className="font-semibold text-white">{totalCount}</span> entries
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="First Page"
          className="p-1.5 rounded-lg border border-[#1F2438] bg-[#121522] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/50 hover:bg-[#1A1F33] disabled:opacity-30 disabled:hover:bg-[#121522] transition cursor-pointer"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
          className="p-1.5 rounded-lg border border-[#1F2438] bg-[#121522] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/50 hover:bg-[#1A1F33] disabled:opacity-30 disabled:hover:bg-[#121522] transition cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((num, idx) => {
          if (num === '...') {
            return (
              <span key={`dots-${idx}`} className="px-1.5 text-xs text-[#64748B]">
                ...
              </span>
            );
          }

          const isActive = num === currentPage;
          return (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-[#00F0FF]/40'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F33] bg-[#121522] border border-[#1F2438]'
              }`}
            >
              {num}
            </button>
          );
        })}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next Page"
          className="p-1.5 rounded-lg border border-[#1F2438] bg-[#121522] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/50 hover:bg-[#1A1F33] disabled:opacity-30 disabled:hover:bg-[#121522] transition cursor-pointer"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last Page"
          className="p-1.5 rounded-lg border border-[#1F2438] bg-[#121522] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/50 hover:bg-[#1A1F33] disabled:opacity-30 disabled:hover:bg-[#121522] transition cursor-pointer"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
}

