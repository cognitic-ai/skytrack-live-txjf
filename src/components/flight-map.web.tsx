import { useEffect, useRef } from "react";
import { View, useColorScheme } from "react-native";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Aircraft } from "@/types/flight";
import { UserLocation } from "@/hooks/use-user-location";

// Fix leaflet default icon paths for Metro bundler
L.Icon.Default.mergeOptions({
  imagePath: window.location.origin,
  iconUrl: require("leaflet/dist/images/marker-icon.png").uri,
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").uri,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").uri,
});

function createPlaneIcon(track: number, isOnGround: boolean): L.DivIcon {
  const color = isOnGround ? "#8E8E93" : "#007AFF";
  return L.divIcon({
    className: "plane-icon",
    html: `<svg width="26" height="26" viewBox="0 0 24 24" style="transform: rotate(${track ?? 0}deg); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
      <path d="M12 2L8 10L2 12L8 14L12 22L16 14L22 12L16 10Z" fill="${color}" stroke="white" stroke-width="0.8"/>
    </svg>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}

interface FlightMapProps {
  flights: Aircraft[];
  userLocation: UserLocation;
  onSelectFlight: (aircraft: Aircraft) => void;
}

export default function FlightMap({
  flights,
  userLocation,
  onSelectFlight,
}: FlightMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const hasCenteredRef = useRef(false);
  const colorScheme = useColorScheme();

  // Initialize map centered on user location
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Zoom 10 ≈ 30-mile view radius
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([userLocation.latitude, userLocation.longitude], 10);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstanceRef.current = map;
    hasCenteredRef.current = true;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
      radiusCircleRef.current = null;
      hasCenteredRef.current = false;
    };
  }, []);

  // Handle tile layer theme switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const isDark = colorScheme === "dark";
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
  }, [colorScheme]);

  // Update user location marker and radius circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const pos: L.LatLngExpression = [
      userLocation.latitude,
      userLocation.longitude,
    ];

    // 50nm radius circle
    const radiusMeters = 50 * 1852; // 50 nautical miles in meters
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng(pos);
    } else {
      radiusCircleRef.current = L.circle(pos, {
        radius: radiusMeters,
        color: "#007AFF",
        fillColor: "#007AFF",
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: "6 4",
        interactive: false,
      }).addTo(map);
    }

    // User location dot
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(pos);
    } else {
      userMarkerRef.current = L.circleMarker(pos, {
        radius: 7,
        fillColor: "#007AFF",
        color: "white",
        weight: 2.5,
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
    }

    // Center map on first real location update
    if (!hasCenteredRef.current) {
      map.setView(pos, 10);
      hasCenteredRef.current = true;
    }
  }, [userLocation]);

  // Update aircraft markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentHexes = new Set(flights.map((f) => f.hex));

    // Remove stale markers
    markersRef.current.forEach((marker, hex) => {
      if (!currentHexes.has(hex)) {
        marker.remove();
        markersRef.current.delete(hex);
      }
    });

    // Add or update markers
    flights.forEach((ac) => {
      if (ac.lat == null || ac.lon == null) return;

      const existing = markersRef.current.get(ac.hex);
      const isOnGround = ac.alt_baro === "ground";
      const icon = createPlaneIcon(ac.track ?? 0, isOnGround);

      if (existing) {
        existing.setLatLng([ac.lat, ac.lon]);
        existing.setIcon(icon);
      } else {
        const marker = L.marker([ac.lat, ac.lon], { icon })
          .addTo(map)
          .on("click", () => onSelectFlight(ac));
        markersRef.current.set(ac.hex, marker);
      }
    });
  }, [flights, onSelectFlight]);

  return (
    <View style={{ flex: 1 }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .plane-icon { background: transparent !important; border: none !important; }
            .leaflet-pane { z-index: 400; }
          `,
        }}
      />
    </View>
  );
}
