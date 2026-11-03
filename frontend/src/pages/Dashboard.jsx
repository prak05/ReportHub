import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Link } from 'react-router-dom';

function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [budgetData, setBudgetData] = useState({ budgets: [], summary: { totalAllocated: 0, totalSpend: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, budgetRes] = await Promise.all([
          api.get('/api/reports'),
          api.get('/api/budget')
        ]);
        setReports(reportsRes.data);
        setBudgetData(budgetRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalReports = reports.length;
  const totalSpend = reports.reduce((sum, r) => sum + (r.spend || 0), 0);
  const uniqueCampaigns = new Set(reports.map(r => r.campaign_name)).size;
  const totalAllocated = budgetData.summary.totalAllocated;

  const recentReports = [...reports].slice(0, 5);

  const channelColors = {
    'Social Media': 'bg-pink-100 text-pink-700',
    'Email': 'bg-blue-100 text-blue-700',
    'SEO': 'bg-green-100 text-green-700',
    'PPC': 'bg-yellow-100 text-yellow-700',
    'Events': 'bg-purple-100 text-purple-700',
    'Other': 'bg-gray-100 text-gray-700'
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
      {/* Welcome Banner */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here's what's happening with your marketing campaigns.</p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
            user?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
          }`}>
            {user?.role === 'admin' ? '⚡ Admin' : '🎯 Marketer'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Reports"
          value={totalReports}
          subtitle={user?.role === 'admin' ? 'All reports' : 'Your reports'}
          color="bg-indigo-100"
          icon={
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Total Budget Allocated"
          value={`$${totalAllocated.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtitle="Across all campaigns"
          color="bg-green-100"
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Spend"
          value={`$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtitle="From all reports"
          color="bg-orange-100"
          icon={
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Campaigns"
          value={uniqueCampaigns}
          subtitle="Unique campaigns"
          color="bg-purple-100"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          }
        />
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Reports</h2>
          <Link to="/reports" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No reports yet</p>
            <Link to="/reports" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
              Create your first report
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Title</th>
                  <th className="table-header">Campaign</th>
                  <th className="table-header">Channel</th>
                  <th className="table-header">Spend</th>
                  <th className="table-header">CTR%</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentReports.map((report) => {
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
                      <td className="table-cell">${report.spend?.toLocaleString()}</td>
                      <td className="table-cell">{ctr}%</td>
                      <td className="table-cell text-gray-400">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
