import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  ReactFlowProvider,
  useReactFlow,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  fetchTransactionFlow, 
  TransactionFlow as TxFlow, 
  identifyCriticalPaths,
  CriticalPathData,
  analyzeEntityConnections,
  EntityConnection
} from '../services/solana';
import { Spinner } from './ui/Spinner';
import { 
  RiSearchLine, 
  RiFilter3Line, 
  RiInformationLine,
  RiExchangeLine,
  RiWalletLine,
  RiAlertLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiZoomInLine,
  RiZoomOutLine,
  RiFullscreenLine,
  RiFlowChart,
  RiArrowRightLine,
} from 'react-icons/ri';
import { Player } from '@lottiefiles/react-lottie-player';

// Date filter options
const DATE_FILTER_OPTIONS = [
  { value: 1, label: 'Last 24 hours' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 3 months' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last year' },
];

// Custom node styles with improved visuals
const nodeStyles = {
  exchange: {
    background: 'rgba(251, 191, 36, 0.8)',
    border: '2px solid #f59e0b',
    boxShadow: '0 0 10px rgba(251, 191, 36, 0.4)'
  },
  highRisk: {
    background: 'rgba(239, 68, 68, 0.8)',
    border: '2px solid #dc2626',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
  },
  center: {
    background: 'rgba(153, 69, 255, 0.8)',
    border: '2px solid #7c3aed',
    boxShadow: '0 0 10px rgba(153, 69, 255, 0.4)'
  },
  wallet: {
    background: 'rgba(20, 241, 149, 0.8)',
    border: '2px solid #06b6d4',
    boxShadow: '0 0 10px rgba(20, 241, 149, 0.4)'
  },
  default: {
    background: 'rgba(100, 116, 139, 0.8)',
    border: '2px solid #475569',
    boxShadow: '0 0 5px rgba(100, 116, 139, 0.4)'
  },
};

// Improved CustomNode component with animations and better tooltip
const CustomNode = ({ data }: { data: any }) => {
  let style;
  if (data.isExchange) {
    style = nodeStyles.exchange;
  } else if (data.isHighRisk) {
    style = nodeStyles.highRisk;
  } else if (data.isCenter) {
    style = nodeStyles.center;
  } else if (data.type === 'wallet') {
    style = nodeStyles.wallet;
  } else {
    style = nodeStyles.default;
  }

  return (
    <motion.div 
      className="group relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium min-w-[150px] backdrop-blur-sm"
        style={style}
      >
        <div className="truncate">{data.label}</div>
        {data.amount && (
          <div className="text-xs opacity-80 mt-1">
            {data.amount.toFixed(2)} SOL
          </div>
        )}
      </div>
      
      {/* Enhanced tooltip */}
      <div className="absolute hidden group-hover:block z-50 bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-lg shadow-xl -translate-y-full left-1/2 -translate-x-1/2 mb-2 min-w-[220px] border border-gray-700">
        <div className="text-sm font-medium mb-2 border-b border-gray-700 pb-2">{data.fullAddress || data.label}</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Total Volume:</span>
            <span>{data.amount?.toFixed(2)} SOL</span>
          </div>
          <div className="flex justify-between">
            <span>Transaction Count:</span>
            <span>{data.transactionCount || 0}</span>
          </div>
          {data.type && (
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="capitalize">{data.type}</span>
            </div>
          )}
          {data.riskScore !== undefined && (
            <div className="flex justify-between">
              <span>Risk Score:</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-700 rounded-full h-1 mr-2">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-red-500"
                    style={{ width: `${data.riskScore * 100}%` }}
                  />
                </div>
                <span className={data.riskScore > 0.7 ? 'text-red-400' : data.riskScore > 0.4 ? 'text-yellow-400' : 'text-green-400'}>
                  {(data.riskScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
          {data.correlations && data.correlations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="font-medium mb-1">Top Correlations:</div>
              {data.correlations.map((corr: any, index: number) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="truncate">{corr.address.slice(0, 6)}...</span>
                  <span>{(corr.strength * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 border-r border-b border-gray-700"></div>
      </div>
    </motion.div>
  );
};

// Enhanced edge styles with more visual distinction
const edgeStyles = {
  critical: {
    stroke: '#ef4444',
    strokeWidth: 3,
    strokeDasharray: '5,5',
  },
  highVolume: {
    stroke: '#3b82f6',
    strokeWidth: 2.5,
  },
  frequent: {
    stroke: '#8b5cf6',
    strokeWidth: 2,
  },
  suspicious: {
    stroke: '#f59e0b',
    strokeWidth: 2,
    strokeDasharray: '3,3',
  },
  default: {
    stroke: 'rgba(148, 163, 184, 0.7)',
    strokeWidth: 1.5,
  },
};

// Enhanced flow control panel
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
  <div className="absolute top-4 right-4 flex space-x-2 z-10">
    <button
      onClick={onZoomIn}
      className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title="Zoom In"
    >
      <RiZoomInLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
    <button
      onClick={onZoomOut}
      className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title="Zoom Out"
    >
      <RiZoomOutLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
    <button
      onClick={onFitView}
      className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title="Fit View"
    >
      <RiFlowChart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
    <button
      onClick={onToggleFullscreen}
      className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      <RiFullscreenLine className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
  </div>
);

export default function TransactionFlow() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<number>(30);
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [flowData, setFlowData] = useState<TxFlow | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();

  // Helper function to calculate risk score
  const calculateRiskScore = (address: string, transactions: any[]) => {
    let score = 0;
    
    // High frequency of transactions
    if (transactions.length > 10) score += 0.2;
    
    // Large total volume
    const volume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    if (volume > 100) score += 0.3;
    
    // Circular transactions
    const hasCircular = transactions.some(tx => 
      transactions.find(t => t.from === tx.to && t.to === tx.from)
    );
    if (hasCircular) score += 0.3;
    
    // Multiple small transactions
    const smallTxCount = transactions.filter(tx => tx.amount < 0.1).length;
    if (smallTxCount > 5) score += 0.2;
    
    return Math.min(score, 1);
  };

  // Helper function to identify suspicious transactions
  const isSuspiciousTransaction = (tx: any) => {
    // Check for common suspicious patterns
    const isSmallAmount = tx.amount < 0.1;
    const hasCircular = transactions?.some(t => 
      t.from === tx.to && t.to === tx.from && 
      Math.abs(t.blockTime - tx.blockTime) < 3600 // Within 1 hour
    );
    const isHighFrequency = transactions?.filter(t => 
      t.from === tx.from && t.to === tx.to &&
      Math.abs(t.blockTime - tx.blockTime) < 3600
    ).length > 3;

    return isSmallAmount || hasCircular || isHighFrequency;
  };

  // Fetch transaction flow data
  const { 
    data: transactions, 
    isLoading: txLoading,
    error: txError,
  } = useQuery({
    queryKey: ['transaction-flow', currentAddress, dateFilter],
    queryFn: () => currentAddress ? fetchTransactionFlow(currentAddress, dateFilter) : null,
    enabled: !!currentAddress,
  });

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    reactFlowInstance.zoomIn();
  };

  const handleZoomOut = () => {
    reactFlowInstance.zoomOut();
  };

  const handleFitView = () => {
    reactFlowInstance.fitView();
  };

  // Transform data for React Flow with enhanced positioning algorithm
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    if (!transactions) return { nodes: [], edges: [] };

    const nodeMap = new Map();
    const nodes = [];
    const edges = [];
    
    // Calculate transaction frequencies and volumes
    const txFrequency = new Map();
    const txVolumes = new Map();
    const addressPairs = new Map();

    transactions.forEach(tx => {
      // Track frequency between address pairs
      const pairKey = `${tx.from}|${tx.to}`;
      txFrequency.set(pairKey, (txFrequency.get(pairKey) || 0) + 1);
      txVolumes.set(pairKey, (txVolumes.get(pairKey) || 0) + tx.amount);

      // Track address correlations
      if (!addressPairs.has(tx.from)) {
        addressPairs.set(tx.from, new Map());
      }
      if (!addressPairs.has(tx.to)) {
        addressPairs.set(tx.to, new Map());
      }
      
      const fromPairs = addressPairs.get(tx.from);
      fromPairs.set(tx.to, (fromPairs.get(tx.to) || 0) + 1);
      
      const toPairs = addressPairs.get(tx.to);
      toPairs.set(tx.from, (toPairs.get(tx.from) || 0) + 1);
    });

    // Calculate correlation strengths
    const correlations = new Map();
    addressPairs.forEach((pairs, address) => {
      const totalTx = Array.from(pairs.values()).reduce((sum, count) => sum + count, 0);
      const addressCorrelations = Array.from(pairs.entries())
        .map(([target, count]) => ({
          address: target,
          strength: count / totalTx
        }))
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 3); // Top 3 correlations
      
      correlations.set(address, addressCorrelations);
    });

    // Identify unique source and target addresses
    const sourceNodes = new Set(transactions.map(tx => tx.from));
    const targetNodes = new Set(transactions.map(tx => tx.to));
    const allAddresses = new Set([...sourceNodes, ...targetNodes]);
    
    // Remove center node from allAddresses
    if (currentAddress) {
      allAddresses.delete(currentAddress);
    }
    
    // Use force-directed positioning for better visualization
    const nodePositions = calculateNodePositions(
      allAddresses, 
      transactions, 
      currentAddress,
      { width: 800, height: 600 }
    );

    // Add center node (target wallet)
    if (currentAddress) {
      const centerPos = { x: 400, y: 300 };
      const centerTxs = transactions;
      nodeMap.set(currentAddress, {
        id: currentAddress,
        type: 'custom',
        position: centerPos,
        data: {
          label: 'Target Wallet',
          fullAddress: currentAddress,
          isCenter: true,
          amount: centerTxs.reduce((sum, tx) => sum + tx.amount, 0),
          transactionCount: centerTxs.length,
          correlations: correlations.get(currentAddress) || [],
          type: 'center'
        },
      });
      nodes.push(nodeMap.get(currentAddress));
    }

    // Add all other nodes
    allAddresses.forEach((address) => {
      if (!nodeMap.has(address)) {
        const pos = nodePositions.get(address) || { x: 0, y: 0 };
        const addressTxs = transactions.filter(tx => tx.from === address || tx.to === address);
        const volume = addressTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const riskScore = calculateRiskScore(address, addressTxs);
        
        // Determine if address is exchange or high risk
        const isExchange = address.endsWith('...') || riskScore < 0.3; // This is a placeholder logic
        const isHighRisk = riskScore > 0.7;
        
        nodeMap.set(address, {
          id: address,
          type: 'custom',
          position: pos,
          data: {
            label: address.slice(0, 6) + '...' + address.slice(-4),
            fullAddress: address,
            isExchange,
            isHighRisk,
            amount: volume,
            transactionCount: addressTxs.length,
            correlations: correlations.get(address) || [],
            type: isExchange ? 'exchange' : 'wallet',
            riskScore
          },
        });
        nodes.push(nodeMap.get(address));
      }
    });

    // Create edges with enhanced styling
    transactions.forEach((tx, index) => {
      const pairKey = `${tx.from}|${tx.to}`;
      const frequency = txFrequency.get(pairKey);
      const volume = txVolumes.get(pairKey);
      
      // Determine edge style based on patterns
      let style = edgeStyles.default;
      let animated = false;
      
      if (volume > 10) { // High volume threshold
        style = edgeStyles.highVolume;
        animated = true;
      } else if (frequency > 3) { // Frequent transactions
        style = edgeStyles.frequent;
        animated = true;
      }
      
      // Check for suspicious patterns
      if (isSuspiciousTransaction(tx)) {
        style = edgeStyles.suspicious;
        animated = true;
      }

      // Edge with improved label
      edges.push({
        id: `e-${tx.signature || index}`,
        source: tx.from,
        target: tx.to,
        animated,
        style,
        label: `${tx.amount.toFixed(2)} SOL`,
        data: {
          frequency,
          volume,
          signature: tx.signature,
          timestamp: tx.timestamp
        },
        labelStyle: { fill: '#fff', fontWeight: 500 },
        labelBgStyle: { fill: 'rgba(30, 41, 59, 0.7)', fillOpacity: 0.7, rx: 4, ry: 4 },
        markerEnd: {
          type: 'arrowclosed',
          color: style.stroke,
          width: 20,
          height: 20,
        },
      });
    });

    return { nodes, edges };
  }, [transactions, currentAddress]);

  // Function to calculate positions for nodes using a basic force-directed approach
  const calculateNodePositions = (
    addresses: Set<string>, 
    transactions: TxFlow[], 
    centerAddress: string | null,
    dimensions: { width: number, height: number }
  ) => {
    const positions = new Map();
    const addressArray = Array.from(addresses);
    
    // Create initial positions based on transaction relationships
    addressArray.forEach((address, index) => {
      // Basic circular layout
      const angle = (index / addressArray.length) * 2 * Math.PI;
      const radius = 300;
      
      // Determine if this is mainly a source or target address
      const outgoingCount = transactions.filter(tx => tx.from === address).length;
      const incomingCount = transactions.filter(tx => tx.to === address).length;
      
      // Position sources more to the left, targets to the right
      let x, y;
      
      if (outgoingCount > incomingCount) {
        // Source node - position on the left side
        x = dimensions.width / 2 - radius * Math.cos(angle);
        y = dimensions.height / 2 + radius * Math.sin(angle);
      } else {
        // Target node - position on the right side
        x = dimensions.width / 2 + radius * Math.cos(angle);
        y = dimensions.height / 2 + radius * Math.sin(angle);
      }
      
      positions.set(address, { x, y });
    });
    
    return positions;
  };

  // Handle node click - select/deselect node
  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(selectedNode === node.id ? null : node.id);
  };

  // Update flow when data changes
  useEffect(() => {
    if (flowNodes && flowEdges) {
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
            Transaction Flow Analysis
          </h1>
          <p className="text-muted-foreground">
            Visualize and analyze the flow of funds between wallets on Solana
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={onSearch} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter wallet address to analyze"
              className="flex-1 glass-input"
            />
            <div className="flex gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(Number(e.target.value))}
                className="glass-input w-40"
              >
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-solana-purple to-solana-teal text-white rounded-lg font-semibold hover:shadow-glow transition-all"
              >
                Analyze
              </button>
            </div>
          </div>
        </form>

        {/* Loading State */}
        {txLoading && (
          <div className="flex justify-center items-center py-20">
            <Spinner />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing transaction flow...</span>
          </div>
        )}

        {/* Error State */}
        {txError && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-600 mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-3"
          >
            <div className="bg-red-100 dark:bg-red-800/30 p-2 rounded-full">
              <RiAlertLine className="text-red-600 dark:text-red-400 text-xl" />
            </div>
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-300">Error</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {txError instanceof Error ? txError.message : 'An error occurred'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Flow Visualization - enhanced */}
        {!txLoading && !txError && transactions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Flow</h2>
              <div className="flex items-center gap-4">
                {selectedNode && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Selected:</span> {selectedNode.slice(0, 6)}...{selectedNode.slice(-4)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="h-[600px] relative">
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={{ custom: CustomNode }}
                  onNodeClick={onNodeClick}
                  fitView
                >
                  <Background color="#94a3b8" variant="dots" />
                  <Controls />
                  <MiniMap 
                    nodeColor={node => {
                      if (node.data.isCenter) return '#9945FF';
                      if (node.data.isHighRisk) return '#ef4444';
                      if (node.data.isExchange) return '#f59e0b';
                      return '#64748b';
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                  />
                  <FlowControls 
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitView={handleFitView}
                    onToggleFullscreen={toggleFullscreen}
                    isFullscreen={isFullscreen}
                  />
                </ReactFlow>
              </ReactFlowProvider>
            </div>
          </motion.div>
        )}

        {/* Transaction Details - new section when a node is selected */}
        {selectedNode && !txLoading && !txError && transactions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl p-6 mt-6"
          >
            <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>
            
            <div className="space-y-4">
              {/* Filter transactions for selected node */}
              {transactions
                .filter(tx => tx.from === selectedNode || tx.to === selectedNode)
                .slice(0, 5) // Show only the first 5 for brevity
                .map((tx, index) => (
                  <div 
                    key={tx.signature || index}
                    className="p-4 bg-card/30 rounded-lg border border-border"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {tx.from === selectedNode ? (
                          <RiArrowRightLine className="text-red-500" />
                        ) : (
                          <RiArrowRightLine className="text-green-500" />
                        )}
                        <span className="text-sm font-medium">
                          {tx.from === selectedNode ? 'Outgoing' : 'Incoming'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">From</span>
                        <span className="font-mono">{tx.from.slice(0, 8)}...{tx.from.slice(-6)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-xs">To</span>
                        <span className="font-mono">{tx.to.slice(0, 8)}...{tx.to.slice(-6)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
                      <span className={`text-sm font-medium ${tx.from === selectedNode ? 'text-red-500' : 'text-green-500'}`}>
                        {tx.amount.toFixed(2)} SOL
                      </span>
                      <a 
                        href={`https://solscan.io/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-solana-purple hover:underline"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                ))}
                
              {/* Show more link if there are more than 5 transactions */}
              {transactions.filter(tx => tx.from === selectedNode || tx.to === selectedNode).length > 5 && (
                <button className="w-full py-2 text-sm text-center text-solana-purple hover:text-solana-teal transition-colors">
                  View all transactions
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!txLoading && !txError && !transactions && (
          <div className="text-center py-10">
            <div className="glass-panel rounded-xl p-8">
              <RiFlowChart className="text-solana-purple/50 text-6xl mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Enter a wallet address to visualize transaction flow</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 