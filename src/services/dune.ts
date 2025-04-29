import axios from 'axios';

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
    const response = await axios.get(`https://api.dune.com/api/echo/beta/balances/svm/${address}`, {
      headers: {
        'X-Dune-Api-Key': import.meta.env.VITE_DUNE_API_KEY
      }
    });
    
    const data: DuneApiResponse = response.data;
    return data.balances || [];
  } catch (error) {
    console.error('Error fetching token balances from Dune:', error);
    throw new Error('Failed to fetch token balances');
  }
} 