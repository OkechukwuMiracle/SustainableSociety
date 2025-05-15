import { useState, useEffect, useRef } from 'react';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { Button } from '@/components/ui/button';

interface FaceScanModalProps {
  onClose: () => void;
}

export function FaceScanModal({ onClose }: FaceScanModalProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const { cancelLogout } = useAutoLogout();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cameraEnabled, setCameraEnabled] = useState(false);
    const [faceScan, setFaceScan] = useState<string | null>(null);
    const [faceDetected, setFaceDetected] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
  

  // Set up face detection
    useEffect(() => {
      if (!cameraEnabled) return;
      
      let detectionInterval: NodeJS.Timeout;
      
      const startCamera = async () => {
        try {
          setCameraError(null);
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
          });
          
          streamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          
          // Setup face detection interval
          detectionInterval = setInterval(() => {
            try {
              if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                
                if (video.videoWidth && video.videoHeight) {
                  const displaySize = { 
                    width: video.videoWidth, 
                    height: video.videoHeight 
                  };
                  
                  canvas.width = displaySize.width;
                  canvas.height = displaySize.height;
                  
                  const ctx = canvas.getContext('2d');
                  
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, displaySize.width, displaySize.height);
                    
                    // Simple brightness-based detection (simulates face detection)
                    const centerX = Math.floor(displaySize.width / 2);
                    const centerY = Math.floor(displaySize.height / 2);
                    const pixelData = ctx.getImageData(centerX, centerY, 10, 10).data;
                    
                    let brightness = 0;
                    for (let i = 0; i < pixelData.length; i += 4) {
                      brightness += (pixelData[i] + pixelData[i+1] + pixelData[i+2]) / 3;
                    }
                    brightness = brightness / (pixelData.length / 4);
                    
                    const detected = brightness > 30 && brightness < 200;
                    setFaceDetected(detected);
                    
                    if (detected) {
                      // Draw a rectangle around the "detected" face
                      ctx.strokeStyle = '#00FF00';
                      ctx.lineWidth = 3;
                      const faceSize = Math.min(displaySize.width, displaySize.height) * 0.6;
                      ctx.strokeRect(
                        centerX - faceSize/2, 
                        centerY - faceSize/2, 
                        faceSize, 
                        faceSize
                      );
                      
                      // Save the face scan as base64
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
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
    }, [cameraEnabled]);


    const handleEnableCamera = () => {
    setCameraEnabled(true);
  };
  
  const handleCancel = () => {
  // Clean up camera
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
  // Reset auto-logout timer
  cancelLogout();
  onClose();
};
  

  const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
  
    
    if (!faceDetected) {
      toast({
        title: 'Face Not Detected',
        description: 'Please position your face properly in the camera view',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    
    // Use the faceScan from state instead of calling captureFace()
    if (!faceScan) {
      toast({
        title: 'Face Capture Failed',
        description: 'Unable to capture face image',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    
    // Process logout with face scan
    await logout(faceScan);
    
    // Clean up camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    onClose();
    window.location.replace('/');
  } catch (error: any) {
    toast({
      title: 'Checkout Failed',
      description: error.message || 'An error occurred during checkout',
      variant: 'destructive',
    });
    setIsSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-neutral-800">Face Verification</h3>
          <p className="text-neutral-600 mt-1">Required for checkout after your shift</p>
        </div>
        
        <div className="w-full bg-neutral-100 h-64 rounded-md border border-neutral-300 flex items-center justify-center mb-6 relative overflow-hidden">
        
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
                  {cameraError && <p className="text-xs text-red-500">{cameraError}</p>}
        
        <div className="flex space-x-3">
          <button 
            className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="flex-1 px-4 py-3 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isSubmitting || !faceDetected}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Complete Checkout'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
