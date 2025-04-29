import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Edge,
  Viewport,
  BackgroundVariant,
  MarkerType,
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
  RiArrowLeftLine,
  RiCloseLine,
} from 'react-icons/ri';
import { Player } from '@lottiefiles/react-lottie-player';

// Helper function to shorten addresses
const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

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

// Enhanced edge styles with more visual distinction and direction indicators
const edgeStyles = {
  critical: {
    stroke: '#ef4444',
    strokeWidth: 3,
    animated: true,
    style: {
      strokeDasharray: '5,5',
    }
  },
  highVolume: {
    stroke: '#3b82f6',
    strokeWidth: 2.5,
    animated: true,
  },
  incoming: {
    stroke: '#14F195', // Solana teal for incoming
    strokeWidth: 2,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#14F195',
    },
  },
  outgoing: {
    stroke: '#9945FF', // Solana purple for outgoing
    strokeWidth: 2,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#9945FF',
    },
  },
  default: {
    stroke: 'rgba(148, 163, 184, 0.7)',
    strokeWidth: 1.5,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'rgba(148, 163, 184, 0.7)',
    },
  },
};

// Enhanced CustomNode component with better tooltip
const CustomNode = ({ data }: { data: any }) => {
  const nodeStyle = useMemo(() => {
    if (data.isExchange) return nodeStyles.exchange;
    if (data.isHighRisk) return nodeStyles.highRisk;
    if (data.isCenter) return nodeStyles.center;
    if (data.type === 'wallet') return nodeStyles.wallet;
    return nodeStyles.default;
  }, [data]);

  return (
    <motion.div 
      className="group relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium min-w-[150px] backdrop-blur-sm"
        style={nodeStyle}
      >
        <div className="truncate">{data.label}</div>
        {data.amount && (
          <div className="text-xs opacity-80 mt-1">
            {data.amount.toFixed(2)} SOL
          </div>
        )}
      </div>
      
      {/* Enhanced tooltip */}
      <div className="absolute hidden group-hover:block z-50 bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-lg shadow-xl -translate-y-full left-1/2 -translate-x-1/2 mb-2 min-w-[250px] border border-gray-700">
        <div className="text-sm font-medium mb-2 border-b border-gray-700 pb-2">
          {data.fullAddress || data.label}
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span>Transactions</span>
            <div className="flex gap-4">
              <span className="flex items-center text-solana-purple">
                <RiArrowRightLine className="mr-1" />
                {data.outgoingCount || 0}
              </span>
              <span className="flex items-center text-solana-teal">
                <RiArrowLeftLine className="mr-1" />
                {data.incomingCount || 0}
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span>Total Volume</span>
            <span>{data.totalVolume?.toFixed(2) || 0} SOL</span>
          </div>
          {data.lastActivity && (
            <div className="flex justify-between">
              <span>Last Activity</span>
              <span>{format(new Date(data.lastActivity), 'MMM d, yyyy')}</span>
            </div>
          )}
          {data.type && (
            <div className="flex justify-between">
              <span>Type</span>
              <span className="capitalize">{data.type}</span>
            </div>
          )}
        </div>
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 border-r border-b border-gray-700"></div>
      </div>
    </motion.div>
  );
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

// Flow visualization component that uses the ReactFlow hooks
function FlowVisualization({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  selectedNode
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  selectedNode: Node | null;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
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

  return (
    <div className="w-full h-[700px] relative bg-gray-900/30 backdrop-blur-sm rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={{ custom: CustomNode }}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} color="#94a3b8" />
        <Controls className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-lg shadow-lg" />
        <MiniMap 
          nodeColor={node => {
            if (node.data.isCenter) return '#9945FF';
            if (node.data.isHighRisk) return '#ef4444';
            if (node.data.isExchange) return '#f59e0b';
            return '#64748b';
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
          className="bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg"
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

// Node Details Panel Component
const NodeDetailsPanel = ({ node, transactions, onClose }: { 
  node: Node | null;
  transactions: any[];
  onClose: () => void;
}) => {
  if (!node) return null;

  const nodeTransactions = transactions.filter(
    tx => tx.from === node.id || tx.to === node.id
  );

  const stats = {
    totalVolume: nodeTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    outgoing: nodeTransactions.filter(tx => tx.from === node.id),
    incoming: nodeTransactions.filter(tx => tx.to === node.id),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="glass-panel rounded-xl p-6 mt-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Address Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RiCloseLine className="text-xl" />
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Volume</div>
          <div className="text-lg font-semibold mt-1">{stats.totalVolume.toFixed(2)} SOL</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Outgoing</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-semibold">{stats.outgoing.length}</span>
            <span className="text-sm text-gray-500">txns</span>
            <span className="text-sm text-solana-purple ml-2">
              {stats.outgoing.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)} SOL
            </span>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Incoming</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-semibold">{stats.incoming.length}</span>
            <span className="text-sm text-gray-500">txns</span>
            <span className="text-sm text-solana-teal ml-2">
              {stats.incoming.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)} SOL
            </span>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Transactions</h3>
        <div className="space-y-3">
          {nodeTransactions.slice(0, 5).map((tx, index) => (
            <div 
              key={index}
              className="glass-card p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {tx.from === node.id ? (
                    <RiArrowRightLine className="text-solana-purple" />
                  ) : (
                    <RiArrowLeftLine className="text-solana-teal" />
                  )}
                  <span className="text-sm font-medium">
                    {tx.from === node.id ? 'Outgoing' : 'Incoming'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(tx.timestamp * 1000), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">From</span>
                  <span className="font-mono">{tx.from.slice(0, 8)}...{tx.from.slice(-6)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-gray-500 text-xs">To</span>
                  <span className="font-mono">{tx.to.slice(0, 8)}...{tx.to.slice(-6)}</span>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className={`text-sm font-medium ${
                  tx.from === node.id ? 'text-solana-purple' : 'text-solana-teal'
                }`}>
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
        </div>
        
        {nodeTransactions.length > 5 && (
          <button className="w-full py-2 text-sm text-center text-solana-purple hover:text-solana-teal transition-colors">
            View all transactions
          </button>
        )}
      </div>
    </motion.div>
  );
};

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
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const containerStyle = {
    width: '100%',
    height: '700px',
    background: 'rgba(13, 17, 23, 0.7)',
    backdropFilter: 'blur(8px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  // Default viewport configuration
  const defaultViewport: Viewport = {
    x: 0,
    y: 0,
    zoom: 0.8,
  };

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

  // Function to calculate positions for nodes using a basic force-directed approach
  const calculateNodePositions = (
    addresses: Set<string>, 
    transactions: TxFlow[], 
    centerAddress: string | null,
    dimensions: { width: number, height: number }
  ) => {
    const positions = new Map();
    const addressArray = Array.from(addresses);
    
    // Center point
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // Calculate base radius based on number of nodes
    const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.3;
    
    // Create initial positions based on transaction relationships
    addressArray.forEach((address, index) => {
      // Determine if this is mainly a source or target address
      const outgoingCount = transactions.filter(tx => tx.from === address).length;
      const incomingCount = transactions.filter(tx => tx.to === address).length;
      
      // Calculate angle based on index and total nodes
      const angle = (index / addressArray.length) * 2 * Math.PI;
      
      // Adjust radius based on transaction volume
      const txVolume = transactions
        .filter(tx => tx.from === address || tx.to === address)
        .reduce((sum, tx) => sum + tx.amount, 0);
      const radiusAdjustment = Math.min(Math.log10(txVolume + 1) * 20, 100);
      
      // Position nodes in a spiral pattern
      const radius = baseRadius + (index * 10) + radiusAdjustment;
      
      // Calculate position with offset based on transaction direction
      let x, y;
      if (outgoingCount > incomingCount) {
        // Source nodes lean left
        x = centerX + (radius * Math.cos(angle)) - 100;
        y = centerY + (radius * Math.sin(angle));
      } else {
        // Target nodes lean right
        x = centerX + (radius * Math.cos(angle)) + 100;
        y = centerY + (radius * Math.sin(angle));
      }
      
      // Add some randomness to prevent overlap
      x += (Math.random() - 0.5) * 50;
      y += (Math.random() - 0.5) * 50;
      
      positions.set(address, { x, y });
    });
    
    // If there's a center address, position it in the middle
    if (centerAddress) {
      positions.set(centerAddress, { x: centerX, y: centerY });
    }
    
    return positions;
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

  useEffect(() => {
    if (!transactions) return; // Add early return if no transactions

    // Get unique addresses
    const addresses = new Set<string>();
    transactions.forEach(tx => {
      addresses.add(tx.from);
      addresses.add(tx.to);
    });

    // Calculate dimensions for node positioning
    const dimensions = {
      width: 1200,  // Default width
      height: 600,  // Default height
    };

    // Calculate node positions
    const positions = calculateNodePositions(addresses, transactions, currentAddress, dimensions);

    // Create nodes
    const newNodes = Array.from(addresses).map(address => ({
      id: address,
      data: { label: shortenAddress(address) },
      position: positions.get(address) || { x: 0, y: 0 },
      style: {
        background: address === currentAddress ? '#4CAF50' : '#1a1a1a',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '14px',
        fontFamily: 'monospace',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        width: 180,
      },
    }));

    // Create edges with improved styling and direction indicators
    const newEdges = transactions.map((tx, index) => ({
      id: `${tx.from}-${tx.to}-${index}`,
      source: tx.from,
      target: tx.to,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: tx.from === currentAddress ? edgeStyles.outgoing.stroke : 
               tx.to === currentAddress ? edgeStyles.incoming.stroke : 
               edgeStyles.default.stroke,
        strokeWidth: tx.amount > 100 ? 3 : tx.amount > 10 ? 2 : 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: tx.from === currentAddress ? edgeStyles.outgoing.stroke : 
               tx.to === currentAddress ? edgeStyles.incoming.stroke : 
               edgeStyles.default.stroke,
      },
      data: {
        amount: tx.amount,
        isOutgoing: tx.from === currentAddress,
        isIncoming: tx.to === currentAddress,
        timestamp: tx.timestamp,
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [transactions, currentAddress]);

  // Handle node click - select/deselect node
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  }, [selectedNode]);

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

        {/* Flow Visualization */}
        {!txLoading && !txError && transactions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Flow</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-solana-purple mr-1" />
                    Outgoing
                  </span>
                  <span className="flex items-center ml-4">
                    <div className="w-3 h-3 rounded-full bg-solana-teal mr-1" />
                    Incoming
                  </span>
                </div>
              </div>
            </div>
            
            <ReactFlowProvider>
              <FlowVisualization
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                selectedNode={selectedNode}
              />
            </ReactFlowProvider>
          </motion.div>
        )}

        {/* Node Details Panel */}
        {selectedNode && transactions && (
          <NodeDetailsPanel
            node={selectedNode}
            transactions={transactions}
            onClose={() => setSelectedNode(null)}
          />
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