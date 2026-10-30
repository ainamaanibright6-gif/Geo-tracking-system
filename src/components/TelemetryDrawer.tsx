import React from 'react';
import {
  Compass,
  Gauge,
  Navigation2,
  Clock,
  MapPin,
  Mountain,
  Activity,
  Layers,
} from 'lucide-react';
import { LocationPoint, TrackingSession } from '../types/gis';
import {
  formatDMS,
  formatDistance,
  formatSpeed,
  getAccuracyQuality,
  getCardinalDirection,
} from '../utils/geoCalculations';

interface TelemetryDrawerProps {
  currentPoint: LocationPoint | null;
  session: TrackingSession;
  elapsedSeconds: number;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  currentPoint,
  session,
  elapsedSeconds,
}) => {
  const speed = currentPoint ? formatSpeed(currentPoint.speed) : { kmh: '0.0 km/h', mps: '0.0 m/s' };
  const avgSpeed = formatSpeed(session.avgSpeed);
  const accuracy = currentPoint ? getAccuracyQuality(currentPoint.accuracy) : null;
  const cardinalHeading = currentPoint ? getCardinalDirection(currentPoint.heading) : 'N/A';

  const formatElapsedTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const h = Math.floor(m / 60);
    if (h > 0) {
      return `${h}h ${m % 60}m ${s}s`;
    }
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-4 py-3">
      {/* 4-6 Column High-Density GIS Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {/* Metric 1: Geographic Coordinates (DD & DMS) */}
        <div className="flex flex-col p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Position (WGS 84)</span>
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          {currentPoint ? (
            <div className="flex flex-col">
              <div className="text-xs font-mono font-semibold text-white tabular-nums truncate">
                {currentPoint.latitude.toFixed(5)}°, {currentPoint.longitude.toFixed(5)}°
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                {formatDMS(currentPoint.latitude, true)}
              </div>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-500 tabular-nums">Waiting for GPS...</span>
          )}
        </div>

        {/* Metric 2: GPS Accuracy & Uncertainty */}
        <div className="flex flex-col p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">GPS Accuracy</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          {currentPoint && accuracy ? (
            <div className="flex flex-col">
              <div className="text-sm font-mono font-bold text-cyan-300 tabular-nums">
                ±{currentPoint.accuracy.toFixed(1)} m
              </div>
              <span className="text-[10px] text-slate-300 truncate mt-0.5">
                {accuracy.label}
              </span>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-500 tabular-nums">No Fix</span>
          )}
        </div>

        {/* Metric 3: Distance Traveled */}
        <div className="flex flex-col p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Track Distance</span>
            <Navigation2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-mono font-bold text-white tabular-nums">
              {formatDistance(session.totalDistance)}
            </div>
            <span className="text-[10px] text-slate-400 tabular-nums">
              {session.points.length} waypoints recorded
            </span>
          </div>
        </div>

        {/* Metric 4: Real-time Speed */}
        <div className="flex flex-col p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Speed</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-mono font-bold text-white tabular-nums">
              {speed.kmh}
            </div>
            <span className="text-[10px] text-slate-400 tabular-nums">
              Avg: {avgSpeed.kmh}
            </span>
          </div>
        </div>

        {/* Metric 5: Elevation / Altitude */}
        <div className="flex flex-col p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Elevation (MSL)</span>
            <Mountain className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-mono font-bold text-white tabular-nums">
              {currentPoint?.altitude !== null && currentPoint?.altitude !== undefined
                ? `${currentPoint.altitude.toFixed(1)} m`
                : '1,432 m (Mbarara)'}
            </div>
            <span className="text-[10px] text-slate-400">
              {currentPoint?.altitudeAccuracy ? `±${currentPoint.altitudeAccuracy.toFixed(1)}m vert` : 'Above Sea Level'}
            </span>
          </div>
        </div>

        {/* Metric 6: Elapsed Time & Heading */}
        <div className="flex flex-col p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Time & Heading</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-mono font-bold text-white tabular-nums">
              {formatElapsedTime(elapsedSeconds)}
            </div>
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              Bearing: {cardinalHeading}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
