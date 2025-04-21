import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { getEnhancedWalletActivity } from '../services/solana';
import { Spinner } from './ui/Spinner';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

export default function WalletAnalysis() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  // Fetch enhanced wallet activity data
  const { 
    data: activity, 
    isLoading 
  } = useQuery({
    queryKey: ['enhanced-wallet-activity', currentAddress],
    queryFn: () => currentAddress ? getEnhancedWalletActivity(currentAddress) : null,
    enabled: !!currentAddress,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
    }
  };

  // Prepare chart data
  const volumeChartData = activity ? {
    labels: ['Incoming', 'Outgoing'],
    datasets: [
      {
        data: [activity.volumeStats.incoming, activity.volumeStats.outgoing],
        backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  } : null;

  // Activity patterns chart data
  const activityPatternsData = activity?.activityPatterns ? {
    labels: activity.activityPatterns.hourlyDistribution.map(h => `${h.hour}:00`),
    datasets: [
      {
        label: 'Transactions',
        data: activity.activityPatterns.hourlyDistribution.map(h => h.count),
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  // Entity connections chart
  const entityConnectionsData = activity?.entityConnections ? {
    labels: activity.entityConnections.slice(0, 10).map(e => e.label || e.address.slice(0, 8)),
    datasets: [
      {
        label: 'Transaction Volume',
        data: activity.entityConnections.slice(0, 10).map(e => e.totalVolume),
        backgroundColor: activity.entityConnections.slice(0, 10).map(e => 
          e.riskScore > 0.7 ? 'rgba(255, 99, 132, 0.7)' :
          e.riskScore > 0.4 ? 'rgba(255, 206, 86, 0.7)' :
          'rgba(75, 192, 192, 0.7)'
        ),
        borderColor: activity.entityConnections.slice(0, 10).map(e => 
          e.riskScore > 0.7 ? 'rgba(255, 99, 132, 1)' :
          e.riskScore > 0.4 ? 'rgba(255, 206, 86, 1)' :
          'rgba(75, 192, 192, 1)'
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
            Enhanced Wallet Analysis
          </h2>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
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
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Analyze
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
          <p className="ml-3 text-gray-500 dark:text-gray-400">Analyzing wallet...</p>
        </div>
      ) : activity ? (
        <>
          {/* Risk Assessment */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Risk Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overall Risk Score</span>
                  <span className={`text-lg font-semibold ${
                    activity.riskAssessment.overallScore > 0.7 ? 'text-red-500' :
                    activity.riskAssessment.overallScore > 0.4 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {(activity.riskAssessment.overallScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className={`h-2.5 rounded-full ${
                      activity.riskAssessment.overallScore > 0.7 ? 'bg-red-500' :
                      activity.riskAssessment.overallScore > 0.4 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${activity.riskAssessment.overallScore * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                {activity.riskAssessment.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{factor.factor}</span>
                    <span className={`text-sm font-medium ${
                      factor.score > 0.7 ? 'text-red-500' :
                      factor.score > 0.4 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {(factor.score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Funding History */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Funding History</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Funding</h4>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {activity.fundingHistory.totalAmount.toFixed(2)} SOL
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Sources</h4>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {activity.fundingHistory.primarySources.length}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Initial Funding</h4>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {activity.fundingHistory.transactions[0]?.amount.toFixed(2)} SOL
                  </p>
                </div>
              </div>

              {/* Primary Sources Table */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Primary Funding Sources</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Percentage</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {activity.fundingHistory.primarySources.map((source, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {source.label || source.address.slice(0, 8) + '...'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {source.amount.toFixed(2)} SOL
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {source.percentage.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {source.type || 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Activity Distribution</h3>
              {activityPatternsData && (
                <div className="h-64">
                  <Bar
                    data={activityPatternsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: 'Hourly Transaction Distribution'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        }
                      }
                    }}
                  />
                </div>
              )}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Activity Patterns</h4>
                <div className="space-y-2">
                  {activity.activityPatterns.commonPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{pattern.pattern}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{pattern.description}</p>
                      </div>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${
                        pattern.riskScore > 0.7 ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                        pattern.riskScore > 0.4 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                        'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      }`}>
                        Risk: {(pattern.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Entity Connections */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Entity Connections</h3>
              {entityConnectionsData && (
                <div className="h-64">
                  <Bar
                    data={entityConnectionsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: 'Top Entity Interactions by Volume'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        }
                      }
                    }}
                  />
                </div>
              )}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Top Connections</h4>
                <div className="space-y-2">
                  {activity.entityConnections.slice(0, 5).map((connection, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {connection.label || connection.address.slice(0, 8) + '...'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {connection.type || 'Unknown'} • {connection.totalTransactions} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {connection.totalVolume.toFixed(2)} SOL
                        </p>
                        <p className={`text-xs ${
                          connection.direction === 'bidirectional' ? 'text-purple-500' :
                          connection.direction === 'incoming' ? 'text-green-500' :
                          'text-red-500'
                        }`}>
                          {connection.direction}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Burst Activity */}
          {activity.activityPatterns.burstActivity.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Burst Activity Detection</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transactions</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {activity.activityPatterns.burstActivity.map((burst, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(burst.timestamp), 'PPp')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {burst.duration.toFixed(1)} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {burst.transactionCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {burst.totalValue.toFixed(2)} SOL
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : currentAddress && !isLoading ? (
        <div className="text-center text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          No data found for this address
        </div>
      ) : null}
    </div>
  );
} 