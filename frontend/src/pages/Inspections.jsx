import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wrench, CheckCircle, AlertTriangle, XCircle, Calendar } from 'lucide-react';
import api from '../api/client';
import { formatRelativeTime, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const RESULT_ICONS = {
  pass: <CheckCircle className="w-5 h-5 text-green-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  fail: <XCircle className="w-5 h-5 text-red-600" />,
};
const RESULT_COLORS = {
  pass: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  fail: 'bg-red-50 border-red-200 text-red-800',
};

export default function Inspections() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(null);

  const { data: inspections, isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => api.get('/inspections').then(r => r.data),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="w-7 h-7 text-primary-600" /> Vehicle Inspections</h1>
          <p className="text-sm text-gray-500 mt-1">Request and track professional vehicle inspections</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
        <h3 className="font-bold text-blue-900 mb-2">About Our Inspection Service</h3>
        <p className="text-sm text-blue-700 mb-3">Our certified inspectors check 50+ points across exterior, interior, engine, transmission, suspension, and more. Get a full report with photos and an overall score.</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[['50+ checkpoints', 'Comprehensive'], ['24-48 hrs', 'Fast turnaround'], ['With photos', 'Visual proof']].map(([v, l]) => (
            <div key={l} className="bg-white rounded-lg p-3 text-center border border-blue-100">
              <p className="font-bold text-blue-800">{v}</p>
              <p className="text-xs text-blue-500">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-24" />)}</div>
      ) : inspections?.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No inspection requests yet.</p>
          <p className="text-sm text-gray-400 mb-4">Go to a car listing to request an inspection.</p>
          <Link to="/cars" className="btn-primary">Browse Cars</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map(ins => (
            <div key={ins.id} className="card overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={ins.listing?.photos?.[0]?.url || 'https://placehold.co/64x48/e2e8f0/64748b?text=Car'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <Link to={`/cars/${ins.listingId}`} className="font-semibold text-sm text-primary-600 hover:underline">
                        {ins.listing?.year} {ins.listing?.make} {ins.listing?.model}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Requested {formatRelativeTime(ins.createdAt)}</span>
                        {ins.preferredDate && <span>Preferred: {formatDate(ins.preferredDate)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${ins.status === 'completed' ? 'bg-green-100 text-green-700' : ins.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {ins.status}
                    </span>
                    {ins.report && (
                      <button onClick={() => setExpanded(expanded === ins.id ? null : ins.id)} className="btn-secondary text-xs py-1.5">
                        {expanded === ins.id ? 'Hide Report' : 'View Report'}
                      </button>
                    )}
                  </div>
                </div>

                {ins.notes && <p className="text-xs text-gray-500 mt-2 italic">Note: {ins.notes}</p>}
              </div>

              {/* Expanded Report */}
              {expanded === ins.id && ins.report && (
                <div className={`border-t p-5 ${RESULT_COLORS[ins.report.result]}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {RESULT_ICONS[ins.report.result]}
                      <span className="font-bold text-lg capitalize">{ins.report.result.toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{ins.report.overallScore}<span className="text-base font-normal">/100</span></p>
                      <p className="text-xs opacity-70">Overall Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {['exterior', 'interior', 'engine', 'transmission', 'suspension', 'tires', 'electrical'].map(section => {
                      const data = ins.report[section] || {};
                      return (
                        <div key={section} className="bg-white/60 rounded-lg p-3">
                          <p className="font-semibold capitalize mb-1">{section}</p>
                          {Object.entries(data).length > 0 ? (
                            Object.entries(data).map(([k, v]) => (
                              <p key={k} className="text-xs flex items-center justify-between">
                                <span className="opacity-70 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                                <span className={`font-medium ${v === 'pass' ? 'text-green-700' : v === 'fail' ? 'text-red-700' : 'text-yellow-700'}`}>{v}</span>
                              </p>
                            ))
                          ) : <p className="text-xs opacity-50">No issues noted</p>}
                        </div>
                      );
                    })}
                  </div>

                  {ins.report.testDriveNotes && (
                    <div className="mt-3 bg-white/60 rounded-lg p-3">
                      <p className="text-sm font-semibold mb-1">Test Drive Notes</p>
                      <p className="text-sm opacity-80">{ins.report.testDriveNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
