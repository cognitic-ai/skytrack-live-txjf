const ADSB_API = "https://api.adsb.lol/v2";

async function fetchEndpoint(path: string): Promise<any> {
  const response = await fetch(`${ADSB_API}${path}`);
  if (!response.ok) {
    throw new Error(`ADSB API error: ${response.status}`);
  }
  return response.json();
}

export async function GET() {
  try {
    const [mil, pia] = await Promise.allSettled([
      fetchEndpoint("/mil"),
      fetchEndpoint("/pia"),
    ]);

    const allAircraft: any[] = [];
    const seen = new Set<string>();

    for (const result of [mil, pia]) {
      if (result.status === "fulfilled" && result.value?.ac) {
        for (const ac of result.value.ac) {
          if (!seen.has(ac.hex)) {
            seen.add(ac.hex);
            allAircraft.push(ac);
          }
        }
      }
    }

    return Response.json({
      ac: allAircraft,
      total: allAircraft.length,
      now: Date.now(),
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch flight data" },
      { status: 502 }
    );
  }
}
