import React, { useState } from 'react';
import { LocationPoint, TrackingSession } from '../types/gis';
import { formatDMS, formatSpeed } from '../utils/geoCalculations';
import { Search, Download, ExternalLink, MapPin } from 'lucide-react';

interface WaypointsTableProps {
  session: TrackingSession;
  onSelectPoint?: (point: LocationPoint) => void;
  onExport: (format: 'geojson' | 'gpx' | 'csv') => void;
}

export const WaypointsTable: React.FC<WaypointsTableProps> = ({
  session,
  onSelectPoint,
  onExport,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredPoints = session.points.filter((pt, index) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    const indexMatch = String(index + 1).includes(q);
    const latMatch = pt.latitude.toFixed(5).includes(q);
    const lonMatch = pt.longitude.toFixed(5).includes(q);
    return indexMatch || latMatch || lonMatch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Recorded Waypoints Log</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{session.points.length} Total Waypoints</span>
            <span aria-hidden="true">·</span>
            <span>WGS 84 Coordinates</span>
            <span aria-hidden="true">·</span>
            <span>Client-side Secure Store</span>
          </div>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search point or coordinate..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => onExport('csv')}
            disabled={session.points.length === 0}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => onExport('geojson')}
            disabled={session.points.length === 0}
            className="px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </button>
        </div>
      </div>

      {session.points.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Waypoints Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Click "Start Tracking" on the map or run the MUST Campus Walk Simulation to record real-time GPS fixes.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">#</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Latitude</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Longitude</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">DMS Format</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Accuracy</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Speed</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Altitude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredPoints.map((pt, idx) => {
                const speed = formatSpeed(pt.speed);
                return (
                  <tr
                    key={pt.timestamp + '-' + idx}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => onSelectPoint?.(pt)}
                  >
                    <td className="py-2 px-4 font-mono text-slate-400 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-300 tabular-nums whitespace-nowrap">
                      {new Date(pt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-4 font-mono text-white tabular-nums">
                      {pt.latitude.toFixed(6)}°
                    </td>
                    <td className="py-2 px-4 font-mono text-white tabular-nums">
                      {pt.longitude.toFixed(6)}°
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-400 tabular-nums text-[11px] whitespace-nowrap">
                      {formatDMS(pt.latitude, true)}, {formatDMS(pt.longitude, false)}
                    </td>
                    <td className="py-2 px-4 font-mono text-cyan-300 tabular-nums">
                      ±{pt.accuracy.toFixed(1)} m
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-200 tabular-nums">
                      {speed.kmh}
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-400 tabular-nums">
                      {pt.altitude !== null ? `${pt.altitude.toFixed(1)} m` : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
