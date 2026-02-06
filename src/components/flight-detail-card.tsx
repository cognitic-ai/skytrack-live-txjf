import { View, Text, Pressable, useColorScheme } from "react-native";
import * as AC from "@bacons/apple-colors";
import { Aircraft } from "@/types/flight";

interface FlightDetailCardProps {
  aircraft: Aircraft;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          color: AC.secondaryLabel as any,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: AC.label as any,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function FlightDetailCard({
  aircraft,
  onClose,
}: FlightDetailCardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const isOnGround = aircraft.alt_baro === "ground";
  const callsign = aircraft.flight?.trim() || "N/A";
  const registration = aircraft.r || "N/A";
  const aircraftType = aircraft.t || "Unknown";

  const altitude = isOnGround
    ? "On Ground"
    : aircraft.alt_baro != null
    ? `${Number(aircraft.alt_baro).toLocaleString()} ft`
    : "N/A";

  const speed =
    aircraft.gs != null ? `${Math.round(aircraft.gs)} kts` : "N/A";

  const heading =
    aircraft.track != null ? `${Math.round(aircraft.track)}°` : "N/A";

  const verticalRate =
    aircraft.baro_rate != null
      ? `${aircraft.baro_rate > 0 ? "+" : ""}${aircraft.baro_rate} ft/min`
      : "N/A";

  const squawk = aircraft.squawk || "N/A";

  return (
    <View
      style={{
        position: "absolute",
        bottom: process.env.EXPO_OS === "web" ? 24 : 40,
        left: 16,
        right: 16,
        maxWidth: 420,
        alignSelf: "center",
        backgroundColor: isDark
          ? "rgba(30,30,30,0.92)"
          : "rgba(255,255,255,0.92)",
        borderRadius: 20,
        borderCurve: "continuous",
        padding: 20,
        boxShadow: "0px 4px 24px rgba(0,0,0,0.2)",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            selectable
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: AC.label as any,
              letterSpacing: 1,
            }}
          >
            {callsign}
          </Text>
          <Text
            selectable
            style={{
              fontSize: 14,
              color: AC.secondaryLabel as any,
            }}
          >
            {aircraftType}
            {registration !== "N/A" ? ` · ${registration}` : ""}
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.06)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: AC.secondaryLabel as any,
              fontWeight: "600",
            }}
          >
            ✕
          </Text>
        </Pressable>
      </View>

      {/* Status badge */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: isOnGround
              ? "rgba(142,142,147,0.2)"
              : "rgba(0,122,255,0.15)",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: isOnGround
                ? (AC.systemGray as any)
                : (AC.systemBlue as any),
            }}
          >
            {isOnGround ? "ON GROUND" : "IN FLIGHT"}
          </Text>
        </View>
        {aircraft.hex && (
          <Text
            selectable
            style={{
              fontSize: 12,
              color: AC.tertiaryLabel as any,
              fontVariant: ["tabular-nums"],
            }}
          >
            ICAO: {aircraft.hex.toUpperCase()}
          </Text>
        )}
      </View>

      {/* Info rows */}
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: AC.separator as any,
        }}
      >
        <InfoRow label="Altitude" value={altitude} />
        <InfoRow label="Ground Speed" value={speed} />
        <InfoRow label="Heading" value={heading} />
        <InfoRow label="Vertical Rate" value={verticalRate} />
        <InfoRow label="Squawk" value={squawk} />
      </View>
    </View>
  );
}
