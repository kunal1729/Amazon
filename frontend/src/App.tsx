import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductsPage from './components/ProductsPage';
import OrdersPage from './components/OrdersPage';
import COGSPage from './components/COGSPage';
import InventoryPage from './components/InventoryPage';
import AnalyticsPage from './components/AnalyticsPage';
import AdsAnalyticsPage from './components/AdsAnalyticsPage';
import GeoAnalyticsPage from './components/GeoAnalyticsPage';
import ReconciliationPage from './components/ReconciliationPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import { Loader2 } from 'lucide-react';
import { getMe, login as apiLogin, signup as apiSignup } from './api';

interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  company_id: number | null;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  };

  const handleLogin = async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    localStorage.setItem('auth_token', res.data.access_token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const handleSignup = async (email: string, name: string, password: string) => {
    const res = await apiSignup({ email, name, password });
    localStorage.setItem('auth_token', res.data.access_token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!user) {
    if (authPage === 'login') {
      return (
        <LoginPage 
          onSwitchToSignup={() => setAuthPage('signup')} 
          onLogin={handleLogin} 
        />
      );
    }
    return (
      <SignupPage 
        onSwitchToLogin={() => setAuthPage('login')} 
        onSignup={handleSignup} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout}
        userName={user.name}
      />
      <main className="ml-64 p-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'orders' && <OrdersPage />}
        {activeTab === 'cogs' && <COGSPage />}
        {activeTab === 'inventory' && <InventoryPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'ads' && <AdsAnalyticsPage />}
        {activeTab === 'geo' && <GeoAnalyticsPage />}
        {activeTab === 'reconciliation' && <ReconciliationPage />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'settings' && <SettingsPage onNavigate={setActiveTab} />}
      </main>
    </div>
  );
}

export default App;
