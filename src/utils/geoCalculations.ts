import { LocationPoint, TrackingSession } from '../types/gis';

/**
 * Calculates the great-circle distance between two points on the Earth surface using the Haversine formula.
 * Result returned in meters.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance into meters or kilometers
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats speed from meters/sec into km/h and m/s
 */
export function formatSpeed(mps: number | null): { kmh: string; mps: string } {
  if (mps === null || isNaN(mps) || mps < 0.1) {
    return { kmh: '0.0 km/h', mps: '0.0 m/s' };
  }
  const kmh = (mps * 3.6).toFixed(1);
  const mpsStr = mps.toFixed(1);
  return { kmh: `${kmh} km/h`, mps: `${mpsStr} m/s` };
}

/**
 * Converts decimal degrees to Degrees, Minutes, Seconds (DMS) string
 */
export function formatDMS(decimal: number, isLatitude: boolean): string {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);

  let direction = '';
  if (isLatitude) {
    direction = decimal >= 0 ? 'N' : 'S';
  } else {
    direction = decimal >= 0 ? 'E' : 'W';
  }

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

/**
 * Categorizes GPS horizontal accuracy in meters (HDOP quality estimation)
 */
export function getAccuracyQuality(accuracyMeters: number): {
  level: 'high' | 'medium' | 'low' | 'poor';
  label: string;
  color: string;
  description: string;
} {
  if (accuracyMeters <= 5) {
    return {
      level: 'high',
      label: 'High Precision',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30',
      description: 'Survey grade / dual-band GNSS fix (≤ 5m)',
    };
  }
  if (accuracyMeters <= 15) {
    return {
      level: 'medium',
      label: 'Standard GPS',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30',
      description: 'Standard smartphone autonomous GPS fix (5–15m)',
    };
  }
  if (accuracyMeters <= 35) {
    return {
      level: 'low',
      label: 'Moderate Accuracy',
      color: 'text-amber-400 border-amber-500/30 bg-amber-950/30',
      description: 'Cell tower / Wi-Fi aided location fix (15–35m)',
    };
  }
  return {
    level: 'poor',
    label: 'Low Accuracy',
    color: 'text-rose-400 border-rose-500/30 bg-rose-950/30',
    description: 'High spatial uncertainty (> 35m)',
  };
}

/**
 * Converts compass degrees (0-360) to cardinal direction
 */
export function getCardinalDirection(heading: number | null): string {
  if (heading === null || isNaN(heading)) return 'N/A';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((heading % 360) / 45)) % 8;
  return `${directions[index]} (${Math.round(heading)}°)`;
}

/**
 * Export track points to GeoJSON FeatureCollection (Standard GIS format)
 */
export function exportToGeoJSON(session: TrackingSession): string {
  const coordinates = session.points.map((p) => [
    p.longitude,
    p.latitude,
    p.altitude ?? 0,
  ]);

  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      name: session.name,
      project: 'Mbarara University of Science and Technology (MUST) GIS GeoTrack',
      datum: 'WGS 84 (EPSG:4326)',
      startTime: new Date(session.startTime).toISOString(),
      endTime: session.endTime ? new Date(session.endTime).toISOString() : null,
      pointCount: session.points.length,
      totalDistanceMeters: Math.round(session.totalDistance),
    },
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          name: `${session.name} - Path`,
          distanceMeters: session.totalDistance,
          maxSpeedKmh: (session.maxSpeed * 3.6).toFixed(1),
          avgSpeedKmh: (session.avgSpeed * 3.6).toFixed(1),
        },
      },
      ...session.points.map((p, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.longitude, p.latitude, p.altitude ?? 0],
        },
        properties: {
          index,
          timestamp: new Date(p.timestamp).toISOString(),
          accuracyMeters: p.accuracy,
          speedMps: p.speed,
          speedKmh: p.speed !== null ? (p.speed * 3.6).toFixed(1) : null,
          heading: p.heading,
          altitude: p.altitude,
        },
      })),
    ],
  };

  return JSON.stringify(geojson, null, 2);
}

/**
 * Export track to GPX format (GPS Exchange Format)
 */
export function exportToGPX(session: TrackingSession): string {
  const trkpts = session.points
    .map((p) => {
      const timeIso = new Date(p.timestamp).toISOString();
      const eleTag = p.altitude !== null ? `<ele>${p.altitude.toFixed(1)}</ele>` : '';
      const speedTag = p.speed !== null ? `<speed>${p.speed.toFixed(2)}</speed>` : '';
      return `      <trkpt lat="${p.latitude.toFixed(6)}" lon="${p.longitude.toFixed(6)}">
        ${eleTag}
        <time>${timeIso}</time>
        ${speedTag}
        <extensions>
          <accuracy>${p.accuracy.toFixed(1)}</accuracy>
        </extensions>
      </trkpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GeoTrack MUST GIS" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${session.name}</name>
    <desc>Field track recorded via GeoTrack - MUST GIS project</desc>
    <time>${new Date(session.startTime).toISOString()}</time>
  </metadata>
  <trk>
    <name>${session.name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

/**
 * Export track points to CSV format (Tabular GIS coordinates)
 */
export function exportToCSV(session: TrackingSession): string {
  const headers = [
    'Index',
    'Timestamp_ISO',
    'Latitude_DD',
    'Longitude_DD',
    'Accuracy_m',
    'Altitude_m',
    'Speed_mps',
    'Speed_kmh',
    'Heading_deg',
  ].join(',');

  const rows = session.points.map((p, i) => {
    return [
      i + 1,
      new Date(p.timestamp).toISOString(),
      p.latitude.toFixed(6),
      p.longitude.toFixed(6),
      p.accuracy.toFixed(1),
      p.altitude !== null ? p.altitude.toFixed(1) : '',
      p.speed !== null ? p.speed.toFixed(2) : '',
      p.speed !== null ? (p.speed * 3.6).toFixed(1) : '',
      p.heading !== null ? Math.round(p.heading) : '',
    ].join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Triggers file download in browser
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
