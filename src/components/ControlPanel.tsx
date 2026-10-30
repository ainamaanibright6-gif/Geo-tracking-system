import React from 'react';
import {
  Play,
  Square,
  Compass,
  Download,
  Trash2,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Eye,
  Sliders,
  Footprints,
} from 'lucide-react';
import { GeolocationStatus, TrackingSession } from '../types/gis';
import { exportToGeoJSON, exportToGPX, exportToCSV, downloadFile } from '../utils/geoCalculations';

interface ControlPanelProps {
  status: GeolocationStatus;
  errorMessage: string | null;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onClearTrack: () => void;
  highAccuracy: boolean;
  setHighAccuracy: (val: boolean) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  showAccuracyCircle: boolean;
  setShowAccuracyCircle: (val: boolean) => void;
  showBreadcrumbs: boolean;
  setShowBreadcrumbs: (val: boolean) => void;
  showCampusPOIs: boolean;
  setShowCampusPOIs: (val: boolean) => void;
  currentSession: TrackingSession;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  errorMessage,
  onStartTracking,
  onStopTracking,
  onClearTrack,
  highAccuracy,
  setHighAccuracy,
  isSimulating,
  onToggleSimulation,
  showAccuracyCircle,
  setShowAccuracyCircle,
  showBreadcrumbs,
  setShowBreadcrumbs,
  showCampusPOIs,
  setShowCampusPOIs,
  currentSession,
}) => {
  const isTracking = status === 'tracking';
  const hasPoints = currentSession.points.length > 0;

  const handleExport = (format: 'geojson' | 'gpx' | 'csv') => {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    if (format === 'geojson') {
      const data = exportToGeoJSON(currentSession);
      downloadFile(`must_geotrack_${timestampStr}.geojson`, data, 'application/geo+json');
    } else if (format === 'gpx') {
      const data = exportToGPX(currentSession);
      downloadFile(`must_geotrack_${timestampStr}.gpx`, data, 'application/gpx+xml');
    } else if (format === 'csv') {
      const data = exportToCSV(currentSession);
      downloadFile(`must_geotrack_${timestampStr}.csv`, data, 'text/csv');
    }
  };

  return (
    <div className="bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col gap-4 h-full overflow-y-auto">
      {/* Primary Action Zone */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          GPS Tracking Controls
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!isTracking ? (
            <button
              onClick={onStartTracking}
              className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Tracking</span>
            </button>
          ) : (
            <button
              onClick={onStopTracking}
              className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98]"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Tracking</span>
            </button>
          )}
        </div>

        {/* Desktop / Indoor Simulation Button */}
        <button
          onClick={onToggleSimulation}
          className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
            isSimulating
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>
            {isSimulating ? 'Stop MUST Walk Simulation' : 'Simulate Walk (MUST Campus)'}
          </span>
        </button>
      </div>

      {/* Permission & Geolocation Status Feedback */}
      {status === 'denied' && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-semibold text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Location Access Denied</span>
          </div>
          <p className="text-[11px] text-rose-300/80 leading-relaxed">
            The browser blocked geolocation permission. To enable: click the site lock icon in your address bar, switch Location to "Allow", and click Start Tracking again.
          </p>
        </div>
      )}

      {status === 'prompt' && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-semibold text-cyan-300">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Browser Permission Required</span>
          </div>
          <p className="text-[11px] text-cyan-300/80 leading-relaxed">
            When you click Start Tracking, your browser will prompt for GPS access. Grant permission to begin real-time positioning.
          </p>
        </div>
      )}

      {status === 'tracking' && (
        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px]">
            {isSimulating ? 'Playing simulated campus walk...' : 'Receiving real-time GPS fixes from device.'}
          </span>
        </div>
      )}

      {/* Accuracy & Hardware Mode Toggles */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
          <span>GPS Configuration</span>
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
        </div>

        <label className="flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors border border-slate-800">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-200">High Accuracy (GNSS)</span>
            <span className="text-[10px] text-slate-400">Forces device hardware GPS sensor</span>
          </div>
          <input
            type="checkbox"
            checked={highAccuracy}
            onChange={(e) => setHighAccuracy(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
          />
        </label>
      </div>

      {/* GIS Map Layers & Overlays */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
          <span>Layer Visibility</span>
          <Eye className="w-3.5 h-3.5 text-slate-500" />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center justify-between px-2.5 py-2 bg-slate-800/30 hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors text-xs text-slate-300">
            <span>Accuracy Uncertainty Circle</span>
            <input
              type="checkbox"
              checked={showAccuracyCircle}
              onChange={(e) => setShowAccuracyCircle(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between px-2.5 py-2 bg-slate-800/30 hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors text-xs text-slate-300">
            <span>Waypoint Breadcrumbs</span>
            <input
              type="checkbox"
              checked={showBreadcrumbs}
              onChange={(e) => setShowBreadcrumbs(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between px-2.5 py-2 bg-slate-800/30 hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors text-xs text-slate-300">
            <span>MUST Campus POIs</span>
            <input
              type="checkbox"
              checked={showCampusPOIs}
              onChange={(e) => setShowCampusPOIs(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
          </label>
        </div>
      </div>

      {/* Spatial Data Management & Export */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 mt-auto">
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Spatial Data Export
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleExport('geojson')}
            disabled={!hasPoints}
            className="px-2 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1"
            title="Export as GeoJSON FeatureCollection"
          >
            <Download className="w-3 h-3" />
            <span>GeoJSON</span>
          </button>
          <button
            onClick={() => handleExport('gpx')}
            disabled={!hasPoints}
            className="px-2 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1"
            title="Export as GPX Track"
          >
            <Download className="w-3 h-3" />
            <span>GPX</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={!hasPoints}
            className="px-2 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1"
            title="Export as Tabular CSV"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>

        {hasPoints && (
          <button
            onClick={onClearTrack}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-lg transition-colors border border-transparent hover:border-rose-900/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Track Trail ({currentSession.points.length} points)</span>
          </button>
        )}
      </div>
    </div>
  );
};
