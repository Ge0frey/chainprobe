import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
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
} from 'react-icons/ri';

// Date filter options
const DATE_FILTER_OPTIONS = [
  { value: 1, label: 'Last 24 hours' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 3 months' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last year' },
];

// Custom node styles
const nodeStyles = {
  exchange: {
    background: '#fbbf24',
    border: '2px solid #f59e0b',
  },
  highRisk: {
    background: '#ef4444',
    border: '2px solid #dc2626',
  },
  center: {
    background: '#9945FF',
    border: '2px solid #7c3aed',
  },
  default: {
    background: '#64748b',
    border: '2px solid #475569',
  },
};

// Custom node component with enhanced tooltip
const CustomNode = ({ data }: { data: any }) => {
  const style = data.isExchange ? nodeStyles.exchange :
               data.isHighRisk ? nodeStyles.highRisk :
               data.isCenter ? nodeStyles.center :
               nodeStyles.default;

  return (
    <div className="group relative">
      <div className="px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium min-w-[150px]"
           style={style}>
        <div className="truncate">{data.label}</div>
        {data.amount && (
          <div className="text-xs opacity-80 mt-1">
            {data.amount.toFixed(2)} SOL
          </div>
        )}
      </div>
      {/* Enhanced tooltip */}
      <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white p-4 rounded-lg shadow-xl -translate-y-full -translate-x-1/4 mb-2 min-w-[200px]">
        <div className="text-sm font-medium mb-2">{data.fullAddress || data.label}</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Total Volume:</span>
            <span>{data.amount?.toFixed(2)} SOL</span>
          </div>
          <div className="flex justify-between">
            <span>Transaction Count:</span>
            <span>{data.transactionCount}</span>
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
              <span className={data.riskScore > 0.7 ? 'text-red-400' : 'text-green-400'}>
                {(data.riskScore * 100).toFixed(0)}%
              </span>
            </div>
          )}
          {data.correlations && (
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
      </div>
    </div>
  );
};

// Enhanced edge styles
const edgeStyles = {
  critical: {
    stroke: '#ef4444',
    strokeWidth: 3,
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
  },
  default: {
    stroke: '#94a3b8',
    strokeWidth: 1.5,
  },
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

  // Transform data for React Flow with enhanced correlation data
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

    // Create nodes with correlation data
    const sourceNodes = new Set(transactions.map(tx => tx.from));
    const targetNodes = new Set(transactions.map(tx => tx.to));
    
    let yOffset = 0;
    
    // Source nodes (left side)
    Array.from(sourceNodes).forEach((address, index) => {
      if (!nodeMap.has(address)) {
        const addressTxs = transactions.filter(tx => tx.from === address || tx.to === address);
        const volume = addressTxs.reduce((sum, tx) => sum + tx.amount, 0);
        
        nodeMap.set(address, {
          id: address,
          type: 'custom',
          position: { x: 0, y: yOffset },
          data: {
            label: address.slice(0, 6) + '...' + address.slice(-4),
            fullAddress: address,
            isExchange: false,
            isHighRisk: false,
            amount: volume,
            transactionCount: addressTxs.length,
            correlations: correlations.get(address) || [],
            type: 'source',
            riskScore: calculateRiskScore(address, addressTxs)
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        nodes.push(nodeMap.get(address));
        yOffset += 100;
      }
    });

    // Center node (target wallet)
    if (currentAddress) {
      const centerTxs = transactions;
      nodeMap.set(currentAddress, {
        id: currentAddress,
        type: 'custom',
        position: { x: 400, y: yOffset / 2 },
        data: {
          label: 'Target Wallet',
          fullAddress: currentAddress,
          isCenter: true,
          amount: centerTxs.reduce((sum, tx) => sum + tx.amount, 0),
          transactionCount: centerTxs.length,
          correlations: correlations.get(currentAddress) || [],
          type: 'center'
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
      nodes.push(nodeMap.get(currentAddress));
    }

    // Target nodes (right side)
    yOffset = 0;
    Array.from(targetNodes).forEach((address, index) => {
      if (!nodeMap.has(address)) {
        const addressTxs = transactions.filter(tx => tx.from === address || tx.to === address);
        const volume = addressTxs.reduce((sum, tx) => sum + tx.amount, 0);
        
        nodeMap.set(address, {
          id: address,
          type: 'custom',
          position: { x: 800, y: yOffset },
          data: {
            label: address.slice(0, 6) + '...' + address.slice(-4),
            fullAddress: address,
            isExchange: false,
            isHighRisk: false,
            amount: volume,
            transactionCount: addressTxs.length,
            correlations: correlations.get(address) || [],
            type: 'target',
            riskScore: calculateRiskScore(address, addressTxs)
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        nodes.push(nodeMap.get(address));
        yOffset += 100;
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

      edges.push({
        id: `e-${tx.signature}`,
        source: tx.from,
        target: tx.to,
        animated,
        style,
        label: `${tx.amount.toFixed(2)} SOL`,
        data: {
          frequency,
          volume,
          signature: tx.signature
        },
        labelStyle: { fill: '#94a3b8', fontWeight: 500 },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.7 },
      });
    });

    return { nodes, edges };
  }, [transactions, currentAddress]);

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
                    onChange={(e) => setDateFilter(Number(e.target.value))}
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
                    onChange={(e) => setMinAmount(Number(e.target.value))}
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
                    onChange={(e) => setMaxAmount(e.target.value ? Number(e.target.value) : null)}
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
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div style={{ height: '800px' }} className="rounded-lg overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={{ custom: CustomNode }}
              fitView
              attributionPosition="bottom-right"
            >
              <Controls />
              <MiniMap />
              <Background />
            </ReactFlow>
          </div>
        </div>
      ) : null}

      {/* Flow Statistics */}
      {transactions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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