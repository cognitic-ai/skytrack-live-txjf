import { useRef, useEffect } from "react";
import { View } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { Aircraft } from "@/types/flight";
import { UserLocation } from "@/hooks/use-user-location";
import * as AC from "@bacons/apple-colors";

interface FlightMapProps {
  flights: Aircraft[];
  userLocation: UserLocation;
  onSelectFlight: (aircraft: Aircraft) => void;
}

// 30mi view ≈ 0.87° latitude delta
const LAT_DELTA = 0.87;
const LON_DELTA = 0.87;

export default function FlightMap({
  flights,
  userLocation,
  onSelectFlight,
}: FlightMapProps) {
  const mapRef = useRef<MapView>(null);
  const hasCenteredRef = useRef(false);

  // Center on user once we get a real location
  useEffect(() => {
    if (!hasCenteredRef.current && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: LAT_DELTA,
          longitudeDelta: LON_DELTA,
        },
        500
      );
      hasCenteredRef.current = true;
    }
  }, [userLocation]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: LAT_DELTA,
          longitudeDelta: LON_DELTA,
        }}
        showsUserLocation
        showsCompass
        rotateEnabled={false}
      >
        {/* 50nm radius circle */}
        <Circle
          center={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          radius={50 * 1852}
          strokeColor="rgba(0,122,255,0.4)"
          fillColor="rgba(0,122,255,0.04)"
          strokeWidth={1.5}
          lineDashPattern={[6, 4]}
        />

        {flights.map((ac) => {
          if (ac.lat == null || ac.lon == null) return null;
          const isOnGround = ac.alt_baro === "ground";
          return (
            <Marker
              key={ac.hex}
              coordinate={{ latitude: ac.lat, longitude: ac.lon }}
              rotation={ac.track ?? 0}
              flat
              tracksViewChanges={false}
              onPress={() => onSelectFlight(ac)}
              title={ac.flight?.trim() || ac.hex}
              description={
                ac.t
                  ? `${ac.t} · ${isOnGround ? "Ground" : `${ac.alt_baro} ft`}`
                  : undefined
              }
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 6,
                    borderRightWidth: 6,
                    borderBottomWidth: 16,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderBottomColor: isOnGround
                      ? (AC.systemGray as any)
                      : (AC.systemBlue as any),
                  }}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}
