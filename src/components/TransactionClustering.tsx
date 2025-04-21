import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MiniMap,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { 
  clusterTransactions, 
  TransactionCluster, 
  fetchEntityLabels,
  analyzeEntityConnections,
  EntityConnection
} from '../services/solana';
import { Spinner } from './ui/Spinner';
import {
  RiFilter3Line,
  RiZoomInLine,
  RiZoomOutLine,
  RiFullscreenLine,
  RiNodeTree,
  RiAlertLine,
  RiExchangeLine,
  RiGroupLine,
  RiFlowChart
} from 'react-icons/ri';

// Custom node for clusters
const ClusterNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const nodeClasses = `px-4 py-2 shadow-md rounded-md border-2 backdrop-blur-sm transition-all duration-300 ${
    selected ? 'ring-2 ring-solana-purple ring-offset-2 scale-110' : ''
  } ${
    data.isSuspicious 
      ? 'bg-red-50/90 dark:bg-red-900/80 border-red-500 dark:border-red-400'
      : data.isHighVolume 
        ? 'bg-amber-50/90 dark:bg-amber-900/80 border-amber-500 dark:border-amber-400'
        : 'bg-white/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
  }`;

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={nodeClasses}
    >
      <div className="flex items-center">
        {data.isSuspicious && (
          <RiAlertLine className="mr-2 text-red-500" />
        )}
        {data.isHighVolume && !data.isSuspicious && (
          <RiExchangeLine className="mr-2 text-amber-500" />
        )}
        {!data.isSuspicious && !data.isHighVolume && (
          <RiGroupLine className="mr-2 text-gray-500" />
        )}
        <div>
          <div className="font-bold text-sm text-gray-900 dark:text-white">
            {data.label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {data.addresses.length} addresses
          </div>
          {data.stats && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <div>Vol: {data.stats.volume.toFixed(2)} SOL</div>
              <div>Tx: {data.stats.transactions}</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Flow Controls Panel
const FlowControls = ({ 
  onZoomIn, 
  onZoomOut, 
  onFitView, 
  onToggleFullscreen,
  isFullscreen 
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}) => (
  <Panel position="top-right" className="flex space-x-2">
    <button
      onClick={onZoomIn}
      className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
      title="Zoom In"
    >
      <RiZoomInLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
    <button
      onClick={onZoomOut}
      className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
      title="Zoom Out"
    >
      <RiZoomOutLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
    <button
      onClick={onFitView}
      className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
      title="Fit View"
    >
      <RiNodeTree className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
    <button
      onClick={onToggleFullscreen}
      className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      <RiFullscreenLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
  </Panel>
);

// Flow visualization component
function ClusterVisualization({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const nodeTypes = useMemo(() => ({ cluster: ClusterNode }), []);

  return (
    <div className="h-[600px] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={node => {
            if (node.data.isSuspicious) return '#ef4444';
            if (node.data.isHighVolume) return '#f59e0b';
            return '#64748b';
          }}
        />
        <FlowControls
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitView={() => fitView()}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      </ReactFlow>
    </div>
  );
}

// Add this helper function at the top level
const getSuspicionLevel = (score: number) => {
  if (score < 0.3) return { text: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' };
  if (score < 0.7) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' };
  return { text: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' };
};

export default function TransactionClustering() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [depth, setDepth] = useState<number>(1);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [minTransactions, setMinTransactions] = useState<number>(5);
  const [minVolume, setMinVolume] = useState<number>(1);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

  // Transform clusters into nodes and edges for visualization
  useMemo(() => {
    if (!clusters) return;

    const filteredClusters = clusters.filter(cluster => 
      cluster.transactions >= minTransactions &&
      cluster.volume >= minVolume
    );

    const nodes = filteredClusters.map((cluster, index) => ({
      id: cluster.id,
      type: 'cluster',
      position: {
        x: Math.cos(index * (2 * Math.PI / filteredClusters.length)) * 300,
        y: Math.sin(index * (2 * Math.PI / filteredClusters.length)) * 300
      },
      data: {
        label: cluster.label,
        addresses: cluster.addresses,
        isSuspicious: cluster.suspiciousScore > 0.7,
        isHighVolume: cluster.volume > 100,
        stats: {
          volume: cluster.volume,
          transactions: cluster.transactions
        }
      }
    }));

    const edges = filteredClusters.flatMap(cluster => 
      cluster.relatedClusters
        .filter(related => related.strength > 0.1)
        .map(related => ({
          id: `${cluster.id}-${related.id}`,
          source: cluster.id,
          target: related.id,
          animated: related.strength > 0.5,
          style: {
            stroke: related.strength > 0.5 ? '#f59e0b' : '#94a3b8',
            strokeWidth: related.strength * 3
          }
        }))
    );

    setNodes(nodes);
    setEdges(edges);
  }, [clusters, minTransactions, minVolume]);

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

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedCluster(node.id);
  }, []);

  // Get details for a selected cluster
  const selectedClusterData = selectedCluster && clusters 
    ? clusters.find((c: TransactionCluster) => c.id === selectedCluster) 
    : null;

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Transaction Clustering
          </h2>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <select
                  id="depth"
                  value={depth}
                  onChange={handleDepthChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value={1}>Level 1 - Basic</option>
                  <option value={2}>Level 2 - Deep</option>
                  <option value={3}>Level 3 - Advanced</option>
                </select>
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
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <RiFilter3Line className="w-5 h-5 mr-1" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {showFilters && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Min Transactions
                  </label>
                  <input
                    type="number"
                    value={minTransactions}
                    onChange={(e) => setMinTransactions(Number(e.target.value))}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Min Volume (SOL)
                  </label>
                  <input
                    type="number"
                    value={minVolume}
                    onChange={(e) => setMinVolume(Number(e.target.value))}
                    min="0"
                    step="0.1"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Visualization and Details */}
      {clustersLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
          <p className="ml-3 text-gray-500 dark:text-gray-400">Analyzing transaction patterns...</p>
        </div>
      ) : clusters && clusters.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cluster Visualization */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <ReactFlowProvider>
              <ClusterVisualization
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
              />
            </ReactFlowProvider>
          </div>

          {/* Cluster Details */}
          <div className="lg:col-span-1">
            {selectedClusterData ? (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedClusterData.label}
                    </h3>
                    {selectedClusterData.suspiciousScore > 0.5 && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                        High Risk Cluster
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

                  {/* Risk Assessment */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Risk Assessment</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Suspicion Level</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSuspicionLevel(selectedClusterData.suspiciousScore).color}`}>
                        {getSuspicionLevel(selectedClusterData.suspiciousScore).text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2.5 rounded-full" 
                        style={{ width: `${selectedClusterData.suspiciousScore * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Addresses in Cluster */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Addresses in Cluster</h4>
                    <div className="max-h-48 overflow-y-auto">
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
                            <tr key={address} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white truncate">
                                {address.slice(0, 4)}...{address.slice(-4)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {address === currentAddress ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                    Central
                                  </span>
                                ) : 'Related'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Related Clusters */}
                  {selectedClusterData.relatedClusters.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Related Clusters</h4>
                      <div className="space-y-2">
                        {selectedClusterData.relatedClusters.map((related) => {
                          const relatedCluster = clusters?.find(c => c.id === related.id);
                          if (!relatedCluster) return null;
                          
                          return (
                            <div 
                              key={related.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                              onClick={() => handleClusterClick(related.id)}
                            >
                              <span className="text-sm text-gray-900 dark:text-white">
                                {relatedCluster.label}
                              </span>
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${related.strength * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {Math.round(related.strength * 100)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suspicious Activity Warning */}
                  {selectedClusterData.suspiciousScore > 0.5 && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                      <div className="flex">
                        <RiAlertLine className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            Suspicious Activity Detected
                          </h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <p>This cluster exhibits patterns that may indicate suspicious activity:</p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              {selectedClusterData.volume > 100 && (
                                <li>High transaction volume ({selectedClusterData.volume.toFixed(2)} SOL)</li>
                              )}
                              {selectedClusterData.transactions > 50 && (
                                <li>Unusual number of transactions ({selectedClusterData.transactions})</li>
                              )}
                              {selectedClusterData.relatedClusters.length > 5 && (
                                <li>Multiple cluster connections ({selectedClusterData.relatedClusters.length} clusters)</li>
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
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="text-center">
                  <RiFlowChart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Cluster Selected</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Click on a cluster in the visualization to view its details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
} 