import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import StatusCards from '@/components/dashboard/StatusCards';
import InventoryManagement from '@/components/dashboard/InventoryManagement';
import TargetsManagement from '@/components/dashboard/TargetsManagement';
import { FaceScanModal } from '@/components/modals/FaceScanModal';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { formatDate } from '@/lib/utils';

export default function Dashboard() {
  const { user, store } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [showFaceScanModal, setShowFaceScanModal] = useState<boolean>(false);
  const { showWarning } = useAutoLogout();
  
  // Show face scan modal when auto-logout warning is triggered
  useEffect(() => {
    if (showWarning) {
      setShowFaceScanModal(true);
    }
  }, [showWarning]);
  
  // Fetch current user data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/user/current'],
    retry: false,
  });
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-3 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <p className="text-red-500">Error loading dashboard data</p>
        </div>
      </div>
    );
  }
  
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            <StatusCards />
            <InventoryManagement />
            <TargetsManagement />
          </>
        );
      case 'inventory':
        return <InventoryManagement />;
      case 'targets':
        return <TargetsManagement />;
      default:
        return <StatusCards />;
    }
  };
  
  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        
        <main className="flex-1 overflow-auto p-6 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">
                Welcome to {store?.name || 'Your Store'}
              </h2>
              <p className="text-neutral-600">{formatDate(new Date())}</p>
            </div>
            
            {/* Dashboard Content */}
            {renderContent()}
          </div>
        </main>
      </div>
      
      {/* Face Scan Modal for logout */}
      {showFaceScanModal && (
        <FaceScanModal onClose={() => setShowFaceScanModal(false)} />
      )}
    </div>
  );
}
