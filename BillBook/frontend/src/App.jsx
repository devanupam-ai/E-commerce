import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './store';
import Login from './pages/Login';
import Layout from './pages/Layout';
import DashboardNew from './pages/DashboardNew';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import Vendors from './pages/Vendors';
import Purchases from './pages/Purchases';
import Analytics from './pages/Analytics';
import Quotations from './pages/Quotations';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import BusinessProfile from './pages/BusinessProfile';
import PartyKhata from './pages/PartyKhata';
import GstReports from './pages/GstReports';
import CashRegister from './pages/CashRegister';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Layout /></Protected>}>
          <Route index element={<DashboardNew />} />
          <Route path="customers" element={<Customers />} />
          <Route path="products" element={<Products />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
          <Route path="business-profile" element={<BusinessProfile />} />
          <Route path="khata" element={<PartyKhata />} />
          <Route path="gst-reports" element={<GstReports />} />
          <Route path="cash-register" element={<CashRegister />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
