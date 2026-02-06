import { useState, useEffect } from "react";
import * as Location from "expo-location";

// San Francisco default
const SF_LOCATION = { latitude: 37.7749, longitude: -122.4194 };

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>(SF_LOCATION);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        // On web, try browser geolocation API first
        if (process.env.EXPO_OS === "web") {
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (!cancelled) {
                  setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  });
                  setHasPermission(true);
                }
              },
              () => {
                // Permission denied or error — stay on SF
              },
              { enableHighAccuracy: false, timeout: 10000 }
            );
          }
          return;
        }

        // Native: use expo-location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== "granted") {
          setHasPermission(false);
          return;
        }
        setHasPermission(true);

        try {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!cancelled) {
            setLocation({
              latitude: current.coords.latitude,
              longitude: current.coords.longitude,
            });
          }
        } catch {
          // Fall back to SF
        }

        if (cancelled) return;

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 500,
          },
          (loc) => {
            if (!cancelled) {
              setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
            }
          }
        );
      } catch {
        // expo-location not available — stay on SF default
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return { location, hasPermission };
}
