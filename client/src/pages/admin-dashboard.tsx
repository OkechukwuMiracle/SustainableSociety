import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminHeader from '@/components/layout/AdminHeader';
import AdminSidebar from '@/components/layout/AdminSidebar';
import SummaryCards from '@/components/admin/SummaryCards';
import StorePerformanceChart from '@/components/admin/StorePerformanceChart';
import AttendanceLog from '@/components/admin/AttendanceLog';
import { formatDate } from '@/lib/utils';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [dateFilter, setDateFilter] = useState<string>('today');
  
  // Fetch admin dashboard data
  const { data: attendanceData } = useQuery({
    queryKey: ['/api/admin/attendance'],
    retry: false,
  });
  
  const { data: summaryData } = useQuery({
    queryKey: ['/api/admin/summary'],
    retry: false,
  });
  
  const { data: storesData } = useQuery({
    queryKey: ['/api/admin/stores'],
    retry: false,
  });
  
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <>
            <SummaryCards summaryData={summaryData} />
            <StorePerformanceChart />
            <AttendanceLog 
              attendanceData={attendanceData} 
              dateFilter={dateFilter} 
              setDateFilter={setDateFilter} 
            />
          </>
        );
      case 'stores':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-5">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Stores Management</h3>
            {/* Stores management content would go here */}
            <p className="text-neutral-600">Store management functionality</p>
          </div>
        );
      case 'staff':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-5">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Staff Management</h3>
            {/* Staff management content would go here */}
            <p className="text-neutral-600">Staff management functionality</p>
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-5">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Reports</h3>
            {/* Reports content would go here */}
            <p className="text-neutral-600">Reports functionality</p>
          </div>
        );
      default:
        return (
          <>
            <SummaryCards summaryData={summaryData} />
            <StorePerformanceChart />
            <AttendanceLog 
              attendanceData={attendanceData} 
              dateFilter={dateFilter} 
              setDateFilter={setDateFilter} 
            />
          </>
        );
    }
  };
  
  return (
    <div className="h-screen flex flex-col">
      <AdminHeader />
      
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        
        <main className="flex-1 overflow-auto p-6 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            {/* Overview Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">Admin Dashboard</h2>
              <p className="text-neutral-600">{formatDate(new Date())}</p>
            </div>
            
            {/* Dashboard Content */}
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
