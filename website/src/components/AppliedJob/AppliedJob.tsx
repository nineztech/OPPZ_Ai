import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  ChartBar,
  ExternalLink,
  RefreshCw,
  Trash2,
  Clock,
  Bot,
  Download,
} from 'lucide-react';
import classNames from 'classnames';

interface Job {
  id: string;
  title: string;
  companyName: string;
  link?: string;
  time?: number;
  isAutoApplied: boolean;
}

interface JobStats {
  total: number;
  external: number;
  auto: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

const extensionId = 'gkjemnmlpgdngnchlgnhacembojdfnbm'; // Replace with your actual extension ID

const JobApplicationHistory: React.FC = () => {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<'all' | 'external' | 'auto'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<JobStats | null>(null);

  const loadJobData = async () => {
    setLoading(true);
    setError('');
    try {
      const response: any = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          extensionId,
          { from: 'website', action: 'getJobData' },
          (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(res);
          }
        );
      });

      if (response?.success) {
        const { externalApplyData = [], autoAppliedJobs = [] } = response.data;
        const combined = [
          ...externalApplyData.map((j: any) => ({ ...j, isAutoApplied: false })),
          ...autoAppliedJobs.map((j: any) => ({ ...j, isAutoApplied: true }))
        ].sort((a, b) => (b.time || 0) - (a.time || 0));
        setAllJobs(combined);
        setFilteredJobs(combined);
        loadStats();
      } else {
        setError('Failed to load job data');
      }
    } catch (err) {
      setError('Failed to communicate with the extension.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response: any = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          extensionId,
          { from: 'website', action: 'getJobStats' },
          (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(res);
          }
        );
      });
      if (response?.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const exportData = async () => {
    try {
      const response: any = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          extensionId,
          { from: 'website', action: 'exportJobData' },
          (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(res);
          }
        );
      });

      if (response?.success) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(response.data, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `job_export_${Date.now()}.json`);
        dlAnchor.click();
      }
    } catch (err) {
      alert('Failed to export job data.');
    }
  };

  const updateFilter = () => {
    let jobs = [...allJobs];
    if (filter === 'external') {
      jobs = jobs.filter((j) => !j.isAutoApplied);
    } else if (filter === 'auto') {
      jobs = jobs.filter((j) => j.isAutoApplied);
    }
    if (search) {
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.companyName.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredJobs(jobs);
  };

  const deleteJob = async (id: string, isAutoApplied: boolean) => {
    if (!window.confirm('Are you sure you want to delete this job application?')) return;
    try {
      const response: any = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          extensionId,
          { from: 'website', action: 'deleteJob', data: { jobId: id, isAutoApplied } },
          (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(res);
          }
        );
      });

      if (response?.success) {
        const updated = allJobs.filter((j) => j.id !== id);
        setAllJobs(updated);
        setFilteredJobs(updated);
        loadStats();
      } else {
        alert('Failed to delete job');
      }
    } catch (err) {
      alert('Error deleting job');
    }
  };

  useEffect(() => {
    loadJobData();
  }, []);

  useEffect(() => {
    updateFilter();
  }, [filter, search, allJobs]);

  const formatDate = (time?: number) => {
    if (!time) return 'Unknown';
    const date = new Date(time);
    return date.toLocaleString();
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-indigo-600 to-purple-800 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="text-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white py-8">
          <h1 className="text-3xl font-bold flex justify-center items-center gap-2">
            <Briefcase /> Job Application History
          </h1>
          <p className="text-sm">Track and manage your job applications with OPPZ Extension</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-100 p-6">
            <StatCard label="Total" count={stats.total} icon={<ChartBar className="w-35 h-35"/>} color="text-indigo-600" />
            {/* <StatCard label="External" count={stats.external} icon={<ExternalLink />} color="text-green-600" /> */}
            <StatCard label="Auto" count={stats.auto} icon={<Bot className="w-35 h-35"/>} color="text-green-600" />
          </div>
        )}

        <div className="p-6 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center">
          {/* <div className="flex gap-4 items-center">
            <label className="font-semibold">Filter:</label> 
             <select
              className="border rounded px-3 py-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Jobs</option>
              <option value="external">External Only</option>
              <option value="auto">Auto Only</option>
            </select>
          </div> */}
          <div className="flex gap-4 items-center">
            <label className="font-semibold">Search:</label>
            <input
              type="text"
              className="border rounded px-3 py-2"
              placeholder="Search by title or company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={loadJobData}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded flex gap-2 items-center"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={exportData}
              className="bg-green-500 text-white px-4 py-2 rounded flex gap-2 items-center"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-100">
          {loading ? (
            <div className="text-center text-gray-600">
              <div className="animate-spin text-3xl mb-2">
                <Clock />
              </div>
              Loading job applications...
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center text-gray-500">
              <Briefcase className="mx-auto text-5xl opacity-30 mb-4" />
              <h3 className="text-xl font-semibold">No jobs found</h3>
              <p>No job applications match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4  ">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-4 rounded-xl border-l-4 shadow transition transform hover:-translate-y-1 bg-gray-50 ${
                    job.isAutoApplied ? 'border-cyan-500' : 'border-green-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{job.title || 'Untitled'}</h2>
                      <p className="text-sm text-gray-600">{job.companyName || 'Unknown Company'}</p>
                    </div>
                    <div className="flex gap-2">
                      {job.link && (
                        <a
                          href={job.link}
                          target="_blank"
                          className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
                        >
                          <ExternalLink className="inline w-4 h-4 mr-1" /> View
                        </a>
                      )}
                      <button
                        onClick={() => deleteJob(job.id, job.isAutoApplied)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        <Trash2 className="inline w-4 h-4 mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 flex gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      job.isAutoApplied ? 'bg-cyan-100 text-cyan-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {job.isAutoApplied ? 'Auto Applied' : 'External Application'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {formatDate(job.time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  count: number;
  icon: JSX.Element;
  color: string;
}> = ({ label, count, icon, color }) => (
  <div className={`bg-white p-4 rounded-xl shadow text-center ${color}`}>
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-2xl font-bold">{count}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

export default JobApplicationHistory;