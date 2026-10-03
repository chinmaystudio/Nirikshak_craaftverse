import { useCallback, useState } from 'react';
import { currentPosition, type GeoPoint } from '@/utils/location';

export type LocationSource = 'gps' | 'approximate' | null;

export interface UseLocationResult {
  point: GeoPoint | null;
  locating: boolean;
  locate: () => Promise<GeoPoint | null>;
}

export function useLocation(): UseLocationResult {
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);

  const locate = useCallback(async (): Promise<GeoPoint | null> => {
    setLocating(true);
    try {
      const pos: GeoPoint = await currentPosition();
      setPoint(pos);
      return pos;
    } finally {
      setLocating(false);
    }
  }, []);

  return { point, locating, locate };
}
