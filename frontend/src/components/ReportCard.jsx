import React from 'react';

export default function ReportCard({ report }) {
  const ctr = report.impressions > 0
    ? ((report.clicks / report.impressions) * 100).toFixed(2)
    : '0.00';

  const channelColors = {
    'Social Media': 'bg-pink-100 text-pink-700',
    'Email': 'bg-blue-100 text-blue-700',
    'SEO': 'bg-green-100 text-green-700',
    'PPC': 'bg-yellow-100 text-yellow-700',
    'Events': 'bg-purple-100 text-purple-700',
    'Other': 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{report.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{report.campaign_name}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${channelColors[report.channel] || 'bg-gray-100 text-gray-700'}`}>
          {report.channel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-500">Spend</p>
          <p className="text-sm font-semibold text-gray-900">${report.spend?.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-500">CTR</p>
          <p className="text-sm font-semibold text-gray-900">{ctr}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-500">Impressions</p>
          <p className="text-sm font-semibold text-gray-900">{report.impressions?.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-500">Conversions</p>
          <p className="text-sm font-semibold text-gray-900">{report.conversions?.toLocaleString()}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {new Date(report.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        })}
      </p>
    </div>
  );
}
