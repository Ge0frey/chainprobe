import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import axios from 'axios';

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_API_URL = `https://api-mainnet.helius.xyz/v0`;

// Create a connection using Helius RPC URL
const connection = new Connection(HELIUS_RPC_URL);

export async function fetchWalletTransactions(
  connection: Connection,
  address: PublicKey,
  limit: number = 20
): Promise<ParsedTransactionWithMeta[]> {
  try {
    const response = await axios.post(HELIUS_RPC_URL, {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getSignaturesForAddress",
      params: [
        address.toString(),
        {
          limit,
        },
      ],
    });

    if (response.data.error) {
      console.error('Error fetching signatures:', response.data.error);
      throw new Error(response.data.error.message);
    }

    const signatures = response.data.result;
    const transactions = await Promise.all(
      signatures.map((sig: any) =>
        connection.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 })
      )
    );

    return transactions.filter((tx): tx is ParsedTransactionWithMeta => tx !== null);
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
}

export async function fetchTokenBalances(address: string): Promise<TokenBalance[]> {
  try {
    const response = await axios.get(`${HELIUS_API_URL}/addresses/${address}/balances`, {
      headers: {
        'Authorization': `Bearer ${HELIUS_API_KEY}`
      }
    });
    return response.data.tokens || [];
  } catch (error) {
    console.error('Error fetching token balances:', error);
    throw error;
  }
}

export interface TransactionFlow {
  from: string;
  to: string;
  amount: number;
  token: string;
  timestamp: number;
}

export async function fetchTransactionFlow(address: string, days: number = 30): Promise<TransactionFlow[]> {
  try {
    const response = await axios.get(`${HELIUS_API_URL}/addresses/${address}/transactions`, {
      params: {
        'api-key': HELIUS_API_KEY,
        'type': 'TRANSFER',
        'days': days
      }
    });
    
    return (response.data || []).map((tx: any) => ({
      from: tx.sourceAddress || address,
      to: tx.destinationAddress || '',
      amount: tx.amount || 0,
      token: tx.token || 'SOL',
      timestamp: tx.timestamp || Date.now()
    }));
  } catch (error) {
    console.error('Error fetching transaction flow:', error);
    throw error;
  }
}

export interface EntityLabel {
  address: string;
  label: string;
  confidence: number;
  type: string;
}

export async function fetchEntityLabels(addresses: string[]): Promise<EntityLabel[]> {
  try {
    const response = await axios.post(`${HELIUS_API_URL}/addresses/labels`, {
      addresses,
      'api-key': HELIUS_API_KEY
    });
    
    return (response.data || []).map((item: any) => ({
      address: item.address || '',
      label: item.label || 'Unknown',
      confidence: item.confidence || 0,
      type: item.type || 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching entity labels:', error);
    throw error;
  }
}

export interface WalletActivity {
  totalTransactions: number;
  uniqueInteractions: string[];
  volumeStats: {
    incoming: number;
    outgoing: number;
  };
  lastActive: number;
}

export async function analyzeWalletActivity(address: string): Promise<WalletActivity> {
  try {
    const response = await axios.get(`${HELIUS_API_URL}/addresses/${address}/activity`, {
      headers: {
        'Authorization': `Bearer ${HELIUS_API_KEY}`
      }
    });
    
    return {
      totalTransactions: response.data?.totalTransactions || 0,
      uniqueInteractions: response.data?.uniqueInteractions || [],
      volumeStats: {
        incoming: response.data?.volumeStats?.incoming || 0,
        outgoing: response.data?.volumeStats?.outgoing || 0
      },
      lastActive: response.data?.lastActive || Date.now()
    };
  } catch (error) {
    console.error('Error analyzing wallet activity:', error);
    throw error;
  }
} 