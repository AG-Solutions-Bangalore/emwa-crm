import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ProfilePage from '../pages/ProfilePage';
import DashboardPage from '../pages/DashboardPage';
import CategoryPage from '../pages/CategoryPage';
import BlogPage from '../pages/BlogPage';
import BlogFormPage from '../pages/BlogFormPage';
import BlogViewPage from '../pages/BlogViewPage';
import EnquiryPage from '../pages/EnquiryPage';
import NewsletterPage from '../pages/NewsletterPage';
import GalleryPage from '../pages/GalleryPage';
import FaqPage from '../pages/FaqPage';
import TestimonialPage from '../pages/TestimonialPage';
import ClientPage from '../pages/ClientPage';
import GroupPage from '../pages/GroupPage';
import ContactPage from '../pages/ContactPage';
import HolidayPage from '../pages/HolidayPage';
import TemplatePage from '../pages/TemplatePage';
import TemplateFormPage from '../pages/TemplateFormPage';
import PipelinePage from '../pages/PipelinePage';
import WhatsAppCampaignPage from '../pages/WhatsAppCampaignPage';
import EmailCampaignPage from '../pages/EmailCampaignPage';
import EmailCampaignFormPage from '../pages/EmailCampaignFormPage';
import EmailCampaignViewPage from '../pages/EmailCampaignViewPage';
import CompanyPage from '../pages/CompanyPage';
import AuthRoute from './AuthRoute';
import ProtectedRoute from './ProtectedRoute';

import { useAuthContext } from '../context/AuthContext';

export default function AppRoutes() {
  const { hasEmail, hasWhatsApp } = useAuthContext();

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected Routes (Require Token) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/company" element={<CompanyPage />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/group" element={<GroupPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/holiday" element={<HolidayPage />} />
        <Route path="/template" element={<TemplatePage />} />
        <Route path="/template/create" element={<TemplateFormPage />} />
        <Route path="/template/add" element={<TemplateFormPage />} />
        <Route path="/template/edit/:id" element={<TemplateFormPage />} />
        
        {/* WhatsApp-only Routes */}
        <Route
          path="/pipeline"
          element={hasWhatsApp ? <PipelinePage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/whatsapp-campaign"
          element={hasWhatsApp ? <WhatsAppCampaignPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/whatsappcampaign"
          element={hasWhatsApp ? <WhatsAppCampaignPage /> : <Navigate to="/dashboard" replace />}
        />

        {/* Email-only Routes */}
        <Route
          path="/email-campaign"
          element={hasEmail ? <EmailCampaignPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/email-campaign/create"
          element={hasEmail ? <EmailCampaignFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/email-campaign/add"
          element={hasEmail ? <EmailCampaignFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/email-campaign/view/:id"
          element={hasEmail ? <EmailCampaignViewPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/emailcampaign"
          element={hasEmail ? <EmailCampaignPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/emailcampaign/create"
          element={hasEmail ? <EmailCampaignFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/emailcampaign/add"
          element={hasEmail ? <EmailCampaignFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/emailcampaign/view/:id"
          element={hasEmail ? <EmailCampaignViewPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/newsletter"
          element={hasEmail ? <NewsletterPage /> : <Navigate to="/dashboard" replace />}
        />

        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/create" element={<BlogFormPage />} />
        <Route path="/blog/add" element={<BlogFormPage />} />
        <Route path="/blog/edit/:id" element={<BlogFormPage />} />
        <Route path="/blog/view/:id" element={<BlogViewPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/testimonial" element={<TestimonialPage />} />
        <Route path="/client" element={<ClientPage />} />
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/category" replace />} />
    </Routes>
  );
}
