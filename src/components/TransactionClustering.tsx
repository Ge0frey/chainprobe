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
import { Player } from '@lottiefiles/react-lottie-player';

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
  const [minTransactions, setMinTransactions] = useState<number>(0);
  const [minVolume, setMinVolume] = useState<number>(0);
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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
            Transaction Clustering
          </h1>
          <p className="text-muted-foreground">
            Analyze transaction patterns and identify related clusters
          </p>
        </div>

        {/* Search Form */}
        <div className="glass-panel rounded-xl p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Enter wallet address to analyze"
                  className="glass-input"
                />
              </div>
              <div>
                <select
                  value={depth}
                  onChange={handleDepthChange}
                  className="glass-input"
                >
                  <option value="1">Depth: 1</option>
                  <option value="2">Depth: 2</option>
                  <option value="3">Depth: 3</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-solana-purple to-solana-teal text-white rounded-lg font-semibold hover:shadow-glow transition-all"
            >
              Analyze Clusters
            </button>
          </form>
        </div>

        {/* Loading State */}
        {clustersLoading && (
          <div className="flex justify-center items-center py-20">
            <Spinner />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing transaction clusters...</span>
          </div>
        )}

        {/* Results */}
        {!clustersLoading && clusters && clusters.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cluster List */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Identified Clusters</h2>
              <div className="space-y-3">
                {clusters.map((cluster) => (
                  <button
                    key={cluster.id}
                    onClick={() => handleClusterClick(cluster.id)}
                    className={`w-full p-4 rounded-lg transition-all ${
                      selectedCluster === cluster.id
                        ? 'bg-gradient-to-r from-solana-purple/20 to-solana-teal/20 border border-solana-purple/30'
                        : 'hover:bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cluster.label}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSuspicionLevel(cluster.suspiciousScore)}`}>
                        Risk: {(cluster.suspiciousScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {cluster.addresses.length} addresses • {cluster.transactions} transactions
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cluster Visualization */}
            <div className="lg:col-span-2 glass-panel rounded-xl p-6">
              <div className="h-[600px] relative">
                <ClusterVisualization
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={handleNodeClick}
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!clustersLoading && (!clusters || clusters.length === 0) && (
          <div className="text-center py-10">
            <div className="w-32 h-32 mx-auto">
              <Player
                autoplay
                loop
                src="https://assets9.lottiefiles.com/packages/lf20_rbtawnwz.json"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Enter a wallet address to analyze transaction clusters</p>
          </div>
        )}
      </div>
    </div>
  );
} 