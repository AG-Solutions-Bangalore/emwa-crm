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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] text-xs text-[#78716C]">
      
      {/* Entry counter text */}
      <div>
        Showing <span className="font-semibold text-[#1A1817]">{startEntry}</span> to{' '}
        <span className="font-semibold text-[#1A1817]">{endEntry}</span> of{' '}
        <span className="font-semibold text-[#1A1817]">{totalCount}</span> entries
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="First Page"
          className="p-1.5 rounded-lg border border-[#E2DDD5] bg-white text-[#4A443D] hover:bg-[#EFECE6] disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
          className="p-1.5 rounded-lg border border-[#E2DDD5] bg-white text-[#4A443D] hover:bg-[#EFECE6] disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((num, idx) => {
          if (num === '...') {
            return (
              <span key={`dots-${idx}`} className="px-1.5 text-xs text-[#9C9488]">
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
                  ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                  : 'text-[#4A443D] hover:bg-[#EFECE6] bg-white border border-[#E2DDD5]'
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
          className="p-1.5 rounded-lg border border-[#E2DDD5] bg-white text-[#4A443D] hover:bg-[#EFECE6] disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last Page"
          className="p-1.5 rounded-lg border border-[#E2DDD5] bg-white text-[#4A443D] hover:bg-[#EFECE6] disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
}

