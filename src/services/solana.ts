import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import axios from 'axios';

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta';

// Create a connection using Helius RPC URL
const connection = new Connection(HELIUS_RPC_URL);

// Known entity labels for common Solana addresses
const KNOWN_ENTITIES: Record<string, { label: string; type: string }> = {
  'GUzaohfNuFbBqQTnPgPSNciv3aUvriXYjQduRE3ZkXDX': { label: 'Mango Markets', type: 'dex' },
  'J8yQQ95WitFXA1H5UYz3xbTeziEEJbLUCj6qdLgFRz1y': { label: 'Raydium', type: 'dex' },
  'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX': { label: 'Hubble', type: 'defi' },
  'So11111111111111111111111111111111111111112': { label: 'Wrapped SOL', type: 'token' },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { label: 'USDC', type: 'token' },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { label: 'Raydium LP', type: 'liquidity' },
  '7RCz8wb6WXxUhAigZXENr6W8fNB9e5k7kYnJpqJWrYXQ': { label: 'Binance Hot Wallet', type: 'exchange' },
  '3h1zGmCwsRJnVk5BuRNnuBZpMYZy4zHEE1LGD3whYab9': { label: 'OKX Hot Wallet', type: 'exchange' },
  'AHntTjf527AAt8PxWWxFKFwQPcqYEgJw4VB4eXkjvoaX': { label: 'Coinbase Hot Wallet', type: 'exchange' },
};

export interface HeliusTransaction {
  signature: string;
  type: string;
  blockTime: number;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  fee: number;
  source?: string;
  destination?: string;
  amount?: number;
  tokenInfo?: {
    mint: string;
    symbol: string;
    decimals: number;
  };
}

export interface EnhancedTransaction {
  signature: string;
  type: string;
  description: string;
  blockTime: number;
  fee: number;
  accounts: {
    inner: string[];
    outer: string[];
  };
  tokenTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }[];
  nativeTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }[];
}

// Fetch enhanced transaction details using Helius API
export async function fetchEnhancedTransaction(signature: string): Promise<EnhancedTransaction | null> {
  try {
    const response = await axios.post(
      HELIUS_RPC_URL,
      {
        jsonrpc: "2.0",
        id: "enhanced-transaction",
        method: "getTransaction",
        params: [
          signature,
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }
        ],
      }
    );

    if (response.data.error) {
      console.error('Error fetching transaction:', response.data.error);
      return null;
    }

    if (!response.data.result) {
      return null;
    }

    // Call Parse Transaction API to get enhanced details
    const parseResponse = await axios.post(
      `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`, 
      { transactions: [signature] }
    );

    if (parseResponse.data && parseResponse.data.length > 0) {
      return parseResponse.data[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching enhanced transaction:', error);
    return null;
  }
}

export async function fetchWalletTransactions(
  walletAddress: string,
  limit: number = 20
): Promise<HeliusTransaction[]> {
  try {
    const pubKey = new PublicKey(walletAddress);
    const signatures = await connection.getSignaturesForAddress(
      pubKey,
      { limit },
      'confirmed'
    );

    if (!signatures.length) {
      return [];
    }

    // Get enhanced transaction data from Helius
    const parsedTxs = await axios.post(
      `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`, 
      { transactions: signatures.map(sig => sig.signature) }
    );

    const transactions = parsedTxs.data.map((tx: any, index: number) => {
      // Extract useful info based on transaction type
      let source = '';
      let destination = '';
      let amount = 0;
      let tokenInfo = undefined;

      // Check for native transfers
      if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
        source = tx.nativeTransfers[0].fromUserAccount;
        destination = tx.nativeTransfers[0].toUserAccount;
        amount = tx.nativeTransfers[0].amount / 1e9; // Convert lamports to SOL
      } 
      // Check for token transfers
      else if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        source = tx.tokenTransfers[0].fromUserAccount;
        destination = tx.tokenTransfers[0].toUserAccount;
        amount = tx.tokenTransfers[0].tokenAmount;
        tokenInfo = {
          mint: tx.tokenTransfers[0].mint,
          symbol: tx.tokenTransfers[0].symbol || 'Unknown',
          decimals: tx.tokenTransfers[0].decimals || 0
        };
      }

      return {
        signature: signatures[index].signature,
        type: tx.type,
        blockTime: signatures[index].blockTime || 0,
        confirmationStatus: signatures[index].confirmationStatus || 'finalized',
        fee: tx.fee || 0,
        source,
        destination,
        amount,
        tokenInfo
      };
    });

    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
  logo?: string;
  price?: number;
  value?: number;
  tokenProgram: string;
}

export async function fetchTokenBalances(address: string): Promise<TokenBalance[]> {
  try {
    const response = await axios.post(
      HELIUS_RPC_URL,
      {
        jsonrpc: "2.0",
        id: "token-balances",
        method: "getTokenAccountsByOwner",
        params: [
          address,
          {
            programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          },
          {
            encoding: "jsonParsed"
          }
        ],
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    // Fetch token metadata to enhance the response
    const balances = response.data.result.value.map((account: any) => ({
      mint: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.amount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals,
      uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
      tokenProgram: account.account.owner,
    }));

    // Get token metadata if available
    const mints = balances.map((balance: TokenBalance) => balance.mint);
    if (mints.length > 0) {
      try {
        const tokenInfoResponse = await axios.get(
          `https://api.helius.xyz/v0/tokens/metadata?api-key=${HELIUS_API_KEY}&mints=${mints.join(',')}`
        );
        
        // Enhance token balances with metadata
        return balances.map((balance: TokenBalance) => {
          const metadata = tokenInfoResponse.data.find((t: any) => t.mint === balance.mint);
          if (metadata) {
            return {
              ...balance,
              symbol: metadata.symbol,
              name: metadata.name,
              logo: metadata.images?.large || metadata.images?.small,
              price: metadata.price,
              value: balance.uiAmount * (metadata.price || 0)
            };
          }
          return balance;
        });
      } catch (error) {
        console.error('Error fetching token metadata:', error);
      }
    }

    return balances;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    throw error;
  }
}

export interface TransactionFlow {
  signature: string;
  from: string;
  to: string;
  amount: number;
  token: string;
  timestamp: number;
  transactionType: string;
  fromLabel?: string;
  toLabel?: string;
}

export async function fetchTransactionFlow(address: string, days: number = 30): Promise<TransactionFlow[]> {
  try {
    // Calculate timestamp for filtering by date
    const fromTimestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    // Get transactions for the address
    const transactions = await fetchWalletTransactions(address, 100);
    
    // Filter transactions by timestamp and extract flow data
    const txFlows: TransactionFlow[] = [];
    
    for (const tx of transactions) {
      if (tx.blockTime < fromTimestamp) continue;
      
      if (tx.source && tx.destination && tx.amount) {
        const flow: TransactionFlow = {
          signature: tx.signature,
          from: tx.source,
          to: tx.destination,
          amount: tx.amount,
          token: tx.tokenInfo?.symbol || 'SOL',
          timestamp: tx.blockTime * 1000,
          transactionType: tx.type,
          fromLabel: KNOWN_ENTITIES[tx.source]?.label,
          toLabel: KNOWN_ENTITIES[tx.destination]?.label
        };
        
        txFlows.push(flow);
      }
    }

    return txFlows;
  } catch (error) {
    console.error('Error fetching transaction flow:', error);
    throw error;
  }
}

// Function to calculate critical paths in transaction flows
export interface CriticalPathData {
  highValuePaths: {from: string, to: string}[];
  frequentPaths: {from: string, to: string, count: number}[];
  suspiciousPatterns: {
    addresses: string[],
    reason: string,
    riskScore: number // 0-1 scale
  }[];
}

export async function identifyCriticalPaths(
  flows: TransactionFlow[], 
  params: {
    highValueThreshold?: number,
    minFrequency?: number,
    includeCircular?: boolean
  } = {}
): Promise<CriticalPathData> {
  // Set default parameters
  const highValueThreshold = params.highValueThreshold || 10; // Default 10 SOL
  const minFrequency = params.minFrequency || 3; // Default 3 transactions
  const includeCircular = params.includeCircular !== undefined ? params.includeCircular : true;
  
  // Results
  const criticalPaths: CriticalPathData = {
    highValuePaths: [],
    frequentPaths: [],
    suspiciousPatterns: []
  };
  
  // Maps to track frequencies
  const pathFrequency = new Map<string, number>();
  const pathTotalValue = new Map<string, number>();
  
  // Process all transactions
  flows.forEach(flow => {
    const pathKey = `${flow.from}|${flow.to}`;
    
    // Count frequency
    pathFrequency.set(pathKey, (pathFrequency.get(pathKey) || 0) + 1);
    
    // Sum values
    pathTotalValue.set(pathKey, (pathTotalValue.get(pathKey) || 0) + flow.amount);
    
    // Check for high value paths
    if (flow.amount >= highValueThreshold) {
      criticalPaths.highValuePaths.push({
        from: flow.from,
        to: flow.to
      });
    }
  });
  
  // Find frequent paths
  for (const [path, count] of pathFrequency.entries()) {
    if (count >= minFrequency) {
      const [from, to] = path.split('|');
      criticalPaths.frequentPaths.push({
        from,
        to,
        count
      });
    }
  }
  
  // Detect suspicious patterns
  if (includeCircular) {
    const addressGraph = new Map<string, Set<string>>();
    
    // Build graph
    flows.forEach(flow => {
      if (!addressGraph.has(flow.from)) {
        addressGraph.set(flow.from, new Set());
      }
      addressGraph.get(flow.from)!.add(flow.to);
    });
    
    // Find circular paths (potential wash trading or layering)
    const findCircularPaths = (start: string, current: string, visited: Set<string>, path: string[]) => {
      if (visited.has(current)) {
        // If we've found a cycle and it includes the start node
        if (current === start && path.length > 2) {
          criticalPaths.suspiciousPatterns.push({
            addresses: [...path],
            reason: 'Circular fund flow detected',
            riskScore: Math.min(0.5 + (path.length * 0.1), 1) // More hops = higher risk, max 1
          });
        }
        return;
      }
      
      visited.add(current);
      path.push(current);
      
      const neighbors = addressGraph.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          findCircularPaths(start, neighbor, new Set(visited), [...path]);
        }
      }
      
      path.pop();
      visited.delete(current);
    };
    
    // Start DFS from each node
    for (const address of addressGraph.keys()) {
      findCircularPaths(address, address, new Set(), []);
    }
  }
  
  return criticalPaths;
}

export interface EntityLabel {
  address: string;
  label: string;
  confidence: number;
  type: string;
}

export async function fetchEntityLabels(addresses: string[]): Promise<EntityLabel[]> {
  try {
    // First check against known entities
    const results: EntityLabel[] = [];
    
    for (const address of addresses) {
      if (KNOWN_ENTITIES[address]) {
        results.push({
          address,
          label: KNOWN_ENTITIES[address].label,
          confidence: 1.0,
          type: KNOWN_ENTITIES[address].type
        });
      } else {
        // For unknown addresses, analyze their transaction patterns
        try {
          const transactions = await fetchWalletTransactions(address, 10);
          
          // Very simple heuristic for entity detection
          let isExchange = false;
          let isDex = false;
          let isNFT = false;
          
          for (const tx of transactions) {
            if (tx.type === 'SWAP' || tx.type === 'SWAP_EXACT_IN' || tx.type === 'SWAP_EXACT_OUT') {
              isDex = true;
            }
            if (tx.type.includes('NFT')) {
              isNFT = true;
            }
            // Check if the address interacts with known exchanges
            for (const entity in KNOWN_ENTITIES) {
              if (KNOWN_ENTITIES[entity].type === 'exchange' && 
                 (tx.source === entity || tx.destination === entity)) {
                isExchange = true;
              }
            }
          }
          
          let label = 'Unknown';
          let type = 'wallet';
          let confidence = 0.5;
          
          if (isExchange) {
            label = 'Possible Exchange';
            type = 'exchange';
            confidence = 0.7;
          } else if (isDex) {
            label = 'DEX User';
            type = 'trader';
            confidence = 0.8;
          } else if (isNFT) {
            label = 'NFT Trader';
            type = 'nft';
            confidence = 0.8;
          }
          
          results.push({
            address,
            label,
            confidence,
            type
          });
        } catch (error) {
          results.push({
            address,
            label: 'Unknown',
            confidence: 0,
            type: 'wallet'
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching entity labels:', error);
    throw error;
  }
}

export interface WalletActivity {
  totalTransactions: number;
  uniqueInteractions: {
    address: string;
    count: number;
    label?: string;
  }[];
  volumeStats: {
    incoming: number;
    outgoing: number;
  };
  lastActive: number;
  firstActive: number;
  transactionsByType: {
    type: string;
    count: number;
  }[];
  fundingSource?: {
    address: string;
    amount: number;
    time: number;
    label?: string;
  };
}

export async function analyzeWalletActivity(address: string): Promise<WalletActivity> {
  try {
    const transactions = await fetchWalletTransactions(address, 50);
    
    // Track unique addresses interacted with
    const addressInteractions = new Map<string, number>();
    let incoming = 0;
    let outgoing = 0;
    let firstActive = Date.now();
    let lastActive = 0;
    
    // Count transactions by type
    const txTypeCount = new Map<string, number>();
    
    // Possible initial funding source
    let fundingSource: {
      address: string;
      amount: number;
      time: number;
      label?: string;
    } | undefined = undefined;
    
    transactions.forEach(tx => {
      // Update time range
      if (tx.blockTime * 1000 < firstActive) {
        firstActive = tx.blockTime * 1000;
      }
      if (tx.blockTime * 1000 > lastActive) {
        lastActive = tx.blockTime * 1000;
      }
      
      // Count transaction types
      const txType = tx.type || 'UNKNOWN';
      txTypeCount.set(txType, (txTypeCount.get(txType) || 0) + 1);
      
      // Count interactions
      if (tx.source && tx.source !== address) {
        addressInteractions.set(tx.source, (addressInteractions.get(tx.source) || 0) + 1);
        incoming += tx.amount || 0;
        
        // Check if this might be the funding source (first large incoming tx)
        if (!fundingSource && tx.amount && tx.amount > 0.1) {
          fundingSource = {
            address: tx.source,
            amount: tx.amount,
            time: tx.blockTime * 1000,
            label: KNOWN_ENTITIES[tx.source]?.label
          };
        }
      }
      
      if (tx.destination && tx.destination !== address) {
        addressInteractions.set(tx.destination, (addressInteractions.get(tx.destination) || 0) + 1);
        outgoing += tx.amount || 0;
      }
    });
    
    // Convert unique interactions to array and sort by count
    const uniqueInteractions = Array.from(addressInteractions.entries())
      .map(([address, count]) => ({
        address,
        count,
        label: KNOWN_ENTITIES[address]?.label
      }))
      .sort((a, b) => b.count - a.count);
    
    // Convert transaction types to array
    const transactionsByType = Array.from(txTypeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    
    return {
      totalTransactions: transactions.length,
      uniqueInteractions,
      volumeStats: {
        incoming,
        outgoing
      },
      lastActive,
      firstActive,
      transactionsByType,
      fundingSource
    };
  } catch (error) {
    console.error('Error analyzing wallet activity:', error);
    throw error;
  }
}

export interface TransactionCluster {
  id: string;
  label: string;
  addresses: string[];
  transactions: number;
  volume: number;
  suspiciousScore: number; // 0-1 representing how suspicious this cluster is
  relatedClusters: {
    id: string;
    strength: number; // 0-1 representing connection strength
  }[];
}

export async function clusterTransactions(centerAddress: string, depth: number = 1): Promise<TransactionCluster[]> {
  try {
    // Get first-level transactions
    const transactions = await fetchWalletTransactions(centerAddress, 100);
    
    // Build address set for exploring
    const uniqueAddresses = new Set<string>();
    const addressInteractions = new Map<string, number>();
    const addressVolume = new Map<string, number>();
    const addressConnections = new Map<string, Set<string>>();
    
    // Initial mapping
    transactions.forEach(tx => {
      if (tx.source && tx.source !== centerAddress) {
        uniqueAddresses.add(tx.source);
        addressInteractions.set(tx.source, (addressInteractions.get(tx.source) || 0) + 1);
        addressVolume.set(tx.source, (addressVolume.get(tx.source) || 0) + (tx.amount || 0));
        
        // Track connections
        if (!addressConnections.has(tx.source)) {
          addressConnections.set(tx.source, new Set<string>());
        }
        if (tx.destination) {
          addressConnections.get(tx.source)?.add(tx.destination);
        }
      }
      
      if (tx.destination && tx.destination !== centerAddress) {
        uniqueAddresses.add(tx.destination);
        addressInteractions.set(tx.destination, (addressInteractions.get(tx.destination) || 0) + 1);
        addressVolume.set(tx.destination, (addressVolume.get(tx.destination) || 0) + (tx.amount || 0));
        
        // Track connections
        if (!addressConnections.has(tx.destination)) {
          addressConnections.set(tx.destination, new Set<string>());
        }
        if (tx.source) {
          addressConnections.get(tx.destination)?.add(tx.source);
        }
      }
    });
    
    // For each additional depth level, get transactions for high-interaction addresses
    if (depth > 1) {
      // Sort addresses by interaction count and take top 5
      const topAddresses = Array.from(addressInteractions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
      
      for (const address of topAddresses) {
        const secondLevelTxs = await fetchWalletTransactions(address, 20);
        
        secondLevelTxs.forEach(tx => {
          if (tx.source) {
            uniqueAddresses.add(tx.source);
            addressInteractions.set(tx.source, (addressInteractions.get(tx.source) || 0) + 1);
            addressVolume.set(tx.source, (addressVolume.get(tx.source) || 0) + (tx.amount || 0));
            
            // Track connections
            if (!addressConnections.has(tx.source)) {
              addressConnections.set(tx.source, new Set<string>());
            }
            if (tx.destination) {
              addressConnections.get(tx.source)?.add(tx.destination);
            }
          }
          
          if (tx.destination) {
            uniqueAddresses.add(tx.destination);
            addressInteractions.set(tx.destination, (addressInteractions.get(tx.destination) || 0) + 1);
            addressVolume.set(tx.destination, (addressVolume.get(tx.destination) || 0) + (tx.amount || 0));
            
            // Track connections
            if (!addressConnections.has(tx.destination)) {
              addressConnections.set(tx.destination, new Set<string>());
            }
            if (tx.source) {
              addressConnections.get(tx.destination)?.add(tx.source);
            }
          }
        });
      }
    }
    
    // Identify clusters using a simple algorithm based on connection patterns
    const clusters: TransactionCluster[] = [];
    const processedAddresses = new Set<string>();
    
    // First, add the center address as its own cluster
    clusters.push({
      id: 'center',
      label: 'Central Address',
      addresses: [centerAddress],
      transactions: transactions.length,
      volume: transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
      suspiciousScore: 0,
      relatedClusters: []
    });
    processedAddresses.add(centerAddress);
    
    // Helper function to detect cyclic transfers which may indicate suspicious activity
    const detectCyclicTransfers = (addresses: string[]): number => {
      if (addresses.length < 3) return 0;
      
      // Check if any address connects back to the cluster
      let cycles = 0;
      for (let i = 0; i < addresses.length; i++) {
        const connections = addressConnections.get(addresses[i]) || new Set();
        
        for (let j = 0; j < addresses.length; j++) {
          if (i !== j && connections.has(addresses[j])) {
            cycles++;
          }
        }
      }
      
      return Math.min(cycles / (addresses.length * 2), 1);
    };
    
    // Group similar addresses
    let clusterId = 1;
    for (const address of uniqueAddresses) {
      if (processedAddresses.has(address)) continue;
      
      const connections = addressConnections.get(address) || new Set();
      const clusterAddresses = [address];
      processedAddresses.add(address);
      
      // Find addresses that share connections
      for (const otherAddress of uniqueAddresses) {
        if (processedAddresses.has(otherAddress) || otherAddress === address) continue;
        
        const otherConnections = addressConnections.get(otherAddress) || new Set();
        
        // Calculate connection overlap
        let overlap = 0;
        for (const conn of connections) {
          if (otherConnections.has(conn)) {
            overlap++;
          }
        }
        
        // If significant overlap (>30%), include in the same cluster
        if (connections.size > 0 && overlap / connections.size > 0.3) {
          clusterAddresses.push(otherAddress);
          processedAddresses.add(otherAddress);
        }
      }
      
      // Calculate cluster stats
      const clusterTransactions = clusterAddresses.reduce(
        (sum, addr) => sum + (addressInteractions.get(addr) || 0), 0);
      const clusterVolume = clusterAddresses.reduce(
        (sum, addr) => sum + (addressVolume.get(addr) || 0), 0);
      
      // Detect suspicious patterns
      const suspiciousScore = detectCyclicTransfers(clusterAddresses);
      
      clusters.push({
        id: `cluster-${clusterId++}`,
        label: `Cluster ${clusterId}`,
        addresses: clusterAddresses,
        transactions: clusterTransactions,
        volume: clusterVolume,
        suspiciousScore,
        relatedClusters: []
      });
    }
    
    // Establish relationships between clusters
    for (let i = 0; i < clusters.length; i++) {
      for (let j = 0; j < clusters.length; j++) {
        if (i === j) continue;
        
        // Calculate connection strength between clusters
        let connections = 0;
        for (const addrA of clusters[i].addresses) {
          const addrAConnections = addressConnections.get(addrA) || new Set();
          
          for (const addrB of clusters[j].addresses) {
            if (addrAConnections.has(addrB)) {
              connections++;
            }
          }
        }
        
        const strength = Math.min(
          connections / (clusters[i].addresses.length * clusters[j].addresses.length),
          1
        );
        
        if (strength > 0.1) {
          clusters[i].relatedClusters.push({
            id: clusters[j].id,
            strength
          });
        }
      }
    }
    
    return clusters;
  } catch (error) {
    console.error('Error clustering transactions:', error);
    throw error;
  }
}

export interface FundingHistory {
  transactions: {
    signature: string;
    source: string;
    amount: number;
    timestamp: number;
    sourceLabel?: string;
    sourceType?: string;
    isInitial: boolean;
  }[];
  totalAmount: number;
  primarySources: {
    address: string;
    amount: number;
    percentage: number;
    label?: string;
    type?: string;
  }[];
}

export interface ActivityPattern {
  hourlyDistribution: { hour: number; count: number }[];
  weeklyDistribution: { day: number; count: number }[];
  burstActivity: {
    timestamp: number;
    duration: number; // in minutes
    transactionCount: number;
    totalValue: number;
  }[];
  commonPatterns: {
    pattern: string;
    frequency: number;
    description: string;
    riskScore: number;
  }[];
  avgTransactionValue: number;
  avgDailyTransactions: number;
  activeHours: number[];
  activeDays: number[];
}

export interface EntityConnection {
  address: string;
  label?: string;
  type?: string;
  firstInteraction: number;
  lastInteraction: number;
  totalTransactions: number;
  totalVolume: number;
  direction: 'incoming' | 'outgoing' | 'bidirectional';
  riskScore: number;
  commonTransactionTypes: { type: string; count: number }[];
}

export interface EnhancedWalletActivity extends WalletActivity {
  fundingHistory: FundingHistory;
  activityPatterns: ActivityPattern;
  entityConnections: EntityConnection[];
  riskAssessment: {
    overallScore: number; // 0-1
    factors: {
      factor: string;
      score: number;
      explanation: string;
    }[];
  };
}

export async function fetchFundingHistory(address: string): Promise<FundingHistory> {
  try {
    const transactions = await fetchWalletTransactions(address, 1000); // Get more historical data
    const fundingTxs = transactions.filter(tx => 
      tx.destination === address && (tx.amount ?? 0) > 0
    );

    // Sort by time to find initial funding
    fundingTxs.sort((a, b) => a.blockTime - b.blockTime);

    const history: FundingHistory = {
      transactions: [],
      totalAmount: 0,
      primarySources: []
    };

    const sourceAmounts = new Map<string, number>();

    for (const tx of fundingTxs) {
      if (tx.source) {
        const entity = KNOWN_ENTITIES[tx.source];
        const amount = tx.amount ?? 0;
        history.transactions.push({
          signature: tx.signature,
          source: tx.source,
          amount,
          timestamp: tx.blockTime * 1000,
          sourceLabel: entity?.label,
          sourceType: entity?.type,
          isInitial: history.transactions.length === 0
        });

        history.totalAmount += amount;
        sourceAmounts.set(
          tx.source, 
          (sourceAmounts.get(tx.source) || 0) + amount
        );
      }
    }

    // Calculate primary sources
    const sortedSources = Array.from(sourceAmounts.entries())
      .sort((a, b) => b[1] - a[1]);

    history.primarySources = sortedSources.map(([address, amount]) => {
      const entity = KNOWN_ENTITIES[address];
      return {
        address,
        amount,
        percentage: (amount / history.totalAmount) * 100,
        label: entity?.label,
        type: entity?.type
      };
    });

    return history;
  } catch (error) {
    console.error('Error fetching funding history:', error);
    throw error;
  }
}

export async function analyzeActivityPatterns(address: string): Promise<ActivityPattern> {
  try {
    const transactions = await fetchWalletTransactions(address, 1000);
    const pattern: ActivityPattern = {
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
      weeklyDistribution: Array.from({ length: 7 }, (_, i) => ({ day: i, count: 0 })),
      burstActivity: [],
      commonPatterns: [],
      avgTransactionValue: 0,
      avgDailyTransactions: 0,
      activeHours: [],
      activeDays: []
    };

    let totalValue = 0;
    const txsByHour = new Map<number, number>();
    const txsByDay = new Map<number, number>();
    const txTimeWindows: number[] = [];

    transactions.forEach(tx => {
      const date = new Date(tx.blockTime * 1000);
      const hour = date.getUTCHours();
      const day = date.getUTCDay();

      // Update distributions
      pattern.hourlyDistribution[hour].count++;
      pattern.weeklyDistribution[day].count++;

      // Track transaction times for burst analysis
      txTimeWindows.push(tx.blockTime);

      // Update averages
      totalValue += tx.amount || 0;

      // Update hour and day counts
      txsByHour.set(hour, (txsByHour.get(hour) || 0) + 1);
      txsByDay.set(day, (txsByDay.get(day) || 0) + 1);
    });

    // Calculate averages
    pattern.avgTransactionValue = totalValue / transactions.length;
    pattern.avgDailyTransactions = transactions.length / 30; // Assuming 30 days of data

    // Find active periods
    pattern.activeHours = Array.from(txsByHour.entries())
      .filter(([_, count]) => count > pattern.avgDailyTransactions)
      .map(([hour]) => hour);

    pattern.activeDays = Array.from(txsByDay.entries())
      .filter(([_, count]) => count > pattern.avgDailyTransactions * 7)
      .map(([day]) => day);

    // Detect burst activity
    const BURST_WINDOW = 15 * 60; // 15 minutes in seconds
    let currentBurst = {
      start: 0,
      count: 0,
      value: 0
    };

    txTimeWindows.sort((a, b) => a - b);
    
    for (let i = 0; i < txTimeWindows.length; i++) {
      const currentTime = txTimeWindows[i];
      
      if (currentBurst.start === 0) {
        currentBurst.start = currentTime;
        currentBurst.count = 1;
        currentBurst.value = transactions[i].amount || 0;
      } else if (currentTime - currentBurst.start <= BURST_WINDOW) {
        currentBurst.count++;
        currentBurst.value += transactions[i].amount || 0;
      } else {
        if (currentBurst.count > 5) { // Minimum 5 transactions to consider it a burst
          pattern.burstActivity.push({
            timestamp: currentBurst.start * 1000,
            duration: (txTimeWindows[i-1] - currentBurst.start) / 60, // Convert to minutes
            transactionCount: currentBurst.count,
            totalValue: currentBurst.value
          });
        }
        currentBurst = {
          start: currentTime,
          count: 1,
          value: transactions[i].amount || 0
        };
      }
    }

    // Identify common patterns
    const patterns = [
      {
        test: (p: ActivityPattern) => p.burstActivity.length > 0,
        pattern: 'Burst Activity',
        description: 'Multiple transactions in short time windows',
        riskScore: 0.6
      },
      {
        test: (p: ActivityPattern) => p.activeHours.length <= 4,
        pattern: 'Time-Restricted Activity',
        description: 'Activity concentrated in specific time windows',
        riskScore: 0.4
      },
      {
        test: (p: ActivityPattern) => {
          const stdDev = calculateStdDev(p.hourlyDistribution.map(h => h.count));
          return stdDev > p.avgDailyTransactions * 2;
        },
        pattern: 'Irregular Activity',
        description: 'High variance in transaction timing',
        riskScore: 0.7
      }
    ];

    pattern.commonPatterns = patterns
      .filter(p => p.test(pattern))
      .map(p => ({
        pattern: p.pattern,
        frequency: transactions.length,
        description: p.description,
        riskScore: p.riskScore
      }));

    return pattern;
  } catch (error) {
    console.error('Error analyzing activity patterns:', error);
    throw error;
  }
}

function calculateStdDev(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b) / numbers.length;
  const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

export async function analyzeEntityConnections(address: string): Promise<EntityConnection[]> {
  try {
    const transactions = await fetchWalletTransactions(address, 1000);
    const connections = new Map<string, EntityConnection>();

    transactions.forEach(tx => {
      let interactionAddress: string | undefined;
      let direction: 'incoming' | 'outgoing' | 'bidirectional';

      if (tx.source === address && tx.destination) {
        interactionAddress = tx.destination;
        direction = 'outgoing';
      } else if (tx.destination === address && tx.source) {
        interactionAddress = tx.source;
        direction = 'incoming';
      } else {
        return;
      }

      if (!interactionAddress) return;

      const existing = connections.get(interactionAddress);
      const entity = KNOWN_ENTITIES[interactionAddress];
      const timestamp = tx.blockTime * 1000;

      if (existing) {
        existing.totalTransactions++;
        existing.totalVolume += tx.amount || 0;
        existing.lastInteraction = Math.max(existing.lastInteraction, timestamp);
        
        if (existing.direction !== direction) {
          existing.direction = 'bidirectional';
        }

        const typeIndex = existing.commonTransactionTypes.findIndex(t => t.type === tx.type);
        if (typeIndex >= 0) {
          existing.commonTransactionTypes[typeIndex].count++;
        } else {
          existing.commonTransactionTypes.push({ type: tx.type, count: 1 });
        }
      } else {
        connections.set(interactionAddress, {
          address: interactionAddress,
          label: entity?.label,
          type: entity?.type,
          firstInteraction: timestamp,
          lastInteraction: timestamp,
          totalTransactions: 1,
          totalVolume: tx.amount || 0,
          direction,
          riskScore: 0,
          commonTransactionTypes: [{ type: tx.type, count: 1 }]
        });
      }
    });

    // Calculate risk scores
    for (const connection of connections.values()) {
      let riskScore = 0;

      // Factors that increase risk score
      if (connection.direction === 'bidirectional') riskScore += 0.2;
      if (connection.totalTransactions > 50) riskScore += 0.3;
      if (connection.totalVolume > 100) riskScore += 0.3;
      if (!connection.label) riskScore += 0.2; // Unknown entity

      // Normalize risk score
      connection.riskScore = Math.min(riskScore, 1);
    }

    return Array.from(connections.values())
      .sort((a, b) => b.totalVolume - a.totalVolume);
  } catch (error) {
    console.error('Error analyzing entity connections:', error);
    throw error;
  }
}

export async function getEnhancedWalletActivity(address: string): Promise<EnhancedWalletActivity> {
  try {
    const [
      baseActivity,
      fundingHistory,
      activityPatterns,
      entityConnections
    ] = await Promise.all([
      analyzeWalletActivity(address),
      fetchFundingHistory(address),
      analyzeActivityPatterns(address),
      analyzeEntityConnections(address)
    ]);

    // Calculate overall risk score
    const riskFactors = [
      {
        factor: 'Funding Sources',
        score: fundingHistory.primarySources.filter(s => !s.label).length / fundingHistory.primarySources.length,
        explanation: 'Percentage of unknown funding sources'
      },
      {
        factor: 'Activity Patterns',
        score: activityPatterns.commonPatterns.reduce((acc, p) => acc + p.riskScore, 0) / 
               Math.max(activityPatterns.commonPatterns.length, 1),
        explanation: 'Suspicious activity patterns detected'
      },
      {
        factor: 'Entity Connections',
        score: entityConnections.reduce((acc, c) => acc + c.riskScore, 0) / 
               Math.max(entityConnections.length, 1),
        explanation: 'Risk assessment of connected entities'
      }
    ];

    const overallScore = riskFactors.reduce((acc, f) => acc + f.score, 0) / riskFactors.length;

    return {
      ...baseActivity,
      fundingHistory,
      activityPatterns,
      entityConnections,
      riskAssessment: {
        overallScore,
        factors: riskFactors
      }
    };
  } catch (error) {
    console.error('Error getting enhanced wallet activity:', error);
    throw error;
  }
} 