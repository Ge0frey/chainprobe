import { useState, useCallback, useMemo, useEffect } from 'react';
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
  const [selectedDepth, setSelectedDepth] = useState('basic');
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  
  // Replace useState with useNodesState and useEdgesState
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Query for fetching cluster data
  const { 
    data: clusters, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['transaction-clusters', currentAddress, selectedDepth],
    queryFn: () => currentAddress ? clusterTransactions(
      currentAddress, 
      selectedDepth === 'advanced' ? 3 : selectedDepth === 'medium' ? 2 : 1
    ) : null,
    enabled: !!currentAddress
  });

  // Transform clusters into nodes and edges for visualization
  useEffect(() => {
    if (!clusters) return;

    const newNodes = clusters.map((cluster, index) => ({
      id: cluster.id,
      type: 'default',
      position: {
        x: Math.cos(index * (2 * Math.PI / clusters.length)) * 300,
        y: Math.sin(index * (2 * Math.PI / clusters.length)) * 300
      },
      data: {
        label: `Cluster ${index + 1}`,
        addresses: cluster.addresses,
        transactions: cluster.transactions,
        volume: cluster.volume,
        suspiciousScore: cluster.suspiciousScore
      }
    }));

    const newEdges = clusters.flatMap(cluster => 
      cluster.relatedClusters.map(related => ({
        id: `${cluster.id}-${related.id}`,
        source: cluster.id,
        target: related.id,
        animated: related.strength > 0.5,
        style: {
          stroke: related.strength > 0.5 ? '#9945FF' : '#14F195',
          strokeWidth: related.strength * 3
        }
      }))
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [clusters, setNodes, setEdges]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
      setSelectedCluster(null); // Reset selected cluster when searching new address
    }
  };

  const handleDepthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepth(e.target.value);
  };

  const handleClusterClick = (clusterId: string) => {
    setSelectedCluster(clusterId);
  };

  // Get selected cluster details
  const selectedClusterDetails = useMemo(() => {
    if (!selectedCluster || !clusters) return null;
    return clusters.find(cluster => cluster.id === selectedCluster);
  }, [selectedCluster, clusters]);

  // Function to get badge color based on risk score
  const getRiskBadgeColor = (score: number) => {
    if (score >= 0.7) return 'bg-red-500/20 text-red-500 border-red-500/20';
    if (score >= 0.4) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
    return 'bg-green-500/20 text-green-500 border-green-500/20';
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
            Transaction Clustering
          </h1>
          <p className="text-muted-foreground">
            Analyze transaction patterns and identify related address clusters
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter wallet address to analyze"
              className="flex-1 glass-input"
            />
            <select
              value={selectedDepth}
              onChange={handleDepthChange}
              className="glass-input md:w-48"
            >
              <option value="basic">Basic Analysis</option>
              <option value="medium">Medium Analysis</option>
              <option value="advanced">Advanced Analysis</option>
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-solana-purple to-solana-teal text-white rounded-lg font-semibold hover:shadow-glow transition-all"
            >
              Analyze Clusters
            </button>
          </div>
        </form>

        {/* Results Section */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            Error: {error instanceof Error ? error.message : 'An error occurred'}
          </div>
        ) : clusters && clusters.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flow Visualization */}
            <div className="lg:col-span-2 glass-panel p-6">
              <ReactFlowProvider>
                <ClusterVisualization
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={(_, node) => handleClusterClick(node.id)}
                />
              </ReactFlowProvider>
            </div>

            {/* Cluster Details */}
            <div className="lg:col-span-1">
              {selectedClusterDetails ? (
                <div className="glass-panel p-6">
                  <h2 className="text-xl font-semibold mb-4">Cluster Details</h2>
                  
                  {/* Risk Score */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                      <span className={`px-2 py-1 rounded-full text-sm border ${getRiskBadgeColor(selectedClusterDetails.suspiciousScore)}`}>
                        {(selectedClusterDetails.suspiciousScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-solana-purple to-solana-teal transition-all duration-300"
                        style={{ width: `${selectedClusterDetails.suspiciousScore * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Cluster Stats */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Cluster Size</h3>
                      <p className="text-lg font-semibold">{selectedClusterDetails.addresses.length} addresses</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Transaction Volume</h3>
                      <p className="text-lg font-semibold">{selectedClusterDetails.transactions} transactions</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Volume</h3>
                      <p className="text-lg font-semibold">{selectedClusterDetails.volume.toFixed(2)} SOL</p>
                    </div>

                    {/* Related Clusters */}
                    {selectedClusterDetails.relatedClusters.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Related Clusters</h3>
                        <div className="space-y-2">
                          {selectedClusterDetails.relatedClusters.map(related => (
                            <div 
                              key={related.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-card/50"
                            >
                              <span className="text-sm">Cluster #{related.id}</span>
                              <span className="text-sm text-muted-foreground">
                                {(related.strength * 100).toFixed(0)}% strength
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-6 text-center">
                  <RiGroupLine className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a cluster to view details</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="glass-panel rounded-xl p-8">
              <RiGroupLine className="text-solana-purple/50 text-6xl mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Enter a wallet address to analyze transaction clusters
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 