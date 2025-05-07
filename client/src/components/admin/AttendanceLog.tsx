import { useState } from 'react';
import { formatTime, calculateDuration, getLoginStatusColor, getLoginStatusText } from '@/lib/utils';

interface AttendanceLogProps {
  attendanceData: any[] | undefined;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
}

export default function AttendanceLog({ 
  attendanceData, 
  dateFilter, 
  setDateFilter 
}: AttendanceLogProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  if (!attendanceData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
        <div className="p-5 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neutral-800">Store Attendance Log</h3>
          <div>
            <select 
              className="text-sm border border-neutral-300 rounded-md px-3 py-2"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              disabled
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="lastWeek">Last 7 days</option>
              <option value="thisMonth">This month</option>
            </select>
          </div>
        </div>
        <div className="p-5 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  // Filter attendance data based on dateFilter
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const filteredAttendance = attendanceData.filter((log) => {
    const logDate = new Date(log.loginTime);
    logDate.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case 'today':
        return logDate.getTime() === today.getTime();
      case 'yesterday':
        return logDate.getTime() === yesterday.getTime();
      case 'lastWeek':
        return logDate >= lastWeekStart;
      case 'thisMonth':
        return logDate >= thisMonthStart;
      default:
        return true;
    }
  });
  
  // Sort by most recent login
  const sortedAttendance = [...filteredAttendance].sort((a, b) => {
    return new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime();
  });
  
  // Pagination
  const totalPages = Math.ceil(sortedAttendance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAttendance = sortedAttendance.slice(startIndex, startIndex + itemsPerPage);
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="p-5 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-neutral-800">Store Attendance Log</h3>
        <div>
          <select 
            className="text-sm border border-neutral-300 rounded-md px-3 py-2"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="lastWeek">Last 7 days</option>
            <option value="thisMonth">This month</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Store
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Staff
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Login Time
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Logout Time
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {paginatedAttendance.length > 0 ? (
              paginatedAttendance.map((log: any) => (
                <tr key={log.id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-800">{log.store?.name || 'Unknown Store'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-neutral-200 overflow-hidden">
                        {/* User avatar placeholder */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-neutral-800">{log.user?.phone || 'Unknown User'}</div>
                        <div className="text-xs text-neutral-500">{log.user?.id ? `User ID: ${log.user.id}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium ${log.loginStatus ? getLoginStatusColor(log.loginStatus) : 'bg-neutral-100 text-neutral-700'} bg-opacity-10 rounded-full`}>
                      {log.loginStatus ? getLoginStatusText(log.loginStatus) : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {log.loginTime ? formatTime(new Date(log.loginTime)) : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {log.logoutTime ? formatTime(new Date(log.logoutTime)) : 'Active'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {log.loginTime ? calculateDuration(log.loginTime, log.logoutTime) : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-neutral-500">
                  No attendance records found for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {sortedAttendance.length > 0 && (
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, sortedAttendance.length)}</span> of <span className="font-medium">{sortedAttendance.length}</span> entries
            </div>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 border border-neutral-300 rounded-md text-sm ${currentPage === 1 ? 'text-neutral-400 cursor-not-allowed' : 'text-neutral-700 hover:bg-neutral-50'}`}
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              {/* Render page numbers - simplified for brevity */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <button 
                    key={pageNumber}
                    className={`px-3 py-1 border border-neutral-300 rounded-md text-sm ${
                      currentPage === pageNumber ? 'text-white bg-primary hover:bg-primary/90' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              {totalPages > 3 && (
                <button 
                  className={`px-3 py-1 border border-neutral-300 rounded-md text-sm ${
                    currentPage === totalPages ? 'text-white bg-primary hover:bg-primary/90' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}
              
              <button 
                className={`px-3 py-1 border border-neutral-300 rounded-md text-sm ${currentPage === totalPages ? 'text-neutral-400 cursor-not-allowed' : 'text-neutral-700 hover:bg-neutral-50'}`}
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
