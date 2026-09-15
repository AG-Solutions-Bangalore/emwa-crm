import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuthContext } from '../../context/AuthContext';

export const Header = ({ title = 'Dashboard' }) => {
  const { companyInfo } = useAppContext();
  const { user } = useAuthContext();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E8E3DA] bg-[#FAF8F5]/90 backdrop-blur-md px-6">
      <div>
        <h2 className="text-sm font-semibold text-[#1A1817] tracking-tight">{title}</h2>
        <p className="text-xs text-[#78716C] font-normal">
          {companyInfo?.company_name || 'AG Solutions'} <span className="text-[#C99C4B] mx-1">•</span> {companyInfo?.company_place || 'Bangalore'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#2D2A26] bg-white border border-[#E8E3DA] px-2.5 py-1 rounded-full shadow-2xs">
          <div className="h-1.5 w-1.5 rounded-full bg-[#1E6B34] ring-2 ring-[#C6E6CC]" />
          <span>{user?.name || user?.username || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;

