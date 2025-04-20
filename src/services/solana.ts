import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import axios from 'axios';

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const HELIUS_API_URL = `https://api.helius.xyz/v0/addresses`;

export async function fetchWalletTransactions(
  connection: Connection,
  address: PublicKey,
  limit: number = 20
): Promise<ParsedTransactionWithMeta[]> {
  try {
    const signatures = await connection.getSignaturesForAddress(address, { limit });
    const transactions = await connection.getParsedTransactions(
      signatures.map((sig) => sig.signature)
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
    const response = await axios.get(`${HELIUS_API_URL}/${address}/balances`, {
      headers: {
        'Authorization': `Bearer ${HELIUS_API_KEY}`
      }
    });
    return response.data.tokens;
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
    const response = await axios.get(`${HELIUS_API_URL}/${address}/transactions`, {
      params: {
        'api-key': HELIUS_API_KEY,
        'type': 'TRANSFER',
        'days': days
      }
    });
    
    return response.data.map((tx: any) => ({
      from: tx.sourceAddress,
      to: tx.destinationAddress,
      amount: tx.amount,
      token: tx.token,
      timestamp: tx.timestamp
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
    const response = await axios.post(`${HELIUS_API_URL}/labels`, {
      addresses,
      'api-key': HELIUS_API_KEY
    });
    
    return response.data.map((item: any) => ({
      address: item.address,
      label: item.label,
      confidence: item.confidence,
      type: item.type
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
    const response = await axios.get(`${HELIUS_API_URL}/${address}/activity`, {
      headers: {
        'Authorization': `Bearer ${HELIUS_API_KEY}`
      }
    });
    
    return {
      totalTransactions: response.data.totalTransactions,
      uniqueInteractions: response.data.uniqueInteractions,
      volumeStats: {
        incoming: response.data.volumeStats.incoming,
        outgoing: response.data.volumeStats.outgoing
      },
      lastActive: response.data.lastActive
    };
  } catch (error) {
    console.error('Error analyzing wallet activity:', error);
    throw error;
  }
} 