import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEntityLabels, EntityLabel } from '../services/solana';

export default function EntityLabels() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [inputAddress, setInputAddress] = useState('');

  const { data: labels, isLoading } = useQuery({
    queryKey: ['entity-labels', addresses],
    queryFn: () => addresses.length > 0 ? fetchEntityLabels(addresses) : null,
    enabled: addresses.length > 0,
  });

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAddress && !addresses.includes(inputAddress)) {
      setAddresses([...addresses, inputAddress]);
      setInputAddress('');
    }
  };

  const handleRemoveAddress = (address: string) => {
    setAddresses(addresses.filter(a => a !== address));
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
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
      <div className="mt-4">
        <form onSubmit={handleAddAddress} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="Enter Solana address"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Address
          </button>
        </form>
      </div>

      {/* Address List */}
      {addresses.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Added Addresses</h3>
          <div className="mt-2 flex flex-wrap gap-2">
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
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Fetching entity labels...</p>
        </div>
      ) : labels ? (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">
                      Address
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Label
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {labels.map((label: EntityLabel) => (
                    <tr key={label.address}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                        {label.address.slice(0, 8)}...{label.address.slice(-8)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {label.label}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {label.type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getConfidenceBadgeColor(label.confidence)}`}>
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
      ) : null}
    </div>
  );
} 