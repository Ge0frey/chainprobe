import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import axios from 'axios';

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Create a connection using Helius RPC URL
const connection = new Connection(HELIUS_RPC_URL);

interface HeliusTransaction {
  signature: string;
  blockTime: number;
  confirmationStatus: string;
}

export async function fetchWalletTransactions(
  connection: Connection,
  address: PublicKey,
  limit: number = 20
): Promise<HeliusTransaction[]> {
  try {
    const response = await axios.post(
      HELIUS_RPC_URL,
      {
        jsonrpc: "2.0",
        id: "my-id",
        method: "getSignaturesForAddress",
        params: [
          address.toString(),
          {
            limit,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    const signatures = response.data.result;
    
    // Map the signatures to the format we need
    return signatures.map((sig: any) => ({
      signature: sig.signature,
      blockTime: sig.blockTime,
      confirmationStatus: sig.confirmationStatus || 'finalized'
    }));
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
    const response = await axios.post(
      HELIUS_RPC_URL,
      {
        jsonrpc: "2.0",
        id: "my-id",
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
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.result.value.map((account: any) => ({
      mint: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.amount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals,
      uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
    }));
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
    // First get all signatures
    const signatures = await fetchWalletTransactions(connection, new PublicKey(address));
    
    // Then get transaction details
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const response = await axios.post(
          HELIUS_RPC_URL,
          {
            jsonrpc: "2.0",
            id: "my-id",
            method: "getTransaction",
            params: [
              sig.signature,
              { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }
            ],
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data.error) {
          return null;
        }

        const tx = response.data.result;
        if (!tx) return null;

        return {
          from: tx.message.accountKeys[0].pubkey,
          to: tx.message.accountKeys[1].pubkey,
          amount: tx.meta?.fee || 0,
          token: 'SOL',
          timestamp: sig.blockTime * 1000
        };
      })
    );

    return transactions.filter((tx): tx is TransactionFlow => tx !== null);
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
    // For now, return placeholder data as this requires additional Helius API endpoints
    return addresses.map(address => ({
      address,
      label: 'Unknown',
      confidence: 0,
      type: 'wallet'
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
    const transactions = await fetchWalletTransactions(connection, new PublicKey(address));
    const uniqueAddresses = new Set<string>();
    let incoming = 0;
    let outgoing = 0;

    transactions.forEach(tx => {
      uniqueAddresses.add(tx.signature);
      // For now, we're just counting transactions
      incoming += 1;
    });

    return {
      totalTransactions: transactions.length,
      uniqueInteractions: Array.from(uniqueAddresses),
      volumeStats: {
        incoming,
        outgoing
      },
      lastActive: transactions[0]?.blockTime || Date.now()
    };
  } catch (error) {
    console.error('Error analyzing wallet activity:', error);
    throw error;
  }
} 