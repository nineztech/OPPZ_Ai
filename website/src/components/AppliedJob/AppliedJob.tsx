import React, { useEffect, useState, useCallback } from 'react';
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
import jsPDF from 'jspdf';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

interface Job {
  id: string;
  title: string;
  companyName: string;
  link?: string;
  time?: number;
  isAutoApplied: boolean;
  location:String;
}

interface JobStats {
  total: number;
  external: number;
  auto: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

 

const extensionId = 'edejolphacgbhddjeoomiadkgfaocjcj';

const JobApplicationHistory: React.FC = () => {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const today = new Date().toISOString().slice(0, 10); // Format: "YYYY-MM-DD"
 

const jobsPerPage = 10;

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<JobStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [graphRange, setGraphRange] = useState<'thisWeek' | 'lastWeek' | 'thisMonth' | 'max'>('thisWeek');

  const ranges = ['thisWeek', 'lastWeek', 'thisMonth', 'max'] as const;
  const buttonTextMap: Record<typeof ranges[number], string> = {
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    thisMonth: 'This Month',
    max: 'Max',
  };


const todayCount = allJobs.filter((job) => {
  if (!job.time) return false;
  const appliedDate = new Date(job.time).toISOString().slice(0, 10);
  return appliedDate === today;
}).length;


  const buildChartData = useCallback((jobs: Job[]) => {
    const today = dayjs();
    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs;

    switch (graphRange) {
      case 'lastWeek':
        start = today.subtract(1, 'week').startOf('week');
        end = today.subtract(1, 'week').endOf('week');
        break;
      case 'thisMonth':
        start = today.startOf('month');
        end = today.endOf('month');
        break;
      case 'max':
        const earliest = Math.min(...jobs.map(j => j.time || 0));
        start = dayjs(earliest);
        end = today;
        break;
      default:
        start = today.startOf('week');
        end = today.endOf('week');
    }

    const data: Record<string, number> = {};
    for (let d = start; d.isBefore(end); d = d.add(1, 'day')) {
      const key = d.format('MMM D');
      data[key] = 0;
    }

    jobs.forEach((job) => {
      const time = job.time;
      if (!time) return;
      const appliedDate = dayjs(time);
      if (appliedDate.isBetween(start, end, null, '[]')) {
        const key = appliedDate.format('MMM D');
        data[key] = (data[key] || 0) + 1;
      }
    });

    const chartArray = Object.entries(data).map(([date, count]) => ({
      date,
      count,
    }));

    setChartData(chartArray);
  }, [graphRange]);

  const loadStats = useCallback(async () => {
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
  }, []);

  const loadJobData = useCallback(async () => {
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
  }, [loadStats]);

  const updateFilter = useCallback(() => {
  let jobs = [...allJobs];
  if (search) {
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.companyName.toLowerCase().includes(search.toLowerCase())
    );
  }
  setFilteredJobs(jobs);
}, [allJobs, search]);


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

      if (!response?.success || !response.data) {
        alert('❌ No job data returned from extension.');
        return;
      }

      const rawJobs = Array.isArray(response.data)
        ? response.data
        : Object.values(response.data);

      const jobs = rawJobs
        .map((item: any, index: number) => {
          if (typeof item === 'string') {
            try {
              return JSON.parse(item);
            } catch {
              return null;
            }
          }
          return item;
        })
        .filter(Boolean);

      if (jobs.length === 0) {
        alert('⚠️ No valid job data to export.');
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(12);
      let y = 10;

      jobs.forEach((job: any, idx: number) => {
        const id = job.id || job.jobId || '-';
        const location =job.location || job.Location||'-';
        const company = job.company || job.companyName || '-';
        const date = job.appliedDate
          ? new Date(job.appliedDate).toLocaleString()
          : '-';
        const title = job.title || 'Untitled';
        const link = job.link || '-';
        const status = job.status || 'N/A';

        doc.text(`Job #${idx + 1}`, 10, y);
        y += 6;
        doc.text(`ID: ${id}`, 10, y);
        y += 6;
        doc.text(`Company: ${company}`, 10, y);
        y += 6;
        doc.text(`Location: ${location}`, 10, y);
        y += 6;
        doc.text(`Applied: ${date}`, 10, y);
        y += 6;
        doc.text(`Title: ${title}`, 10, y);
        y += 6;
        doc.text(`Status: ${status}`, 10, y);
        y += 6;
        doc.text(`Link: ${link}`, 10, y);
        y += 10;

        if (y > 270) {
          doc.addPage();
          y = 10;
        }
      });

      doc.save(`job_export_${Date.now()}.pdf`);
    } catch (err: any) {
      alert(`❌ Failed to export job data.\nError: ${err.message || err}`);
    }
  };

  const formatDate = (time?: number) => {
    if (!time) return 'Unknown';
    return new Date(time).toLocaleString();
  };

  useEffect(() => {
  updateFilter();
  setCurrentPage(1); // reset page on filter change
}, [search, allJobs, updateFilter]);


  useEffect(() => {
    loadJobData();
  }, [loadJobData]);

  useEffect(() => {
    updateFilter();
  }, [search, allJobs, updateFilter]);

  useEffect(() => {
    buildChartData(allJobs);
  }, [graphRange, allJobs, buildChartData]);

  // RENDER CODE REMAINS THE SAME (starting with return...)



const StatCard = ({
  label,
  count,
  icon,
  color,
  description,
  percentage,
}: {
  label: string;
  count: number;
  icon: JSX.Element;
  color: string;
  description?: string;
  percentage?: number;
}) => (
  <div className="bg-white p-4 rounded-xl shadow text-center">
    <div className={`text-4xl mb-2 flex justify-center ${color}`}>{icon}</div>
    <div className="text-xl font-bold">{label}</div>
    <div className="text-3xl font-extrabold">{count}</div>

    {percentage !== undefined && (
      <div className="text-sm text-gray-500 mt-1">
        {percentage}% of total
      </div>
    )}

    {description && (
      <div className="text-xs text-gray-400 mt-2">
        {description}
      </div>
    )}
  </div>
);


  return (
    <div className="p-4 md:p-4 ml-6 mt-6 bg-[#f0f0ff] min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="text-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white py-8">
          <h1 className="text-3xl font-bold flex justify-center items-center gap-2">
            <Briefcase /> Job Application History
          </h1>
          <p className="text-sm">Track and manage your job applications with OPPZ Extension</p>
        </div>

        {stats && (
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-100 p-6">
           <StatCard
  label="Total Applications"
  count={stats.total}
  icon={<ChartBar className="w-10 h-10" />}
  color="text-indigo-600"
  description="All jobs tracked so far"
  percentage={100}
/>

<StatCard
  label="Today Applied"
  count={todayCount}
  icon={<Bot className="w-10 h-10 animate-bounce" />}
  color="text-green-600"
  description={`Handled by OPPZ Bot. That's ${Math.round((todayCount / stats.total) * 100)}% of all.`}
  percentage={Math.round((todayCount / stats.total) * 100)}
/>



        <div className="px-6 py-4 w-[205%]">
          <div className="flex space-x-2 mb-2">
            {ranges.map((range) => (
              <button
                key={range}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  graphRange === range ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-white text-gray-900'
                }`}
                onClick={() => setGraphRange(range)}
              >
                {buttonTextMap[range]}
              </button>
            ))}
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600  p-4 rounded-xl">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" stroke="white" />
                <YAxis stroke="white" />
                {/* <Tooltip contentStyle={{ height:'23px',width: '52px', borderColor: '#4b5563' }} /> */}
                <Bar dataKey="count" fill="white" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
</div>
        )}
        <div className="p-6 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-4 w-[40%] items-center">
            <label className="font-semibold">Search:</label>
            <input
              type="text"
              className="border w-full rounded px-3 py-2"
              placeholder="Search by Job title or Company name"
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
            <div className="space-y-4">
             {filteredJobs
  .slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage)
  .map((job) => (

                <div
  key={job.id}
  className={`p-4 rounded-xl border-l-4 shadow transition transform hover:-translate-y-1 bg-gray-50 ${
    job.isAutoApplied ? 'border-cyan-500' : 'border-green-500'
  }`}
>
  {/* Row 1: Title + Badge (left), Buttons (right) */}
  <div className="flex justify-between items-center mb-3">
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold text-gray-800">
        Position: {job.title || 'Untitled'}
      </h2>
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold ${
          job.isAutoApplied ? 'bg-cyan-100 text-cyan-700' : 'bg-green-100 text-green-700'
        }`}
      >
        {job.isAutoApplied ? 'Auto Applied' : 'External Application'}
      </span>
    </div>

    <div className="flex gap-2">
      {job.link && (
        <a
          href={job.link}
          target="_blank"
          rel="noreferrer"
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

  {/* Row 2: Company + Location (left), Time (right) */}
  <div className="flex justify-between items-center text-sm text-gray-600">
    <div>
      Company: {job.companyName || 'Unknown Company'}  
      {/* •{' '}Location: {job.location || 'Unknown Location'} */}
    </div>
    <div className="flex items-center gap-1">
      <Clock className="w-4 h-4" />
      {formatDate(job.time)}
    </div>
  </div>
</div>


              ))}
              {filteredJobs.length > jobsPerPage && (
  <div className="flex justify-center gap-2 mt-6">
    {Array.from({ length: Math.ceil(filteredJobs.length / jobsPerPage) }).map((_, index) => (
      <button
        key={index}
        onClick={() => setCurrentPage(index + 1)}
        className={`px-3 h-12 w-12 py-1 rounded-md border text-sm font-medium ${
          currentPage === index + 1
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-700 hover:bg-indigo-100'
        }`}
      >
        {index + 1}
      </button>
    ))}
  </div>
)}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobApplicationHistory;
