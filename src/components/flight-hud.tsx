import { View, Text, useColorScheme } from "react-native";
import * as AC from "@bacons/apple-colors";

interface FlightHUDProps {
  totalFlights: number;
  isLoading: boolean;
  isFetching: boolean;
  lastUpdated: Date | null;
}

export default function FlightHUD({
  totalFlights,
  isLoading,
  isFetching,
  lastUpdated,
}: FlightHUDProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View
      style={{
        position: "absolute",
        top: process.env.EXPO_OS === "web" ? 16 : 60,
        left: 16,
        right: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        pointerEvents: "box-none",
      }}
    >
      <View
        style={{
          backgroundColor: isDark
            ? "rgba(30,30,30,0.85)"
            : "rgba(255,255,255,0.85)",
          borderRadius: 14,
          borderCurve: "continuous",
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          boxShadow: "0px 2px 12px rgba(0,0,0,0.15)",
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: AC.label as any,
          }}
        >
          ✈ Flight Tracker
        </Text>
        <View
          style={{
            width: 1,
            height: 20,
            backgroundColor: AC.separator as any,
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isFetching
                ? (AC.systemOrange as any)
                : (AC.systemGreen as any),
            }}
          />
          <Text
            selectable
            style={{
              fontSize: 14,
              fontVariant: ["tabular-nums"],
              color: AC.secondaryLabel as any,
              fontWeight: "500",
            }}
          >
            {isLoading ? "Loading..." : `${totalFlights} aircraft`}
          </Text>
        </View>
      </View>

      {lastUpdated && (
        <View
          style={{
            backgroundColor: isDark
              ? "rgba(30,30,30,0.85)"
              : "rgba(255,255,255,0.85)",
            borderRadius: 10,
            borderCurve: "continuous",
            paddingHorizontal: 12,
            paddingVertical: 8,
            boxShadow: "0px 2px 12px rgba(0,0,0,0.15)",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: AC.secondaryLabel as any,
              fontVariant: ["tabular-nums"],
            }}
          >
            {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>
      )}
    </View>
  );
}
