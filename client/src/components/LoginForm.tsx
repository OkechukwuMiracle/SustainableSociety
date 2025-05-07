import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { MapPin } from 'lucide-react';

// Form schema
const formSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  storeId: z.string().min(1, 'Store is required'),
});

export function LoginForm() {
  const { login, loading, isAuthenticated, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { getPosition, position, error: geoError } = useGeolocation();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        setLocation('/admin-dashboard');
      } else {
        setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, setLocation]);
  
  const {
    videoRef,
    canvasRef,
    isDetecting,
    faceDetected,
    startDetection,
    stopDetection,
    captureFace,
    error: faceError
  } = useFaceDetection({ enabled: true });
  
  // Fetch stores list
  const { data: stores } = useQuery({
    queryKey: ['/api/stores'],
    retry: false,
  });
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
      storeId: '',
    },
  });
  
  const handleEnableCamera = async () => {
    setCameraEnabled(true);
    await startDetection();
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Get location
      const locationData = await getPosition();
      
      // Get face scan
      const faceScan = captureFace();
      
      if (!faceScan) {
        throw new Error('Face scan required. Please enable your camera and try again.');
      }
      
      // Login
      await login(
        values.phone, 
        parseInt(values.storeId), 
        { latitude: locationData.latitude, longitude: locationData.longitude },
        faceScan
      );
      
      // Redirection will happen in the useEffect
    } catch (error: any) {
      console.error('Login error:', error);
      form.setError('root', { 
        message: error.message || 'Login failed. Please try again.'
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+234 800 000 0000" 
                  {...field} 
                />
              </FormControl>
              <p className="text-xs text-neutral-500 mt-1">Enter the phone number associated with your store</p>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="storeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store Location</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map((store: any) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <p className="block text-sm font-medium text-neutral-700">Face Verification</p>
          <div className="w-full bg-neutral-100 h-48 rounded-md border border-neutral-300 flex items-center justify-center relative">
            {cameraEnabled ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover rounded-md"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 h-full w-full"
                />
                {faceDetected && (
                  <div className="absolute bottom-2 right-2 bg-success text-white px-2 py-1 rounded text-xs">
                    Face Detected
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-neutral-500 text-sm mt-2">Camera access required</p>
                <Button
                  type="button"
                  className="mt-2"
                  onClick={handleEnableCamera}
                >
                  Enable Camera
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-500">Your face scan is required for attendance tracking</p>
          {faceError && <p className="text-xs text-red-500">{faceError}</p>}
        </div>
        
        <div>
          <p className="text-xs text-neutral-500 mb-3 flex items-center">
            <MapPin className="h-3 w-3 mr-1" /> We need to verify you're at your store location to log in
          </p>
          {geoError && <p className="text-xs text-red-500 mb-3">{geoError}</p>}
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || (cameraEnabled && !faceDetected)}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Login to Store'
            )}
          </Button>
          {form.formState.errors.root && (
            <p className="text-xs text-red-500 mt-2">{form.formState.errors.root.message}</p>
          )}
        </div>
      </form>
    </Form>
  );
}
