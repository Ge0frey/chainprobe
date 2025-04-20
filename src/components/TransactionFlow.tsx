import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionFlow, TransactionFlow as TxFlow } from '../services/solana';

const nodeTypes = {
  wallet: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
      <div className="font-bold text-sm text-gray-900 dark:text-white">{data.label}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{data.address.slice(0, 8)}...</div>
    </div>
  ),
};

export default function TransactionFlow() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transaction-flow', currentAddress],
    queryFn: () => currentAddress ? fetchTransactionFlow(currentAddress) : null,
    enabled: !!currentAddress,
  });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
    }
  };

  const createGraphData = useCallback((transactions: TxFlow[]) => {
    const uniqueAddresses = new Set<string>();
    transactions.forEach(tx => {
      uniqueAddresses.add(tx.from);
      uniqueAddresses.add(tx.to);
    });

    const nodes: Node[] = Array.from(uniqueAddresses).map((address, index) => ({
      id: address,
      type: 'wallet',
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      data: { label: `Wallet ${index + 1}`, address },
    }));

    const edges: Edge[] = transactions.map((tx, index) => ({
      id: `e${index}`,
      source: tx.from,
      target: tx.to,
      animated: true,
      label: `${tx.amount} ${tx.token}`,
    }));

    setNodes(nodes);
    setEdges(edges);
  }, [setNodes, setEdges]);

  // Update graph when transactions change
  useState(() => {
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

      {/* Search Form */}
      <div className="mt-4">
        <form onSubmit={onSearch} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter Solana wallet address"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Analyze
          </button>
        </form>
      </div>

      {/* Transaction Flow Graph */}
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Analyzing transaction flow...</p>
        </div>
      ) : (
        <div className="h-[600px] w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      )}
    </div>
  );
} 