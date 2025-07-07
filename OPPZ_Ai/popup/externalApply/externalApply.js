document.addEventListener('DOMContentLoaded', () => {
  const linksDiv = document.getElementById('links');
  const removeAllBtn = document.getElementById('remove-all');
  const openAllLinksBtn = document.getElementById('open-all-links');
  const removeDuplicatesBtn = document.getElementById('remove-duplicates');
  const linksCountElement = document.getElementById('links-count');
  const jobFilter = document.getElementById('job-filter');
  
  // Function to update the links counter
  function updateLinksCounter(count) {
    linksCountElement.textContent = count;
  }
  
 // Fixed load jobs function with better sorting and display
function loadJobs(filter = 'all') {
    chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], result => {
        let externalJobs = result.externalApplyData || [];
        let autoJobs = result.autoAppliedJobs || [];
        
        // Ensure all jobs have the correct structure and isAutoApplied flag
        externalJobs = externalJobs.map(job => ({
            ...job,
            isAutoApplied: false,
            time: job.time || Date.now() // Fallback if time is missing
        }));
        
        autoJobs = autoJobs.map(job => ({
            ...job,
            isAutoApplied: true,
            time: job.time || Date.now() // Fallback if time is missing
        }));
        
        let allJobs = [];
        if (filter === 'all') {
            allJobs = [...externalJobs, ...autoJobs];
        } else if (filter === 'external') {
            allJobs = externalJobs;
        } else if (filter === 'auto') {
            allJobs = autoJobs;
        }
        
        // Sort by most recent first (using time property)
        allJobs.sort((a, b) => {
            const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime();
            const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime();
            return timeB - timeA; // Most recent first
        });
        
        // Clear existing display
        linksDiv.innerHTML = '';
        
        // Add all jobs to display
        allJobs.forEach((job, index) => {
            console.log(`Loading job ${index + 1}:`, job.title, job.companyName, new Date(job.time).toLocaleString());
            addLinkRow(job);
        });
        
        // Update counter
        updateLinksCounter(allJobs.length);
        
        console.log(`Loaded ${allJobs.length} jobs for filter: ${filter}`);
    });
}
  
  // Filter change handler
  jobFilter.addEventListener('change', () => {
    loadJobs(jobFilter.value);
  });
  
  removeAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to remove all saved jobs?')) {
      chrome.storage.local.set({ 
        externalApplyData: [], 
        autoAppliedJobs: [] 
      }, () => {
        linksDiv.innerHTML = '';
        updateLinksCounter(0);
      });
    }
  });
  
  openAllLinksBtn.addEventListener('click', () => {
    chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], result => {
      const externalJobs = result.externalApplyData || [];
      const autoJobs = result.autoAppliedJobs || [];
      const allJobs = [...externalJobs, ...autoJobs];
      
      // Open each job link in a new tab
      allJobs.forEach(job => {
        if (job.link) {
          window.open(job.link, '_blank');
        }
      });
    });
  });
  
  removeDuplicatesBtn.addEventListener('click', () => {
    removeDuplicateLinks();
  });
  
  function removeDuplicateLinks() {
    chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], result => {
      const externalJobs = result.externalApplyData || [];
      const autoJobs = result.autoAppliedJobs || [];
      
      // Add type flags to distinguish between job types
      const externalJobsWithFlag = externalJobs.map(job => ({ ...job, isAutoApplied: false }));
      const autoJobsWithFlag = autoJobs.map(job => ({ ...job, isAutoApplied: true }));
      
      const allJobs = [...externalJobsWithFlag, ...autoJobsWithFlag];
      
      // Remove duplicates based on job link
      const uniqueLinks = new Map();
      const uniqueJobs = [];
      
      allJobs.forEach(job => {
        if (job.link && !uniqueLinks.has(job.link)) {
          uniqueLinks.set(job.link, true);
          uniqueJobs.push(job);
        }
      });
      
      // Separate back into original storage arrays
      const updatedExternal = uniqueJobs.filter(job => !job.isAutoApplied);
      const updatedAuto = uniqueJobs.filter(job => job.isAutoApplied);
      
      // Remove the isAutoApplied flag from external jobs for storage consistency
      const cleanedExternal = updatedExternal.map(job => {
        const { isAutoApplied, ...cleanJob } = job;
        return cleanJob;
      });
      
      const cleanedAuto = updatedAuto.map(job => {
        const { isAutoApplied, ...cleanJob } = job;
        return cleanJob;
      });
      
      chrome.storage.local.set({ 
        externalApplyData: cleanedExternal,
        autoAppliedJobs: cleanedAuto 
      }, () => {
        loadJobs(jobFilter.value);
      });
    });
  }
  
  function addLinkRow(job) {
    const container = document.createElement('div');
    container.className = 'link-container';
    container.dataset.type = job.isAutoApplied ? 'auto' : 'external';
    
    // Type badge
    const typeBadge = document.createElement('span');
    typeBadge.className = 'job-type-badge';
    typeBadge.textContent = job.isAutoApplied ? 'Auto-Applied' : 'External';
    typeBadge.style.backgroundColor = job.isAutoApplied ? '#4CAF50' : '#2196F3';
    typeBadge.style.color = 'white';
    typeBadge.style.padding = '2px 8px';
    typeBadge.style.borderRadius = '12px';
    typeBadge.style.fontSize = '12px';
    typeBadge.style.fontWeight = 'bold';
    typeBadge.style.marginRight = '8px';
    
    const title = document.createElement('div');
    title.className = 'job-title';
    title.appendChild(typeBadge);
    title.appendChild(document.createTextNode(job.title || 'No title'));
    
    const companyWrapper = document.createElement('div');
    companyWrapper.className = 'company-wrapper';
    
    const time = document.createElement('div');
    time.className = 'job-time';
    // Handle both timestamp formats (number and string)
    if (job.time) {
      const timeValue = typeof job.time === 'number' ? job.time : new Date(job.time).getTime();
      time.textContent = new Date(timeValue).toLocaleString();
    } else {
      time.textContent = 'No date';
    }
    
    const company = document.createElement('div');
    company.className = 'company-name';
    company.textContent = `Company: ${job.companyName || 'Unknown'}`;
    
    companyWrapper.appendChild(company);
    companyWrapper.appendChild(time);
    
    const link = document.createElement('a');
    link.href = job.link || '#';
    link.textContent = job.link || 'No link available';
    link.target = '_blank';
    link.className = 'job-link';
    
    // Prevent navigation if no link
    if (!job.link) {
      link.style.color = '#ccc';
      link.style.textDecoration = 'none';
      link.style.cursor = 'default';
      link.addEventListener('click', (e) => e.preventDefault());
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.style.backgroundColor = '#f44336';
    deleteBtn.style.color = 'white';
    deleteBtn.style.border = 'none';
    deleteBtn.style.padding = '4px 8px';
    deleteBtn.style.borderRadius = '4px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to delete this job?')) {
        removeJob(job);
        container.remove();
      }
    });
    
    container.appendChild(companyWrapper);
    container.appendChild(title);
    container.appendChild(link);
    container.appendChild(deleteBtn);
    linksDiv.appendChild(container);
  }
  
  function removeJob(jobToDelete) {
    chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], result => {
      let externalJobs = result.externalApplyData || [];
      let autoJobs = result.autoAppliedJobs || [];
      
      if (jobToDelete.isAutoApplied) {
        // Remove from auto-applied jobs
        autoJobs = autoJobs.filter(job => 
          job.link !== jobToDelete.link || 
          (job.title !== jobToDelete.title && job.companyName !== jobToDelete.companyName)
        );
      } else {
        // Remove from external jobs
        externalJobs = externalJobs.filter(job => 
          job.link !== jobToDelete.link || 
          (job.title !== jobToDelete.title && job.companyName !== jobToDelete.companyName)
        );
      }
      
      chrome.storage.local.set({ 
        externalApplyData: externalJobs,
        autoAppliedJobs: autoJobs
      }, () => {
        // Update counter with current filter
        const currentFilter = jobFilter.value;
        chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], result => {
          let count = 0;
          const external = result.externalApplyData || [];
          const auto = result.autoAppliedJobs || [];
          
          if (currentFilter === 'all') {
            count = external.length + auto.length;
          } else if (currentFilter === 'external') {
            count = external.length;
          } else if (currentFilter === 'auto') {
            count = auto.length;
          }
          
          updateLinksCounter(count);
        });
      });
    });
  }
  
  // Add some basic styling if not already present
  function addBasicStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .link-container {
        border: 1px solid #ddd;
        padding: 12px;
        margin-bottom: 8px;
        border-radius: 8px;
        background-color: #f9f9f9;
      }
      
      .job-title {
        font-weight: bold;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
      }
      
      .company-wrapper {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        color: #666;
      }
      
      .job-link {
        display: block;
        margin: 8px 0;
        word-break: break-all;
        color: #0066cc;
      }
      
      .delete-btn:hover {
        background-color: #d32f2f !important;
      }
      
      .link-container[data-type="auto"] {
        border-left: 4px solid #4CAF50;
      }
      
      .link-container[data-type="external"] {
        border-left: 4px solid #2196F3;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Initialize styles and load jobs
  addBasicStyles();
  loadJobs();
});