import axios from 'axios';

// Backend API URL - update this for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface DuneTokenBalance {
  address: string;
  amount: string;
  chain: string;
  chain_id: number;
  decimals: number;
  low_liquidity: boolean;
  name: string;
  pool_size: number;
  price_usd: number;
  symbol: string;
  token_metadata: {
    logo: string;
    url: string;
  };
  value_usd: number;
}

export interface DuneApiResponse {
  balances: DuneTokenBalance[];
  errors?: {
    error_message?: string;
    token_errors?: {
      address: string;
      chain_id: number;
      description: string;
    }[];
  };
  next_offset?: string;
  request_time: string;
  response_time: string;
  wallet_address: string;
}

export async function fetchDuneTokenBalances(address: string): Promise<DuneTokenBalance[]> {
  try {
    // Use backend proxy instead of direct API call
    const response = await axios.get(`${API_BASE_URL}/api/dune/balances/${address}`);
    
    const data: DuneApiResponse = response.data;
    return data.balances || [];
  } catch (error) {
    console.error('Error fetching token balances from Dune:', error);
    throw new Error('Failed to fetch token balances');
  }
} 