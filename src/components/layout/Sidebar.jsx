import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuthContext } from '../../context/AuthContext';
import LogoutConfirmModal from '../common/LogoutConfirmModal';
import { 
  LayoutDashboard, 
  Layers,
  FileText,
  MessageSquareText,
  Mail,
  LogOut 
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', to: '/', exact: true, icon: LayoutDashboard },
  { label: 'Categories', to: '/category', icon: Layers },
  { label: 'Blogs', to: '/blog', icon: FileText },
  { label: 'Enquiries', to: '/enquiry', icon: MessageSquareText },
  { label: 'Newsletter', to: '/newsletter', icon: Mail },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { companyInfo, companyLogoUrl } = useAppContext();
  const { user, logout } = useAuthContext();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/login');
    } catch (err) {
      toast.error('Logout completed.');
      navigate('/login');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  return (
    <>
      <aside className="sticky top-0 flex h-screen w-60 flex-col justify-between border-r border-[#E8E3DA] bg-[#F7F4EE] px-3.5 py-4 text-[#1A1817] select-none flex-shrink-0 z-30">
        
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-2.5 px-2 pb-3.5 border-b border-[#E8E3DA]">
            {companyLogoUrl ? (
              <img
                src={companyLogoUrl}
                alt={companyInfo?.company_name || 'AG Solutions'}
                className="h-7 w-auto max-w-[110px] object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1817] text-[#FAF8F5] font-bold text-xs shadow-2xs">
                {companyInfo?.company_short || 'AGS'}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-[#1A1817] truncate tracking-tight">
                {companyInfo?.company_name || 'AG Solutions'}
              </h1>
              <p className="text-[10px] font-medium tracking-wide text-[#8C8275]">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Clean Navigation Links */}
          <nav className="mt-4 space-y-1">
            {navItems.map(({ label, to, exact, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#1A1817] text-[#FAF8F5] shadow-2xs font-semibold'
                      : 'text-[#5C554B] hover:bg-[#EDE8DE] hover:text-[#1A1817]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#C99C4B]' : 'text-[#8C8275]'}`} />
                    <span className="flex-1 tracking-tight">{label}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C99C4B]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Clickable Admin Profile Footer & Logout Button */}
        <div className="border-t border-[#E8E3DA] pt-3 px-1 flex items-center justify-between">
          <div
            onClick={() => navigate('/profile')}
            title="View & Edit Profile"
            className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-lg hover:bg-[#EDE8DE] transition cursor-pointer group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5DFD5] group-hover:bg-[#1A1817] group-hover:text-[#FAF8F5] text-xs font-semibold text-[#1A1817] transition shadow-2xs">
              {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#1A1817] truncate transition">
                {user?.name || user?.username || 'admin'}
              </div>
              <div className="text-[10px] text-[#8C8275]">
                {companyInfo?.company_place || 'Bangalore'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setLogoutModalOpen(true)}
            title="Logout"
            className="p-1.5 text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FBEAEA] rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

      </aside>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        submitting={loggingOut}
      />
    </>
  );
};

export default Sidebar;

