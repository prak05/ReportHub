import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const CHANNELS = ['Social Media', 'Email', 'SEO', 'PPC', 'Events', 'Other'];

const channelColors = {
  'Social Media': 'bg-pink-100 text-pink-700',
  'Email': 'bg-blue-100 text-blue-700',
  'SEO': 'bg-green-100 text-green-700',
  'PPC': 'bg-yellow-100 text-yellow-700',
  'Events': 'bg-purple-100 text-purple-700',
  'Other': 'bg-gray-100 text-gray-700'
};

const emptyForm = {
  title: '',
  campaign_name: '',
  channel: 'Social Media',
  spend: '',
  impressions: '',
  clicks: '',
  conversions: '',
  notes: ''
};

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/api/reports');
      setReports(res.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.get(`/api/reports/${id}`);
      setSelectedReport(res.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to fetch report detail:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await api.post('/api/reports', {
        ...form,
        spend: parseFloat(form.spend) || 0,
        impressions: parseInt(form.impressions) || 0,
        clicks: parseInt(form.clicks) || 0,
        conversions: parseInt(form.conversions) || 0
      });
      setReports([res.data, ...reports]);
      setShowModal(false);
      setForm(emptyForm);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role === 'admin' ? 'All marketing reports' : 'Your marketing reports'}
          </p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(emptyForm); setFormError(''); }} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Report
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {reports.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">No reports found</p>
            <p className="text-sm mt-1">Create your first marketing report</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header">Title</th>
                  <th className="table-header">Campaign</th>
                  <th className="table-header">Channel</th>
                  <th className="table-header">Spend</th>
                  <th className="table-header">CTR%</th>
                  <th className="table-header">Conversions</th>
                  <th className="table-header">Date</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {reports.map((report) => {
                  const ctr = report.impressions > 0
                    ? ((report.clicks / report.impressions) * 100).toFixed(2)
                    : '0.00';
                  return (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-medium text-gray-900">{report.title}</td>
                      <td className="table-cell text-gray-600">{report.campaign_name}</td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${channelColors[report.channel] || 'bg-gray-100 text-gray-700'}`}>
                          {report.channel}
                        </span>
                      </td>
                      <td className="table-cell font-medium">${report.spend?.toLocaleString()}</td>
                      <td className="table-cell">
                        <span className={`font-medium ${parseFloat(ctr) > 2 ? 'text-green-600' : 'text-gray-700'}`}>
                          {ctr}%
                        </span>
                      </td>
                      <td className="table-cell">{report.conversions?.toLocaleString()}</td>
                      <td className="table-cell text-gray-400 text-xs">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleOpenDetail(report.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">New Marketing Report</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Title *</label>
                  <input name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="Q4 Social Campaign" required />
                </div>
                <div>
                  <label className="label">Campaign Name *</label>
                  <input name="campaign_name" value={form.campaign_name} onChange={handleChange} className="input-field" placeholder="Holiday 2024" required />
                </div>
              </div>

              <div>
                <label className="label">Channel *</label>
                <select name="channel" value={form.channel} onChange={handleChange} className="input-field">
                  {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="label">Spend ($)</label>
                  <input type="number" name="spend" value={form.spend} onChange={handleChange} className="input-field" placeholder="0" min="0" step="0.01" />
                </div>
                <div>
                  <label className="label">Impressions</label>
                  <input type="number" name="impressions" value={form.impressions} onChange={handleChange} className="input-field" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="label">Clicks</label>
                  <input type="number" name="clicks" value={form.clicks} onChange={handleChange} className="input-field" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="label">Conversions</label>
                  <input type="number" name="conversions" value={form.conversions} onChange={handleChange} className="input-field" placeholder="0" min="0" />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field resize-none" rows={3} placeholder="Additional notes about this campaign..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Creating...</>
                  ) : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{selectedReport.title}</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${channelColors[selectedReport.channel] || 'bg-gray-100 text-gray-700'}`}>
                  {selectedReport.channel}
                </span>
                <span className="text-sm text-gray-500">{selectedReport.campaign_name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Spend', value: `$${selectedReport.spend?.toLocaleString()}` },
                  { label: 'Impressions', value: selectedReport.impressions?.toLocaleString() },
                  { label: 'Clicks', value: selectedReport.clicks?.toLocaleString() },
                  { label: 'Conversions', value: selectedReport.conversions?.toLocaleString() }
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-500 font-medium">CTR</p>
                  <p className="text-lg font-bold text-indigo-700">{selectedReport.ctr}%</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-500 font-medium">Conv. Rate</p>
                  <p className="text-lg font-bold text-green-700">{selectedReport.conversionRate}%</p>
                </div>
                <div className={`${parseFloat(selectedReport.roi) >= 0 ? 'bg-emerald-50' : 'bg-red-50'} rounded-xl p-3 text-center`}>
                  <p className={`text-xs font-medium ${parseFloat(selectedReport.roi) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>ROI</p>
                  <p className={`text-lg font-bold ${parseFloat(selectedReport.roi) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{selectedReport.roi}%</p>
                </div>
              </div>

              {selectedReport.notes && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{selectedReport.notes}</p>
                </div>
              )}

              <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                <span>Created by {selectedReport.creator_email}</span>
                <span className="mx-2">·</span>
                <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
