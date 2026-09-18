import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ProfilePage from '../pages/ProfilePage';
import DashboardPage from '../pages/DashboardPage';
import CategoryPage from '../pages/CategoryPage';
import BlogPage from '../pages/BlogPage';
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
import PipelinePage from '../pages/PipelinePage';
import WhatsAppCampaignPage from '../pages/WhatsAppCampaignPage';
import EmailCampaignPage from '../pages/EmailCampaignPage';
import AuthRoute from './AuthRoute';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected Routes (Require Token) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/category" replace />} />
        {/* <Route path="/" element={<DashboardPage />} /> */}
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/group" element={<GroupPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/holiday" element={<HolidayPage />} />
        <Route path="/template" element={<TemplatePage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/whatsapp-campaign" element={<WhatsAppCampaignPage />} />
        <Route path="/whatsappcampaign" element={<WhatsAppCampaignPage />} />
        <Route path="/email-campaign" element={<EmailCampaignPage />} />
        <Route path="/emailcampaign" element={<EmailCampaignPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/testimonial" element={<TestimonialPage />} />
        <Route path="/client" element={<ClientPage />} />
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/category" replace />} />
    </Routes>
  );
}
