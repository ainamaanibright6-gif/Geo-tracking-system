import React from 'react';
import { MUST_CAMPUS_POIS } from '../utils/mustPresets';
import { CampusPOI, LocationPoint } from '../types/gis';
import { calculateDistance, formatDistance, formatDMS } from '../utils/geoCalculations';
import { MapPin, Navigation, Compass, Building, BookOpen, Layers } from 'lucide-react';

interface CampusPOIsViewProps {
  currentPoint: LocationPoint | null;
  onNavigateToPOI: (poi: CampusPOI) => void;
}

export const CampusPOIsView: React.FC<CampusPOIsViewProps> = ({
  currentPoint,
  onNavigateToPOI,
}) => {
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">
          MUST Campus Geospatial Points of Interest
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Ground-truth geodetic benchmarks and academic facilities at Mbarara University of Science and Technology (MUST Main Campus & Kihumuro Campus).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MUST_CAMPUS_POIS.map((poi) => {
          let distanceStr = 'Location required';
          if (currentPoint) {
            const dist = calculateDistance(
              currentPoint.latitude,
              currentPoint.longitude,
              poi.latitude,
              poi.longitude
            );
            distanceStr = `${formatDistance(dist)} away`;
          }

          const getCategoryIcon = (category: string) => {
            switch (category) {
              case 'academic':
                return <Building className="w-4 h-4 text-cyan-400" />;
              case 'library':
                return <BookOpen className="w-4 h-4 text-emerald-400" />;
              default:
                return <MapPin className="w-4 h-4 text-amber-400" />;
            }
          };

          return (
            <div
              key={poi.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(poi.category)}
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {poi.category}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-cyan-400">
                    {distanceStr}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white mb-1.5">{poi.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {poi.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="font-mono text-[11px] text-slate-400">
                  {poi.latitude.toFixed(5)}°, {poi.longitude.toFixed(5)}°
                </div>
                <button
                  onClick={() => onNavigateToPOI(poi)}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Navigation className="w-3 h-3 text-cyan-400 transform -rotate-45" />
                  <span>View on Map</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
