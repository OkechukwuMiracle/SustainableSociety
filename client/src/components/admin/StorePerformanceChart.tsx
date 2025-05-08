import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chart, registerables } from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Register Chart.js components
Chart.register(...registerables);

type TimeRange = 'daily' | 'weekly' | 'monthly';
type ChartType = 'attendance' | 'topEngagement' | 'bottomEngagement' | 'topConversation' | 'bottomConversation';

export default function StorePerformanceChart() {
  const [chartType, setChartType] = useState<ChartType>('attendance');
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  
  const attendanceChartRef = useRef<HTMLCanvasElement>(null);
  const engagementChartRef = useRef<HTMLCanvasElement>(null);
  const conversationChartRef = useRef<HTMLCanvasElement>(null);
  
  const attendanceChartInstance = useRef<Chart | null>(null);
  const engagementChartInstance = useRef<Chart | null>(null);
  const conversationChartInstance = useRef<Chart | null>(null);
  
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

  // Fetch targets data
  const { data: targetsData } = useQuery({
    queryKey: ['/api/admin/targets'],
    enabled: isAuthenticated,
  });
  
  // Create attendance chart
  useEffect(() => {
    if (!attendanceChartRef.current || !storesData || !attendanceData) return;
    
    // Cleanup previous chart instance
    if (attendanceChartInstance.current) {
      attendanceChartInstance.current.destroy();
    }
    
    // Process data for the chart
    const stores = storesData.map((store: any) => store.name);
    
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
    const ctx = attendanceChartRef.current.getContext('2d');
    if (ctx) {
      attendanceChartInstance.current = new Chart(ctx, {
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
      if (attendanceChartInstance.current) {
        attendanceChartInstance.current.destroy();
      }
    };
  }, [storesData, attendanceData]);
  
  // Create targets charts
  useEffect(() => {
    if (!engagementChartRef.current || !conversationChartRef.current || !storesData || !targetsData) return;
    
    // Cleanup previous chart instances
    if (engagementChartInstance.current) {
      engagementChartInstance.current.destroy();
    }
    
    if (conversationChartInstance.current) {
      conversationChartInstance.current.destroy();
    }
    
    // Filter targets based on time range
    const now = new Date();
    const filteredTargets = targetsData.filter((target: any) => {
      const targetDate = new Date(target.date);
      
      if (timeRange === 'daily') {
        return targetDate.toDateString() === now.toDateString();
      } else if (timeRange === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return targetDate >= oneWeekAgo;
      } else if (timeRange === 'monthly') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return targetDate >= oneMonthAgo;
      }
      
      return true;
    });
    
    // Process targets data
    const storePerformance = storesData.map((store: any) => {
      const storeTargets = filteredTargets.filter((t: any) => t.storeId === store.id);
      
      // Calculate total engagement and conversation targets/achieved
      let totalEngagementTarget = 0;
      let totalEngagementAchieved = 0;
      let totalConversationTarget = 0;
      let totalConversationAchieved = 0;
      
      storeTargets.forEach((target: any) => {
        totalEngagementTarget += target.engagementDailyTarget;
        totalEngagementAchieved += target.engagementAchieved;
        totalConversationTarget += target.conversationDailyTarget;
        totalConversationAchieved += target.conversationAchieved;
      });
      
      // Calculate achievement percentages
      const engagementPercentage = totalEngagementTarget > 0 
        ? (totalEngagementAchieved / totalEngagementTarget) * 100 
        : 0;
        
      const conversationPercentage = totalConversationTarget > 0 
        ? (totalConversationAchieved / totalConversationTarget) * 100 
        : 0;
      
      return {
        storeId: store.id,
        storeName: store.name,
        engagementPercentage: Math.round(engagementPercentage),
        conversationPercentage: Math.round(conversationPercentage),
        totalEngagementTarget,
        totalEngagementAchieved,
        totalConversationTarget,
        totalConversationAchieved
      };
    });
    
    // Sort stores by engagement percentage
    const sortedByEngagement = [...storePerformance].sort((a, b) => b.engagementPercentage - a.engagementPercentage);
    
    // Get top 10 stores by engagement
    const topEngagementStores = sortedByEngagement.slice(0, 10);
    
    // Get bottom 10 stores by engagement
    const bottomEngagementStores = [...sortedByEngagement].sort((a, b) => a.engagementPercentage - b.engagementPercentage).slice(0, 10);
    
    // Sort stores by conversation percentage
    const sortedByConversation = [...storePerformance].sort((a, b) => b.conversationPercentage - a.conversationPercentage);
    
    // Get top 10 stores by conversation
    const topConversationStores = sortedByConversation.slice(0, 10);
    
    // Get bottom 10 stores by conversation
    const bottomConversationStores = [...sortedByConversation].sort((a, b) => a.conversationPercentage - b.conversationPercentage).slice(0, 10);
    
    // Create engagement chart
    const engagementCtx = engagementChartRef.current.getContext('2d');
    if (engagementCtx) {
      let engagementLabels, engagementData, engagementTitle;
      
      if (chartType === 'topEngagement') {
        engagementLabels = topEngagementStores.map((store) => store.storeName);
        engagementData = topEngagementStores.map((store) => store.engagementPercentage);
        engagementTitle = 'Top 10 Stores by Engagement Target Achievement';
      } else {
        engagementLabels = bottomEngagementStores.map((store) => store.storeName);
        engagementData = bottomEngagementStores.map((store) => store.engagementPercentage);
        engagementTitle = 'Bottom 10 Stores by Engagement Target Achievement';
      }
      
      engagementChartInstance.current = new Chart(engagementCtx, {
        type: 'bar',
        data: {
          labels: engagementLabels,
          datasets: [
            {
              label: 'Engagement Target Achievement (%)',
              data: engagementData,
              backgroundColor: '#3B82F6',
              borderColor: '#2563EB',
              borderWidth: 1
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: engagementTitle,
              font: {
                size: 16
              }
            },
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex;
                  const store = chartType === 'topEngagement' 
                    ? topEngagementStores[index] 
                    : bottomEngagementStores[index];
                  
                  return [
                    `Achievement: ${store.engagementPercentage}%`,
                    `Target: ${store.totalEngagementTarget}`,
                    `Achieved: ${store.totalEngagementAchieved}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Achievement Percentage (%)'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Stores'
              }
            }
          }
        }
      });
    }
    
    // Create conversation chart
    const conversationCtx = conversationChartRef.current.getContext('2d');
    if (conversationCtx) {
      let conversationLabels, conversationData, conversationTitle;
      
      if (chartType === 'topConversation') {
        conversationLabels = topConversationStores.map((store) => store.storeName);
        conversationData = topConversationStores.map((store) => store.conversationPercentage);
        conversationTitle = 'Top 10 Stores by Conversation Target Achievement';
      } else {
        conversationLabels = bottomConversationStores.map((store) => store.storeName);
        conversationData = bottomConversationStores.map((store) => store.conversationPercentage);
        conversationTitle = 'Bottom 10 Stores by Conversation Target Achievement';
      }
      
      conversationChartInstance.current = new Chart(conversationCtx, {
        type: 'bar',
        data: {
          labels: conversationLabels,
          datasets: [
            {
              label: 'Conversation Target Achievement (%)',
              data: conversationData,
              backgroundColor: '#EC4899',
              borderColor: '#DB2777',
              borderWidth: 1
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: conversationTitle,
              font: {
                size: 16
              }
            },
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex;
                  const store = chartType === 'topConversation' 
                    ? topConversationStores[index] 
                    : bottomConversationStores[index];
                  
                  return [
                    `Achievement: ${store.conversationPercentage}%`,
                    `Target: ${store.totalConversationTarget}`,
                    `Achieved: ${store.totalConversationAchieved}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Achievement Percentage (%)'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Stores'
              }
            }
          }
        }
      });
    }
    
    // Cleanup on component unmount
    return () => {
      if (engagementChartInstance.current) {
        engagementChartInstance.current.destroy();
      }
      
      if (conversationChartInstance.current) {
        conversationChartInstance.current.destroy();
      }
    };
  }, [storesData, targetsData, chartType, timeRange]);
  
  if (!storesData || !attendanceData || !targetsData) {
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
      <div className="p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-neutral-800">Store Performance</h3>
        
        <div className="flex items-center space-x-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="p-5">
        <Tabs defaultValue="attendance" value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="topEngagement">Top Engagement</TabsTrigger>
            <TabsTrigger value="bottomEngagement">Bottom Engagement</TabsTrigger>
            <TabsTrigger value="topConversation">Top Conversation</TabsTrigger>
            <TabsTrigger value="bottomConversation">Bottom Conversation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendance">
            <div className="h-80 bg-neutral-50 rounded-lg">
              <canvas ref={attendanceChartRef}></canvas>
            </div>
          </TabsContent>
          
          <TabsContent value="topEngagement">
            <div className="h-80 bg-neutral-50 rounded-lg">
              <canvas ref={engagementChartRef}></canvas>
            </div>
          </TabsContent>
          
          <TabsContent value="bottomEngagement">
            <div className="h-80 bg-neutral-50 rounded-lg">
              <canvas ref={engagementChartRef}></canvas>
            </div>
          </TabsContent>
          
          <TabsContent value="topConversation">
            <div className="h-80 bg-neutral-50 rounded-lg">
              <canvas ref={conversationChartRef}></canvas>
            </div>
          </TabsContent>
          
          <TabsContent value="bottomConversation">
            <div className="h-80 bg-neutral-50 rounded-lg">
              <canvas ref={conversationChartRef}></canvas>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
