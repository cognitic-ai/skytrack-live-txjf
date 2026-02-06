import { useState, useCallback } from "react";
import { View } from "react-native";
import { useFlights } from "@/hooks/use-flights";
import { useUserLocation } from "@/hooks/use-user-location";
import FlightMap from "@/components/flight-map";
import FlightHUD from "@/components/flight-hud";
import FlightDetailCard from "@/components/flight-detail-card";
import { Aircraft } from "@/types/flight";

export default function TrackerScreen() {
  const { location } = useUserLocation();
  const {
    data: flights = [],
    isLoading,
    isFetching,
    dataUpdatedAt,
  } = useFlights(location);
  const [selectedFlight, setSelectedFlight] = useState<Aircraft | null>(null);

  const handleSelectFlight = useCallback((aircraft: Aircraft) => {
    setSelectedFlight(aircraft);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedFlight(null);
  }, []);

  // Keep selected flight data fresh from the latest poll
  const currentSelected = selectedFlight
    ? flights.find((f) => f.hex === selectedFlight.hex) ?? selectedFlight
    : null;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <View style={{ flex: 1 }}>
      <FlightMap
        flights={flights}
        userLocation={location}
        onSelectFlight={handleSelectFlight}
      />

      <FlightHUD
        totalFlights={flights.length}
        isLoading={isLoading}
        isFetching={isFetching}
        lastUpdated={lastUpdated}
      />

      {currentSelected && (
        <FlightDetailCard aircraft={currentSelected} onClose={handleClose} />
      )}
    </View>
  );
}
