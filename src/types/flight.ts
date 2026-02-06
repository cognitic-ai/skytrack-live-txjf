export interface Aircraft {
  hex: string;
  r?: string;
  flight?: string;
  t?: string;
  lat?: number;
  lon?: number;
  rr_lat?: number;
  rr_lon?: number;
  lastPosition?: {
    lat: number;
    lon: number;
    nic: number;
    rc: number;
    seen_pos: number;
  };
  alt_baro?: number | "ground";
  alt_geom?: number;
  gs?: number;
  track?: number;
  baro_rate?: number;
  squawk?: string;
  category?: string;
  nav_altitude_mcp?: number;
  nav_heading?: number;
  seen?: number;
  rssi?: number;
  type?: string;
  dbFlags?: number;
}

export interface ADSBResponse {
  ac: Aircraft[];
  msg: string;
  now: number;
  total: number;
  ctime: number;
  ptime: number;
}
