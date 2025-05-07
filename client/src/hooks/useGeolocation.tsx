import { useState, useEffect } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface UseGeolocationProps {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  getPosition: () => Promise<GeolocationPosition>;
}

export const useGeolocation = ({
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 0,
}: UseGeolocationProps = {}): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSuccess = (pos: GeolocationPosition) => {
    setPosition(pos);
    setLoading(false);
    setError(null);
  };

  const handleError = (err: GeolocationPositionError) => {
    setError(`Geolocation error: ${err.message}`);
    setLoading(false);
  };

  const getPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        setError(error);
        setLoading(false);
        reject(new Error(error));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          handleSuccess(pos);
          resolve(pos);
        },
        (error) => {
          handleError(error);
          reject(error);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  };

  useEffect(() => {
    // You can automatically get position on mount if needed
    // getPosition().catch(err => console.error(err));
  }, []);

  return { position, error, loading, getPosition };
};
