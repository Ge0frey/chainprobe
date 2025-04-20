import { useState, useCallback, useEffect } from 'react';
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

// Custom node representing a wallet
const WalletNode = ({ data }: { data: any }) => (
  <div className={`px-4 py-2 shadow-md rounded-md border-2 ${data.isExchange ? 'bg-amber-50 dark:bg-amber-900 border-amber-500 dark:border-amber-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
    <div className="flex items-center">
      {data.isExchange && (
        <div className="mr-2 w-4 h-4 rounded-full bg-amber-400"></div>
      )}
      <div>
        <div className="font-bold text-sm text-gray-900 dark:text-white">{data.label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{data.address.slice(0, 6)}...{data.address.slice(-6)}</div>
      </div>
    </div>
  </div>
);

// Register custom node types
const nodeTypes = {
  wallet: WalletNode,
};

export default function TransactionFlow() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<number>(30); // days
  const [minAmount, setMinAmount] = useState<number>(0);
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
  };

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
      const angle = (2 * Math.PI * index) / nodeCount;
      const isCenter = address === currentAddress;
      
      // Center node is in the middle, others are arranged in a circle
      const x = isCenter ? centerX : centerX + radius * Math.cos(angle);
      const y = isCenter ? centerY : centerY + radius * Math.sin(angle);
      
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
          zIndex: isCenter ? 1000 : 1, // Ensure center node is on top
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
      
      return {
        id: `e${index}`,
        source: tx.from,
        target: tx.to,
        animated: true,
        label: `${count > 1 ? `${count}x ` : ''}${totalAmount.toFixed(2)} ${tx.token}`,
        type: 'smoothstep',
        labelStyle: { fill: '#888', fontWeight: 500 },
        style: { strokeWidth },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#888',
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
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Transaction Flow Analysis
          </h2>
        </div>
      </div>

      {/* Search and Filter Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <form onSubmit={onSearch} className="space-y-4">
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
            
            <div>
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Range
              </label>
              <div className="mt-1">
                <select
                  id="date-filter"
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={180}>Last 6 months</option>
                  <option value={365}>Last year</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="min-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Minimum Amount
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="min-amount"
                  value={minAmount}
                  onChange={handleMinAmountChange}
                  min="0"
                  step="0.1"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Analyze
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Transaction Flow Graph */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transaction Flow Visualization</h3>
        </div>
        
        {txLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <Spinner />
            <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">Analyzing transaction flow...</p>
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
              <Background />
              <Controls />
              <Panel position="top-right" className="bg-white dark:bg-gray-800 p-2 rounded shadow-md text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-1 bg-white border border-gray-300 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Regular Wallet</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-1 bg-amber-50 border border-amber-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Exchange/Entity</span>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        )}
        
        {nodes.length === 0 && !txLoading && currentAddress && (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">No transaction flow data found for the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
} 