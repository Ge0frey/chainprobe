import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Connection, PublicKey } from '@solana/web3.js';
import { fetchWalletTransactions } from '../services/solana';
import { Spinner } from './ui/Spinner';

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const connection = new Connection(HELIUS_RPC_URL);

export interface HeliusTransaction {
  signature: string;
  blockTime: number;
  confirmationStatus: string;
  fee: number;
}

export default function Dashboard() {
  const [searchInput, setSearchInput] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  const { data: transactions, isLoading, error } = useQuery<HeliusTransaction[]>({
    queryKey: ['transactions', currentAddress],
    queryFn: async () => {
      if (!currentAddress) throw new Error('No address provided');
      try {
        const pubKey = new PublicKey(currentAddress);
        const result = await fetchWalletTransactions(connection, pubKey, 20);
        return result as HeliusTransaction[];
      } catch (e) {
        throw new Error('Invalid Solana address format');
      }
    },
    enabled: !!currentAddress,
    retry: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentAddress(searchInput);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Solana Transaction Dashboard</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter Solana wallet address"
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="text-red-600 mb-4">
          {error instanceof Error ? error.message : 'An error occurred'}
        </div>
      )}

      {transactions && transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Signature</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Fee (SOL)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: HeliusTransaction) => (
                <tr key={tx.signature} className="border-t">
                  <td className="px-4 py-2 font-mono text-sm">{tx.signature.slice(0, 16)}...</td>
                  <td className="px-4 py-2">
                    {new Date(tx.blockTime * 1000).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded ${
                      tx.confirmationStatus === 'finalized' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tx.confirmationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2">{(tx.fee / 1e9).toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {transactions && transactions.length === 0 && (
        <div className="text-center text-gray-600">
          No transactions found for this address
        </div>
      )}
    </div>
  );
} 