import { useQuery } from '@tanstack/react-query';

interface SummaryCardsProps {
  summaryData: any | undefined;
}

export default function SummaryCards({ summaryData }: SummaryCardsProps) {
  // Fetch stores data if summaryData is not provided
  const { data: fallbackData, isLoading } = useQuery({
    queryKey: ['/api/admin/summary'],
    enabled: !summaryData,
  });
  
  const data = summaryData || fallbackData;
  
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 animate-pulse">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-4 bg-neutral-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-neutral-200 rounded w-12"></div>
              </div>
              <div className="w-10 h-10 rounded-full bg-neutral-200"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  const {
    totalStores = 0,
    activeStores = 0,
    earlyCount = 0,
    ontimeCount = 0,
    lateCount = 0,
  } = data;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Total Stores</p>
            <h3 className="mt-1 text-2xl font-semibold text-neutral-800">{totalStores}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Active Stores</p>
            <h3 className="mt-1 text-2xl font-semibold text-success">{activeStores}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-success bg-opacity-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Early Login</p>
            <h3 className="mt-1 text-2xl font-semibold text-success">{earlyCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-success bg-opacity-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Late Login</p>
            <h3 className="mt-1 text-2xl font-semibold text-danger">{lateCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-danger bg-opacity-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
