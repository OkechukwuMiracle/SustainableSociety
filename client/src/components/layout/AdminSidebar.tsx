interface AdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function AdminSidebar({ activeSection, setActiveSection }: AdminSidebarProps) {
  return (
    <aside className="w-16 md:w-56 bg-white border-r border-neutral-200 flex-shrink-0 hidden md:block">
      <nav className="p-4 space-y-2">
        <a
          href="#overview"
          className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            activeSection === 'overview'
              ? 'bg-primary bg-opacity-10 text-white'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('overview');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="hidden md:inline">Overview</span>
        </a>
        <a
          href="#stores"
          className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            activeSection === 'stores'
              ? 'bg-primary bg-opacity-10 text-white'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('stores');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
          <span className="hidden md:inline">Stores</span>
        </a>
        <a
          href="#staff"
          className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            activeSection === 'staff'
              ? 'bg-primary bg-opacity-10 text-white'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('staff');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="hidden md:inline">Staff</span>
        </a>
        <a
          href="#reports"
          className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            activeSection === 'reports'
              ? 'bg-primary bg-opacity-10 text-white'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('reports');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden md:inline">Reports</span>
        </a>
        <a
          href="#settings"
          className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            activeSection === 'settings'
              ? 'bg-primary bg-opacity-10 text-white'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('settings');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden md:inline">Settings</span>
        </a>
      </nav>
    </aside>
  );
}
