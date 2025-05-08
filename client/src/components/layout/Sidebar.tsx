import { useAuth } from '@/contexts/AuthContext';
import { FaceScanModal } from '@/components/modals/FaceScanModal';
import { useState } from 'react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const { logout } = useAuth();
  const [showFaceScanModal, setShowFaceScanModal] = useState(false);
  
  const handleLogout = () => {
    setShowFaceScanModal(true);
  };
  
  return (
    <>
      <aside className="w-16 md:w-56 bg-white border-r border-neutral-200 flex-shrink-0 hidden md:flex flex-col">
        <nav className="p-4 space-y-2 flex-grow">
          <a
            href="#dashboard"
            className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
              activeSection === 'dashboard'
                ? 'bg-primary bg-opacity-10 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('dashboard');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden md:inline">Dashboard</span>
          </a>
          <a
            href="#inventory"
            className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
              activeSection === 'inventory'
                ? 'bg-primary bg-opacity-10 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('inventory');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="hidden md:inline">Inventory</span>
          </a>
          <a
            href="#targets"
            className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
              activeSection === 'targets'
                ? 'bg-primary bg-opacity-10 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('targets');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden md:inline">Targets</span>
          </a>
          <a
            href="#attendance"
            className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
              activeSection === 'attendance'
                ? 'bg-primary bg-opacity-10 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('attendance');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden md:inline">Attendance</span>
          </a>
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <button 
            className="flex items-center space-x-3 px-3 py-2 w-full rounded-md text-neutral-700 hover:bg-neutral-100"
            onClick={handleLogout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </aside>
      
      {/* Mobile Sidebar - Shown at bottom of screen */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10">
        <div className="flex justify-around items-center">
          <a
            href="#dashboard"
            className={`flex flex-col items-center py-3 px-4 ${
              activeSection === 'dashboard' ? 'text-primary' : 'text-neutral-600'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('dashboard');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-xs mt-1">Dashboard</span>
          </a>
          <a
            href="#inventory"
            className={`flex flex-col items-center py-3 px-4 ${
              activeSection === 'inventory' ? 'text-primary' : 'text-neutral-600'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('inventory');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="text-xs mt-1">Inventory</span>
          </a>
          <a
            href="#targets"
            className={`flex flex-col items-center py-3 px-4 ${
              activeSection === 'targets' ? 'text-primary' : 'text-neutral-600'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('targets');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Targets</span>
          </a>
          <button
            className="flex flex-col items-center py-3 px-4 text-neutral-600"
            onClick={handleLogout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>
      </div>

      {showFaceScanModal && (
        <FaceScanModal onClose={() => setShowFaceScanModal(false)} />
      )}
    </>
  );
}
