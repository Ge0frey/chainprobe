export interface TokenReport {
  mint: string;
  tokenProgram: string;
  token: {
    mintAuthority: string | null;
    supply: number;
    decimals: number;
    isInitialized: boolean;
    freezeAuthority: string | null;
  };
  tokenMeta: {
    name: string;
    symbol: string;
    uri: string;
    mutable: boolean;
    updateAuthority: string;
  };
  totalHolders: number;
  price: number;
  score: number;
  score_normalised: number;
  risks: {
    name: string;
    value: string;
    description: string;
    score: number;
    level: string;
  }[];
  verification: {
    mint: string;
    name: string;
    symbol: string;
    jup_verified: boolean;
    jup_strict: boolean;
    description: string;
  };
  rugged: boolean;
  totalMarketLiquidity: number;
}

export interface TokenSummary {
  mint: string;
  name: string;
  symbol: string;
  score: number;
  score_normalised: number;
  rugged: boolean;
}

export interface NewToken {
  mint: string;
  name: string;
  symbol: string;
  timestamp: number;
}

export interface TrendingToken {
  mint: string;
  name: string;
  symbol: string;
  votes: number;
  score_normalised: number;
}

export interface VerifiedToken {
  mint: string;
  name: string;
  symbol: string;
  verification_date: string;
} 