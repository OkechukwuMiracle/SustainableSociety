import { useQuery } from '@tanstack/react-query';
import { FullInventoryItem } from '@shared/schema'; // Assuming this type is defined in your schema.ts
import { formatDate } from '@/lib/utils'; // Assuming you have a formatDate utility
import * as XLSX from 'xlsx';

const StorePerformance = () => {
  const { data: inventoryData, isLoading, error } = useQuery<FullInventoryItem[]>({
    queryKey: ['/api/admin/inventory'],
    // queryFn is usually set globally in queryClient.ts, so not needed here
    // if not, you would add: queryFn: () => fetch('/api/admin/inventory').then(res => res.json())
  });

  const handleDownloadExcel = () => {
    if (!inventoryData) return;

    const dataForExcel = inventoryData.map(item => {
      let statusText = '-';
      if (item.closingStock !== null && item.closingStock !== undefined && item.openingStock > 0) {
        const percentage = (item.closingStock / item.openingStock) * 100;
        if (percentage >= 80) {
          statusText = `Good (${Math.round(percentage)}%)`;
        } else if (percentage >= 40) {
          statusText = `Low (${Math.round(percentage)}%)`;
        } else {
          statusText = `Very Low (${Math.round(percentage)}%)`;
        }
      }

      return {
        'Store': item.store.name,
        'Product': item.product.name,
        'Brand': item.product.brand.name,
        'Expected Products': item.openingStock,
        'Available Products': item.closingStock !== null && item.closingStock !== undefined ? item.closingStock : 'N/A',
        'Status': statusText,
        'Date': formatDate(new Date(item.date)),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'StorePerformance');

    // Generate a unique filename with timestamp
    XLSX.writeFile(workbook, `StorePerformance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> Failed to load store performance data. {error.message}</span>
      </div>
    );
  }

  if (!inventoryData || inventoryData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 text-center">
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Store Performance</h3>
        <p className="text-neutral-600">No inventory data available to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      <div className="flex justify-between items-center px-5 pt-5 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Store Inventory Performance</h3>
        <button
          onClick={handleDownloadExcel}
          disabled={!inventoryData || inventoryData.length === 0}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Store
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Brand
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Expected Products
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Available Products
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {inventoryData.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{item.store.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{item.product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{item.product.brand.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 text-center">{item.openingStock}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 text-center">
                  {item.closingStock !== null && item.closingStock !== undefined ? item.closingStock : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 text-center">
                  {item.closingStock !== null && item.closingStock !== undefined && item.openingStock > 0 ? (
                    (() => {
                      const percentage = (item.closingStock / item.openingStock) * 100;
                      let colorClass = '';
                      let statusText = '';
                      if (percentage >= 80) {
                        colorClass = 'bg-green-100 text-green-800';
                        statusText = 'Good';
                      } else if (percentage >= 40) {
                        colorClass = 'bg-yellow-100 text-yellow-800';
                        statusText = 'Low';
                      } else {
                        colorClass = 'bg-red-100 text-red-800';
                        statusText = 'Very Low';
                      }
                      return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>{statusText} ({Math.round(percentage)}%)</span>;
                    })()
                  ) : <span className="text-xs text-neutral-500">-</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatDate(new Date(item.date))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StorePerformance;