import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Stethoscope, Calendar, Award, MapPin, Phone } from 'lucide-react';
import api from '../services/api';

export default function DoctorList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDept = searchParams.get('department') || 'All';
  const currentSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    api.get('/departments').then((r) => setDepartments(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('approvalStatus', 'approved');
    if (currentDept !== 'All') params.set('department', currentDept);
    if (currentSearch) params.set('search', currentSearch);
    api.get(`/doctors?${params}`).then((r) => setDoctors(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [currentDept, currentSearch]);

  const handleDeptSelect = (deptName) => {
    const next = new URLSearchParams(searchParams);
    deptName === 'All' ? next.delete('department') : next.set('department', deptName);
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    searchInput ? next.set('search', searchInput) : next.delete('search');
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Find a Doctor</h1>
          <p className="text-sm text-[#888882] mt-1">Browse certified physicians and check real-time schedule availability.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#555552] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="Search by name or specialty..."
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#1a1a18] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#555552] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-xl transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', ...departments.map((d) => d.name)].map((name) => {
          const isSelected = currentDept === name || (name === 'All' && currentDept === 'All');
          return (
            <button
              key={name} type="button" onClick={() => handleDeptSelect(name)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'bg-[#1a1a18] text-[#888882] border border-white/[0.08] hover:border-teal-500/40 hover:text-white'
              }`}
            >
              {name === 'All' ? 'All Departments' : name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map((n) => <div key={n} className="h-72 bg-[#1a1a18] rounded-2xl animate-pulse" />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-[#1a1a18] rounded-3xl border border-dashed border-white/[0.08] p-12 text-center max-w-md mx-auto">
          <Stethoscope className="w-12 h-12 text-[#3a3a38] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Doctors Found</h3>
          <p className="text-xs text-[#888882] mt-1">No approved physicians matched your filter. Try 'All Departments' or clear search.</p>
          <button onClick={() => { setSearchInput(''); setSearchParams({}); }}
            className="mt-4 text-xs font-bold text-teal-400 hover:text-teal-300 underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc._id} className="bg-[#1a1a18] rounded-3xl border border-white/[0.08] overflow-hidden hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-900/20 transition-all flex flex-col justify-between">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-20 h-20 rounded-2xl object-cover object-top border border-white/10 shadow-lg flex-shrink-0 bg-[#252522]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=350';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-1">
                      {doc.department}
                    </span>
                    <h3 className="text-base font-bold text-white truncate" title={doc.name}>{doc.name}</h3>
                    <p className="text-xs text-[#888882] truncate">{doc.specialization}</p>
                    <p className="text-[11px] text-[#6b6b66] mt-0.5 truncate" title={doc.qualification}>{doc.qualification}</p>
                  </div>
                </div>

                <p className="text-xs text-[#888882] mt-4 line-clamp-2 leading-relaxed">
                  {doc.bio || 'Compassionate specialist providing high-quality medical consultations.'}
                </p>

                {doc.phoneNumber && (
                  <div className="mt-3 px-3 py-2 rounded-xl bg-[#141412] border border-white/[0.05] flex items-center gap-2 text-xs text-teal-400/90 font-medium truncate">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-teal-400" />
                    <span className="truncate">{doc.phoneNumber}</span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#888882]">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>{doc.experience} yrs exp</span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-[#555552] flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{doc.clinicAddress}</span>
                </div>
              </div>

              <div className="p-4 bg-[#111110] border-t border-white/[0.06]">
                <Link
                  to={`/doctors/${doc._id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Check Availability &amp; Book</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
