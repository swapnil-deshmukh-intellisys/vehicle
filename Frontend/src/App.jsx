import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './components/context/ThemeContext';
import { AuthProvider } from './components/context/AuthContext';
import { LoginPopupProvider } from './components/context/LoginPopupContext';
import PageLayout from './components/layout/PageLayout';
import ScrollToTop from './components/common/ScrollToTop';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Login from './pages/Login';
import Profile from './pages/Profile';

// Service Listing Pages
import GarageListingPage from './pages/GarageListingPage';
import WashingDetailingPage from './pages/WashingDetailingPage';
import EVServicePage from './pages/EVServicePage';
import RoadsideAssistancePage from './pages/RoadsideAssistancePage';
import BuySellPage from './pages/BuySellPage';
import RentPage from './pages/RentPage';

// Info Pages
import GarageInfoPage from './pages/GarageInfoPage';
import WashingCenterInfoPage from './pages/WashingCenterInfoPage';
import EVServiceInfoPage from './pages/EVServiceInfoPage';
import RSAInfoPage from './pages/RSAInfoPage';
import BuySellVehicleDetailPage from './pages/BuySellVehicleDetailPage';
import RentVehicleDetailPage from './pages/RentVehicleDetailPage';

// Booking Pages
import BookingPage from './pages/BookingPage';
import BookingDetailsPage from './pages/BookingDetailsPage';

function App() {
  const { theme } = useTheme();

  return (
    <AuthProvider>
      <Router>
        <LoginPopupProvider>
          <div className={`min-h-screen overflow-x-hidden w-full max-w-full ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
            <ScrollToTop />
            <PageLayout>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Service Listing Routes */}
            <Route path="/garage" element={<GarageListingPage />} />
            <Route path="/washing-detailing" element={<WashingDetailingPage />} />
            <Route path="/ev-service" element={<EVServicePage />} />
            <Route path="/roadside-assistance" element={<RoadsideAssistancePage />} />
            <Route path="/buy-sell" element={<BuySellPage />} />
            <Route path="/rent" element={<RentPage />} />
            
            {/* Info Page Routes */}
            <Route path="/garage/:id" element={<GarageInfoPage />} />
            <Route path="/washing-detailing/:id" element={<WashingCenterInfoPage />} />
            <Route path="/ev-service/:id" element={<EVServiceInfoPage />} />
            <Route path="/roadside-assistance/:id" element={<RSAInfoPage />} />
            <Route path="/buy-sell/:id" element={<BuySellVehicleDetailPage />} />
            <Route path="/rent/:id" element={<RentVehicleDetailPage />} />
            
            {/* Booking Routes */}
            <Route 
              path="/booking" 
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/booking/:bookingId" 
              element={
                <ProtectedRoute>
                  <BookingDetailsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageLayout>
        </div>
        </LoginPopupProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;

