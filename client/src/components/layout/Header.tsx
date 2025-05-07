import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getLoginStatusColor, getLoginStatusText } from '@/lib/utils';

export default function Header() {
  const { user, store } = useAuth();
  
  // Fetch current user data
  const { data } = useQuery({
    queryKey: ['/api/user/current'],
    retry: false,
  });
  
  const loginStatus = data?.attendance?.loginStatus || 'unknown';
  
  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-primary">Reckitt</h1>
        <div className="hidden md:block py-1 px-3 rounded-full text-sm font-medium">
          <span className={`${getLoginStatusColor(loginStatus)} py-1 px-3 rounded-full`}>
            {getLoginStatusText(loginStatus)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="text-right hidden sm:block">
          <p className="font-medium text-neutral-800">{store?.name || 'Store'}</p>
          <p className="text-sm text-neutral-500">{user?.phone || ''}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden border border-neutral-300">
          {/* Profile photo placeholder */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </header>
  );
}
