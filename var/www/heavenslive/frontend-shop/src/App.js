import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import SEO from './components/SEO';
import AuthInit from './components/AuthInit';
import ShopHome from './pages/ShopHome';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import SellerDashboard from './pages/SellerDashboard';
import SellerAnalytics from './pages/SellerAnalytics';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import BulkImport from './pages/BulkImport';
import Promotions from './pages/Promotions';
import SellerOrders from './pages/SellerOrders';
import Offers from './pages/Offers';
import BuyerDashboard from './pages/BuyerDashboard';
import BuyerPurchases from './pages/BuyerPurchases';
import Following from './pages/Following';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Messages from './pages/Messages';
import Disputes from './pages/Disputes';
import FileDispute from './pages/FileDispute';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import GiftCards from './pages/GiftCards';
import SavedSearches from './pages/SavedSearches';
import AffiliateDashboard from './pages/AffiliateDashboard';
import HelpCenter from './pages/HelpCenter';
import Contact from './pages/Contact';
import StorePage from './pages/StorePage';
import StoreSettings from './pages/StoreSettings';
import StoreCustomization from './pages/StoreCustomization';
import LeaveFeedback from './pages/LeaveFeedback';
import LeaveRating from './pages/LeaveRating';
import AdminDashboard from './components/AdminShop/AdminDashboard';

function App() {
  return (
    <div className="App">
      <AuthInit />
      <SEO />
      <Routes>
        <Route path="/" element={<ShopHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/store/:slug" element={<StorePage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/contact" element={<Contact />} />
        
        <Route path="/create" element={<ProtectedRoute requireAuth={true}><CreateListing /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requireAuth={true}><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requireAuth={true}><Settings /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute requireAuth={true}><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute requireAuth={true}><Checkout /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute requireAuth={true}><Wishlist /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute requireAuth={true}><Messages /></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute requireAuth={true}><Messages /></ProtectedRoute>} />
        <Route path="/saved-searches" element={<ProtectedRoute requireAuth={true}><SavedSearches /></ProtectedRoute>} />
        <Route path="/affiliate" element={<ProtectedRoute requireAuth={true}><AffiliateDashboard /></ProtectedRoute>} />
        
        <Route path="/buyer/dashboard" element={<ProtectedRoute requireAuth={true}><BuyerDashboard /></ProtectedRoute>} />
        <Route path="/buyer/purchases" element={<ProtectedRoute requireAuth={true}><BuyerPurchases /></ProtectedRoute>} />
        <Route path="/buyer/following" element={<ProtectedRoute requireAuth={true}><Following /></ProtectedRoute>} />
        <Route path="/rate/:purchaseId" element={<ProtectedRoute requireAuth={true}><LeaveRating /></ProtectedRoute>} />
        <Route path="/feedback/:orderId" element={<ProtectedRoute requireAuth={true}><LeaveFeedback /></ProtectedRoute>} />
        
        <Route path="/seller/dashboard" element={<ProtectedRoute requireAuth={true}><SellerDashboard /></ProtectedRoute>} />
        <Route path="/seller/offers" element={<ProtectedRoute requireAuth={true}><Offers /></ProtectedRoute>} />
        <Route path="/seller/settings" element={<ProtectedRoute requireAuth={true}><StoreSettings /></ProtectedRoute>} />
        <Route path="/seller/customization" element={<ProtectedRoute requireAuth={true}><StoreCustomization /></ProtectedRoute>} />
        <Route path="/seller/analytics" element={<ProtectedRoute requireAuth={true}><SellerAnalytics /></ProtectedRoute>} />
        <Route path="/seller/advanced-analytics" element={<ProtectedRoute requireAuth={true}><AdvancedAnalytics /></ProtectedRoute>} />
        <Route path="/seller/bulk-import" element={<ProtectedRoute requireAuth={true}><BulkImport /></ProtectedRoute>} />
        <Route path="/seller/promotions" element={<ProtectedRoute requireAuth={true}><Promotions /></ProtectedRoute>} />
        <Route path="/seller/orders" element={<ProtectedRoute requireAuth={true}><SellerOrders /></ProtectedRoute>} />
        
        <Route path="/disputes" element={<ProtectedRoute requireAuth={true}><Disputes /></ProtectedRoute>} />
        <Route path="/disputes/new" element={<ProtectedRoute requireAuth={true}><FileDispute /></ProtectedRoute>} />
        
        <Route path="/admin" element={<ProtectedRoute requireAuth={true}><AdminDashboard /></ProtectedRoute>} />
        
        <Route path="*" element={<ShopHome />} />
      </Routes>
    </div>
  );
}

export default App;
