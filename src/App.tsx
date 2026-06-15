import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Cart from "./pages/Cart.tsx";
import OrderConfirmed from "./pages/OrderConfirmed.tsx";
import Favorites from "./pages/Favorites.tsx";
import Account from "./pages/Account.tsx";

import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPremiumRequests from "./pages/admin/AdminPremiumRequests";
import AdminLogs from "./pages/admin/AdminLogs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <PWAInstallPrompt />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/produit/:id" element={<ProductDetail />} />
            <Route path="/panier" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/commande-confirmee/:id" element={<ProtectedRoute><OrderConfirmed /></ProtectedRoute>} />
            <Route path="/favoris" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/compte" element={<ProtectedRoute><Account /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="produits" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="commandes" element={<AdminOrders />} />
              <Route path="utilisateurs" element={<AdminUsers />} />
              <Route path="premium" element={<AdminPremiumRequests />} />
              <Route path="logs" element={<AdminLogs />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
