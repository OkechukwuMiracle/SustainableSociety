import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculatePercentage } from '@/lib/utils';

interface Target {
  id: number;
  userId: number;
  storeId: number;
  engagementDailyTarget: number;
  engagementAchieved: number;
  conversationDailyTarget: number;
  conversationAchieved: number;
  date: string;
}

export default function TargetsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newEngagementTarget, setNewEngagementTarget] = useState<number>(0);
  const [newConversationTarget, setNewConversationTarget] = useState<number>(0);
  
  // Fetch current user target data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/user/current'],
    retry: false,
  });
  
  const target: Target | undefined = data?.target;
  
  // Use initial values when data loads
  useState(() => {
    if (target) {
      setNewEngagementTarget(target.engagementDailyTarget);
      setNewConversationTarget(target.conversationDailyTarget);
    }
  });
  
  // Update target mutation
  const updateTargetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/targets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/targets'] }); // Added to refresh StorePerformanceChart
      toast({
        title: 'Target Updated',
        description: 'Your target has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update target',
        variant: 'destructive',
      });
    },
  });
  
  // Handle update engagement target
  const handleUpdateEngagementTarget = () => {
    if (!target) return;
    
    updateTargetMutation.mutate({
      id: target.id,
      data: { engagementDailyTarget: newEngagementTarget }
    });
  };
  
  // Handle update conversation target
  const handleUpdateConversationTarget = () => {
    if (!target) return;
    
    updateTargetMutation.mutate({
      id: target.id,
      data: { conversationDailyTarget: newConversationTarget }
    });
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
        <div className="p-5 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">Targets Management</h3>
        </div>
        <div className="p-5 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error || !target) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
        <div className="p-5 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">Targets Management</h3>
        </div>
        <div className="p-5">
          <p className="text-red-500">Error loading target data. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  const engagementPercentage = calculatePercentage(target.engagementAchieved, target.engagementDailyTarget);
  const conversationPercentage = calculatePercentage(target.conversationAchieved, target.conversationDailyTarget);
  
  // Weekly targets - this would typically be calculated on the backend
  // For now, we're just showing some example data
  const weeklyEngagement = {
    achieved: target.engagementAchieved * 3, // Simplified calculation for demo
    target: target.engagementDailyTarget * 5
  };
  
  const weeklyConversation = {
    achieved: target.conversationAchieved * 3, // Simplified calculation for demo
    target: target.conversationDailyTarget * 5
  };
  
  // Monthly targets
  const monthlyEngagement = {
    achieved: target.engagementAchieved * 12, // Simplified calculation for demo
    target: target.engagementDailyTarget * 20
  };
  
  const monthlyConversation = {
    achieved: target.conversationAchieved * 10, // Simplified calculation for demo
    target: target.conversationDailyTarget * 20
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="p-5 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-800">Targets Management</h3>
      </div>
      
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engagement Targets */}
        <div>
          <h4 className="text-md font-medium text-neutral-800 mb-4">Engagement Targets</h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-neutral-600">Daily Target</label>
                <span className="text-sm text-neutral-500">{target.engagementAchieved}/{target.engagementDailyTarget} achieved</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${engagementPercentage}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-neutral-600">Weekly Target</label>
                <span className="text-sm text-neutral-500">{weeklyEngagement.achieved}/{weeklyEngagement.target} achieved</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${calculatePercentage(weeklyEngagement.achieved, weeklyEngagement.target)}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-neutral-600">Monthly Target</label>
                <span className="text-sm text-neutral-500">{monthlyEngagement.achieved}/{monthlyEngagement.target} achieved</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${calculatePercentage(monthlyEngagement.achieved, monthlyEngagement.target)}%` }}></div>
              </div>
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-neutral-600 mb-1">Update Daily Target</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  value={newEngagementTarget} 
                  onChange={(e) => setNewEngagementTarget(parseInt(e.target.value) || 0)} 
                  className="w-24 px-3 py-2 text-sm border border-neutral-300 rounded-md" 
                  min="0"
                />
                <button 
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleUpdateEngagementTarget}
                  disabled={updateTargetMutation.isPending || newEngagementTarget === target.engagementDailyTarget}
                >
                  {updateTargetMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Conversation Targets */}
        <div>
          <h4 className="text-md font-medium text-neutral-800 mb-4">Conversation Targets</h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-neutral-600">Daily Target</label>
                <span className="text-sm text-neutral-500">{target.conversationAchieved}/{target.conversationDailyTarget} achieved</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: `${conversationPercentage}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-neutral-600">Weekly Target</label>
                <span className="text-sm text-neutral-500">{weeklyConversation.achieved}/{weeklyConversation.target} achieved</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: `${calculatePercentage(weeklyConversation.achieved, weeklyConversation.target)}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-neutral-600">Monthly Target</label>
                <span className="text-sm text-neutral-500">{monthlyConversation.achieved}/{monthlyConversation.target} achieved</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: `${calculatePercentage(monthlyConversation.achieved, monthlyConversation.target)}%` }}></div>
              </div>
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-neutral-600 mb-1">Update Daily Target</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  value={newConversationTarget} 
                  onChange={(e) => setNewConversationTarget(parseInt(e.target.value) || 0)} 
                  className="w-24 px-3 py-2 text-sm border border-neutral-300 rounded-md" 
                  min="0"
                />
                <button 
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleUpdateConversationTarget}
                  disabled={updateTargetMutation.isPending || newConversationTarget === target.conversationDailyTarget}
                >
                  {updateTargetMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
