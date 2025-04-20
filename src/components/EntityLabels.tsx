import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEntityLabels, EntityLabel, fetchWalletTransactions, fetchTransactionFlow } from '../services/solana';
import { Spinner } from './ui/Spinner';

export default function EntityLabels() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [inputAddress, setInputAddress] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [showBatchInput, setShowBatchInput] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  // Fetch entity labels data
  const { 
    data: labels, 
    isLoading: labelsLoading,
    refetch: refetchLabels 
  } = useQuery<EntityLabel[]>({
    queryKey: ['entity-labels', addresses],
    queryFn: () => addresses.length > 0 ? fetchEntityLabels(addresses) : [],
    enabled: addresses.length > 0,
  });

  // Fetch transactions for the selected entity
  const { 
    data: entityTransactions, 
    isLoading: txLoading 
  } = useQuery({
    queryKey: ['entity-transactions', selectedEntity],
    queryFn: () => selectedEntity ? fetchWalletTransactions(selectedEntity, 10) : null,
    enabled: !!selectedEntity,
  });

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAddress && !addresses.includes(inputAddress)) {
      setAddresses([...addresses, inputAddress]);
      setInputAddress('');
    }
  };

  const handleBatchAddresses = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchInput.trim()) return;
    
    // Parse addresses (split by commas, newlines, or spaces)
    const newAddresses = batchInput
      .split(/[\s,]+/)
      .map(addr => addr.trim())
      .filter(addr => addr && !addresses.includes(addr));
    
    if (newAddresses.length > 0) {
      setAddresses([...addresses, ...newAddresses]);
      setBatchInput('');
      setShowBatchInput(false);
    }
  };

  const handleRemoveAddress = (address: string) => {
    setAddresses(addresses.filter(a => a !== address));
    if (selectedEntity === address) {
      setSelectedEntity(null);
    }
  };

  const handleSelectEntity = (address: string) => {
    setSelectedEntity(address === selectedEntity ? null : address);
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'exchange':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'dex':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'token':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'nft':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100';
      case 'trader':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const findCommonAddresses = async () => {
    // Find addresses that frequently interact with the selected addresses
    if (addresses.length < 1) return;
    
    const recommendedAddresses: string[] = [];
    
    try {
      for (const address of addresses) {
        // Get transaction flow for the address
        const flowData = await fetchTransactionFlow(address, 30);
        
        // Collect frequently interacted addresses
        const interactionMap = new Map<string, number>();
        
        flowData.forEach(flow => {
          const interactingAddress = flow.from === address ? flow.to : flow.from;
          
          if (!addresses.includes(interactingAddress)) {
            interactionMap.set(
              interactingAddress, 
              (interactionMap.get(interactingAddress) || 0) + 1
            );
          }
        });
        
        // Find top 2 most frequent interactions
        const topInteractions = Array.from(interactionMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([addr]) => addr);
          
        recommendedAddresses.push(...topInteractions);
      }
      
      // Filter out duplicates
      const uniqueRecommended = [...new Set(recommendedAddresses)];
      
      // Add recommended addresses and refetch labels
      if (uniqueRecommended.length > 0) {
        setAddresses([...addresses, ...uniqueRecommended]);
      }
    } catch (error) {
      console.error("Error finding common addresses:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Entity Labels
          </h2>
        </div>
      </div>

      {/* Add Address Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        {!showBatchInput ? (
          <form onSubmit={handleAddAddress} className="space-y-4">
            <div>
              <label htmlFor="address-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Add Wallet Address
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="address-input"
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  placeholder="Enter Solana address"
                  className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button" 
                onClick={() => setShowBatchInput(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Batch import addresses
              </button>
              
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={findCommonAddresses}
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Find related addresses
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleBatchAddresses} className="space-y-4">
            <div>
              <label htmlFor="batch-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Batch Import (one address per line or separated by commas)
              </label>
              <div className="mt-1">
                <textarea
                  id="batch-input"
                  rows={5}
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder="Enter multiple Solana addresses, separated by commas or new lines"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowBatchInput(false)}
                className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Import
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Address List */}
      {addresses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Added Addresses</h3>
          <div className="flex flex-wrap gap-2">
            {addresses.map((address) => (
              <span
                key={address}
                className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-700 px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                {address.slice(0, 8)}...{address.slice(-8)}
                <button
                  type="button"
                  onClick={() => handleRemoveAddress(address)}
                  className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:bg-gray-500 focus:text-white"
                >
                  <span className="sr-only">Remove address</span>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {labelsLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
          <p className="ml-3 text-gray-500 dark:text-gray-400">Fetching entity labels...</p>
        </div>
      ) : labels && labels.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Entity table */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Entity Label Results</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Label
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {labels.map((label: EntityLabel) => (
                      <tr 
                        key={label.address} 
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedEntity === label.address ? 'bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-20' : ''}`}
                        onClick={() => handleSelectEntity(label.address)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {label.address.slice(0, 8)}...{label.address.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {label.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(label.type)}`}>
                            {label.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfidenceBadgeColor(label.confidence)}`}>
                            {(label.confidence * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Entity Details */}
          <div className="lg:col-span-1">
            {selectedEntity ? (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Entity Details
                  </h3>
                </div>
                
                {txLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Spinner />
                  </div>
                ) : entityTransactions && entityTransactions.length > 0 ? (
                  <div className="px-4 py-5 sm:p-6">
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Transactions</h4>
                      <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
                        {entityTransactions.slice(0, 5).map(tx => (
                          <li key={tx.signature} className="py-3">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(tx.blockTime * 1000).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100`}>
                                  {tx.type || 'TRANSFER'}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Analysis</h4>
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          This entity has made {entityTransactions.length} transactions in the last 30 days.
                        </p>
                        
                        {/* Transaction type breakdown */}
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-gray-400 dark:text-gray-500">Transaction Types</h5>
                          <div className="mt-2 space-y-2">
                            {Array.from(new Set(entityTransactions.map(tx => tx.type || 'UNKNOWN'))).map(type => {
                              const count = entityTransactions.filter(tx => (tx.type || 'UNKNOWN') === type).length;
                              const percentage = (count / entityTransactions.length) * 100;
                              
                              return (
                                <div key={type} className="relative">
                                  <div className="flex items-center justify-between text-xs">
                                    <span>{type}</span>
                                    <span>{count} ({percentage.toFixed(1)}%)</span>
                                  </div>
                                  <div className="overflow-hidden h-2 mt-1 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                                    <div 
                                      style={{ width: `${percentage}%` }}
                                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-5 sm:p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No recent transactions found for this entity.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400">
                  Select an entity to view details
                </p>
              </div>
            )}
          </div>
        </div>
      ) : addresses.length > 0 && !labelsLoading ? (
        <div className="text-center text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          No entity labels found
        </div>
      ) : null}
    </div>
  );
} 