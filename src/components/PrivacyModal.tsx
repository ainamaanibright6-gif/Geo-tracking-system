import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Smartphone, Database, Check } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Geospatial Privacy & Data Ethics</h3>
              <p className="text-xs text-slate-400">MUST GIS Field Tracking Policy & Safeguards</p>
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
        <div className="overflow-y-auto py-4 space-y-4 text-xs text-slate-300 leading-relaxed pr-1">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>100% Client-Side Processing</span>
            </div>
            <p className="text-slate-400">
              Your real-time GPS coordinates are processed exclusively inside your smartphone or computer browser memory. Coordinates are never transmitted to unauthorized external cloud databases or third-party ad networks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Explicit User Consent</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Geolocation is governed by the W3C Geolocation API. Tracking only occurs after you explicitly grant permission in the browser permission prompt.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <EyeOff className="w-4 h-4 text-cyan-400" />
                <span>Zero Passive Surveillance</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                When you click "Stop Tracking", the device GPS watch listener is immediately unregistered (`navigator.geolocation.clearWatch`).
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-white text-xs">Ugandan & International Privacy Compliance</h4>
            <p className="text-slate-400">
              This application is designed in compliance with the <strong className="text-slate-200">Uganda Data Protection and Privacy Act (2019)</strong> and international GIS ethical research guidelines regarding personal spatial trajectory data.
            </p>
            <ul className="space-y-1.5 text-slate-300 pt-1">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Data minimization: Only essential geodetic coordinates are read during active tracks.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>User control: You can export your data in open GIS formats (GeoJSON, GPX, CSV) or purge it anytime.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-colors"
          >
            I Understand & Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
