import { useQuery } from "@tanstack/react-query";
import { Aircraft } from "@/types/flight";
import { UserLocation } from "./use-user-location";

const RADIUS_NM = 50;

// Haversine distance in nautical miles
function distanceNM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Normalize aircraft coordinates from various field formats
function normalizePosition(ac: Aircraft): Aircraft {
  if (typeof ac.lat === "number" && typeof ac.lon === "number") {
    return ac;
  }
  if (typeof ac.rr_lat === "number" && typeof ac.rr_lon === "number") {
    return { ...ac, lat: ac.rr_lat, lon: ac.rr_lon };
  }
  if (ac.lastPosition?.lat != null && ac.lastPosition?.lon != null) {
    return { ...ac, lat: ac.lastPosition.lat, lon: ac.lastPosition.lon };
  }
  return ac;
}

async function fetchFlights(location: UserLocation): Promise<Aircraft[]> {
  // Fetch from our server-side API route (avoids CORS)
  const response = await fetch("/api/flights");
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data = await response.json();

  const aircraft: Aircraft[] = (data.ac ?? []).map(normalizePosition);

  // Filter to aircraft with valid positions within radius
  return aircraft.filter((ac) => {
    if (typeof ac.lat !== "number" || typeof ac.lon !== "number") return false;
    if (ac.lat === 0 && ac.lon === 0) return false;
    return (
      distanceNM(location.latitude, location.longitude, ac.lat, ac.lon) <=
      RADIUS_NM
    );
  });
}

export function useFlights(location: UserLocation) {
  return useQuery({
    queryKey: ["flights", location.latitude, location.longitude],
    queryFn: () => fetchFlights(location),
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    staleTime: 4_000,
  });
}
