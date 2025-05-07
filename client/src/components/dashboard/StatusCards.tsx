import { useQuery } from '@tanstack/react-query';
import { formatTime, calculatePercentage } from '@/lib/utils';

export default function StatusCards() {
  // Fetch current user data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/user/current'],
    retry: false,
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 animate-pulse">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-4 bg-neutral-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-neutral-200 rounded w-32"></div>
              </div>
              <div className="w-10 h-10 rounded-full bg-neutral-200"></div>
            </div>
            <div className="mt-4">
              <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
              <div className="mt-2 w-full bg-neutral-100 rounded-full h-1.5">
                <div className="bg-neutral-200 h-1.5 rounded-full" style={{ width: '50%' }}></div>
              </div>
              <div className="h-3 bg-neutral-200 rounded w-32 mt-1"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!data) {
    return null;
  }
  
  const { attendance, target } = data;
  
  const loginStatusColor = {
    early: 'bg-success text-success',
    ontime: 'bg-warning text-warning',
    late: 'bg-danger text-danger',
  };
  
  const loginStatusText = {
    early: 'Early Login',
    ontime: 'On Time',
    late: 'Late Login',
  };
  
  const loginTime = attendance ? new Date(attendance.loginTime) : new Date();
  const engagementPercentage = target ? calculatePercentage(target.engagementAchieved, target.engagementDailyTarget) : 0;
  const conversationPercentage = target ? calculatePercentage(target.conversationAchieved, target.conversationDailyTarget) : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Login Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Login Status</p>
            <h3 className={`mt-1 text-xl font-semibold ${
              attendance?.loginStatus ? 
                (attendance.loginStatus === 'early' ? 'text-success' : 
                 attendance.loginStatus === 'ontime' ? 'text-warning' : 'text-danger') : 
                'text-neutral-800'
            }`}>
              {attendance?.loginStatus ? loginStatusText[attendance.loginStatus as keyof typeof loginStatusText] : 'Not Available'}
            </h3>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            attendance?.loginStatus ? `${loginStatusColor[attendance.loginStatus as keyof typeof loginStatusColor]} bg-opacity-10` : 'bg-neutral-100'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-neutral-500">Login time: <span className="font-medium text-neutral-700">{formatTime(loginTime)}</span></p>
          <div className="mt-2 w-full bg-neutral-100 rounded-full h-1.5">
            <div className={`${
              attendance?.loginStatus === 'early' ? 'bg-success' : 
              attendance?.loginStatus === 'ontime' ? 'bg-warning' : 'bg-danger'
            } h-1.5 rounded-full`} style={{ width: '15%' }}></div>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Shift: 8:00 AM - 4:00 PM</p>
        </div>
      </div>

      {/* Engagement Target Card */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Engagement Target</p>
            <h3 className="mt-1 text-xl font-semibold text-neutral-800">{engagementPercentage}% Completed</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-neutral-100 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${engagementPercentage}%` }}></div>
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-neutral-500">Today's Goal: <span className="font-medium text-neutral-700">{target?.engagementDailyTarget || 0}</span></p>
            <p className="text-xs text-neutral-500">Achieved: <span className="font-medium text-neutral-700">{target?.engagementAchieved || 0}</span></p>
          </div>
        </div>
      </div>

      {/* Conversation Target Card */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Conversation Target</p>
            <h3 className="mt-1 text-xl font-semibold text-neutral-800">{conversationPercentage}% Completed</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary bg-opacity-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-neutral-100 rounded-full h-1.5">
            <div className="bg-secondary h-1.5 rounded-full" style={{ width: `${conversationPercentage}%` }}></div>
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-neutral-500">Today's Goal: <span className="font-medium text-neutral-700">{target?.conversationDailyTarget || 0}</span></p>
            <p className="text-xs text-neutral-500">Achieved: <span className="font-medium text-neutral-700">{target?.conversationAchieved || 0}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
