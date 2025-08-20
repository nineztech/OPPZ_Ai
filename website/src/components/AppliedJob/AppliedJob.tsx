import React, { useEffect, useState, useCallback } from 'react';
 
import jsPDF from 'jspdf';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer 
} from 'recharts';
import {
  Briefcase,
  History,
  BarChart3,
  Calendar,
  ExternalLink,
  RefreshCw,
  Trash2,
  Clock,
  Bot,
  Download,
} from 'lucide-react';
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
  location: string;
}

interface JobStats {
  total: number;
  external: number;
  auto: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

// API base URL - update this to match your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5006/api';

const extensionId = 'edejolphacgbhddjeoomiadkgfaocjcj';

const JobApplicationHistory: React.FC = () => {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  
  // Separate pagination states for each tab
  const [todayCurrentPage, setTodayCurrentPage] = useState(1);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const today = new Date().toISOString().slice(0, 10);

  const jobsPerPage = 10;

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<JobStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [graphRange, setGraphRange] = useState<'thisWeek' | 'lastWeek' | 'thisMonth' | 'max'>('thisWeek');
  const [userEmail, setUserEmail] = useState<string>('');

  const ranges = ['thisWeek', 'lastWeek', 'thisMonth', 'max'] as const;
  const buttonTextMap: Record<typeof ranges[number], string> = {
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    thisMonth: 'This Month',
    max: 'Max',
  };

  const todayJobs = allJobs.filter((job) => {
    if (!job.time) return false;
    const appliedDate = new Date(job.time).toISOString().slice(0, 10);
    return appliedDate === today;
  });

  const historyJobs = allJobs.filter((job) => {
    if (!job.time) return true; // Include jobs with no time in history
    const appliedDate = new Date(job.time).toISOString().slice(0, 10);
    return appliedDate !== today;
  });

  // Get current page based on active tab
  const getCurrentPage = useCallback(() => {
    return activeTab === 'today' ? todayCurrentPage : historyCurrentPage;
  }, [activeTab, todayCurrentPage, historyCurrentPage]);

  // Set current page based on active tab - wrapped in useCallback to fix ESLint warning
  const setCurrentPage = useCallback((page: number) => {
    if (activeTab === 'today') {
      setTodayCurrentPage(page);
    } else {
      setHistoryCurrentPage(page);
    }
  }, [activeTab]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserEmail(userData.email);
    }
  }, []);

  // Function to create unique key for job deduplication
  const createJobKey = (job: Job): string => {
    return `${job.title.toLowerCase().trim()}_${job.companyName.toLowerCase().trim()}`;
  };

  // API functions for backend communication - wrapped in useCallback to fix dependency issues
  const saveJobToDatabase = useCallback(async (job: Job): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applied-jobs/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: job.id,
          title: job.title,
          companyName: job.companyName,
          link: job.link,
          time: job.time,
          isAutoApplied: job.isAutoApplied,
          location: job.location,
          email: userEmail,
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error saving job to database:', error);
      return false;
    }
  }, [userEmail]);

  const loadJobsFromDatabase = useCallback(async (): Promise<Job[]> => {
    if (!userEmail) return [];

    try {
      const response = await fetch(`${API_BASE_URL}/api/applied-jobs/${userEmail}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data.map((job: any) => ({
          id: job.jobId,
          title: job.title,
          companyName: job.companyName,
          link: job.link,
          time: job.time,
          isAutoApplied: job.isAutoApplied,
          location: job.location || 'Ahmedabad',
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading jobs from database:', error);
      return [];
    }
  }, [userEmail]);

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

  const loadJobFromExtension = useCallback(async (): Promise<Job[]> => {
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
        return [
          ...externalApplyData.map((j: any) => ({ ...j, isAutoApplied: false })),
          ...autoAppliedJobs.map((j: any) => ({ ...j, isAutoApplied: true }))
        ].sort((a, b) => (b.time || 0) - (a.time || 0));
      }
      return [];
    } catch (err) {
      console.error('Failed to load from extension:', err);
      return [];
    }
  }, []);

  const loadJobData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      let combinedJobs: Job[] = [];

      // Load from both extension and database
      const [extensionJobs, dbJobs] = await Promise.all([
        loadJobFromExtension(),
        loadJobsFromDatabase(),
      ]);

      // Combine all jobs
      const allJobsList = [...extensionJobs, ...dbJobs];
      
      // Remove duplicates based on title + company name combination
      const jobMap = new Map<string, Job>();
      
      allJobsList.forEach(job => {
        const jobKey = createJobKey(job);
        
        // If job doesn't exist, add it
        if (!jobMap.has(jobKey)) {
          jobMap.set(jobKey, job);
        } else {
          // If job exists, keep the one with more complete data or newer timestamp
          const existingJob = jobMap.get(jobKey)!;
          
          // Prefer job with link if one doesn't have it
          if (!existingJob.link && job.link) {
            jobMap.set(jobKey, job);
          } else if (existingJob.link && !job.link) {
            // Keep existing
          } else {
            // Keep the one with newer timestamp
            if ((job.time || 0) > (existingJob.time || 0)) {
              jobMap.set(jobKey, job);
            }
          }
        }
      });

      combinedJobs = Array.from(jobMap.values());

      // Auto-save new extension jobs to database (only new ones)
      if (userEmail && extensionJobs.length > 0) {
        const existingDbJobKeys = new Set(dbJobs.map(createJobKey));
        
        for (const job of extensionJobs) {
          const jobKey = createJobKey(job);
          if (!existingDbJobKeys.has(jobKey)) {
            await saveJobToDatabase(job);
          }
        }
      }

      // Sort by time (newest first)
      combinedJobs.sort((a, b) => (b.time || 0) - (a.time || 0));
      
      setAllJobs(combinedJobs);
      loadStats();
    } catch (err: any) {
      setError(`Failed to load job data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [userEmail, loadJobFromExtension, loadJobsFromDatabase, saveJobToDatabase, loadStats]);

  const updateFilter = useCallback(() => {
    let jobs = activeTab === 'today' ? todayJobs : historyJobs;
    
    if (search) {
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.companyName.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredJobs(jobs);
  }, [todayJobs, historyJobs, search, activeTab]);

  const deleteJob = async (id: string, isAutoApplied: boolean) => {
    if (!window.confirm('Are you sure you want to delete this job application?')) return;
    
    try {
      // Delete from extension
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
        loadStats();
      } else {
        alert('Failed to delete job from extension');
      }
    } catch (err) {
      alert('Error deleting job');
    }
  };

  const exportData = async () => {
    try {
      let jobs = allJobs;

      if (jobs.length === 0) {
        jobs = await loadJobFromExtension();
      }

      if (jobs.length === 0) {
        alert('⚠️ No job data available to export. Please refresh the data first.');
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Job Application History', 10, 20);
      doc.setFontSize(12);
      let y = 35;

      jobs.forEach((job: any, idx: number) => {
        const id = job.id || '-';
        const location = job.location || '-';
        const company = job.companyName || '-';
        const title = job.title || 'Untitled';
        const link = job.link || '-';
        const appliedDate = job.time 
          ? new Date(job.time).toLocaleString() 
          : '-';
        const type = job.isAutoApplied ? 'Auto Applied' : 'External Application';

        if (idx > 0) {
          y += 5;
          doc.line(10, y, 200, y);
          y += 5;
        }

        doc.setFontSize(14);
        doc.text(`Job #${idx + 1}`, 10, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.text(`ID: ${id}`, 10, y);
        y += 6;
        doc.text(`Title: ${title}`, 10, y);
        y += 6;
        doc.text(`Company: ${company}`, 10, y);
        y += 6;
        doc.text(`Location: ${location}`, 10, y);
        y += 6;
        doc.text(`Applied: ${appliedDate}`, 10, y);
        y += 6;
        doc.text(`Type: ${type}`, 10, y);
        y += 6;
        doc.text(`Link: ${link}`, 10, y);
        y += 10;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      doc.addPage();
      doc.setFontSize(16);
      doc.text('Summary', 10, 20);
      doc.setFontSize(12);
      y = 35;
      
      const totalJobs = jobs.length;
      const autoAppliedCount = jobs.filter(j => j.isAutoApplied).length;
      const externalCount = jobs.filter(j => !j.isAutoApplied).length;
      
      doc.text(`Total Applications: ${totalJobs}`, 10, y);
      y += 8;
      doc.text(`Auto Applied: ${autoAppliedCount}`, 10, y);
      y += 8;
      doc.text(`External Applications: ${externalCount}`, 10, y);
      y += 8;
      doc.text(`Export Date: ${new Date().toLocaleString()}`, 10, y);

      doc.save(`job_applications_${new Date().toISOString().slice(0, 10)}.pdf`);
      alert(`✅ Successfully exported ${totalJobs} job applications to PDF!`);
      
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`❌ Failed to export job data.\nError: ${err.message || err}`);
    }
  };

  const formatDate = (time?: number) => {
    if (!time) return 'Unknown';
    return new Date(time).toLocaleString();
  };

  // Reset current tab's pagination when search changes
  useEffect(() => {
    updateFilter();
    // Only reset pagination when search changes, not when switching tabs
    if (search) {
      setCurrentPage(1);
    }
  }, [search, allJobs, updateFilter, setCurrentPage]);

  // Update filter when tab changes but don't reset pagination
  useEffect(() => {
    updateFilter();
  }, [activeTab, updateFilter]);

  useEffect(() => {
    if (userEmail) {
      loadJobData();
    }
  }, [loadJobData, userEmail]);

  useEffect(() => {
    buildChartData(allJobs);
  }, [graphRange, allJobs, buildChartData]);

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
              count={allJobs.length}
              icon={<BarChart3 className="w-10 h-10" />}
              color="text-indigo-600"
              description="All jobs tracked so far"
              percentage={100}
            />

            <StatCard
              label="Today Applied"
              count={todayJobs.length}
              icon={<Bot className="w-10 h-10 animate-bounce" />}
              color="text-green-600"
              description={`Applied today. That's ${Math.round((todayJobs.length / allJobs.length) * 100)}% of all.`}
              percentage={Math.round((todayJobs.length / allJobs.length) * 100)}
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
 
  <Bar
    dataKey="count"
    fill="#f8f8f7ff"
    isAnimationActive={false}
    barSize={30}
  />
</BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'today'
                  ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Today ({todayJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <History className="w-4 h-4" />
              History ({historyJobs.length})
            </button>
          </div>
        </div>

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
              <p>No job applications found for {activeTab === 'today' ? 'today' : 'history'}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Tab Info
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold capitalize">{activeTab}</span> Tab • 
                  Page {getCurrentPage()} of {Math.ceil(filteredJobs.length / jobsPerPage)} • 
                  Showing {((getCurrentPage() - 1) * jobsPerPage) + 1} to {Math.min(getCurrentPage() * jobsPerPage, filteredJobs.length)} of {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Debug: Current Page = {getCurrentPage()}, Total Pages = {Math.ceil(filteredJobs.length / jobsPerPage)}, 
                  Today Page = {todayCurrentPage}, History Page = {historyCurrentPage}
                </p>
              </div> */}
              
              {filteredJobs
                .slice((getCurrentPage() - 1) * jobsPerPage, getCurrentPage() * jobsPerPage)
                .map((job) => (
                  <div
                    key={job.id}
                    className={`p-4 rounded-xl border-l-4 shadow transition transform hover:-translate-y-1 bg-gray-50 ${
                      job.isAutoApplied ? 'border-cyan-500' : 'border-green-500'
                    }`}
                  >
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

                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div>
                        Company: {job.companyName || 'Unknown Company'}<br />
                        {/* Location: {job.location || 'Unknown'} */}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(job.time)}
                      </div>
                    </div>
                  </div>
                ))}
                
              {/* Pagination - Shows only when there are multiple pages */}
              {filteredJobs.length > jobsPerPage && (
                <div className="flex flex-col items-center gap-4 mt-6">
                  {/* Debug info */}
                  {/* <div className="text-xs text-gray-500">
                    Total jobs: {filteredJobs.length} | Jobs per page: {jobsPerPage} | 
                    Current page: {getCurrentPage()} | Total pages: {Math.ceil(filteredJobs.length / jobsPerPage)}
                  </div> */}
                  
                  <div className="flex items-center gap-2">
                    {/* Previous button */}
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, getCurrentPage() - 1);
                        console.log(`Moving to previous page: ${newPage}`);
                        setCurrentPage(newPage);
                      }}
                      disabled={getCurrentPage() === 1}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        getCurrentPage() === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-indigo-100 border'
                      }`}
                    >
                      ← 
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.ceil(filteredJobs.length / jobsPerPage) }).map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            console.log(`Clicking page ${pageNum} for ${activeTab} tab`);
                            setCurrentPage(pageNum);
                          }}
                          className={`px-3 h-10 w-10 py-1 rounded-md border text-sm font-medium ${
                            getCurrentPage() === pageNum
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 hover:bg-indigo-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Next button */}
                    <button
                      onClick={() => {
                        const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
                        const newPage = Math.min(totalPages, getCurrentPage() + 1);
                        console.log(`Moving to next page: ${newPage}`);
                        setCurrentPage(newPage);
                      }}
                      disabled={getCurrentPage() === Math.ceil(filteredJobs.length / jobsPerPage)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        getCurrentPage() === Math.ceil(filteredJobs.length / jobsPerPage)
                          ? 'bg-gray-200 text-gray-400  cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-indigo-100 border'
                      }`}
                    >
                       →
                    </button>
                  </div>
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
