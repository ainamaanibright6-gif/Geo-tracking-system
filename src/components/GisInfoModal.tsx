import React from 'react';
import { X, Globe2, Satellite, Award, BookOpen, Layers, CheckCircle } from 'lucide-react';

interface GisInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GisInfoModal: React.FC<GisInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">GeoTrack: University GIS Documentation</h3>
              <p className="text-xs text-slate-400">Mbarara University of Science and Technology (MUST)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-4 space-y-5 text-xs text-slate-300 leading-relaxed pr-1">
          {/* Assignment Banner */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-start gap-3">
            <Award className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white text-xs">Project Context & University Assignment</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Developed for the Geographic Information Systems (GIS) tracking project at Mbarara University of Science and Technology (MUST). Demonstrates real-time smartphone GNSS tracking, spatial visualization, dynamic uncertainty modeling, and WGS 84 coordinate reference management.
              </p>
            </div>
          </div>

          {/* Core GIS Concepts Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Satellite className="w-4 h-4 text-cyan-400" />
                <span>Geodetic Datum: WGS 84 (EPSG:4326)</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The World Geodetic System 1984 is the global reference ellipsoid utilized by the browser Geolocation API. Coordinates are rendered in Decimal Degrees (DD) and transformed on-the-fly into Degrees Minutes Seconds (DMS) for surveying precision.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Spatial Accuracy Circle (HDOP)</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The concentric blue circle visualized around the current position marker represents the 95% confidence radius (accuracy in meters). It models horizontal uncertainty caused by satellite geometry and atmospheric signal delays.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Great Circle Distance (Haversine)</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Cumulative track length is computed using the spherical Haversine formula accounting for Earth's curvature (mean radius R = 6,371 km), avoiding Euclidean flat-plane projection distortions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <span>Interoperable GIS Exports</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Tracks can be directly exported as GeoJSON FeatureCollections (for QGIS/ArcGIS), GPX tracks (for Garmin/handheld receivers), and tabular CSV with timestamps for statistical regression.
              </p>
            </div>
          </div>

          {/* Technological Pipeline */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-white text-xs">Technical Implementation Details</h4>
            <div className="space-y-1.5 text-slate-400 text-[11px]">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong className="text-slate-200">Continuous Tracking:</strong> Managed via <code className="text-cyan-300">navigator.geolocation.watchPosition()</code> with hardware GNSS priority.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong className="text-slate-200">Interactive Map Engine:</strong> Leaflet.js with multi-source basemaps (OpenStreetMap, Carto, Esri Satellite).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong className="text-slate-200">MUST Campus Presets:</strong> Pre-calibrated ground-truth landmarks across Mbarara University of Science and Technology.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
