import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  ConnectionLineType,
  NodeChange,
  EdgeChange,
  BaseEdge,
  MiniMap,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchTransactionFlow, 
  TransactionFlow as TxFlow, 
  fetchEntityLabels,
  identifyCriticalPaths,
  CriticalPathData,
  analyzeEntityConnections,
  EntityConnection
} from '../services/solana';
import { Spinner } from './ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  RiSearchLine, 
  RiFilter3Line, 
  RiArrowRightLine,
  RiInformationLine,
  RiExchangeLine,
  RiWalletLine,
  RiSettings4Line,
  RiRefreshLine,
  RiAlertLine,
  RiFlashlightLine,
  RiRadarLine,
  RiZoomInLine,
  RiZoomOutLine,
  RiFullscreenLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiNodeTree
} from 'react-icons/ri';

// Custom node representing a wallet with enhanced interactivity
const WalletNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const nodeClasses = `px-4 py-2 shadow-md rounded-md border-2 backdrop-blur-sm transition-all duration-300 ${
    selected ? 'ring-2 ring-solana-purple ring-offset-2 scale-110' : ''
  } ${
    data.isHighRisk 
      ? 'bg-red-50/90 dark:bg-red-900/80 border-red-500 dark:border-red-400 shadow-red-500/20'
      : data.isExchange 
        ? 'bg-amber-50/90 dark:bg-amber-900/80 border-amber-500 dark:border-amber-400 shadow-amber-500/20' 
        : data.isCenter
          ? 'bg-white/90 dark:bg-gray-800/90 border-solana-purple shadow-glow-purple'
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
        {data.isHighRisk && (
          <div className="mr-2 w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
        )}
        {data.isExchange && !data.isHighRisk && (
          <div className="mr-2 w-4 h-4 rounded-full bg-amber-400"></div>
        )}
        {data.isCenter && !data.isHighRisk && !data.isExchange && (
          <div className="mr-2 w-4 h-4 rounded-full bg-solana-purple"></div>
        )}
        <div>
          <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center">
            {data.label}
            {data.isSuspicious && (
              <RiAlertLine className="ml-1 text-amber-500" />
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {data.address.slice(0, 6)}...{data.address.slice(-6)}
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

// Enhanced edge with animated flow and detailed tooltips
const CustomEdge = ({ id, data, sourceX, sourceY, targetX, targetY, ...props }: any) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const edgeClasses = `transition-all duration-300 ${
    data.isCriticalPath ? 'stroke-red-500 stroke-[3]' : 
    data.isHighValue ? 'stroke-amber-500 stroke-[2]' : 
    'stroke-gray-300 dark:stroke-gray-600'
  }`;

  return (
    <g 
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="group"
    >
      <BaseEdge 
        id={id} 
        {...props} 
        className={edgeClasses}
        style={{
          ...props.style,
          animation: data.isAnimated ? 'flowAnimation 1s infinite' : 'none',
        }}
      />
      {showTooltip && (
        <foreignObject
          x={(sourceX + targetX) / 2 - 100}
          y={(sourceY + targetY) / 2 - 40}
          width={200}
          height={80}
          className="overflow-visible pointer-events-none"
        >
          <div className="bg-black/90 text-white p-2 rounded text-xs">
            <div className="font-bold">{format(new Date(data.lastTx), 'PPp')}</div>
            <div>Transactions: {data.transactions}</div>
            <div>Total: {data.amount.toFixed(2)} {data.token}</div>
            <div>Avg: {(data.amount / data.transactions).toFixed(2)} {data.token}</div>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

// Register custom node types and edge types
const nodeTypes = {
  wallet: WalletNode,
};

const edgeTypes = {
  custom: CustomEdge,
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

// Flow visualization component that uses ReactFlow hooks
function FlowVisualization({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
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

  return (
    <div className="h-[800px] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={node => {
            if (node.data.isHighRisk) return '#ef4444';
            if (node.data.isExchange) return '#f59e0b';
            if (node.data.isCenter) return '#9945FF';
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

// Main component that handles the business logic
export default function TransactionFlow() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<number>(30);
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [highlightCriticalPaths, setHighlightCriticalPaths] = useState(true);
  const [criticalPathConfig, setCriticalPathConfig] = useState({
    highValueThreshold: 10,
    minFrequency: 3,
    includeCircular: true,
  });
  const [criticalPathData, setCriticalPathData] = useState<CriticalPathData | null>(null);
  const [criticalPathView, setCriticalPathView] = useState<'all' | 'highValue' | 'frequent' | 'suspicious'>('all');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showFlowSummary, setShowFlowSummary] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [entityConnections, setEntityConnections] = useState<EntityConnection[]>([]);

  // Custom handler to properly type node changes
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  // Custom handler to properly type edge changes
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  // Fetch transaction flow data
  const { 
    data: transactions, 
    isLoading: txLoading, 
    refetch 
  } = useQuery({
    queryKey: ['transaction-flow', currentAddress, dateFilter],
    queryFn: () => currentAddress ? fetchTransactionFlow(currentAddress, dateFilter) : null,
    enabled: !!currentAddress,
  });

  // Fetch entity connections for additional analysis
  useEffect(() => {
    const fetchConnections = async () => {
      if (!currentAddress) return;
      try {
        const connections = await analyzeEntityConnections(currentAddress);
        setEntityConnections(connections);
      } catch (error) {
        console.error('Error fetching entity connections:', error);
      }
    };
    fetchConnections();
  }, [currentAddress]);

  // Calculate critical paths when transactions change
  useEffect(() => {
    const analyzeCriticalPaths = async () => {
      if (!transactions) return;
      
      try {
        const criticalPaths = await identifyCriticalPaths(transactions, criticalPathConfig);
        setCriticalPathData(criticalPaths);
      } catch (error) {
        console.error('Error analyzing critical paths:', error);
      }
    };
    
    analyzeCriticalPaths();
  }, [transactions, criticalPathConfig]);

  // Transform transactions into nodes and edges
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    if (!transactions || !entityConnections) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, boolean>();

    // Add center node
    if (currentAddress) {
      nodes.push({
        id: currentAddress,
        type: 'wallet',
        position: { x: 0, y: 0 },
        data: {
          address: currentAddress,
          label: 'Target Wallet',
          isCenter: true,
          stats: {
            volume: transactions.reduce((sum, tx) => sum + tx.amount, 0),
            transactions: transactions.length
          }
        }
      });
      nodeMap.set(currentAddress, true);
    }

    // Process transactions into nodes and edges
    transactions.forEach(tx => {
      const amount = tx.amount;
      if (amount < (minAmount || 0)) return;
      if (maxAmount && amount > maxAmount) return;

      // Add nodes if they don't exist
      [tx.from, tx.to].forEach(address => {
        if (!nodeMap.has(address)) {
          const connection = entityConnections.find(c => c.address === address);
          const isHighRisk = connection?.riskScore ?? 0 > 0.7;
          
          nodes.push({
            id: address,
            type: 'wallet',
            position: { x: 0, y: 0 }, // Layout will be calculated later
            data: {
              address,
              label: connection?.label || 'Unknown Wallet',
              isHighRisk,
              isExchange: connection?.type === 'exchange',
              isSuspicious: connection?.riskScore ?? 0 > 0.5,
              stats: {
                volume: connection?.totalVolume ?? 0,
                transactions: connection?.totalTransactions ?? 0
              }
            }
          });
          nodeMap.set(address, true);
        }
      });

      // Add edge
      const edgeId = `${tx.from}-${tx.to}`;
      const existingEdge = edges.find(e => e.id === edgeId);

      if (existingEdge) {
        existingEdge.data.amount += amount;
        existingEdge.data.transactions += 1;
        if (tx.timestamp > existingEdge.data.lastTx) {
          existingEdge.data.lastTx = tx.timestamp;
        }
      } else {
        const isCriticalPath = criticalPathData?.highValuePaths.some(
          p => p.from === tx.from && p.to === tx.to
        );

        edges.push({
          id: edgeId,
          source: tx.from,
          target: tx.to,
          type: 'custom',
          animated: amount > criticalPathConfig.highValueThreshold,
          data: {
            amount,
            transactions: 1,
            token: tx.token,
            lastTx: tx.timestamp,
            isCriticalPath,
            isHighValue: amount > criticalPathConfig.highValueThreshold
          }
        });
      }
    });

    // Apply force-directed layout
    const centerX = 0;
    const centerY = 0;
    const radius = 300;
    const angleStep = (2 * Math.PI) / (nodes.length - 1);

    nodes.forEach((node, index) => {
      if (node.data.isCenter) {
        node.position = { x: centerX, y: centerY };
      } else {
        const angle = angleStep * index;
        node.position = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      }
    });

    return { nodes, edges };
  }, [transactions, entityConnections, currentAddress, minAmount, maxAmount, criticalPathConfig, criticalPathData]);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
    }
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateFilter(Number(e.target.value));
  };

  const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinAmount(Number(e.target.value));
  };

  const handleMaxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? Number(e.target.value) : null;
    setMaxAmount(value);
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Transaction Flow Analysis
          </h2>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <form onSubmit={onSearch} className="space-y-4">
          <div className="flex space-x-4">
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
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Time Period
                  </label>
                  <select
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  >
                    {DATE_FILTER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Min Amount (SOL)
                  </label>
                  <input
                    type="number"
                    value={minAmount}
                    onChange={handleMinAmountChange}
                    min="0"
                    step="0.1"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Amount (SOL)
                  </label>
                  <input
                    type="number"
                    value={maxAmount || ''}
                    onChange={handleMaxAmountChange}
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

      {/* Flow Visualization */}
      {txLoading ? (
        <div className="flex items-center justify-center h-96">
          <Spinner />
          <p className="ml-3 text-gray-500 dark:text-gray-400">Analyzing transaction flow...</p>
        </div>
      ) : transactions ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <ReactFlowProvider>
            <FlowVisualization
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
            />
          </ReactFlowProvider>
        </div>
      ) : null}

      {/* Flow Summary */}
      {transactions && criticalPathData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Critical Paths</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">High Value Paths</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {criticalPathData.highValuePaths.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Frequent Paths</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {criticalPathData.frequentPaths.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Suspicious Patterns</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {criticalPathData.suspiciousPatterns.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Flow Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Volume</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {transactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Unique Addresses</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Set([...transactions.map(tx => tx.from), ...transactions.map(tx => tx.to)]).size}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Transaction Count</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {transactions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 