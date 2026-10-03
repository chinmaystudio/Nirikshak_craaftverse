export interface GeoPoint {
  lat: number;
  lng: number;
  source: "gps" | "approximate";
}

export function formatGps(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function randomPunePoint(): { lat: number; lng: number } {
  return { lat: 18.46 + Math.random() * 0.14, lng: 73.78 + Math.random() * 0.12 };
}

export function currentPosition(): Promise<GeoPoint> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: "gps" }),
        () => {
          const p = randomPunePoint();
          resolve({ lat: p.lat, lng: p.lng, source: "approximate" });
        },
        { timeout: 6000, maximumAge: 60000 }
      );
    } else {
      window.setTimeout(() => {
        const p = randomPunePoint();
        resolve({ lat: p.lat, lng: p.lng, source: "approximate" });
      }, 600);
    }
  });
}
