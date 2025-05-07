import { useAuth } from '@/contexts/AuthContext';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  
  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-primary">Reckitt Admin</h1>
        <span className="bg-neutral-100 text-neutral-600 py-1 px-3 rounded-full text-sm font-medium">Dashboard</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <p className="font-medium text-neutral-800">Admin Panel</p>
          <p className="text-sm text-neutral-500">{user?.phone || ''}</p>
        </div>
        <button 
          className="text-neutral-700 hover:text-neutral-900"
          onClick={() => logout()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
