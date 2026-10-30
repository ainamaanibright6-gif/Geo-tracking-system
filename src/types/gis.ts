export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null; // degrees (0-360)
  speed: number | null; // in meters per second
  timestamp: number;
}

export interface TrackingSession {
  id: string;
  name: string;
  startTime: number;
  endTime: number | null;
  points: LocationPoint[];
  totalDistance: number; // in meters
  maxSpeed: number; // in m/s
  avgSpeed: number; // in m/s
}

export type BasemapId = 'osm' | 'carto-dark' | 'esri-satellite' | 'topo';

export interface BasemapConfig {
  id: BasemapId;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export interface CampusPOI {
  id: string;
  name: string;
  category: 'academic' | 'administrative' | 'library' | 'facility';
  latitude: number;
  longitude: number;
  description: string;
}

export type GeolocationStatus =
  | 'idle'
  | 'prompt'
  | 'requesting'
  | 'tracking'
  | 'stopped'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';
