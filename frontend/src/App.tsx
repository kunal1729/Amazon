import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductsPage from './components/ProductsPage';
import OrdersPage from './components/OrdersPage';
import COGSPage from './components/COGSPage';
import InventoryPage from './components/InventoryPage';
import AnalyticsPage from './components/AnalyticsPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="ml-64 p-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'orders' && <OrdersPage />}
        {activeTab === 'cogs' && <COGSPage />}
        {activeTab === 'inventory' && <InventoryPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'settings' && <SettingsPage onNavigate={setActiveTab} />}
      </main>
    </div>
  );
}

export default App;
