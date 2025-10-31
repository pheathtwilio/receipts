import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [showGroups, setShowGroups] = useState(true);

  useEffect(() => {
    // Set up real-time listener for receipt groups
    const groupsRef = collection(db, 'receiptGroups');
    const unsubscribe = onSnapshot(groupsRef, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort groups: SMS first, then alphabetically by friendlyName
      groupsData.sort((a, b) => {
        if (a.id === 'SMS') return -1;
        if (b.id === 'SMS') return 1;
        return (a.friendlyName || a.name).localeCompare(b.friendlyName || b.name);
      });
      setGroups(groupsData);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Receipts Manager</h2>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Navigation
          </h3>
          <nav className="space-y-2">
            <div>
              <button
                onClick={() => {
                  if (location.pathname === '/dashboard/receipts') {
                    setShowGroups(!showGroups);
                  } else {
                    navigate('/dashboard/receipts');
                    setShowGroups(true);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname.startsWith('/dashboard/receipts')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Receipts</span>
                </div>
                <svg 
                  className={cn('w-4 h-4 transition-transform', showGroups ? 'rotate-90' : '')}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Nested Receipt Groups */}
              {showGroups && groups.length > 0 && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                  {groups.map((group) => {
                    const groupPath = `/dashboard/receipts/${group.id}`;
                    const isActive = location.pathname === groupPath;
                    
                    return (
                      <button
                        key={group.id}
                        onClick={() => navigate(groupPath)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <span className="truncate">{group.friendlyName || group.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {group.photos?.length || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Signed in as:</p>
              <p className="text-xs text-gray-600 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
