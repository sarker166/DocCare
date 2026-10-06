import React from 'react';
import { Stethoscope, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#060e1c] text-slate-400 pt-12 pb-8 border-t border-blue-900/40 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-base font-bold text-white">DocCare</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Real-time doctor availability and appointment booking system. Eliminating double bookings and hospital wait queues with digital slot reservations.
            </p>
            <div className="flex items-center gap-3 text-xs text-sky-400">
              <Shield className="w-4 h-4" />
              <span>HIPAA Compliant &amp; Secure</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              {[
                { to: '/doctors', label: 'Find Specialist Doctors' },
                { to: '/login', label: 'Patient Portal' },
                { to: '/register', label: 'Doctor Registration' },
                { to: '/admin', label: 'Hospital Admin Login' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-sky-300 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Specialties</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {['Cardiology & Heart Care', 'Neurology & Brain Sciences', 'Pediatrics & Child Wellness', 'Dermatology & Skin Clinic', 'Orthopedics & Joint Health', 'General Family Medicine'].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-blue-900/30 text-center text-xs flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400">
          <p>© {new Date().getFullYear()} DocCare Availability System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
