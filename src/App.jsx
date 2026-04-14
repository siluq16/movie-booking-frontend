import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import HomePage from './pages/Home/HomePage'
import MovieDetailPage from './pages/Movie/MovieDetailPage'
import SeatSelectionPage from './pages/Booking/SeatSelectionPage'
import FoodPage from './pages/Booking/FoodPage'
import PaymentPage from './pages/Booking/PaymentPage'
import BookingSuccessPage from './pages/Booking/BookingSuccessPage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import ProfilePage from './pages/Auth/ProfilePage'
import CinemasPage from './pages/Cinemas/CinemasPage'
import PromotionsPage from './pages/Promotions/PromotionsPage'
import ContactPage from './pages/Contact/ContactPage'
import AdminDashboard from './pages/Admin/Dashboard'
import ManageMovies from './pages/Admin/ManageMovies'
import ManageShowtimes from './pages/Admin/ManageShowtimes'
import ManageCinemas from './pages/Admin/ManageCinemas'
import ManageCinemasDetail from './pages/Admin/ManageCinemasDetail'
import ManagePromotions from './pages/Admin/ManagePromotions'
import ManagePeople from './pages/Admin/ManagePeople'
import ManagePricing from './pages/Admin/ManagePricing'
import ManageUsers from './pages/Admin/ManageUsers'
import ManageFood from './pages/Admin/ManageFood'
import Revenue from './pages/Admin/Revenue'
import ManageOrders from './pages/Admin/ManageOrders'
import NotificationsPage from './pages/Notifications/NotificationsPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/Auth/ResetPasswordPage'
import ScrollToTop from './components/common/ScrollToTop'

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/booking/:showtimeId/seats" element={<SeatSelectionPage />} />
          <Route path="/booking/:bookingId/food" element={<FoodPage />} />
          <Route path="/booking/:bookingId/payment" element={<PaymentPage />} />
          <Route path="/booking/:bookingId/success" element={<BookingSuccessPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/movies" element={<ManageMovies />} />
          <Route path="/admin/showtimes" element={<ManageShowtimes />} />
          <Route path="/admin/cinemas" element={<ManageCinemas />} />
          <Route path="/admin/cinemas/detail" element={<ManageCinemasDetail />} />
          <Route path="/admin/promotions" element={<ManagePromotions />} />
          <Route path="/admin/people" element={<ManagePeople />} />
          <Route path="/admin/pricing" element={<ManagePricing />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/food" element={<ManageFood />} />
          <Route path="/admin/revenue" element={<Revenue />} />
          <Route path="/admin/orders" element={<ManageOrders />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
