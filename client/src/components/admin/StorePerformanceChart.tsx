import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chart, registerables } from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';

// Register Chart.js components
Chart.register(...registerables);

export default function StorePerformanceChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { isAuthenticated } = useAuth();
  
  // Fetch stores data
  const { data: storesData } = useQuery({
    queryKey: ['/api/admin/stores'],
    enabled: isAuthenticated,
  });
  
  // Fetch attendance data
  const { data: attendanceData } = useQuery({
    queryKey: ['/api/admin/attendance'],
    enabled: isAuthenticated,
  });
  
  useEffect(() => {
    if (!chartRef.current || !storesData || !attendanceData) return;
    
    // Cleanup previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Process data for the chart
    const stores = storesData.map((store: any) => store.name);
    
    // Group attendance by store
    const attendanceByStore = storesData.map((store: any) => {
      const storeAttendance = attendanceData.filter((a: any) => a.storeId === store.id);
      return storeAttendance.length;
    });
    
    // Calculate early, ontime, and late logins per store
    const earlyLoginsByStore = storesData.map((store: any) => {
      return attendanceData.filter((a: any) => a.storeId === store.id && a.loginStatus === 'early').length;
    });
    
    const onTimeLoginsByStore = storesData.map((store: any) => {
      return attendanceData.filter((a: any) => a.storeId === store.id && a.loginStatus === 'ontime').length;
    });
    
    const lateLoginsByStore = storesData.map((store: any) => {
      return attendanceData.filter((a: any) => a.storeId === store.id && a.loginStatus === 'late').length;
    });
    
    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: stores,
          datasets: [
            {
              label: 'Early Logins',
              data: earlyLoginsByStore,
              backgroundColor: '#4CAF50',
              borderColor: '#4CAF50',
              borderWidth: 1
            },
            {
              label: 'On-Time Logins',
              data: onTimeLoginsByStore,
              backgroundColor: '#FF9800',
              borderColor: '#FF9800',
              borderWidth: 1
            },
            {
              label: 'Late Logins',
              data: lateLoginsByStore,
              backgroundColor: '#F44336',
              borderColor: '#F44336',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Store Performance - Attendance Overview',
              font: {
                size: 16
              }
            },
            legend: {
              position: 'bottom'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Stores'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Logins'
              }
            }
          }
        }
      });
    }
    
    // Cleanup on component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [storesData, attendanceData]);
  
  if (!storesData || !attendanceData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 overflow-hidden">
        <div className="p-5 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">Store Performance</h3>
        </div>
        <div className="p-5">
          <div className="h-80 flex items-center justify-center bg-neutral-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-neutral-500">Loading performance data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 overflow-hidden">
      <div className="p-5 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-800">Store Performance</h3>
      </div>
      
      <div className="p-5">
        <div className="h-80 bg-neutral-50 rounded-lg">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
}
