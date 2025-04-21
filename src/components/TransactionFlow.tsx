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
  BaseEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchTransactionFlow, 
  TransactionFlow as TxFlow, 
  fetchEntityLabels,
  identifyCriticalPaths,
  CriticalPathData
} from '../services/solana';
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
  RiRefreshLine,
  RiAlertLine,
  RiFlashlightLine,
  RiRadarLine
} from 'react-icons/ri';

// Custom node representing a wallet
const WalletNode = ({ data }: { data: any }) => {
  const nodeClasses = `px-4 py-2 shadow-md rounded-md border-2 backdrop-blur-sm ${
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
        </div>
      </div>
    </motion.div>
  );
};

// Custom Edge with improved hover details
const CustomEdge = ({ id, data, ...props }: any) => (
  <div>
    <BaseEdge id={id} {...props} />
    <div
      className="edge-tooltip absolute bg-black text-white p-2 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
      style={{ 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none' 
      }}
    >
      <div><strong>Transactions:</strong> {data.transactions}</div>
      <div><strong>Total:</strong> {data.amount.toFixed(2)} {data.token}</div>
      <div><strong>Dates:</strong> {data.dates}</div>
    </div>
  </div>
);

// Register custom node types and edge types
const nodeTypes = {
  wallet: WalletNode,
};

const edgeTypes = {
  custom: CustomEdge,
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

  const handleCriticalPathViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCriticalPathView(e.target.value as 'all' | 'highValue' | 'frequent' | 'suspicious');
  };

  const toggleCriticalPathHighlighting = () => {
    setHighlightCriticalPaths(!highlightCriticalPaths);
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

  // Stats about critical paths
  const criticalStats = useMemo(() => {
    if (!criticalPathData) return null;
    
    return {
      highValue: criticalPathData.highValuePaths.length,
      frequent: criticalPathData.frequentPaths.length,
      suspicious: criticalPathData.suspiciousPatterns.length,
    };
  }, [criticalPathData]);

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

    // Create transaction map for future reference
    const transactionsByPath = new Map<string, TxFlow[]>();
    filteredTxs.forEach(tx => {
      const key = `${tx.from}-${tx.to}`;
      if (!transactionsByPath.has(key)) {
        transactionsByPath.set(key, []);
      }
      transactionsByPath.get(key)!.push(tx);
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

    // Identify suspicious addresses from critical paths
    const suspiciousAddresses = new Set<string>();
    const highRiskAddresses = new Set<string>();
    
    if (criticalPathData && highlightCriticalPaths) {
      // Add addresses from suspicious patterns
      criticalPathData.suspiciousPatterns.forEach(pattern => {
        pattern.addresses.forEach(addr => {
          suspiciousAddresses.add(addr);
          if (pattern.riskScore > 0.7) {
            highRiskAddresses.add(addr);
          }
        });
      });
    }

    // Create nodes with improved positioning for better correlation
    const nodeCount = uniqueAddresses.size;
    const radius = Math.min(400, 100 + nodeCount * 20);
    const centerX = 400;
    const centerY = 300;
    
    // Track node positions to avoid overlap
    const usedPositions = new Map<string, {x: number, y: number}>();
    
    // Calculate transaction counts for each address
    const addressTransactionCount = new Map<string, number>();
    filteredTxs.forEach(tx => {
      addressTransactionCount.set(tx.from, (addressTransactionCount.get(tx.from) || 0) + 1);
      addressTransactionCount.set(tx.to, (addressTransactionCount.get(tx.to) || 0) + 1);
    });
    
    // First place the centerAddress and other high-traffic nodes
    const nodes: Node[] = Array.from(uniqueAddresses).map((address, index) => {
      const isCenter = address === currentAddress;
      const txCount = addressTransactionCount.get(address) || 0;
      let x, y;
      
      if (isCenter) {
        // Place central node in the middle
        x = centerX;
        y = centerY;
      } else {
        // Position based on activity level and connection to center
        const isDirectlyConnected = filteredTxs.some(tx => 
          (tx.from === currentAddress && tx.to === address) || 
          (tx.to === currentAddress && tx.from === address)
        );
        
        // Calculate angle - try to group related nodes together
        const baseAngle = index * (2 * Math.PI / (nodeCount - 1));
        
        // Adjust radius based on connection and transaction count
        let nodeRadius = radius;
        if (isDirectlyConnected) {
          nodeRadius = radius * 0.6; // Closer to center
        } else if (txCount > 5) {
          nodeRadius = radius * 0.8; // Medium distance
        }
        
        // Add some randomization for better distribution
        const angleVariation = 0.2 * Math.random() - 0.1;
        const radiusVariation = radius * 0.1 * Math.random();
        
        x = centerX + (nodeRadius + radiusVariation) * Math.cos(baseAngle + angleVariation);
        y = centerY + (nodeRadius + radiusVariation) * Math.sin(baseAngle + angleVariation);
        
        // Avoid node overlap
        let attempts = 0;
        while (attempts < 5) {
          let overlapping = false;
          
          for (const [otherAddr, pos] of usedPositions.entries()) {
            const dx = x - pos.x;
            const dy = y - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 60) { // Minimum distance between nodes
              overlapping = true;
              break;
            }
          }
          
          if (!overlapping) break;
          
          // Adjust position slightly
          x += (Math.random() - 0.5) * 30;
          y += (Math.random() - 0.5) * 30;
          attempts++;
        }
      }
      
      usedPositions.set(address, {x, y});
      
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
          isCenter,
          isSuspicious: suspiciousAddresses.has(address),
          isHighRisk: highRiskAddresses.has(address),
          transactionCount: txCount
        },
        style: {
          zIndex: isCenter ? 1000 : (suspiciousAddresses.has(address) ? 900 : 1),
        }
      };
    });

    // Create sets of critical paths for edge styling
    const highValuePaths = new Set<string>();
    const frequentPaths = new Set<string>();
    const suspiciousPaths = new Set<string>();
    
    if (criticalPathData && highlightCriticalPaths) {
      // Create path strings for easy lookup
      criticalPathData.highValuePaths.forEach(path => {
        highValuePaths.add(`${path.from}-${path.to}`);
      });
      
      criticalPathData.frequentPaths.forEach(path => {
        frequentPaths.add(`${path.from}-${path.to}`);
      });
      
      criticalPathData.suspiciousPatterns.forEach(pattern => {
        // Create edges for each consecutive pair in the suspicious pattern
        for (let i = 0; i < pattern.addresses.length - 1; i++) {
          suspiciousPaths.add(`${pattern.addresses[i]}-${pattern.addresses[i+1]}`);
        }
        // Add edge from last to first if it's a cycle
        if (pattern.addresses[0] === pattern.addresses[pattern.addresses.length - 1]) {
          suspiciousPaths.add(`${pattern.addresses[pattern.addresses.length - 1]}-${pattern.addresses[0]}`);
        }
      });
    }
    
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
      const pathKey = `${tx.from}-${tx.to}`;
      
      // Check if this edge is part of a critical path
      const isHighValue = highValuePaths.has(pathKey);
      const isFrequent = frequentPaths.has(pathKey);
      const isSuspicious = suspiciousPaths.has(pathKey);
      
      // Determine if this edge should be shown based on critical path view filter
      if (criticalPathView !== 'all' && highlightCriticalPaths) {
        if (criticalPathView === 'highValue' && !isHighValue) return null;
        if (criticalPathView === 'frequent' && !isFrequent) return null;
        if (criticalPathView === 'suspicious' && !isSuspicious) return null;
      }
      
      // Edge thickness based on amount and frequency
      const strokeWidth = Math.min(10, 1 + Math.log(totalAmount + 1) / 2);
      
      // Color the edge based on path type and direction
      let edgeColor = 'rgba(153, 69, 255, 0.6)'; // Default purple
      
      if (highlightCriticalPaths) {
        if (isSuspicious) {
          edgeColor = 'rgba(239, 68, 68, 0.8)'; // Red for suspicious
        } else if (isHighValue) {
          edgeColor = 'rgba(234, 179, 8, 0.8)'; // Yellow for high value
        } else if (isFrequent) {
          edgeColor = 'rgba(59, 130, 246, 0.8)'; // Blue for frequent
        } else {
          // Regular edge color based on direction
          const isOutgoing = tx.from === currentAddress;
          edgeColor = isOutgoing ? 'rgba(153, 69, 255, 0.6)' : 'rgba(20, 241, 149, 0.6)';
        }
      } else {
        // Regular edge color based on direction when highlighting is off
        const isOutgoing = tx.from === currentAddress;
        edgeColor = isOutgoing ? 'rgba(153, 69, 255, 0.6)' : 'rgba(20, 241, 149, 0.6)';
      }
      
      // Get all transactions for this path for enhanced tooltips
      const pathTransactions = transactionsByPath.get(pathKey) || [];
      const txDates = pathTransactions.map(t => new Date(t.timestamp).toLocaleDateString()).join(', ');
      
      return {
        id: `e${index}`,
        source: tx.from,
        target: tx.to,
        animated: isSuspicious ? true : false,
        label: `${count > 1 ? `${count}x ` : ''}${totalAmount.toFixed(2)} ${tx.token}`,
        type: 'smoothstep',
        labelBgStyle: { fill: 'rgba(255, 255, 255, 0.7)', fillOpacity: 0.7 },
        labelStyle: { fill: '#333', fontWeight: 500 },
        style: { 
          stroke: edgeColor, 
          strokeWidth: isSuspicious || isHighValue ? strokeWidth + 1 : strokeWidth,
          opacity: highlightCriticalPaths && criticalPathView !== 'all' ? 
            (isSuspicious || isHighValue || isFrequent ? 1 : 0.3) : 1
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edgeColor,
        },
        data: {
          transactions: count,
          amount: totalAmount,
          token: tx.token,
          isHighValue,
          isFrequent,
          isSuspicious,
          dates: txDates,
          description: `${pathTransactions.length} transaction${pathTransactions.length > 1 ? 's' : ''} totaling ${totalAmount.toFixed(2)} ${tx.token}`
        }
      };
    }).filter(Boolean) as Edge[];

    setNodes(nodes);
    setEdges(edges);
  }, [currentAddress, setNodes, setEdges, minAmount, criticalPathData, highlightCriticalPaths, criticalPathView]);

  // Update graph when transactions change
  useEffect(() => {
    if (transactions) {
      createGraphData(transactions);
    }
  }, [transactions, createGraphData]);

  // Update onNodeClick handler
  const handleNodeClick = (e: React.MouseEvent, node: Node) => {
    // Set the selected node
    setSelectedNode(node.id);
    
    // Highlight connected paths when clicking on a node
    const connectedEdges = edges.filter(
      edge => edge.source === node.id || edge.target === node.id
    );
    
    // Update edge styling to highlight connections
    const updatedEdges = edges.map(edge => {
      const isConnected = connectedEdges.some(ce => ce.id === edge.id);
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isConnected ? 1 : 0.1,
          strokeWidth: isConnected ? (edge.style.strokeWidth as number) + 1 : edge.style.strokeWidth,
        }
      };
    });
    
    setEdges(updatedEdges);
  };

  // Reset edges and selection
  const handlePaneClick = () => {
    setSelectedNode(null);
    
    // Reset edge styling when clicking on the pane
    const resetEdges = edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: highlightCriticalPaths && criticalPathView !== 'all' ? 
          (edge.data.isSuspicious || edge.data.isHighValue || edge.data.isFrequent ? 1 : 0.3) : 1,
        strokeWidth: edge.data.isSuspicious || edge.data.isHighValue ? 
          1 + Math.log((edge.data.amount || 1) + 1) / 2 + 1 : 
          1 + Math.log((edge.data.amount || 1) + 1) / 2,
      }
    }));
    
    setEdges(resetEdges);
  };

  // Function to calculate wallet relationships when a node is selected
  const getWalletRelationships = useCallback(() => {
    if (!selectedNode || !transactions) return null;
    
    // Find all direct transactions with this wallet
    const directTransactions = transactions.filter(tx => 
      tx.from === selectedNode || tx.to === selectedNode
    );
    
    // Group by the other wallet in the transaction
    const relationshipsByWallet = new Map<string, {
      address: string,
      label: string,
      outgoing: number,
      incoming: number,
      count: number,
      volume: number,
      lastTransaction: number
    }>();
    
    directTransactions.forEach(tx => {
      const otherWallet = tx.from === selectedNode ? tx.to : tx.from;
      const isIncoming = tx.to === selectedNode;
      
      if (!relationshipsByWallet.has(otherWallet)) {
        relationshipsByWallet.set(otherWallet, {
          address: otherWallet,
          label: tx.fromLabel || tx.toLabel || otherWallet.slice(0, 6) + '...',
          outgoing: 0,
          incoming: 0,
          count: 0,
          volume: 0,
          lastTransaction: tx.timestamp
        });
      }
      
      const data = relationshipsByWallet.get(otherWallet)!;
      data.count += 1;
      data.volume += tx.amount;
      
      if (isIncoming) {
        data.incoming += tx.amount;
      } else {
        data.outgoing += tx.amount;
      }
      
      if (tx.timestamp > data.lastTransaction) {
        data.lastTransaction = tx.timestamp;
      }
    });
    
    return Array.from(relationshipsByWallet.values())
      .sort((a, b) => b.volume - a.volume);
  }, [selectedNode, transactions]);

  // Get relationship data
  const relationshipData = useMemo(() => 
    getWalletRelationships(), 
    [getWalletRelationships]
  );

  // Calculate multihop flow analysis
  const getTransactionFlowPaths = useCallback(() => {
    if (!transactions) return [];
    
    // Create a directed graph of all transactions
    const graph = new Map<string, Set<string>>();
    const volumeByPath = new Map<string, number>();
    
    transactions.forEach(tx => {
      if (!graph.has(tx.from)) {
        graph.set(tx.from, new Set());
      }
      graph.get(tx.from)!.add(tx.to);
      
      const pathKey = `${tx.from}|${tx.to}`;
      volumeByPath.set(pathKey, (volumeByPath.get(pathKey) || 0) + tx.amount);
    });
    
    // Find all multihop paths from center address (limited to 3 hops for performance)
    const findPaths = (start: string, current: string, visited: Set<string>, path: string[], depth: number) => {
      if (depth > 3 || visited.has(current)) return [];
      
      visited.add(current);
      path.push(current);
      
      const paths: {
        path: string[],
        volume: number,
        hops: number
      }[] = [];
      
      // If this is not the start node, consider this a valid path
      if (current !== start && path.length > 1) {
        // Calculate total volume along this path (minimum volume across all hops)
        let totalVolume = Number.MAX_VALUE;
        for (let i = 0; i < path.length - 1; i++) {
          const pathVolume = volumeByPath.get(`${path[i]}|${path[i+1]}`) || 0;
          totalVolume = Math.min(totalVolume, pathVolume);
        }
        
        paths.push({
          path: [...path],
          volume: totalVolume === Number.MAX_VALUE ? 0 : totalVolume,
          hops: path.length - 1
        });
      }
      
      const neighbors = graph.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          const newPaths = findPaths(start, neighbor, new Set(visited), [...path], depth + 1);
          paths.push(...newPaths);
        }
      }
      
      return paths;
    };
    
    // Start from center address if available
    if (currentAddress) {
      const allPaths = findPaths(currentAddress, currentAddress, new Set(), [], 0);
      
      // Sort by volume (highest first)
      return allPaths
        .filter(p => p.volume > 0)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10); // Limit to top 10 paths
    }
    
    return [];
  }, [transactions, currentAddress]);

  // Get flow paths data
  const flowPaths = useMemo(() => 
    getTransactionFlowPaths(), 
    [getTransactionFlowPaths]
  );

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
              
              <div>
                <label htmlFor="high-value-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  High Value Threshold (SOL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="high-value-threshold"
                    value={criticalPathConfig.highValueThreshold}
                    onChange={(e) => setCriticalPathConfig({
                      ...criticalPathConfig,
                      highValueThreshold: Number(e.target.value)
                    })}
                    min="0"
                    step="1"
                    className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-solana-purple/50 dark:focus:ring-solana-teal/50 focus:border-transparent dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="min-frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequent Path Threshold
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="min-frequency"
                    value={criticalPathConfig.minFrequency}
                    onChange={(e) => setCriticalPathConfig({
                      ...criticalPathConfig,
                      minFrequency: Number(e.target.value)
                    })}
                    min="2"
                    step="1"
                    className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-solana-purple/50 dark:focus:ring-solana-teal/50 focus:border-transparent dark:text-white"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2 flex gap-4">
                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={criticalPathConfig.includeCircular}
                    onChange={(e) => setCriticalPathConfig({
                      ...criticalPathConfig,
                      includeCircular: e.target.checked
                    })}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Detect circular fund flows (suspicious patterns)
                </label>
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

      {/* Critical Paths Toolbar */}
      {criticalStats && criticalStats.highValue + criticalStats.frequent + criticalStats.suspicious > 0 && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="glass-panel p-4 rounded-xl mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <RiRadarLine className="text-xl text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Critical Paths Detected</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-yellow-500">
                    {criticalStats.highValue} high value
                  </span>
                  <span className="text-blue-500">
                    {criticalStats.frequent} frequent
                  </span>
                  <span className="text-red-500">
                    {criticalStats.suspicious} suspicious
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
              <select
                value={criticalPathView}
                onChange={handleCriticalPathViewChange}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-800/70 text-sm"
              >
                <option value="all">All Paths</option>
                <option value="highValue">High Value Paths</option>
                <option value="frequent">Frequent Paths</option>
                <option value="suspicious">Suspicious Patterns</option>
              </select>
              
              <button
                onClick={toggleCriticalPathHighlighting}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  highlightCriticalPaths 
                    ? 'bg-gradient-solana text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <RiFlashlightLine />
                <span>{highlightCriticalPaths ? "Highlighting On" : "Highlighting Off"}</span>
              </button>
              
              <button
                onClick={() => setShowFlowSummary(!showFlowSummary)}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  showFlowSummary 
                    ? 'bg-gradient-solana text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <RiExchangeLine />
                <span>{showFlowSummary ? "Hide Flow Paths" : "Show Flow Paths"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transaction Flow Graph */}
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
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
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
              }}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
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
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-50/90 border border-red-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">High Risk</span>
                  </div>
                  
                  {highlightCriticalPaths && (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-0.5 w-8 bg-yellow-500/80"></div>
                        <span className="text-gray-700 dark:text-gray-300">High Value</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-0.5 w-8 bg-blue-500/80"></div>
                        <span className="text-gray-700 dark:text-gray-300">Frequent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-0.5 w-8 bg-red-500/80"></div>
                        <span className="text-gray-700 dark:text-gray-300">Suspicious</span>
                      </div>
                    </>
                  )}
                  
                  {!highlightCriticalPaths && (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-0.5 w-8 bg-solana-purple/60"></div>
                        <span className="text-gray-700 dark:text-gray-300">Outgoing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-0.5 w-8 bg-solana-teal/60"></div>
                        <span className="text-gray-700 dark:text-gray-300">Incoming</span>
                      </div>
                    </>
                  )}
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

      {/* Add wallet relationship panel when a node is selected */}
      {selectedNode && relationshipData && relationshipData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="mt-6 glass-panel p-4 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              Wallet Relationships 
              <span className="ml-2 text-sm text-gray-500">
                ({selectedNode.slice(0, 6)}...{selectedNode.slice(-4)})
              </span>
            </h3>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Wallet</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transactions</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Volume</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Flow Direction</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {relationshipData.map((relation, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {relation.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {relation.address.slice(0, 6)}...{relation.address.slice(-4)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {relation.count}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {relation.volume.toFixed(2)} SOL
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {relation.incoming > 0 && relation.outgoing > 0 ? (
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                            <span className="text-xs text-gray-700 dark:text-gray-300">In: {relation.incoming.toFixed(2)} SOL</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-1"></span>
                            <span className="text-xs text-gray-700 dark:text-gray-300">Out: {relation.outgoing.toFixed(2)} SOL</span>
                          </div>
                        </div>
                      ) : relation.incoming > 0 ? (
                        <div className="flex items-center">
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Incoming Only</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Outgoing Only</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {new Date(relation.lastTransaction).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add visual flow overview panel */}
      {showFlowSummary && flowPaths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="mt-6 glass-panel p-4 rounded-xl"
        >
          <h3 className="text-lg font-medium mb-4">Transaction Flow Paths</h3>
          <div className="space-y-4">
            {flowPaths.map((path, index) => (
              <div 
                key={index} 
                className="p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg"
                onClick={() => {
                  // Highlight this path when clicked
                  const pathAddresses = path.path;
                  const pathEdges = edges.map(edge => {
                    let isInPath = false;
                    for (let i = 0; i < pathAddresses.length - 1; i++) {
                      if (edge.source === pathAddresses[i] && edge.target === pathAddresses[i+1]) {
                        isInPath = true;
                        break;
                      }
                    }
                    
                    return {
                      ...edge,
                      style: {
                        ...edge.style,
                        opacity: isInPath ? 1 : 0.1,
                        strokeWidth: isInPath ? (edge.style.strokeWidth as number) + 2 : edge.style.strokeWidth,
                        stroke: isInPath ? 'rgba(234, 179, 8, 0.8)' : edge.style.stroke
                      }
                    };
                  });
                  
                  setEdges(pathEdges);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium flex items-center">
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded mr-2">
                      {path.hops} {path.hops === 1 ? 'hop' : 'hops'}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {path.volume.toFixed(2)} SOL
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  {path.path.map((addr, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            addr === currentAddress
                              ? 'bg-solana-purple/20 text-solana-purple border border-solana-purple'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                          title={addr}
                        >
                          {addr.slice(0, 2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {addr.slice(0, 4)}...
                        </div>
                      </div>
                      {i < path.path.length - 1 && (
                        <div className="mx-1 text-gray-400">
                          <RiArrowRightLine />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add Help Button to UI */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowHelp(true)}
          className="rounded-full w-8 h-8 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center shadow-sm"
          title="Help"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Help overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 overflow-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Flow Guide</h2>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Viewing Wallet Correlations</h3>
                  <p className="text-gray-600 dark:text-gray-400">Here are several ways to see how wallets are related:</p>
                  <ul className="mt-2 list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                    <li><strong>Click on any wallet</strong> to highlight its direct connections</li>
                    <li><strong>Flow Paths</strong> button shows multihop transaction routes</li>
                    <li>Use the <strong>Critical Paths</strong> filters to focus on important patterns</li>
                    <li>Click on a wallet to see a <strong>detailed relationship table</strong> below the chart</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Understanding Edge Colors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-8 bg-purple-500/60 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-400">Outgoing funds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-8 bg-green-500/60 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-400">Incoming funds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-8 bg-yellow-500/80 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-400">High value transfers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-8 bg-blue-500/80 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-400">Frequent interactions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-8 bg-red-500/80 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-400">Suspicious patterns</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Node Placement Logic</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Wallets with direct connections to the central address are placed closer.
                    Wallets with many transactions are given more prominent positions. 
                    Suspicious addresses or those involved in critical paths are highlighted.
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowHelp(false)}
                    className="w-full py-2 bg-gradient-solana text-white rounded-lg"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 