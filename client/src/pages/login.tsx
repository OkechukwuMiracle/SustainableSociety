import { useState } from 'react';
import { Link } from 'wouter';
import { LoginForm } from '@/components/LoginForm';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'staff' | 'admin'>('staff');
  const { toast } = useToast();

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Login Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Reckitt</h1>
            <p className="text-neutral-600 mt-2">Store Management System</p>
          </div>

          {/* Login Tabs */}
          <div className="flex border-b border-neutral-200 mb-6">
            <button 
              className={`flex-1 py-3 font-medium ${
                activeTab === 'staff' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-neutral-500 hover:text-primary'
              }`}
              onClick={() => setActiveTab('staff')}
            >
              Staff Login
            </button>
            <button 
              className={`flex-1 py-3 font-medium ${
                activeTab === 'admin' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-neutral-500 hover:text-primary'
              }`}
              onClick={() => setActiveTab('admin')}
            >
              <Link href="/admin">Admin Login</Link>
            </button>
          </div>

          {/* Staff Login Form */}
          {activeTab === 'staff' && <LoginForm />}
        </div>
      </div>
    </div>
  );
}
