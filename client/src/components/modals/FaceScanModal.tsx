import { useState, useEffect } from 'react';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAutoLogout } from '@/hooks/useAutoLogout';

interface FaceScanModalProps {
  onClose: () => void;
}

export function FaceScanModal({ onClose }: FaceScanModalProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const { cancelLogout } = useAutoLogout();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  useEffect(() => {
    // Start face detection when modal opens
    startDetection().catch(console.error);
    
    // Clean up on unmount
    return () => {
      stopDetection();
    };
  }, []);
  
  const handleCancel = () => {
    stopDetection();
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
      
      // Capture face data
      const faceScan = captureFace();
      
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
      
      stopDetection();
      onClose();
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
          {isDetecting ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
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
              <button 
                className="mt-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
                onClick={() => startDetection()}
              >
                Enable Camera
              </button>
            </div>
          )}
        </div>
        
        {faceError && (
          <p className="text-red-500 text-sm mb-4">{faceError}</p>
        )}
        
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
