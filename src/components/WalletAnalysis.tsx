import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { analyzeWalletActivity, fetchTokenBalances } from '../services/solana';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function WalletAnalysis() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  const { data: activity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['wallet-activity', currentAddress],
    queryFn: () => currentAddress ? analyzeWalletActivity(currentAddress) : null,
    enabled: !!currentAddress,
  });

  const { data: tokenBalances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ['token-balances', currentAddress],
    queryFn: () => currentAddress ? fetchTokenBalances(currentAddress) : null,
    enabled: !!currentAddress,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
    }
  };

  const volumeChartData = activity ? {
    labels: ['Incoming', 'Outgoing'],
    datasets: [
      {
        data: [activity.volumeStats.incoming, activity.volumeStats.outgoing],
        backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  } : null;

  const tokenBalanceChartData = tokenBalances ? {
    labels: tokenBalances.map(token => token.symbol || token.mint.slice(0, 8)),
    datasets: [
      {
        data: tokenBalances.map(token => token.uiAmount),
        backgroundColor: tokenBalances.map(() => 
          `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2)`
        ),
        borderColor: tokenBalances.map(() => 
          `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`
        ),
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Wallet Analysis
          </h2>
        </div>
      </div>

      {/* Search Form */}
      <div className="mt-4">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter Solana wallet address"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Analyze
          </button>
        </form>
      </div>

      {(isLoadingActivity || isLoadingBalances) ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Analyzing wallet...</p>
        </div>
      ) : activity && tokenBalances ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Activity Stats */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activity Overview</h3>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Transactions
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                  {activity.totalTransactions}
                </dd>
              </div>
              <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Unique Interactions
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                  {activity.uniqueInteractions.length}
                </dd>
              </div>
            </dl>
            {volumeChartData && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume Distribution</h4>
                <div className="mt-2 h-64">
                  <Doughnut
                    data={volumeChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Token Balances */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Token Holdings</h3>
            {tokenBalanceChartData && (
              <div className="mt-6">
                <div className="h-64">
                  <Doughnut
                    data={tokenBalanceChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="mt-6">
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                  {tokenBalances.map((token) => (
                    <li key={token.mint} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {token.symbol || token.mint.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            Balance: {token.uiAmount}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
} 