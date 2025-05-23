import { useState, useEffect, useMemo } from 'react';
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
  const [selectedBrandId, setSelectedBrandId] = useState<number | 'all'>('all');
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const storeId = store?.id || 0;

  // Fetch inventory data
  const { data: inventoryData, isLoading, error } = useQuery<InventoryItem[]>({
    queryKey: [`/api/inventory/store/${storeId}`],
    enabled: storeId > 0,
  });

  // Fetch brands for filtering
  const { data: brandsData = [] } = useQuery<Brand[]>({
    queryKey: ['/api/brands'],
  });

  // Update inventory mutation
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, closingStock }: { id: number; closingStock: number }) => {
      const res = await apiRequest('PUT', `/api/inventory/${id}`, { closingStock });
      return res.json();
    },
    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: [`/api/inventory/store/${storeId}`] });
    //   toast({
    //     title: 'Inventory Updated',
    //     description: 'The inventory has been successfully updated.',
    //   });
    // },

     onSuccess: (data, variables) => {
    const updatedInventory = inventory.map(item => {
      if (item.id === variables.id) {
        return {
          ...item,
          closingStock: variables.closingStock,
          unitsSold: item.openingStock - variables.closingStock
        };
      }
      return item;
    });
    setInventory(updatedInventory);
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: [`/api/inventory/store/${storeId}`] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/targets'] }); // Added to refresh engagement/conversion charts
    
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
    if (inventoryData && Array.isArray(inventoryData)) {
      setInventory(inventoryData);
    }
  }, [inventoryData]);

  const currentSelectedBrand = useMemo(() => {
    if (typeof selectedBrandId === 'number') {
      return brandsData.find(b => b.id === selectedBrandId);
    }
    return null;
  }, [selectedBrandId, brandsData]);

  const variantsForSelectedBrand = useMemo(() => {
    if (!currentSelectedBrand || typeof selectedBrandId !== 'number') {
      return [];
    }
    const brandName = currentSelectedBrand.name;
    const prefixes = new Set<string>();
    inventory
      .filter(item => item.product && item.product.brandId === selectedBrandId)
      .forEach(item => {
        let nameToCheck = item.product.name;
        if (nameToCheck.toLowerCase().startsWith(brandName.toLowerCase())) {
          nameToCheck = nameToCheck.substring(brandName.length).trim();
        }
        if (nameToCheck) {
          const firstWord = nameToCheck.split(' ')[0];
          if (firstWord) {
            prefixes.add(firstWord);
          }
        }
      });
    return Array.from(prefixes).sort();
  }, [selectedBrandId, inventory, currentSelectedBrand]);

  const handleBrandSelect = (brandId: number | 'all') => {
    setSelectedBrandId(brandId);
    setSelectedVariant(null); // Reset variant when brand changes
  };

  const handleVariantSelect = (variant: string) => {
    setSelectedVariant(variant);
  };

  const finalDisplayedInventory = useMemo(() => {
    // if (selectedBrandId === 'all') {
    //   return inventory.filter(item => item.product); // Show all products if "All Brands" is selected
    // }

    if (typeof selectedBrandId === 'number' && currentSelectedBrand) {
      const brandName = currentSelectedBrand.name;
      if (selectedVariant) { // A specific variant is selected
        return inventory.filter(item => {
          if (!item.product || item.product.brandId !== selectedBrandId) return false;
          let nameToCheck = item.product.name;
          if (nameToCheck.toLowerCase().startsWith(brandName.toLowerCase())) {
            nameToCheck = nameToCheck.substring(brandName.length).trim();
          }
          return nameToCheck.toLowerCase().startsWith(selectedVariant.toLowerCase());
        });
      } else if (variantsForSelectedBrand.length === 0) { // No variant selected, and no variants derived, show all for brand
        return inventory.filter(item => item.product && item.product.brandId === selectedBrandId);
      }
    }
    return []; // Otherwise, no items to display (e.g., brand selected, waiting for variant)
  }, [selectedBrandId, selectedVariant, inventory, currentSelectedBrand, variantsForSelectedBrand]);

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
        <span className="text-sm text-neutral-500">Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
      </div>
      
      <div className="p-5">
        {/* Brand Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {/* <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedBrandId === 'all' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
            onClick={() => handleBrandSelect('all')}
          >
            All Brands
          </button> */}
          {Array.isArray(brandsData) && brandsData.map((brand: Brand) => (
            <button 
              key={brand.id}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedBrandId === brand.id ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              onClick={() => handleBrandSelect(brand.id)}
            >
              {brand.name}
            </button>
          ))}
        </div>

        {/* Variant Filter */}
        {typeof selectedBrandId === 'number' && currentSelectedBrand && variantsForSelectedBrand.length > 0 && (
          <div className="my-4 flex flex-wrap gap-2 p-3 bg-neutral-50 rounded-md border border-neutral-200">
            <p className="w-full text-sm text-neutral-700 mb-2 font-medium">
              Select a Variant for {currentSelectedBrand.name}:
            </p>
            {variantsForSelectedBrand.map(variant => (
              <button
                key={variant}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  selectedVariant === variant ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                }`}
                onClick={() => handleVariantSelect(variant)}
              >
                {variant}
              </button>
            ))}
          </div>
        )}
        {typeof selectedBrandId === 'number' && currentSelectedBrand && !selectedVariant && variantsForSelectedBrand.length > 0 && (
           <p className="text-sm text-neutral-600 my-4 p-3 bg-blue-50 border border-blue-200 rounded-md">Please select a variant to view products for {currentSelectedBrand.name}.</p>
        )}
      
        
        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Brand Name
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Expected Products
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Available Products
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {finalDisplayedInventory.length > 0 ? (
                finalDisplayedInventory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-800">{item.product.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-700">
                        {item.product.brand ? item.product.brand.name : 'Unknown Brand'}
                      </div>
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
                      {item.closingStock !== null && item.openingStock > 0 ? (
                        (() => {
                          const percentage = (item.closingStock / item.openingStock) * 100;
                          let colorClass = '';
                          let statusText = '';
                          if (percentage >= 80) {
                            colorClass = 'bg-green-100 text-green-800';
                            statusText = 'Good';
                          } else if (percentage >= 40) {
                            colorClass = 'bg-yellow-200 text-yellow-800';
                            statusText = 'Low';
                          } else {
                            colorClass = 'bg-red-100 text-red-800';
                            statusText = 'Very Low';
                          }
                          return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>{statusText} ({Math.round(percentage)}%)</span>;
                        })()
                      ) : <span className="text-xs text-neutral-500">-</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-neutral-500">
                    {isLoading ? 'Loading inventory...' : 
                     (typeof selectedBrandId === 'number' && !selectedVariant && variantsForSelectedBrand.length > 0 && currentSelectedBrand) ? 
                     `Select a variant for ${currentSelectedBrand.name} to see products.` :
                     'No inventory items found for the current selection.'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Save Button - show if there are items in the table */}
        {finalDisplayedInventory.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
