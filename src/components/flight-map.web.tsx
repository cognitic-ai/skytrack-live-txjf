import { useEffect, useRef, useState } from "react";
import { View, useColorScheme } from "react-native";
import type * as LType from "leaflet";
import { Aircraft } from "@/types/flight";
import { UserLocation } from "@/hooks/use-user-location";

function createPlaneIcon(
  L: typeof LType,
  track: number,
  isOnGround: boolean
): LType.DivIcon {
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
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const leafletRef = useRef<typeof LType | null>(null);
  const markersRef = useRef<Map<string, LType.Marker>>(new Map());
  const tileLayerRef = useRef<LType.TileLayer | null>(null);
  const userMarkerRef = useRef<LType.CircleMarker | null>(null);
  const radiusCircleRef = useRef<LType.Circle | null>(null);
  const [ready, setReady] = useState(false);
  const colorScheme = useColorScheme();

  // Dynamically import Leaflet client-side only
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      L.Icon.Default.mergeOptions({
        imagePath: window.location.origin,
        iconUrl: require("leaflet/dist/images/marker-icon.png").uri,
        iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").uri,
        shadowUrl: require("leaflet/dist/images/marker-shadow.png").uri,
      });

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([userLocation.latitude, userLocation.longitude], 10);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;
      leafletRef.current = L;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      leafletRef.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
      radiusCircleRef.current = null;
      setReady(false);
    };
  }, []);

  // Handle tile layer theme switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !ready) return;

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
  }, [colorScheme, ready]);

  // Update user location marker and radius circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !ready) return;

    const pos: LType.LatLngExpression = [
      userLocation.latitude,
      userLocation.longitude,
    ];

    const radiusMeters = 50 * 1852;
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
  }, [userLocation, ready]);

  // Update aircraft markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !ready) return;

    const currentHexes = new Set(flights.map((f) => f.hex));

    markersRef.current.forEach((marker, hex) => {
      if (!currentHexes.has(hex)) {
        marker.remove();
        markersRef.current.delete(hex);
      }
    });

    flights.forEach((ac) => {
      if (ac.lat == null || ac.lon == null) return;

      const existing = markersRef.current.get(ac.hex);
      const isOnGround = ac.alt_baro === "ground";
      const icon = createPlaneIcon(L, ac.track ?? 0, isOnGround);

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
  }, [flights, onSelectFlight, ready]);

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
