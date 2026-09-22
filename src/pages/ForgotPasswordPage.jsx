import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { User, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { companyInfo, companyLogoUrl } = useAppContext();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setError('Please enter both username and email.');
      return;
    }

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await sendPasswordResetEmail({
        username: username.trim(),
        email: email.trim(),
      });
      const msg = response?.message || 'Password reset request sent successfully.';
      setMessage(msg);
      toast.success(msg);
    } catch (err) {
      const msg = err.message || 'Unable to send password reset request.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F0] px-4 py-12 select-none text-[#1A1817]">
      <div className="w-full max-w-md rounded-3xl border border-[#E8E3DA] bg-white p-8 sm:p-9 shadow-[0_8px_30px_-6px_rgba(30,25,20,0.08)]">
        
        <div className="mb-7 text-center">
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt={companyInfo?.company_name || 'AG Solutions'}
              className="h-12 w-auto mx-auto object-contain mb-3"
            />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-[#1A1817] text-[#FAF8F5] font-serif font-bold mx-auto flex items-center justify-center text-xl mb-3 shadow-xs">
              {companyInfo?.company_short || 'AGS'}
            </div>
          )}
          <h1 className="font-serif text-2xl font-semibold text-[#1A1817] tracking-tight">Forgot Password</h1>
          <p className="text-xs text-[#7A7369] mt-1">
            Enter your details to receive password recovery instructions
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[#FDF0F0] p-3 text-xs text-[#9A2D2D] border border-[#F6C8C8]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[#EDF7EE] p-3 text-xs text-[#1E6B34] border border-[#C6E6CC]">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">Mobile Number</label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C9488]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter mobile number..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">Registered Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C9488]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-full bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
          >
            {isSubmitting ? 'Sending Request...' : 'Send Reset Instructions'}
          </button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#7A7369] hover:text-[#1A1817] pt-3 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Login</span>
          </Link>
        </form>
      </div>
    </div>
  );
}

