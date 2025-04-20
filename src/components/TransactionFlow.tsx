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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionFlow, TransactionFlow as TxFlow, fetchEntityLabels } from '../services/solana';
import { Spinner } from './ui/Spinner';
import { motion } from 'framer-motion';
import { 
  RiSearchLine, 
  RiFilter3Line, 
  RiArrowRightLine,
  RiInformationLine,
  RiExchangeLine,
  RiWalletLine,
  RiSettings4Line,
  RiRefreshLine
} from 'react-icons/ri';

// Custom node representing a wallet
const WalletNode = ({ data }: { data: any }) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.3 }}
    className={`px-4 py-2 shadow-md rounded-md border-2 backdrop-blur-sm ${
      data.isExchange 
        ? 'bg-amber-50/90 dark:bg-amber-900/80 border-amber-500 dark:border-amber-400 shadow-amber-500/20' 
        : data.isCenter
          ? 'bg-white/90 dark:bg-gray-800/90 border-solana-purple shadow-glow-purple'
          : 'bg-white/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
    }`}
  >
    <div className="flex items-center">
      {data.isExchange && (
        <div className="mr-2 w-4 h-4 rounded-full bg-amber-400"></div>
      )}
      {data.isCenter && (
        <div className="mr-2 w-4 h-4 rounded-full bg-solana-purple"></div>
      )}
      <div>
        <div className="font-bold text-sm text-gray-900 dark:text-white">{data.label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{data.address.slice(0, 6)}...{data.address.slice(-6)}</div>
      </div>
    </div>
  </motion.div>
);

// Register custom node types
const nodeTypes = {
  wallet: WalletNode,
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function TransactionFlow() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<number>(30); // days
  const [minAmount, setMinAmount] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

  const applyFilters = () => {
    refetch();
    setShowFilters(false);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Stats about the graph
  const graphStats = useMemo(() => {
    if (!transactions) return null;
    
    const addresses = new Set<string>();
    let totalVolume = 0;
    
    transactions.forEach(tx => {
      addresses.add(tx.from);
      addresses.add(tx.to);
      totalVolume += tx.amount;
    });
    
    return {
      transactions: transactions.length,
      addresses: addresses.size,
      volume: totalVolume.toFixed(2)
    };
  }, [transactions]);

  const createGraphData = useCallback(async (transactions: TxFlow[]) => {
    // Filter by amount if needed
    const filteredTxs = minAmount > 0 
      ? transactions.filter(tx => tx.amount >= minAmount)
      : transactions;
    
    if (filteredTxs.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Get unique addresses
    const uniqueAddresses = new Set<string>();
    filteredTxs.forEach(tx => {
      uniqueAddresses.add(tx.from);
      uniqueAddresses.add(tx.to);
    });

    // Fetch entity labels for the addresses
    const addressArray = Array.from(uniqueAddresses);
    const entityLabels = await fetchEntityLabels(addressArray);
    
    // Map of address to entity info
    const entityMap = new Map();
    entityLabels.forEach(entity => {
      entityMap.set(entity.address, {
        label: entity.label !== 'Unknown' ? entity.label : `Wallet ${entity.address.slice(0, 4)}...`,
        type: entity.type,
        isExchange: entity.type === 'exchange' || entity.label.includes('Exchange')
      });
    });

    // Create nodes with better positioning
    const nodeCount = uniqueAddresses.size;
    const radius = Math.min(400, 100 + nodeCount * 20);
    const centerX = 400;
    const centerY = 300;
    
    const nodes: Node[] = Array.from(uniqueAddresses).map((address, index) => {
      const isCenter = address === currentAddress;
      let x, y;
      
      if (isCenter) {
        // Place central node in the middle
        x = centerX;
        y = centerY;
      } else {
        // Place surrounding nodes in a circle with some randomization
        const angleStep = (2 * Math.PI) / (nodeCount - 1);
        const angle = index * angleStep;
        const randomOffset = Math.random() * 50 - 25; // Random offset for natural look
        
        x = centerX + (radius + randomOffset) * Math.cos(angle);
        y = centerY + (radius + randomOffset) * Math.sin(angle);
      }
      
      const entityInfo = entityMap.get(address) || { 
        label: `Wallet ${index + 1}`, 
        type: 'wallet',
        isExchange: false
      };
      
      return {
        id: address,
        type: 'wallet',
        position: { x, y },
        data: { 
          label: entityInfo.label, 
          address,
          type: entityInfo.type,
          isExchange: entityInfo.isExchange,
          isCenter
        },
        style: {
          zIndex: isCenter ? 1000 : 1,
        }
      };
    });

    // Create edges with better styling
    const edgesByKey = new Map<string, { tx: TxFlow, count: number, totalAmount: number }>();
    
    filteredTxs.forEach(tx => {
      const key = `${tx.from}-${tx.to}`;
      if (edgesByKey.has(key)) {
        const existing = edgesByKey.get(key)!;
        existing.count += 1;
        existing.totalAmount += tx.amount;
      } else {
        edgesByKey.set(key, { tx, count: 1, totalAmount: tx.amount });
      }
    });
    
    const edges: Edge[] = Array.from(edgesByKey.values()).map((edgeData, index) => {
      const { tx, count, totalAmount } = edgeData;
      // Edge thickness based on amount
      const strokeWidth = Math.min(10, 1 + Math.log(totalAmount + 1) / 2);
      
      // Color the edge based on if it's outgoing or incoming relative to center
      const isOutgoing = tx.from === currentAddress;
      const edgeColor = isOutgoing ? 'rgba(153, 69, 255, 0.6)' : 'rgba(20, 241, 149, 0.6)';
      
      return {
        id: `e${index}`,
        source: tx.from,
        target: tx.to,
        animated: true,
        label: `${count > 1 ? `${count}x ` : ''}${totalAmount.toFixed(2)} ${tx.token}`,
        type: 'smoothstep',
        labelBgStyle: { fill: 'rgba(255, 255, 255, 0.7)', fillOpacity: 0.7 },
        labelStyle: { fill: '#333', fontWeight: 500 },
        style: { stroke: edgeColor, strokeWidth },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edgeColor,
        },
        data: {
          transactions: count,
          amount: totalAmount,
          token: tx.token
        }
      };
    });

    setNodes(nodes);
    setEdges(edges);
  }, [currentAddress, setNodes, setEdges, minAmount]);

  // Update graph when transactions change
  useEffect(() => {
    if (transactions) {
      createGraphData(transactions);
    }
  }, [transactions, createGraphData]);

  return (
    <div className="space-y-6">
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="mb-4"
      >
        <h2 className="gradient-text text-3xl font-bold mb-2">Transaction Flow Analysis</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize the flow of funds between wallets and identify key patterns
        </p>
      </motion.div>

      {/* Search and Filter Form */}
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 rounded-xl"
      >
        <form onSubmit={onSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wallet Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <RiSearchLine className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="wallet-address"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Enter Solana wallet address"
                  className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-solana-purple/50 dark:focus:ring-solana-teal/50 focus:border-transparent dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <motion.button
                type="button"
                onClick={toggleFilters}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RiFilter3Line className={showFilters ? "text-solana-purple" : ""} />
                <span>Filters</span>
              </motion.button>
              
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-solana text-white rounded-lg shadow-glow-purple flex items-center gap-2"
              >
                <span>Analyze</span>
                <RiArrowRightLine />
              </motion.button>
            </div>
          </div>
          
          {/* Filter options */}
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div>
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Range
                </label>
                <select
                  id="date-filter"
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-solana-purple/50 dark:focus:ring-solana-teal/50 focus:border-transparent dark:text-white"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={180}>Last 6 months</option>
                  <option value={365}>Last year</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="min-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="min-amount"
                    value={minAmount}
                    onChange={handleMinAmountChange}
                    min="0"
                    step="0.1"
                    className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-solana-purple/50 dark:focus:ring-solana-teal/50 focus:border-transparent dark:text-white"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2 flex justify-end">
                <motion.button
                  type="button"
                  onClick={applyFilters}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"
                >
                  <RiRefreshLine />
                  <span>Apply Filters</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>

      {/* Stats Cards */}
      {graphStats && !txLoading && nodes.length > 0 && (
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        >
          <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <RiWalletLine className="text-xl text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Addresses</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{graphStats.addresses}</p>
            </div>
          </div>
          
          <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <RiExchangeLine className="text-xl text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{graphStats.transactions}</p>
            </div>
          </div>
          
          <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <RiSettings4Line className="text-xl text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Volume</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{graphStats.volume} SOL</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transaction Flow Graph */}
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200/70 dark:border-gray-700/70 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transaction Flow Visualization</h3>
          
          {currentAddress && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="font-mono">{currentAddress.slice(0, 6)}...{currentAddress.slice(-6)}</span>
            </div>
          )}
        </div>
        
        {txLoading ? (
          <div className="flex flex-col items-center justify-center h-[600px] gap-4">
            <Spinner />
            <p className="text-gray-500 dark:text-gray-400">Analyzing transaction flow...</p>
          </div>
        ) : (
          <div className="h-[600px] w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
              }}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
            >
              <Background color="#888" gap={16} />
              <Controls />
              <Panel position="top-right" className="glass-panel p-3 rounded-lg text-xs">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/90 border border-gray-300 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Regular Wallet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-50/90 border border-amber-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Exchange/Entity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/90 border border-solana-purple rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Central Address</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-0.5 w-8 bg-solana-purple/60"></div>
                    <span className="text-gray-700 dark:text-gray-300">Outgoing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-8 bg-solana-teal/60"></div>
                    <span className="text-gray-700 dark:text-gray-300">Incoming</span>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        )}
        
        {nodes.length === 0 && !txLoading && currentAddress && (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <RiInformationLine className="text-3xl text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No transaction flow data found for the current filters.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
} 