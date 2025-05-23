import React, { useEffect, useState } from 'react';
 import { useQuery } from '@tanstack/react-query';
 import { apiRequest } from '@/lib/queryClient';
 import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TargetData {
  storeId: number;
  storeName: string;
  engagementTarget: number;
  engagementAchieved: number;
  conversionTarget: number;
  conversionAchieved: number;
}

interface InventoryData {
  storeId: number;
  storeName: string;
  totalStock: number; 
  itemsSold: number;
}

const StorePerformanceChart: React.FC = () => {
  const [topEngagementStores, setTopEngagementStores] = useState<TargetData[]>([]);
  const [bottomEngagementStores, setBottomEngagementStores] = useState<TargetData[]>([]);
  const [topConversionStores, setTopConversionStores] = useState<TargetData[]>([]);
  const [bottomConversionStores, setBottomConversionStores] = useState<TargetData[]>([]);
  const [topInventoryStores, setTopInventoryStores] = useState<InventoryData[]>([]);
  const [bottomInventoryStores, setBottomInventoryStores] = useState<InventoryData[]>([]);

  // Fetch target data (engagement and conversion)
  const { data: targetsData, isLoading: isTargetsLoading, error: targetsError } = useQuery({
    queryKey: ['/api/admin/targets'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/targets');
      if (!res.ok) {
        throw new Error('Failed to fetch targets');
      }
      return res.json();
    },
  });

  // Fetch Inventory Data
  const { data: inventoryData, isLoading: isInventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['/api/admin/inventory'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/inventory');
      if (!res.ok) {
        throw new Error('Failed to fetch inventory data');
      }
      return res.json();
    }
  })

  useEffect(() => {
    if (targetsData && Array.isArray(targetsData)) {
      // Sort and slice data for top/bottom engagement
      const sortedByEngagement = [...targetsData].sort(
        (a, b) => b.engagementAchieved - a.engagementAchieved
      );
      setTopEngagementStores(sortedByEngagement.slice(0, 10));
      setBottomEngagementStores(sortedByEngagement.slice(-10).reverse());

      // Sort and slice data for top/bottom conversion
      const sortedByConversion = [...targetsData].sort(
        (a, b) => b.conversionAchieved - a.conversionAchieved
      );
      setTopConversionStores(sortedByConversion.slice(0, 10));
      setBottomConversionStores(sortedByConversion.slice(-10).reverse());
    }
  }, [targetsData]);

  useEffect(() => {
    if (inventoryData && Array.isArray(inventoryData)) {
      const storeInventoryMap: { [storeId: number]: InventoryData } = {};

      inventoryData.forEach((item: any) => {
        // Ensure item has storeId and storeName; provide a fallback for storeName if missing.
        // Ideally, the API /api/admin/inventory should consistently provide storeName.
        if (!item.storeId) {
          console.warn('Inventory item is missing storeId. Skipping item:', item);
          return;
        }
        const storeName = (typeof item.storeName === 'string' && item.storeName.trim() !== '') 
                          ? item.storeName 
                          : `Store ID: ${item.storeId}`;
        if (storeName.startsWith('Store ID:')) {
            console.warn(`Inventory item for storeId ${item.storeId} is missing a proper storeName. Using fallback. Item:`, item);
        }

        if (!storeInventoryMap[item.storeId]) {
          storeInventoryMap[item.storeId] = {
            storeId: item.storeId,
            storeName: storeName,
            totalStock: 0,
            itemsSold: 0,
          };
        }
        storeInventoryMap[item.storeId].totalStock += Number(item.openingStock) || 0;
        storeInventoryMap[item.storeId].itemsSold += Number(item.unitsSold) || 0;
      });

      const inventorySummaryList = Object.values(storeInventoryMap);

      // Top 10 Stores (Least Unsold Stock): Sort by (totalStock - itemsSold) ASCENDING
      const sortedForLeastUnsold = [...inventorySummaryList].sort(
        (a, b) => (a.totalStock - a.itemsSold) - (b.totalStock - b.itemsSold)
      );
      setTopInventoryStores(sortedForLeastUnsold.slice(0, 10));

      // Bottom 10 Stores (Most Unsold Stock): Sort by (totalStock - itemsSold) DESCENDING
      const sortedForMostUnsold = [...inventorySummaryList].sort(
        (a, b) => (b.totalStock - b.itemsSold) - (a.totalStock - a.itemsSold)
      );
      setBottomInventoryStores(sortedForMostUnsold.slice(0, 10));
    }
  }, [inventoryData]);

  if (isTargetsLoading || isInventoryLoading) {
    return <div>Loading store performance data...</div>;
  }

  if (targetsError) {
    return <div>Error loading targets data: {targetsError.message}</div>;
  }

  if (inventoryError) {
    return <div>Error loading inventory data: {inventoryError.message}</div>
  }

  return (
    <div>
      {/* Engagement Performance */}
      <h2 className="text-xl font-semibold mb-4">Engagement Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Engagement Stores */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-medium text-gray-700 mb-2">Top 10 Stores (Engagement)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topEngagementStores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="storeName" 
                angle={-30} 
                textAnchor="end" 
                interval={0} 
                height={70} // Adjust height as needed for angled labels
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="engagementAchieved" fill="#8884d8" name="Engagement Achieved" />
              <Bar dataKey="engagementTarget" fill="#82ca9d" name="Engagement Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Engagement Stores */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-medium text-gray-700 mb-2">Bottom 10 Stores (Engagement)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bottomEngagementStores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="storeName" 
                angle={-30} 
                textAnchor="end" 
                interval={0} 
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="engagementAchieved" fill="#8884d8" name="Engagement Achieved" />
              <Bar dataKey="engagementTarget" fill="#82ca9d" name="Engagement Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Performance */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Conversion Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Conversion Stores */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-medium text-gray-700 mb-2">Top 10 Stores (Conversion)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topConversionStores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="storeName" 
                angle={-30} 
                textAnchor="end" 
                interval={0} 
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="conversionAchieved" fill="#c51162" name="Conversion Achieved" />
              <Bar dataKey="conversionTarget" fill="#f50057" name="Conversion Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Conversion Stores */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-medium text-gray-700 mb-2">Bottom 10 Stores (Conversion)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bottomConversionStores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="storeName" 
                angle={-30} 
                textAnchor="end" 
                interval={0} 
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="conversionAchieved" fill="#c51162" name="Conversion Achieved" />
              <Bar dataKey="conversionTarget" fill="#f50057" name="Conversion Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Management */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Inventory Management (Unsold Stock)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Inventory Stores (Least Unsold) */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-medium text-gray-700 mb-2">Top 10 Stores (Least Unsold Stock)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topInventoryStores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="storeName" 
                angle={-30} 
                textAnchor="end" 
                interval={0} 
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalStock" fill="#3f51b5" name="Total Stock" />
              <Bar dataKey="itemsSold" fill="#2196f3" name="Items Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Inventory Stores (Most Unsold) */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-medium text-gray-700 mb-2">Bottom 10 Stores (Most Unsold Stock)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bottomInventoryStores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="storeName" 
                angle={-30} 
                textAnchor="end" 
                interval={0} 
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalStock" fill="#3f51b5" name="Total Stock" />
              <Bar dataKey="itemsSold" fill="#2196f3" name="Items Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StorePerformanceChart;