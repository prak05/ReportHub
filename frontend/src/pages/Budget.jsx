import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  department: '',
  campaign: '',
  allocated_amount: '',
  fiscal_period: ''
};

export default function Budget() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [budgetData, setBudgetData] = useState({ budgets: [], summary: { totalAllocated: 0, totalSpend: 0 } });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const res = await api.get('/api/budget');
      setBudgetData(res.data);
    } catch (err) {
      console.error('Failed to fetch budget:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditEntry(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setEditEntry(entry);
    setForm({
      department: entry.department,
      campaign: entry.campaign,
      allocated_amount: entry.allocated_amount.toString(),
      fiscal_period: entry.fiscal_period
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editEntry) {
        const res = await api.put(`/api/budget/${editEntry.id}`, {
          ...form,
          allocated_amount: parseFloat(form.allocated_amount)
        });
        setBudgetData(prev => ({
          ...prev,
          budgets: prev.budgets.map(b => b.id === editEntry.id ? res.data : b),
          summary: {
            ...prev.summary,
            totalAllocated: prev.budgets
              .map(b => b.id === editEntry.id ? res.data.allocated_amount : b.allocated_amount)
              .reduce((sum, a) => sum + a, 0)
          }
        }));
      } else {
        const res = await api.post('/api/budget', {
          ...form,
          allocated_amount: parseFloat(form.allocated_amount)
        });
        setBudgetData(prev => ({
          budgets: [res.data, ...prev.budgets],
          summary: {
            ...prev.summary,
            totalAllocated: prev.summary.totalAllocated + res.data.allocated_amount
          }
        }));
      }
      setShowModal(false);
      fetchBudget(); // refresh for accurate totals
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save budget entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/budget/${id}`);
      fetchBudget();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete budget entry:', err);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const { budgets, summary } = budgetData;
  const budgetUtilization = summary.totalAllocated > 0
    ? Math.min((summary.totalSpend / summary.totalAllocated) * 100, 100).toFixed(1)
    : 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Budget Allocation</h1>
          <p className="text-gray-500 text-sm mt-1">Track marketing budget across campaigns</p>
        </div>
        {isAdmin && (
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Budget
          </button>
        )}
      </div>

      {/* Summary Bar */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Allocated</p>
            <p className="text-2xl font-bold text-gray-900">
              ${summary.totalAllocated.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-orange-600">
              ${summary.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Remaining</p>
            <p className={`text-2xl font-bold ${(summary.totalAllocated - summary.totalSpend) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(summary.totalAllocated - summary.totalSpend).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              {(summary.totalAllocated - summary.totalSpend) < 0 && <span className="text-sm font-normal ml-1">over</span>}
            </p>
          </div>
          <div className="min-w-[200px]">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Budget Utilization</span>
              <span>{budgetUtilization}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  parseFloat(budgetUtilization) > 90 ? 'bg-red-500' :
                  parseFloat(budgetUtilization) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${budgetUtilization}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Table */}
      <div className="card overflow-hidden p-0">
        {budgets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">No budget entries yet</p>
            {isAdmin && <p className="text-sm mt-1">Add your first budget allocation</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header">Department</th>
                  <th className="table-header">Campaign</th>
                  <th className="table-header">Allocated</th>
                  <th className="table-header">Fiscal Period</th>
                  <th className="table-header">Created By</th>
                  {isAdmin && <th className="table-header">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {budgets.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-medium text-gray-900">{entry.department}</td>
                    <td className="table-cell text-gray-600">{entry.campaign}</td>
                    <td className="table-cell font-semibold text-green-700">
                      ${entry.allocated_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="table-cell">
                      <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                        {entry.fiscal_period}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 text-xs">{entry.creator_email}</td>
                    {isAdmin && (
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(entry)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editEntry ? 'Edit Budget Entry' : 'Add Budget Entry'}
              </h2>
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

              <div>
                <label className="label">Department *</label>
                <input name="department" value={form.department} onChange={handleChange} className="input-field" placeholder="Marketing" required />
              </div>
              <div>
                <label className="label">Campaign *</label>
                <input name="campaign" value={form.campaign} onChange={handleChange} className="input-field" placeholder="Q4 Holiday Campaign" required />
              </div>
              <div>
                <label className="label">Allocated Amount ($) *</label>
                <input type="number" name="allocated_amount" value={form.allocated_amount} onChange={handleChange} className="input-field" placeholder="50000" min="0" step="0.01" required />
              </div>
              <div>
                <label className="label">Fiscal Period *</label>
                <input name="fiscal_period" value={form.fiscal_period} onChange={handleChange} className="input-field" placeholder="Q4 2024" required />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                  ) : editEntry ? 'Update' : 'Add Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Budget Entry</h3>
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this budget entry? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
