import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionFlow, TransactionFlow } from '../services/solana';

interface ClusterNode {
  id: string;
  label: string;
  transactions: number;
  volume: number;
}

interface ClusterEdge {
  source: string;
  target: string;
  transactions: number;
  volume: number;
}

interface Cluster {
  nodes: ClusterNode[];
  edges: ClusterEdge[];
}

function clusterTransactions(transactions: TransactionFlow[]): Cluster {
  const nodes = new Map<string, ClusterNode>();
  const edges = new Map<string, ClusterEdge>();

  // Process transactions to build nodes and edges
  transactions.forEach(tx => {
    if (!nodes.has(tx.from)) {
      nodes.set(tx.from, {
        id: tx.from,
        label: `Wallet ${tx.from.slice(0, 8)}...`,
        transactions: 0,
        volume: 0,
      });
    }
    const sourceNode = nodes.get(tx.from)!;
    sourceNode.transactions += 1;
    sourceNode.volume += tx.amount;

    // Update or create target node
    if (!nodes.has(tx.to)) {
      nodes.set(tx.to, {
        id: tx.to,
        label: `Wallet ${tx.to.slice(0, 8)}...`,
        transactions: 0,
        volume: 0,
      });
    }
    const targetNode = nodes.get(tx.to)!;
    targetNode.transactions += 1;
    targetNode.volume += tx.amount;

    // Update or create edge
    const edgeId = `${tx.from}-${tx.to}`;
    if (!edges.has(edgeId)) {
      edges.set(edgeId, {
        source: tx.from,
        target: tx.to,
        transactions: 0,
        volume: 0,
      });
    }
    const edge = edges.get(edgeId)!;
    edge.transactions += 1;
    edge.volume += tx.amount;
  });

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}

export default function TransactionClustering() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30); // days

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['clustering-transactions', currentAddress, timeRange],
    queryFn: () => currentAddress ? fetchTransactionFlow(currentAddress, timeRange) : null,
    enabled: !!currentAddress,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
    }
  };

  const clusters = transactions ? clusterTransactions(transactions) : null;

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
      <div className="mt-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex space-x-4">
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
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Analyzing transaction patterns...</p>
        </div>
      ) : clusters ? (
        <div className="mt-8 space-y-8">
          {/* Nodes/Wallets */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Connected Wallets</h3>
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">
                          Wallet
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Transactions
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {clusters.nodes.map((node) => (
                        <tr key={node.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                            {node.label}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {node.transactions}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {node.volume.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Edges/Connections */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Transaction Patterns</h3>
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">
                          From
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          To
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Transactions
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {clusters.edges.map((edge) => (
                        <tr key={`${edge.source}-${edge.target}`}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                            {edge.source.slice(0, 8)}...
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {edge.target.slice(0, 8)}...
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {edge.transactions}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {edge.volume.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
} 