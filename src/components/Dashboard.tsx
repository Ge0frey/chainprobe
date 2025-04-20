import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchWalletTransactions, fetchTokenBalances, HeliusTransaction, fetchEnhancedTransaction, EnhancedTransaction } from '../services/solana';
import { Spinner } from './ui/Spinner';

export default function Dashboard() {
  const [searchInput, setSearchInput] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  // Fetch wallet transactions
  const { 
    data: transactions, 
    isLoading: txLoading, 
    error: txError 
  } = useQuery<HeliusTransaction[]>({
    queryKey: ['transactions', currentAddress],
    queryFn: async () => {
      if (!currentAddress) throw new Error('No address provided');
      try {
        return await fetchWalletTransactions(currentAddress, 20);
      } catch (e) {
        throw new Error('Invalid Solana address format');
      }
    },
    enabled: !!currentAddress,
    retry: false,
  });

  // Fetch token balances
  const { 
    data: tokenBalances, 
    isLoading: balancesLoading 
  } = useQuery({
    queryKey: ['token-balances', currentAddress],
    queryFn: () => currentAddress ? fetchTokenBalances(currentAddress) : null,
    enabled: !!currentAddress,
  });

  // Fetch transaction details when selected
  const { 
    data: transactionDetails, 
    isLoading: detailsLoading 
  } = useQuery<EnhancedTransaction | null>({
    queryKey: ['transaction-details', selectedTransaction],
    queryFn: () => selectedTransaction ? fetchEnhancedTransaction(selectedTransaction) : null,
    enabled: !!selectedTransaction,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput) {
      setCurrentAddress(searchInput);
      setSelectedTransaction(null); // Reset selected transaction
    }
  };

  const handleTransactionClick = (signature: string) => {
    setSelectedTransaction(signature);
  };

  // Format SOL amount
  const formatSol = (lamports: number) => {
    return (lamports / 1e9).toFixed(6);
  };

  // Get transaction type badge color
  const getTypeBadgeColor = (txType: string) => {
    switch (txType.toUpperCase()) {
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'SWAP':
      case 'SWAP_EXACT_IN':
      case 'SWAP_EXACT_OUT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'NFT_SALE':
      case 'NFT_LISTING':
      case 'NFT_CANCEL_LISTING':
      case 'NFT_MINT':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'UNKNOWN':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      default:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Solana Forensic Analysis Dashboard</h1>
      
      {/* Quick Links */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/transaction-flow" className="flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-100">Transaction Flow</h2>
            <p className="text-sm text-blue-600 dark:text-blue-300">Visualize transaction flows</p>
          </div>
        </Link>
        <Link to="/wallet-analysis" className="flex items-center justify-center p-4 bg-purple-100 dark:bg-purple-900 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-100">Wallet Analysis</h2>
            <p className="text-sm text-purple-600 dark:text-purple-300">Deep dive into wallet activity</p>
          </div>
        </Link>
        <Link to="/entity-labels" className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-100">Entity Labels</h2>
            <p className="text-sm text-green-600 dark:text-green-300">Identify wallet entities</p>
          </div>
        </Link>
        <Link to="/transaction-clustering" className="flex items-center justify-center p-4 bg-amber-100 dark:bg-amber-900 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-100">Transaction Clustering</h2>
            <p className="text-sm text-amber-600 dark:text-amber-300">Group related transactions</p>
          </div>
        </Link>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter Solana wallet address"
            className="flex-1 px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>

      {/* Loading state */}
      {(txLoading || balancesLoading) && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}

      {/* Error state */}
      {txError && (
        <div className="text-red-600 mb-4 p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-md">
          {txError instanceof Error ? txError.message : 'An error occurred'}
        </div>
      )}

      {/* Results display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions */}
        <div className="lg:col-span-2">
          {transactions && transactions.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Signature</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fee (SOL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((tx: HeliusTransaction) => (
                      <tr 
                        key={tx.signature} 
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedTransaction === tx.signature ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
                        onClick={() => handleTransactionClick(tx.signature)}
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(tx.type)}`}>
                            {tx.type || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(tx.blockTime * 1000).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {tx.amount ? `${tx.amount} ${tx.tokenInfo?.symbol || 'SOL'}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatSol(tx.fee)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : currentAddress && !txLoading ? (
            <div className="text-center text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              No transactions found for this address
            </div>
          ) : null}
        </div>

        {/* Sidebar with token balances and transaction details */}
        <div className="space-y-6">
          {/* Token Balances */}
          {tokenBalances && tokenBalances.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Token Holdings</h2>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tokenBalances.map((token) => (
                    <li key={token.mint} className="py-3">
                      <div className="flex items-center space-x-3">
                        {token.logo && (
                          <div className="flex-shrink-0 h-6 w-6">
                            <img 
                              src={token.logo} 
                              alt={token.symbol || 'token'} 
                              className="h-6 w-6 rounded-full"
                              onError={(e) => {
                                // Handle image load errors
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {token.symbol || token.mint.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {token.uiAmount}
                          </p>
                        </div>
                        {token.value !== undefined && (
                          <div className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-white">
                            ${token.value.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          {selectedTransaction && (detailsLoading ? (
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <Spinner />
            </div>
          ) : transactionDetails ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Details</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{transactionDetails.type}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{transactionDetails.description}</p>
                </div>
                
                {transactionDetails.nativeTransfers && transactionDetails.nativeTransfers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">SOL Transfers</h3>
                    <div className="mt-1 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">From</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">To</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {transactionDetails.nativeTransfers.map((transfer, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {transfer.fromUserAccount.slice(0, 6)}...{transfer.fromUserAccount.slice(-6)}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {transfer.toUserAccount.slice(0, 6)}...{transfer.toUserAccount.slice(-6)}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                                {formatSol(transfer.amount)} SOL
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {transactionDetails.tokenTransfers && transactionDetails.tokenTransfers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Token Transfers</h3>
                    <div className="mt-1 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">From</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">To</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Token</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {transactionDetails.tokenTransfers.map((transfer, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {transfer.fromUserAccount.slice(0, 6)}...{transfer.fromUserAccount.slice(-6)}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {transfer.toUserAccount.slice(0, 6)}...{transfer.toUserAccount.slice(-6)}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                                {transfer.tokenAmount}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                {transfer.mint.slice(0, 6)}...
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <p className="text-gray-500 dark:text-gray-400">No transaction details available</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 