import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Default context value
const defaultAuthContext = {
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  store: null,
  login: async () => {},
  adminLogin: async () => {},
  logout: async () => {},
  loading: false
};

interface User {
  id: number;
  phone: string;
  storeId: number;
  isAdmin: boolean;
}

interface Store {
  id: number;
  name: string;
  location: string;
  coordinates: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  store: Store | null;
  login: (phone: string, storeId: number, coordinates: { latitude: number, longitude: number }, faceScan: string) => Promise<void>;
  adminLogin: (phone: string, password: string) => Promise<void>;
  logout: (faceScan?: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>(defaultAuthContext as AuthContextType);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // useEffect(() => {
  //   // Check if user is already logged in
  //   const checkAuth = async () => {
  //     try {
  //       const res = await fetch('/api/user/current', {
  //         credentials: 'include'
  //       });

  //       if (res.ok) {
  //         const data = await res.json();
  //         setUser(data.user);
  //         setStore(data.store);
  //         setIsAuthenticated(true);
  //         setIsAdmin(data.user.isAdmin);
  //       }
  //     } catch (error) {
  //       console.error('Auth check failed:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   checkAuth();
  // }, []);



  // Updated checkAuth function in AuthContext.tsx
useEffect(() => {
  // Check if user is already logged in
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/user/current', {
        credentials: 'include'
      });

      if (res.ok) {
        // Check if the response is actually JSON
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setUser(data.user);
          setStore(data.store);
          setIsAuthenticated(true);
          setIsAdmin(data.user.isAdmin);
        } else {
          console.error('Expected JSON response but got:', contentType);
        }
      } else {
        // Log the response for debugging
        const text = await res.text();
        console.error('Auth check failed with status:', res.status, 'Response:', text);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  checkAuth();
}, []);

  const login = async (
    phone: string, 
    storeId: number, 
    coordinates: { latitude: number, longitude: number },
    faceScan: string
  ) => {
    setLoading(true);
    try {
      const res = await apiRequest('POST', '/api/login', {
        phone,
        storeId,
        coordinates,
        faceScan,
      });

      const data = await res.json();
      setUser(data.user);
      setStore(data.store);
      setIsAuthenticated(true);
      setIsAdmin(false);
      setLocation('/');
      toast({
        title: "Logged in successfully",
        description: `Welcome to ${data.store.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiRequest('POST', '/api/admin/login', {
        phone,
        password,
      });

      const data = await res.json();
      setUser(data.user);
      setIsAuthenticated(true);
      setIsAdmin(true);
      setLocation('/');
      toast({
        title: "Admin login successful",
        description: "Welcome to the admin dashboard",
      });
    } catch (error: any) {
      toast({
        title: "Admin login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (faceScan?: string) => {
    setLoading(true);
    try {
      await apiRequest('POST', '/api/logout', { faceScan });
      setUser(null);
      setStore(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLocation('/');
      toast({
        title: "Logged out successfully",
        description: "Thank you for using Reckitt Store Management",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        user,
        store,
        login,
        adminLogin,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
