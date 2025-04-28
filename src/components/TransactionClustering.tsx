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
import { getComprehensiveRiskAnalysis } from '../services/webacy';
import { WebacyBranding } from './ui/WebacyBranding';

// Enhanced cluster node component with better visuals
const ClusterNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const baseClasses = "px-4 py-2 shadow-md rounded-md border-2 backdrop-blur-sm transition-all duration-300";
  const selectedClasses = selected ? 'ring-2 ring-solana-purple ring-offset-2 transform scale-110' : '';
  
  // Determine style based on node data
  let colorClasses;
  if (data.isSuspicious) {
    colorClasses = 'bg-red-50/90 dark:bg-red-900/80 border-red-500 dark:border-red-400';
  } else if (data.isHighVolume) {
    colorClasses = 'bg-amber-50/90 dark:bg-amber-900/80 border-amber-500 dark:border-amber-400';
  } else if (data.isActive) {
    colorClasses = 'bg-blue-50/90 dark:bg-blue-900/80 border-blue-500 dark:border-blue-400';
  } else {
    colorClasses = 'bg-white/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700';
  }

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${baseClasses} ${colorClasses} ${selectedClasses}`}
    >
      <div className="flex items-center justify-between">
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
              {data.addresses?.length || 0} addresses
            </div>
          </div>
        </div>
        
        {data.suspiciousScore !== undefined && (
          <div className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
               style={{
                 backgroundColor: `rgba(${Math.round(255 * data.suspiciousScore)}, ${Math.round(255 * (1 - data.suspiciousScore))}, 0, 0.2)`,
                 color: `rgb(${Math.round(255 * data.suspiciousScore)}, ${Math.round(255 * (1 - data.suspiciousScore))}, 0)`
               }}>
            {(data.suspiciousScore * 100).toFixed(0)}%
          </div>
        )}
      </div>
      
      {data.volume !== undefined && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <span>Vol: {data.volume.toFixed(2)} SOL</span>
          <span>Tx: {data.transactions}</span>
        </div>
      )}
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

// Enhanced function to display suspicion level
const getSuspicionLevel = (score: number) => {
  if (score < 0.3) return { 
    text: 'Low', 
    color: 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
    description: 'This cluster shows minimal suspicious activity'
  };
  if (score < 0.7) return { 
    text: 'Medium', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300',
    description: 'This cluster shows some patterns that could warrant further investigation'
  };
  return { 
    text: 'High', 
    color: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
    description: 'This cluster shows strong indicators of suspicious activity'
  };
};

export default function TransactionClustering() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [selectedDepth, setSelectedDepth] = useState('basic');
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddresses, setShowAddresses] = useState(false);
  const [clusterStats, setClusterStats] = useState<any>(null);
  
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

  // Add Webacy risk analysis query
  const { 
    data: riskAnalysis, 
    isLoading: riskLoading 
  } = useQuery({
    queryKey: ['risk-analysis', selectedCluster, clusters],
    queryFn: async () => {
      if (!selectedCluster || !clusters) return null;
      const cluster = clusters.find(c => c.id === selectedCluster);
      if (!cluster?.addresses?.[0]) return null;
      // Use the first address in the cluster for risk analysis
      return getComprehensiveRiskAnalysis(cluster.addresses[0]);
    },
    enabled: !!selectedCluster && !!clusters
  });

  // Enhanced effect to transform cluster data into visualization
  useEffect(() => {
    if (!clusters) return;

    // Convert clusters to nodes and edges with improved positioning
    const clusterCount = clusters.length;
    const radius = 250; // Base radius for layout
    
    const newNodes = clusters.map((cluster, index) => {
      // Determine if cluster has suspicious characteristics
      const isSuspicious = cluster.suspiciousScore > 0.7;
      const isHighVolume = cluster.volume > 100; // Arbitrary threshold
      
      // Calculate position in a circular layout
      const angle = (index / clusterCount) * 2 * Math.PI;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      
      return {
        id: cluster.id,
        type: 'cluster',
        position: { x, y },
        data: {
          label: cluster.label || `Cluster ${index + 1}`,
          addresses: cluster.addresses,
          transactions: cluster.transactions,
          volume: cluster.volume,
          suspiciousScore: cluster.suspiciousScore,
          isSuspicious,
          isHighVolume,
          isSelected: cluster.id === selectedCluster
        }
      };
    });

    // Create edges with strength-based styling
    const newEdges = clusters.flatMap(cluster => 
      cluster.relatedClusters.map(related => {
        // Style based on connection strength
        const strokeWidth = 1 + (related.strength * 4); // 1-5px width
        
        // Determine color based on relationship characteristics
        let strokeColor;
        if (related.strength > 0.8) {
          strokeColor = '#ef4444'; // Red for strong connections
        } else if (related.strength > 0.5) {
          strokeColor = '#9945FF'; // Purple for medium connections
        } else {
          strokeColor = '#14F195'; // Teal for weak connections
        }
        
        return {
          id: `${cluster.id}-${related.id}`,
          source: cluster.id,
          target: related.id,
          animated: related.strength > 0.7, // Animate strong connections
          style: {
            stroke: strokeColor,
            strokeWidth,
          },
          label: `${(related.strength * 100).toFixed(0)}%`,
          labelBgStyle: { fill: 'rgba(0, 0, 0, 0.7)', borderRadius: 4 },
          labelStyle: { fill: 'white', fontSize: 10 }
        };
      })
    );

    setNodes(newNodes);
    setEdges(newEdges);
    
    // Also update cluster stats if a cluster is selected
    if (selectedCluster) {
      updateClusterStats(selectedCluster);
    }
  }, [clusters, selectedCluster, setNodes, setEdges]);

  // Function to calculate detailed stats for a selected cluster
  const updateClusterStats = (clusterId: string) => {
    if (!clusters) return;
    
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster) return;
    
    // Calculate volume distribution
    const totalVolume = cluster.volume;
    const avgVolumePerAddress = totalVolume / cluster.addresses.length;
    const avgVolumePerTransaction = totalVolume / cluster.transactions;
    
    // Calculate connection metrics
    const totalConnections = cluster.relatedClusters.length;
    const avgConnectionStrength = cluster.relatedClusters.reduce(
      (sum, rel) => sum + rel.strength, 
      0
    ) / Math.max(totalConnections, 1);
    
    // Calculate strongest connections
    const strongestConnections = [...cluster.relatedClusters]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);
    
    // Set the detailed stats
    setClusterStats({
      totalVolume,
      avgVolumePerAddress,
      avgVolumePerTransaction,
      totalConnections,
      avgConnectionStrength,
      strongestConnections,
      riskLevel: getSuspicionLevel(cluster.suspiciousScore)
    });
  };

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
    updateClusterStats(clusterId);
    setSelectedAddress(null); // Reset selected address
    setShowAddresses(false); // Reset show addresses
  };

  // Get selected cluster details
  const selectedClusterDetails = useMemo(() => {
    if (!selectedCluster || !clusters) return null;
    return clusters.find(cluster => cluster.id === selectedCluster);
  }, [selectedCluster, clusters]);

  // Handler for address selection within a cluster
  const handleAddressClick = (address: string) => {
    setSelectedAddress(address);
  };

  // Toggle display of all addresses in a cluster
  const toggleShowAddresses = () => {
    setShowAddresses(!showAddresses);
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

        {/* Results Section - Enhanced */}
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

            {/* Enhanced Cluster Details */}
            <div className="lg:col-span-1 space-y-6">
              {selectedClusterDetails ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Cluster Details</h2>
                    <WebacyBranding size="md" />
                  </div>
                  
                  {/* Risk assessment section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                      <span className={`font-medium ${
                        (riskAnalysis?.overallRiskScore ?? 0) > 0.7 ? 'text-red-500' : 
                        (riskAnalysis?.overallRiskScore ?? 0) > 0.3 ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {riskAnalysis ? `${(riskAnalysis.overallRiskScore * 100).toFixed(0)}%` : 'Analyzing...'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ 
                          width: `${(riskAnalysis?.overallRiskScore || 0) * 100}%`,
                          background: `linear-gradient(90deg, rgb(20, 241, 149), rgb(255, 159, 28), rgb(239, 68, 68))`
                        }}
                      />
                    </div>
                    {riskAnalysis?.threatRisks?.details && (
                      <div className="mt-2 space-y-2">
                        {riskAnalysis.threatRisks.details.slice(0, 2).map((detail, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              detail.severity === 'high' ? 'bg-red-500' :
                              detail.severity === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <span>{detail.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="glass-card p-3">
                      <div className="text-xs text-muted-foreground mb-1">Addresses</div>
                      <div className="text-lg font-semibold">{selectedClusterDetails.addresses.length}</div>
                    </div>
                    
                    <div className="glass-card p-3">
                      <div className="text-xs text-muted-foreground mb-1">Transactions</div>
                      <div className="text-lg font-semibold">{selectedClusterDetails.transactions}</div>
                    </div>
                    
                    <div className="glass-card p-3">
                      <div className="text-xs text-muted-foreground mb-1">Volume</div>
                      <div className="text-lg font-semibold">{selectedClusterDetails.volume.toFixed(2)} SOL</div>
                    </div>
                    
                    <div className="glass-card p-3">
                      <div className="text-xs text-muted-foreground mb-1">Connections</div>
                      <div className="text-lg font-semibold">{selectedClusterDetails.relatedClusters.length}</div>
                    </div>
                  </div>

                  {/* Detailed metrics */}
                  {clusterStats && (
                    <div className="mb-6 space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Volume Metrics</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg per Address:</span>
                            <span>{clusterStats.avgVolumePerAddress.toFixed(2)} SOL</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg per Transaction:</span>
                            <span>{clusterStats.avgVolumePerTransaction.toFixed(2)} SOL</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Connection Metrics</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg Connection Strength:</span>
                            <span>{(clusterStats.avgConnectionStrength * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address list */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Addresses in Cluster</h3>
                      <button 
                        onClick={toggleShowAddresses}
                        className="text-xs text-solana-purple hover:text-solana-teal transition-colors"
                      >
                        {showAddresses ? 'Show Less' : 'Show All'}
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {(showAddresses 
                        ? selectedClusterDetails.addresses 
                        : selectedClusterDetails.addresses.slice(0, 5)
                      ).map((address: string, index: number) => (
                        <div 
                          key={address}
                          onClick={() => handleAddressClick(address)}
                          className={`flex justify-between items-center p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                            selectedAddress === address 
                              ? 'bg-solana-purple/10 border border-solana-purple/30' 
                              : 'hover:bg-card/50 border border-transparent'
                          }`}
                        >
                          <div className="font-mono truncate mr-2">
                            {address.slice(0, 8)}...{address.slice(-6)}
                          </div>
                          <a 
                            href={`https://solscan.io/account/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-solana-purple hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                      
                      {!showAddresses && selectedClusterDetails.addresses.length > 5 && (
                        <div className="text-center text-xs text-muted-foreground pt-2">
                          +{selectedClusterDetails.addresses.length - 5} more addresses
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Connection details */}
                  {selectedClusterDetails.relatedClusters.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-2">Related Clusters</h3>
                      <div className="space-y-2">
                        {selectedClusterDetails.relatedClusters
                          .sort((a: any, b: any) => b.strength - a.strength)
                          .map((related: any) => {
                            const strengthClass = 
                              related.strength > 0.7 ? 'bg-red-500/20 text-red-500' :
                              related.strength > 0.4 ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-green-500/20 text-green-500';
                            
                            return (
                              <div 
                                key={related.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-card/50 hover:bg-card/70 cursor-pointer transition-colors"
                                onClick={() => handleClusterClick(related.id)}
                              >
                                <span className="text-sm">
                                  {clusters?.find(c => c.id === related.id)?.label || `Cluster ${related.id}`}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${strengthClass}`}>
                                  {(related.strength * 100).toFixed(0)}% connection
                                </span>
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="glass-panel p-6 text-center">
                  <RiGroupLine className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a cluster to view details</p>
                </div>
              )}
              
              {/* Address Details - Show when an address is selected */}
              {selectedAddress && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Address Details</h3>
                  <div className="mb-4">
                    <div className="font-mono text-sm break-all bg-card/50 p-3 rounded-lg">
                      {selectedAddress}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href={`https://solscan.io/account/${selectedAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 bg-solana-purple/10 hover:bg-solana-purple/20 text-solana-purple rounded-lg text-sm transition-colors"
                    >
                      View on Explorer
                    </a>
                    <button
                      onClick={() => setSearchAddress(selectedAddress)}
                      className="flex-1 py-2 bg-solana-teal/10 hover:bg-solana-teal/20 text-solana-teal rounded-lg text-sm transition-colors"
                    >
                      Analyze This Address
                    </button>
                  </div>
                </motion.div>
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