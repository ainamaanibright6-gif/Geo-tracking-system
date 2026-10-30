import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationPoint, BasemapId, CampusPOI } from '../types/gis';
import { BASEMAPS } from '../utils/basemaps';
import { formatDMS, formatDistance, formatSpeed, getAccuracyQuality } from '../utils/geoCalculations';
import { MUST_CAMPUS_POIS } from '../utils/mustPresets';
import { Layers, Crosshair, ZoomIn, ZoomOut, Maximize2, MapPin } from 'lucide-react';

interface MapContainerProps {
  currentPoint: LocationPoint | null;
  points: LocationPoint[];
  isTracking: boolean;
  basemapId: BasemapId;
  setBasemapId: (id: BasemapId) => void;
  followUser: boolean;
  setFollowUser: (follow: boolean) => void;
  showAccuracyCircle: boolean;
  showBreadcrumbs: boolean;
  showCampusPOIs: boolean;
  onSelectPOI?: (poi: CampusPOI) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  currentPoint,
  points,
  isTracking,
  basemapId,
  setBasemapId,
  followUser,
  setFollowUser,
  showAccuracyCircle,
  showBreadcrumbs,
  showCampusPOIs,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  // Layer references
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const trailPolylineRef = useRef<L.Polyline | null>(null);
  const trailGlowPolylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const breadcrumbGroupRef = useRef<L.LayerGroup | null>(null);
  const poiGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: MUST Main Campus, Mbarara (-0.6163, 30.6568)
    const initialLat = currentPoint ? currentPoint.latitude : -0.6163;
    const initialLng = currentPoint ? currentPoint.longitude : 30.6568;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      zoomControl: false, // We render sleek custom controls
      attributionControl: true,
    });

    // Add initial basemap
    const selectedBasemap = BASEMAPS.find((b) => b.id === basemapId) || BASEMAPS[0];
    const tileLayer = L.tileLayer(selectedBasemap.url, {
      attribution: selectedBasemap.attribution,
      maxZoom: selectedBasemap.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Add standard GIS metric scale bar
    L.control
      .scale({
        imperial: false,
        metric: true,
        position: 'bottomleft',
      })
      .addTo(map);

    // Create layer groups
    breadcrumbGroupRef.current = L.layerGroup().addTo(map);
    poiGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Unmount cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap layer when basemapId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const selectedBasemap = BASEMAPS.find((b) => b.id === basemapId) || BASEMAPS[0];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(selectedBasemap.url, {
      attribution: selectedBasemap.attribution,
      maxZoom: selectedBasemap.maxZoom,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [basemapId]);

  // Update MUST Campus POIs
  useEffect(() => {
    const map = mapInstanceRef.current;
    const poiGroup = poiGroupRef.current;
    if (!map || !poiGroup) return;

    poiGroup.clearLayers();

    if (!showCampusPOIs) return;

    MUST_CAMPUS_POIS.forEach((poi) => {
      const poiIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div class="relative flex items-center justify-center w-7 h-7 bg-amber-500/20 border-2 border-amber-400 rounded-full text-amber-300 shadow-lg backdrop-blur-sm transform hover:scale-110 transition-transform">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([poi.latitude, poi.longitude], { icon: poiIcon });
      marker.bindPopup(`
        <div class="p-1 max-w-xs font-sans text-slate-100">
          <div class="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
            <span>MUST Campus POI</span>
            <span>·</span>
            <span class="capitalize text-slate-400">${poi.category}</span>
          </div>
          <h4 class="font-bold text-sm text-white mb-1">${poi.name}</h4>
          <p class="text-xs text-slate-300 mb-2">${poi.description}</p>
          <div class="text-[11px] font-mono text-slate-400 border-t border-slate-700/60 pt-1.5">
            ${poi.latitude.toFixed(5)}, ${poi.longitude.toFixed(5)}
          </div>
        </div>
      `);

      poiGroup.addLayer(marker);
    });
  }, [showCampusPOIs]);

  // Update User Trail (Polylines) & Breadcrumbs
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latlngs: L.LatLngTuple[] = points.map((p) => [p.latitude, p.longitude]);

    // Outer glow trail
    if (trailGlowPolylineRef.current) {
      trailGlowPolylineRef.current.setLatLngs(latlngs);
    } else if (latlngs.length > 0) {
      trailGlowPolylineRef.current = L.polyline(latlngs, {
        color: '#0891b2',
        weight: 6,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    }

    // Main sharp trail
    if (trailPolylineRef.current) {
      trailPolylineRef.current.setLatLngs(latlngs);
    } else if (latlngs.length > 0) {
      trailPolylineRef.current = L.polyline(latlngs, {
        color: '#06b6d4',
        weight: 3.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    }

    // Start point pin
    if (points.length > 0 && !startMarkerRef.current) {
      const first = points[0];
      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `
          <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white">
            S
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      startMarkerRef.current = L.marker([first.latitude, first.longitude], {
        icon: startIcon,
      })
        .bindPopup(`
          <div class="p-1 text-slate-100 font-sans text-xs">
            <span class="font-bold text-emerald-400">Track Origin</span>
            <div class="text-[11px] text-slate-300 mt-0.5">
              ${new Date(first.timestamp).toLocaleTimeString()}
            </div>
            <div class="font-mono text-[10px] text-slate-400 mt-1">
              ${first.latitude.toFixed(5)}, ${first.longitude.toFixed(5)}
            </div>
          </div>
        `)
        .addTo(map);
    } else if (points.length === 0 && startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }

    // Breadcrumbs layer
    const breadcrumbGroup = breadcrumbGroupRef.current;
    if (breadcrumbGroup) {
      breadcrumbGroup.clearLayers();
      if (showBreadcrumbs && points.length > 2) {
        // Show sampled waypoints to keep performance high
        const step = points.length > 100 ? 5 : points.length > 50 ? 2 : 1;
        for (let i = 1; i < points.length - 1; i += step) {
          const pt = points[i];
          const dot = L.circleMarker([pt.latitude, pt.longitude], {
            radius: 3,
            fillColor: '#38bdf8',
            color: '#0f172a',
            weight: 1,
            fillOpacity: 0.8,
          });

          dot.bindPopup(`
            <div class="p-1 font-sans text-xs text-slate-100">
              <div class="font-semibold text-cyan-400">Waypoint #${i + 1}</div>
              <div class="text-slate-300 text-[11px] mt-0.5">${new Date(pt.timestamp).toLocaleTimeString()}</div>
              <div class="font-mono text-[10px] text-slate-400 mt-1">
                ${pt.latitude.toFixed(6)}, ${pt.longitude.toFixed(6)}
              </div>
              <div class="text-[11px] text-slate-300 mt-1">
                Accuracy: ±${pt.accuracy.toFixed(1)}m
              </div>
            </div>
          `);

          breadcrumbGroup.addLayer(dot);
        }
      }
    }
  }, [points, showBreadcrumbs]);

  // Update Current Position Marker & Accuracy Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentPoint) return;

    const { latitude, longitude, accuracy, heading, speed } = currentPoint;
    const quality = getAccuracyQuality(accuracy);
    const speedFormatted = formatSpeed(speed);

    // 1. Accuracy Circle (visualizes spatial uncertainty)
    if (showAccuracyCircle) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([latitude, longitude]);
        accuracyCircleRef.current.setRadius(accuracy);
      } else {
        accuracyCircleRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#06b6d4',
          weight: 1.5,
          opacity: 0.6,
          fillColor: '#06b6d4',
          fillOpacity: 0.12,
          dashArray: '4, 6',
        }).addTo(map);
      }
    } else if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }

    // 2. Current Position Marker with Radar Beacon
    const rotationDeg = heading !== null && !isNaN(heading) ? heading : 0;
    const hasHeading = heading !== null && !isNaN(heading);

    const markerHtml = `
      <div class="relative flex items-center justify-center w-10 h-10 -top-2 -left-2">
        <div class="absolute w-10 h-10 rounded-full bg-cyan-400/30 beacon-pulse pointer-events-none"></div>
        <div class="relative w-5 h-5 bg-cyan-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          ${
            hasHeading
              ? `<div style="transform: rotate(${rotationDeg}deg);" class="transition-transform duration-200">
                  <svg class="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
                    <polygon points="12,2 22,22 12,18 2,22" />
                  </svg>
                </div>`
              : `<div class="w-2 h-2 bg-white rounded-full"></div>`
          }
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'gis-user-tracker-icon',
      html: markerHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const popupContent = `
      <div class="p-1 font-sans text-slate-100 max-w-[240px]">
        <div class="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1 mb-2">
          <span class="font-bold text-xs text-cyan-400">Live Device Position</span>
          <span class="text-[10px] font-mono text-slate-400">${new Date(currentPoint.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="space-y-1 text-xs">
          <div class="flex justify-between text-slate-300">
            <span class="text-slate-400">Lat:</span>
            <span class="font-mono text-white">${latitude.toFixed(6)}°</span>
          </div>
          <div class="flex justify-between text-slate-300">
            <span class="text-slate-400">Lon:</span>
            <span class="font-mono text-white">${longitude.toFixed(6)}°</span>
          </div>
          <div class="flex justify-between text-slate-300">
            <span class="text-slate-400">DMS Lat:</span>
            <span class="font-mono text-[11px] text-slate-200">${formatDMS(latitude, true)}</span>
          </div>
          <div class="flex justify-between text-slate-300">
            <span class="text-slate-400">DMS Lon:</span>
            <span class="font-mono text-[11px] text-slate-200">${formatDMS(longitude, false)}</span>
          </div>
          <div class="flex justify-between text-slate-300">
            <span class="text-slate-400">GPS Accuracy:</span>
            <span class="font-mono font-medium text-cyan-300">±${accuracy.toFixed(1)} m</span>
          </div>
          <div class="flex justify-between text-slate-300">
            <span class="text-slate-400">Speed:</span>
            <span class="font-mono text-white">${speedFormatted.kmh}</span>
          </div>
          ${
            currentPoint.altitude !== null
              ? `<div class="flex justify-between text-slate-300">
                  <span class="text-slate-400">Elevation:</span>
                  <span class="font-mono text-white">${currentPoint.altitude.toFixed(1)} m</span>
                </div>`
              : ''
          }
        </div>
        <div class="mt-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
          Precision: <span class="font-medium text-slate-200">${quality.label}</span>
        </div>
      </div>
    `;

    if (currentMarkerRef.current) {
      currentMarkerRef.current.setLatLng([latitude, longitude]);
      currentMarkerRef.current.setIcon(customIcon);
      currentMarkerRef.current.setPopupContent(popupContent);
    } else {
      currentMarkerRef.current = L.marker([latitude, longitude], {
        icon: customIcon,
        zIndexOffset: 1000,
      })
        .bindPopup(popupContent)
        .addTo(map);
    }

    // Auto-pan / follow user if followUser is toggled
    if (followUser) {
      map.panTo([latitude, longitude], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [currentPoint, showAccuracyCircle, followUser]);

  // Center on Current Location
  const handleCenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (!map || !currentPoint) return;
    map.flyTo([currentPoint.latitude, currentPoint.longitude], 18, {
      duration: 1,
    });
    setFollowUser(true);
  };

  // Fit all trail bounds
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    } else if (currentPoint) {
      map.setView([currentPoint.latitude, currentPoint.longitude], 17);
    } else {
      map.setView([-0.6163, 30.6568], 17);
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* The Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Basemap & GIS Layer Selector (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl flex items-center gap-1">
          {BASEMAPS.map((bm) => (
            <button
              key={bm.id}
              onClick={() => setBasemapId(bm.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                basemapId === bm.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {bm.name}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Quick Action Controls (Right Center) */}
      <div className="absolute right-4 bottom-24 md:bottom-8 z-20 flex flex-col gap-2">
        {/* Recenter & Follow Toggle */}
        <button
          onClick={handleCenterOnUser}
          disabled={!currentPoint}
          title={followUser ? 'Following Location (Locked)' : 'Center on My Location'}
          className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg backdrop-blur-md transition-all ${
            followUser
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 ring-2 ring-cyan-500/30'
              : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
          } ${!currentPoint ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* Fit Track Bounds */}
        <button
          onClick={handleFitBounds}
          title="Fit Track Bounds in View"
          className="w-10 h-10 rounded-xl bg-slate-900/90 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 flex items-center justify-center shadow-lg backdrop-blur-md transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-10 h-10 rounded-xl bg-slate-900/90 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 flex items-center justify-center shadow-lg backdrop-blur-md transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-10 h-10 rounded-xl bg-slate-900/90 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 flex items-center justify-center shadow-lg backdrop-blur-md transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Live Map Watermark Badge (Quiet, Non-intrusive) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
        <span className="font-semibold text-white">Mbarara, Uganda</span>
        <span className="text-slate-600">·</span>
        <span className="font-mono text-[11px] text-slate-400">EPSG:4326 (WGS 84)</span>
      </div>
    </div>
  );
};
