import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  CheckSquare,
  User2,
  Bookmark,
  CreditCard,
  Lock,
  UserCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const navigate = useNavigate();

  // Function to check profile completion status
  const checkProfileStatus = () => {
    const status = localStorage.getItem('profileStatus');
    console.log('Sidebar - Checking profile status:', status);
    
    if (status) {
      try {
        const parsed = JSON.parse(status);
        // Profile is complete only if all conditions are met AND it's submitted
        const isComplete = parsed.completed === true && 
                          parsed.requiredFieldsFilled === true && 
                          parsed.resumeUploaded === true && 
                          parsed.submitted === true;
        
        console.log('Sidebar - Profile complete:', isComplete, parsed);
        setIsProfileComplete(isComplete);
      } catch (err) {
        console.error('Sidebar - Failed to parse profileStatus', err);
        setIsProfileComplete(false);
      }
    } else {
      console.log('Sidebar - No profile status found');
      setIsProfileComplete(false);
    }
  };

  useEffect(() => {
    // Check initial status
    checkProfileStatus();

    // Listen for profile status changes
    const handleProfileStatusChange = (event: CustomEvent) => {
      console.log('Sidebar - Profile status change event received:', event.detail);
      
      // Check all conditions for profile completion
      const detail = event.detail;
      const isComplete = detail.completed === true && 
                        detail.requiredFieldsFilled === true && 
                        detail.resumeUploaded === true && 
                        detail.submitted === true;
      
      console.log('Sidebar - Setting profile complete to:', isComplete);
      setIsProfileComplete(isComplete);
    };

    // Add event listener for profile status changes
    window.addEventListener('profileStatusChanged', handleProfileStatusChange as EventListener);

    // Also check localStorage changes (in case of updates from other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'profileStatus') {
        checkProfileStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('profileStatusChanged', handleProfileStatusChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleBlockedRoute = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('🚫 Please complete your profile to access this feature. Fill all required fields and upload your resume.');
  };

  return (
    <div className="fixed top-0  z-50 left-0 h-screen w-63  bg-gradient-to-b from-blue-800 to-purple-900 text-white z-50 rounded-tr-lg rounded-br-lg shadow-lg flex flex-col justify-between">
      <div>
       <div className="flex justify-center items-center gap-2 px-4 py-4">
         <img src="/OPPZ_Ai_Logo.png" alt="Logo" className="w-8 h-8" />
         <span className="text-white font-bold text-lg">OPPZ Ai</span>
       </div>


        {/* Profile completion status indicator */}
        <div className="px-4 py-2 mb-2">
          <div className={`text-xs px-2 py-1 rounded-full text-center ${
            isProfileComplete 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {isProfileComplete ? '✓ Profile Complete' : '⚠ Profile Incomplete'}
          </div>
        </div>

        <ul className="space-y-1 mt-2">
           <SidebarLink
            to="/profile"
            icon={<User2 size={20} />}
            text="Career Profile Summary"
            navigate={navigate}
            isProfileComplete={isProfileComplete}
          />
          <SidebarLink
            to="/MainPage"
            icon={<Bookmark size={20} />}
            text="Questions Library"
            restricted={!isProfileComplete}
            onRestricted={handleBlockedRoute}
            navigate={navigate}
            isProfileComplete={isProfileComplete}
          />
        <SidebarLink
           to="https://www.linkedin.com/jobs/search/?currentJobId=4240231968&f_AL=true&origin=JOB_SEARCH_PAGE_JOB_FILTER"
           icon={<PlayCircle size={20} />}
           text="Kickstart Applications"
           restricted={!isProfileComplete}
           onRestricted={handleBlockedRoute}
           navigate={navigate}
           isProfileComplete={isProfileComplete}
           external={true}
          />
          <SidebarLink
            to="/AppliedJob"
            icon={<CheckSquare size={20} />}
            text="Application History"
            restricted={!isProfileComplete}
            onRestricted={handleBlockedRoute}
            navigate={navigate}
            isProfileComplete={isProfileComplete}
          />
          <SidebarLink
            to="/subscription"
            icon={<CreditCard size={20} />}
            text="Membership Plan"
            restricted={!isProfileComplete}
            onRestricted={handleBlockedRoute}
            navigate={navigate}
            isProfileComplete={isProfileComplete}
          />
          <SidebarLink
            to="/Contact"
            icon={<UserCheck size={20} />}
            text="Help & Contact"
            restricted={!isProfileComplete}
            onRestricted={handleBlockedRoute}
            navigate={navigate}
            isProfileComplete={isProfileComplete}
          />
        </ul>
      </div>

      <div className="px-4 py-3 text-xs text-gray-400">
        © {new Date().getFullYear()} OPPZ Ai
      </div>
    </div>
  );
};

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  external?: boolean;
  restricted?: boolean;
  onRestricted?: (e: React.MouseEvent) => void;
  navigate?: ReturnType<typeof useNavigate>;
  isProfileComplete?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to,
  icon,
  text,
  external = false,
  restricted = false,
  onRestricted,
  navigate,
  isProfileComplete = false,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (restricted && onRestricted) {
      onRestricted(e);
      return;
    }
    
    if (navigate) {
      navigate(to);
    }
  };

 if (external) {
  return (
    <li>
      {restricted ? (
        <button
          onClick={onRestricted}
          className="flex items-center px-5 py-3 transition cursor-pointer relative hover:bg-red-900/20 text-gray-400 w-full text-left"
        >
          <div className="mr-3">
            <Lock size={20} className="text-red-400" />
          </div>
          <span>{text}</span>
          <div className="absolute right-2">
            <Lock size={16} className="text-red-400" />
          </div>
        </button>
      ) : (
        <a
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-5 py-3 transition cursor-pointer relative hover:bg-[#34495e] text-white"
        >
          <div className="mr-3 text-white">{icon}</div>
          <span>{text}</span>
        </a>
      )}
    </li>
  );
}


  return (
    <li>
      <div
        role="button"
        onClick={handleClick}
        className={`flex items-center px-5 py-3 transition cursor-pointer relative ${
          restricted 
            ? 'hover:bg-red-900/20 text-gray-400' 
            : 'hover:bg-[#34495e] text-white'
        }`}
      >
        <div className="mr-3">
          {restricted ? (
            <Lock size={20} className="text-red-400" />
          ) : (
            <div className="text-white">{icon}</div>
          )}
        </div>
        <span className={restricted ? 'text-gray-400' : ''}>{text}</span>
        {restricted && (
          <div className="absolute right-2">
            <Lock size={16} className="text-red-400" />
          </div>
        )}
      </div>
    </li>
  );
};