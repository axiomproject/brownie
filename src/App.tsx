import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from '@/context/AuthContext'
import { SidebarProvider } from '@/context/SidebarContext';
import Home from '@/pages/Home'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Menu from '@/pages/Menu'
import ProductDetail from '@/pages/ProductDetail'
import Login from '@/pages/Login'
import { AdminRoute } from '@/components/AdminRoute';
import Dashboard from '@/pages/admin/Dashboard';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PublicRoute } from '@/components/PublicRoute';
import Users from '@/pages/admin/Users';
import Products from '@/pages/admin/Products';
import Orders from '@/pages/admin/Orders';
import Inventory from '@/pages/admin/Inventory';
import { Toaster } from 'sonner';
import PaymentSuccess from '@/pages/payment/PaymentSuccess';
import PaymentFailed from '@/pages/payment/PaymentFailed';
import { CartProvider } from '@/context/CartContext';
import Coupon from '@/pages/admin/Coupon';
import Feedback from '@/pages/admin/Feedback';
import VerifyEmail from "@/pages/VerifyEmail";
import ResetPassword from "@/pages/ResetPassword";
import TrackOrder from '@/pages/TrackOrder';
import FeedbackPage from '@/pages/FeedbackPage';
import Settings from '@/pages/admin/Settings';
import FeedbackDebug from '@/pages/debug/FeedbackDebug';
import Contacts from '@/pages/admin/Contacts';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <AuthProvider>
          {({ user }) => (
            <CartProvider userId={user?._id}>
              <Toaster richColors closeButton position="top-right" />
              <Routes>
                {/* Public routes with Navbar */}
                <Route element={<PublicRoute />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/menu/:id" element={<ProductDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                </Route>

                {/* Standalone routes (no navbar) */}
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/track-order/:orderId" element={<TrackOrder />} />
                <Route path="/feedback/:orderId" element={<FeedbackPage />} />
                
                {/* Payment routes */}
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failed" element={<PaymentFailed />} />

                {/* Debug routes */}
                <Route path="/debug/feedbacks" element={<FeedbackDebug />} />

                {/* Admin routes */}
                <Route path="/admin/*" element={
                  <AdminRoute>
                    <SidebarProvider>
                      <AdminLayout>
                        <Routes>
                          <Route index element={<Dashboard />} />
                          <Route path="users" element={<Users />} />
                          <Route path="products" element={<Products />} />
                          <Route path="orders" element={<Orders />} />
                          <Route path="inventory" element={<Inventory />} />
                          <Route path="coupons" element={<Coupon />} />
                          <Route path="feedbacks" element={<Feedback />} />
                          <Route path="contacts" element={<Contacts />} /> {/* Add this line */}
                          <Route path="settings" element={<Settings />} />
                        </Routes>
                      </AdminLayout>
                    </SidebarProvider>
                  </AdminRoute>
                } />
              </Routes>
            </CartProvider>
          )}
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
             
}

export default App

