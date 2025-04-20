import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clusterTransactions, TransactionCluster, fetchEntityLabels } from '../services/solana';
import { Spinner } from './ui/Spinner';

export default function TransactionClustering() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [depth, setDepth] = useState<number>(1);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Fetch clustered transactions
  const { 
    data: clusters, 
    isLoading: clustersLoading 
  } = useQuery<TransactionCluster[]>({
    queryKey: ['transaction-clusters', currentAddress, depth],
    queryFn: async () => {
      if (!currentAddress) return [];
      return await clusterTransactions(currentAddress, depth);
    },
    enabled: !!currentAddress,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
      setSelectedCluster(null);
    }
  };

  const handleDepthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepth(Number(e.target.value));
  };

  const handleClusterClick = (clusterId: string) => {
    setSelectedCluster(clusterId === selectedCluster ? null : clusterId);
  };

  // Get details for a selected cluster
  const selectedClusterData = selectedCluster && clusters 
    ? clusters.find((c: TransactionCluster) => c.id === selectedCluster) 
    : null;

  // Function to get the suspicion level text and color
  const getSuspicionLevel = (score: number) => {
    if (score < 0.3) return { text: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' };
    if (score < 0.7) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' };
    return { text: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' };
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Transaction Clustering
          </h2>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Wallet Address
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="wallet-address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Enter Solana wallet address"
                className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="depth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Analysis Depth
              </label>
              <div className="mt-1">
                <select
                  id="depth"
                  value={depth}
                  onChange={handleDepthChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value={1}>Level 1 - Basic</option>
                  <option value={2}>Level 2 - Deep</option>
                </select>
              </div>
            </div>
            
            <div className="self-end">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Analyze
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {clustersLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
          <p className="ml-3 text-gray-500 dark:text-gray-400">Analyzing transaction patterns...</p>
        </div>
      ) : clusters && clusters.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Clusters List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transaction Clusters</h3>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {clusters.map((cluster: TransactionCluster) => (
                  <li 
                    key={cluster.id}
                    className={`
                      cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 
                      ${selectedCluster === cluster.id ? 'bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-20' : ''}`
                    }
                    onClick={() => handleClusterClick(cluster.id)}
                  >
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {cluster.label}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                            {cluster.addresses.length} addresses
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>Transactions: {cluster.transactions}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>Volume: {cluster.volume.toFixed(2)}</span>
                        </div>
                      </div>
                      {cluster.suspiciousScore > 0.1 && (
                        <div className="mt-2 flex justify-between">
                          <div className="flex items-center text-sm">
                            <span className="mr-1">Suspicion Level:</span>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSuspicionLevel(cluster.suspiciousScore).color}`}>
                              {getSuspicionLevel(cluster.suspiciousScore).text}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cluster Details */}
          <div className="lg:col-span-2">
            {selectedClusterData ? (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedClusterData.label} Details
                    </h3>
                    {selectedClusterData.suspiciousScore > 0.5 && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                        Potential Suspicious Activity
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4 space-y-6">
                  {/* Cluster Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Addresses</h4>
                      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                        {selectedClusterData.addresses.length}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transactions</h4>
                      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                        {selectedClusterData.transactions}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume</h4>
                      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                        {selectedClusterData.volume.toFixed(2)} SOL
                      </p>
                    </div>
                  </div>
                  
                  {/* Addresses in Cluster */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Addresses in Cluster</h4>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Address
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Type
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {selectedClusterData.addresses.map((address: string) => (
                              <tr key={address}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                                  {address}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {address === currentAddress ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                      Central Address
                                    </span>
                                  ) : 'Related Address'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Related Clusters */}
                  {selectedClusterData.relatedClusters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Related Clusters</h4>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Cluster
                                </th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Connection Strength
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {selectedClusterData.relatedClusters.map((related: { id: string; strength: number }) => {
                                const relatedCluster = clusters.find((c: TransactionCluster) => c.id === related.id);
                                return (
                                  <tr 
                                    key={related.id}
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    onClick={() => handleClusterClick(related.id)}
                                  >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                      {relatedCluster?.label || related.id}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center">
                                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                          <div 
                                            className="bg-blue-600 h-2.5 rounded-full" 
                                            style={{ width: `${related.strength * 100}%` }}
                                          ></div>
                                        </div>
                                        <span className="ml-2">{Math.round(related.strength * 100)}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Suspicious Activity Warning */}
                  {selectedClusterData.suspiciousScore > 0.5 && (
                    <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-800 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Suspicious Activity Detected</h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <p>
                              This cluster exhibits patterns that may indicate suspicious activity:
                            </p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              <li>Cyclic transaction patterns</li>
                              <li>Unusual transaction volume</li>
                              {selectedClusterData.volume > 100 && (
                                <li>High transaction volume ({selectedClusterData.volume.toFixed(2)} SOL)</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {clusters && clusters.length > 0 
                    ? 'Select a cluster to view details' 
                    : 'No transaction clusters found for this address'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        currentAddress && !clustersLoading && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No transaction clusters found for this address</p>
          </div>
        )
      )}
    </div>
  );
} 