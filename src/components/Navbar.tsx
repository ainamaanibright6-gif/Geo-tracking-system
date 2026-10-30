import React from 'react';
import { Navigation, ShieldCheck, HelpCircle, Layers, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'telemetry' | 'tracks' | 'campus' | 'ethics';
  setActiveTab: (tab: 'map' | 'telemetry' | 'tracks' | 'campus' | 'ethics') => void;
  isTracking: boolean;
  onOpenPrivacyModal: () => void;
  onOpenGisInfoModal: () => void;
  pointCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isTracking,
  onOpenPrivacyModal,
  onOpenGisInfoModal,
  pointCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-5 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      {/* Zone 1: Brand Title (One line wordmark) */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#map"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('map');
          }}
          className="flex items-center gap-2.5 text-slate-100 group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
            <Navigation className="w-4 h-4 transform -rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              GeoTrack MUST
            </span>
          </div>
        </a>
      </div>

      {/* Zone 2: 4-5 single-line clean navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('map')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeTab === 'map' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Interactive Map
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeTab === 'telemetry' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Spatial Telemetry
        </button>
        <button
          onClick={() => setActiveTab('campus')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeTab === 'campus' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Campus GIS POIs
        </button>
        <button
          onClick={() => setActiveTab('tracks')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeTab === 'tracks' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Waypoints ({pointCount})
        </button>
        <button
          onClick={onOpenPrivacyModal}
          className="transition-colors whitespace-nowrap shrink-0 hover:text-white text-slate-400 flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Privacy & Consent</span>
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenGisInfoModal}
          title="GIS Technical Documentation & WGS 84 Reference"
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
          aria-label="GIS Project Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border ${
              isTracking
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                isTracking ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
              }`}
            />
            <span className="whitespace-nowrap">
              {isTracking ? 'GPS Active' : 'Standby'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
