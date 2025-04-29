import { useState, useEffect } from 'react';
import axios from 'axios';
import { NewTokensSection } from '../RugCheck/NewTokensSection';
import type { NewToken } from '../RugCheck/types';

const API_BASE_URL = 'https://api.rugcheck.xyz/v1';

export default function NewTokens() {
  const [newTokens, setNewTokens] = useState<NewToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewTokens = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/stats/new_tokens`);
        setNewTokens(response.data);
      } catch (err) {
        setError('Failed to fetch new tokens');
        console.error('Failed to fetch new tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNewTokens();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 gradient-text">New Tokens</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor recently created tokens on the Solana network.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <NewTokensSection tokens={newTokens} />
      )}
    </div>
  );
} 