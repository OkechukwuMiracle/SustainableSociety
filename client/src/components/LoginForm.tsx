import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin } from 'lucide-react';

const formSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  storeId: z.string().min(1, 'Store is required'),
});

export function LoginForm() {
  const { login, loading, isAuthenticated, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { getPosition, position, error: geoError } = useGeolocation();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [faceScan, setFaceScan] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        setLocation('/admin-dashboard');
      } else {
        setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, setLocation]);

  const [storesLoaded, setStoresLoaded] = useState(false);
  const { data: stores = [], refetch: fetchStores } = useQuery({
    queryKey: ['/api/stores'],
    retry: false,
    enabled: false,
  });

  const handleStoreSelectOpen = async () => {
    if (!storesLoaded) {
      try {
        await fetchStores();
        setStoresLoaded(true);
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      }
    }
  };

  useEffect(() => {
    if (!cameraEnabled) return;
    let detectionInterval: NodeJS.Timeout;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        detectionInterval = setInterval(() => {
          try {
            if (videoRef.current && canvasRef.current) {
              const video = videoRef.current;
              const canvas = canvasRef.current;

              if (video.videoWidth && video.videoHeight) {
                const displaySize = {
                  width: video.videoWidth,
                  height: video.videoHeight,
                };

                canvas.width = displaySize.width;
                canvas.height = displaySize.height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0, displaySize.width, displaySize.height);

                  const centerX = Math.floor(displaySize.width / 2);
                  const centerY = Math.floor(displaySize.height / 2);
                  const pixelData = ctx.getImageData(centerX, centerY, 10, 10).data;

                  let brightness = 0;
                  for (let i = 0; i < pixelData.length; i += 4) {
                    brightness += (pixelData[i] + pixelData[i + 1] + pixelData[i + 2]) / 3;
                  }
                  brightness = brightness / (pixelData.length / 4);

                  const detected = brightness > 30 && brightness < 200;
                  setFaceDetected(detected);

                  if (detected) {
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 3;
                    const faceSize = Math.min(displaySize.width, displaySize.height) * 0.6;
                    ctx.strokeRect(
                      centerX - faceSize / 2,
                      centerY - faceSize / 2,
                      faceSize,
                      faceSize
                    );
                    setFaceScan(canvas.toDataURL('image/jpeg'));
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error in face detection:', err);
          }
        }, 100);
      } catch (err) {
        setCameraError('Failed to access camera. Please ensure camera permissions are granted.');
        console.error('Camera access error:', err);
      }
    };

    startCamera();

    return () => {
      clearInterval(detectionInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraEnabled]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
      storeId: '',
    },
  });

  const handleEnableCamera = () => {
    setCameraEnabled(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const locationData = await getPosition();

      if (!faceScan) {
        throw new Error('Face scan required. Please enable your camera and try again.');
      }

      await login(
        values.phone,
        parseInt(values.storeId),
        { latitude: locationData.latitude, longitude: locationData.longitude },
        faceScan
      );
    } catch (error: any) {
      console.error('Login error:', error);
      form.setError('root', {
        message: error.message || 'Login failed. Please try again.',
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
                <Input placeholder="+234 800 000 0000" {...field} />
              </FormControl>
              <p className="text-xs text-neutral-500 mt-1">
                Enter the phone number associated with your store
              </p>
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
                  onOpenChange={(open) => {
                    if (open) handleStoreSelectOpen();
                  }}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your store" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(stores) &&
                      stores.map((store: any) => (
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
                <canvas ref={canvasRef} className="absolute top-0 left-0 h-full w-full" />
                {faceDetected && (
                  <div className="absolute bottom-2 right-2 bg-success text-white px-2 py-1 rounded text-xs">
                    Face Detected
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-neutral-400 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-neutral-500 text-sm mt-2">Camera access required</p>
                <Button type="button" className="mt-2" onClick={handleEnableCamera}>
                  Enable Camera
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            Your face scan is required for attendance tracking
          </p>
          {cameraError && <p className="text-xs text-red-500">{cameraError}</p>}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Form>
  );
}
