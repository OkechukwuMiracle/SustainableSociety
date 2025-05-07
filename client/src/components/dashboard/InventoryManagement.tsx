import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Brand {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  brandId: number;
  brand: Brand;
}

interface InventoryItem {
  id: number;
  storeId: number;
  productId: number;
  openingStock: number;
  closingStock: number | null;
  unitsSold: number | null;
  date: string;
  product: Product;
}

export default function InventoryManagement() {
  const { store } = useAuth();
  const { toast } = useToast();
  const [selectedBrand, setSelectedBrand] = useState<number | 'all'>('all');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const storeId = store?.id || 0;

  // Fetch inventory data
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/inventory/store/${storeId}`],
    enabled: storeId > 0,
  });

  // Fetch brands for filtering
  const { data: brandsData } = useQuery({
    queryKey: ['/api/brands'],
  });

  // Update inventory mutation
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, closingStock }: { id: number; closingStock: number }) => {
      const res = await apiRequest('PUT', `/api/inventory/${id}`, { closingStock });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/inventory/store/${storeId}`] });
      toast({
        title: 'Inventory Updated',
        description: 'The inventory has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update inventory',
        variant: 'destructive',
      });
    },
  });

  // Update inventory when data changes
  useEffect(() => {
    if (data) {
      setInventory(data);
    }
  }, [data]);

  // Filter inventory by selected brand
  const filteredInventory = inventory.filter((item) => {
    if (selectedBrand === 'all') return true;
    return item.product.brandId === selectedBrand;
  });

  // Handle closing stock input change
  const handleClosingStockChange = (id: number, value: number) => {
    const updatedInventory = inventory.map((item) => {
      if (item.id === id) {
        const units = item.openingStock - value;
        return {
          ...item,
          closingStock: value,
          unitsSold: units >= 0 ? units : 0,
        };
      }
      return item;
    });
    setInventory(updatedInventory);
  };

  // Handle save inventory
  const handleSaveInventory = () => {
    const updatedItems = inventory.filter((item) => 
      item.closingStock !== null && item.closingStock !== undefined
    );
    
    if (updatedItems.length === 0) {
      toast({
        title: 'No Changes',
        description: 'No inventory changes to save',
      });
      return;
    }

    // Save each updated item
    updatedItems.forEach((item) => {
      if (item.closingStock !== null) {
        updateInventoryMutation.mutate({
          id: item.id,
          closingStock: item.closingStock,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">Stock Management</h3>
          <span className="text-sm text-neutral-500">Loading inventory data...</span>
        </div>
        <div className="p-5 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">Stock Management</h3>
        </div>
        <div className="p-5">
          <p className="text-red-500">Error loading inventory data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 overflow-hidden">
      <div className="flex justify-between items-center p-5 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-800">Stock Management</h3>
        <span className="text-sm text-neutral-500">Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
      
      <div className="p-5">
        {/* Brand Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedBrand === 'all' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
            onClick={() => setSelectedBrand('all')}
          >
            All Brands
          </button>
          {brandsData && brandsData.map((brand: Brand) => (
            <button 
              key={brand.id}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedBrand === brand.id ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              onClick={() => setSelectedBrand(brand.id)}
            >
              {brand.name}
            </button>
          ))}
        </div>
        
        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Brand
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Opening Stock
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Closing Stock
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Units Sold
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-800">{item.product.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-700">{item.product.brand?.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input 
                        type="number" 
                        readOnly
                        value={item.openingStock} 
                        className="w-20 px-2 py-1 text-sm border border-neutral-300 rounded-md bg-neutral-50" 
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input 
                        type="number" 
                        value={item.closingStock === null ? '' : item.closingStock} 
                        onChange={(e) => handleClosingStockChange(item.id, parseInt(e.target.value) || 0)} 
                        className="w-20 px-2 py-1 text-sm border border-neutral-300 rounded-md" 
                        min="0"
                        max={item.openingStock}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-800">
                        {item.unitsSold !== null ? item.unitsSold : '-'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-neutral-500">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSaveInventory}
            disabled={updateInventoryMutation.isPending}
          >
            {updateInventoryMutation.isPending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Inventory'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
