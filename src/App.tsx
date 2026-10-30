import React, { useState, useEffect, useRef } from 'react';
import { LocationPoint, TrackingSession, GeolocationStatus, BasemapId, CampusPOI } from './types/gis';
import { calculateDistance, exportToGeoJSON, exportToGPX, exportToCSV, downloadFile } from './utils/geoCalculations';
import { MUST_CAMPUS_WALK_SIMULATION } from './utils/mustPresets';
import { Navbar } from './components/Navbar';
import { MapContainer } from './components/MapContainer';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { WaypointsTable } from './components/WaypointsTable';
import { CampusPOIsView } from './components/CampusPOIsView';
import { PrivacyModal } from './components/PrivacyModal';
import { GisInfoModal } from './components/GisInfoModal';
import { Map, Activity, Layers, ListFilter, Shield } from 'lucide-react';

export default function App() {
  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<'map' | 'telemetry' | 'tracks' | 'campus' | 'ethics'>('map');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isGisInfoModalOpen, setIsGisInfoModalOpen] = useState(false);

  // Map & GIS Layer Display State
  const [basemapId, setBasemapId] = useState<BasemapId>('carto-dark');
  const [followUser, setFollowUser] = useState(true);
  const [showAccuracyCircle, setShowAccuracyCircle] = useState(true);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [showCampusPOIs, setShowCampusPOIs] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);

  // Tracking Data State
  const [currentPoint, setCurrentPoint] = useState<LocationPoint | null>(null);
  const [session, setSession] = useState<TrackingSession>({
    id: `track-${Date.now()}`,
    name: 'MUST Campus Field Survey Track',
    startTime: Date.now(),
    endTime: null,
    points: [],
    totalDistance: 0,
    maxSpeed: 0,
    avgSpeed: 0,
  });

  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Refs for background watches & timers
  const watchIdRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);
  const simulationIndexRef = useRef(0);
  const timerIntervalRef = useRef<number | null>(null);

  // Handle incoming GPS or Simulated location point
  const handleNewLocationPoint = (newPt: LocationPoint) => {
    setCurrentPoint(newPt);

    setSession((prevSession) => {
      const prevPoints = prevSession.points;
      const lastPoint = prevPoints.length > 0 ? prevPoints[prevPoints.length - 1] : null;

      let addedDistance = 0;
      if (lastPoint) {
        addedDistance = calculateDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          newPt.latitude,
          newPt.longitude
        );
      }

      const newTotalDistance = prevSession.totalDistance + addedDistance;
      const pointSpeed = newPt.speed !== null && !isNaN(newPt.speed) ? Math.max(0, newPt.speed) : 0;
      const newMaxSpeed = Math.max(prevSession.maxSpeed, pointSpeed);

      // Running average speed
      const totalPoints = prevPoints.length + 1;
      const speedSum = prevPoints.reduce((acc, p) => acc + (p.speed || 0), 0) + pointSpeed;
      const newAvgSpeed = totalPoints > 0 ? speedSum / totalPoints : 0;

      return {
        ...prevSession,
        points: [...prevPoints, newPt],
        totalDistance: newTotalDistance,
        maxSpeed: newMaxSpeed,
        avgSpeed: newAvgSpeed,
      };
    });
  };

  // Start Real Browser GPS Tracking
  const startTracking = () => {
    if (isSimulating) {
      stopSimulation();
    }

    if (!navigator.geolocation) {
      setStatus('unsupported');
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setStatus('requesting');
    setErrorMessage(null);

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 12000,
      maximumAge: 0,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const {
          latitude,
          longitude,
          accuracy,
          altitude,
          altitudeAccuracy,
          heading,
          speed,
        } = position.coords;

        const point: LocationPoint = {
          latitude,
          longitude,
          accuracy: accuracy || 5,
          altitude: altitude !== null ? altitude : null,
          altitudeAccuracy: altitudeAccuracy !== null ? altitudeAccuracy : null,
          heading: heading !== null ? heading : null,
          speed: speed !== null ? speed : null,
          timestamp: position.timestamp || Date.now(),
        };

        handleNewLocationPoint(point);
        setStatus('tracking');
        setErrorMessage(null);
      },
      (error) => {
        console.warn('Geolocation watchPosition error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          setErrorMessage('Location permission denied. Please allow location access in your browser settings.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setStatus('unavailable');
          setErrorMessage('Position unavailable. Check that GPS or network location is active.');
        } else if (error.code === error.TIMEOUT) {
          setStatus('timeout');
          setErrorMessage('GPS request timed out. Retrying satellite fix...');
        }
      },
      options
    );

    watchIdRef.current = watchId;
  };

  // Stop Real GPS Tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (isSimulating) {
      stopSimulation();
    }
    setStatus('stopped');
    setSession((prev) => ({
      ...prev,
      endTime: Date.now(),
    }));
  };

  // MUST Campus Walk Simulation
  const startSimulation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsSimulating(true);
    setStatus('tracking');
    setErrorMessage(null);
    simulationIndexRef.current = 0;

    const playNextStep = () => {
      const route = MUST_CAMPUS_WALK_SIMULATION;
      const index = simulationIndexRef.current;
      const simPt = route[index];

      const point: LocationPoint = {
        ...simPt,
        timestamp: Date.now(),
      };

      handleNewLocationPoint(point);

      simulationIndexRef.current = (index + 1) % route.length;
    };

    // First point immediately
    playNextStep();

    // Step every 2 seconds
    const interval = window.setInterval(playNextStep, 2000);
    simulationIntervalRef.current = interval;
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current !== null) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
  };

  const toggleSimulation = () => {
    if (isSimulating) {
      stopSimulation();
      setStatus('stopped');
    } else {
      startSimulation();
    }
  };

  // Track session timer
  useEffect(() => {
    if (status === 'tracking') {
      const timer = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      timerIntervalRef.current = timer;
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simulationIntervalRef.current !== null) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // Clear track handler
  const handleClearTrack = () => {
    if (window.confirm('Reset recorded track and clear all waypoints?')) {
      setSession({
        id: `track-${Date.now()}`,
        name: 'MUST Campus Field Survey Track',
        startTime: Date.now(),
        endTime: null,
        points: [],
        totalDistance: 0,
        maxSpeed: 0,
        avgSpeed: 0,
      });
      setElapsedSeconds(0);
    }
  };

  const handleExport = (format: 'geojson' | 'gpx' | 'csv') => {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    if (format === 'geojson') {
      const data = exportToGeoJSON(session);
      downloadFile(`must_geotrack_${timestampStr}.geojson`, data, 'application/geo+json');
    } else if (format === 'gpx') {
      const data = exportToGPX(session);
      downloadFile(`must_geotrack_${timestampStr}.gpx`, data, 'application/gpx+xml');
    } else if (format === 'csv') {
      const data = exportToCSV(session);
      downloadFile(`must_geotrack_${timestampStr}.csv`, data, 'text/csv');
    }
  };

  const handleNavigateToPOI = (poi: CampusPOI) => {
    setActiveTab('map');
    // Set point as current point if none exists or center on it
    if (!currentPoint) {
      setCurrentPoint({
        latitude: poi.latitude,
        longitude: poi.longitude,
        accuracy: 5,
        altitude: 1432,
        altitudeAccuracy: 3,
        heading: 0,
        speed: 0,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Navigation (Top Bar Contract) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTracking={status === 'tracking'}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onOpenGisInfoModal={() => setIsGisInfoModalOpen(true)}
        pointCount={session.points.length}
      />

      {/* Main Viewport Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Tab 1: Interactive Live Map */}
        <div
          className={`flex-1 flex flex-col h-full relative ${
            activeTab === 'map' ? 'flex' : 'hidden'
          }`}
        >
          <div className="flex-1 relative w-full h-full">
            <MapContainer
              currentPoint={currentPoint}
              points={session.points}
              isTracking={status === 'tracking'}
              basemapId={basemapId}
              setBasemapId={setBasemapId}
              followUser={followUser}
              setFollowUser={setFollowUser}
              showAccuracyCircle={showAccuracyCircle}
              showBreadcrumbs={showBreadcrumbs}
              showCampusPOIs={showCampusPOIs}
            />
          </div>

          {/* GIS Telemetry Bar (Bottom) */}
          <TelemetryDrawer
            currentPoint={currentPoint}
            session={session}
            elapsedSeconds={elapsedSeconds}
          />
        </div>

        {/* Tab 2: Spatial Telemetry Detailed View */}
        {activeTab === 'telemetry' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
            <div className="border-b border-slate-800 pb-4 mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Live Spatial Telemetry & GNSS Analytics
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time geodetic measurements, speed analysis, and horizontal accuracy dilution.
              </p>
            </div>

            <TelemetryDrawer
              currentPoint={currentPoint}
              session={session}
              elapsedSeconds={elapsedSeconds}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-2">Track Overview</h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Distance:</span>
                    <span className="font-mono font-bold text-white">
                      {(session.totalDistance / 1000).toFixed(3)} km ({Math.round(session.totalDistance)} m)
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Recorded Coordinates:</span>
                    <span className="font-mono text-cyan-300">{session.points.length} fixes</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Max Ground Speed:</span>
                    <span className="font-mono text-white">{(session.maxSpeed * 3.6).toFixed(1)} km/h</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Average Ground Speed:</span>
                    <span className="font-mono text-white">{(session.avgSpeed * 3.6).toFixed(1)} km/h</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Tracking Mode:</span>
                    <span className="text-slate-200">
                      {isSimulating ? 'MUST Campus Walk Simulation' : 'Live Browser Geolocation API'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-2">Geodetic Reference Frame</h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Coordinate Datum:</span>
                    <span className="font-mono text-white">WGS 84 (EPSG:4326)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Distance Metric:</span>
                    <span className="text-white">Spherical Haversine Great Circle</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Project University:</span>
                    <span className="text-white">Mbarara University of Science & Technology</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Hardware GNSS Flag:</span>
                    <span className="font-mono text-emerald-400">
                      enableHighAccuracy: {highAccuracy ? 'true' : 'false'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Recorded Waypoints Log */}
        {activeTab === 'tracks' && (
          <div className="flex-1 overflow-y-auto">
            <WaypointsTable
              session={session}
              onSelectPoint={(pt) => {
                setCurrentPoint(pt);
                setActiveTab('map');
              }}
              onExport={handleExport}
            />
          </div>
        )}

        {/* Tab 4: MUST Campus GIS POIs */}
        {activeTab === 'campus' && (
          <div className="flex-1 overflow-y-auto">
            <CampusPOIsView
              currentPoint={currentPoint}
              onNavigateToPOI={handleNavigateToPOI}
            />
          </div>
        )}

        {/* Tab 5: Privacy & Ethics View (Direct nav or modal) */}
        {activeTab === 'ethics' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-800 pb-4 mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Privacy Considerations & GIS Ethics
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Student and researcher data rights, consent workflows, and device security.
              </p>
            </div>
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <p>
                In compliance with the <strong className="text-white">Uganda Data Protection and Privacy Act 2019</strong>, personal spatial location trajectories represent sensitive information.
              </p>
              <h3 className="text-sm font-bold text-white pt-2">Key Protections in GeoTrack:</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-300">
                <li><strong className="text-white">Zero External Database Leakage:</strong> All GPS readings obtained via <code className="text-cyan-300">navigator.geolocation.watchPosition()</code> reside only in client browser memory.</li>
                <li><strong className="text-white">Granular User Agency:</strong> The user can start or terminate tracking at will. Stopping tracking unhooks the watch listener immediately.</li>
                <li><strong className="text-white">Data Portability:</strong> Recorded tracks can be exported to standard GIS formats (GeoJSON, GPX, CSV) or purged instantly.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Control Panel (Side Panel on Desktop, Drawer on Mobile) */}
        <aside
          className={`w-full md:w-80 lg:w-96 shrink-0 h-auto md:h-full z-10 ${
            activeTab === 'map' ? 'block' : 'hidden md:block'
          }`}
        >
          <ControlPanel
            status={status}
            errorMessage={errorMessage}
            onStartTracking={startTracking}
            onStopTracking={stopTracking}
            onClearTrack={handleClearTrack}
            highAccuracy={highAccuracy}
            setHighAccuracy={setHighAccuracy}
            isSimulating={isSimulating}
            onToggleSimulation={toggleSimulation}
            showAccuracyCircle={showAccuracyCircle}
            setShowAccuracyCircle={setShowAccuracyCircle}
            showBreadcrumbs={showBreadcrumbs}
            setShowBreadcrumbs={setShowBreadcrumbs}
            showCampusPOIs={showCampusPOIs}
            setShowCampusPOIs={setShowCampusPOIs}
            currentSession={session}
          />
        </aside>
      </div>

      {/* Modals */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <GisInfoModal
        isOpen={isGisInfoModalOpen}
        onClose={() => setIsGisInfoModalOpen(false)}
      />
    </div>
  );
}
