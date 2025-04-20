export interface HeliusTransaction {
  signature: string;
  blockTime: number;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  slot: number;
  err: any | null;
  fee: number;
  meta: {
    err: any | null;
    fee: number;
    innerInstructions: any[];
    logMessages: string[];
    postBalances: number[];
    postTokenBalances: any[];
    preBalances: number[];
    preTokenBalances: any[];
    status: {
      Ok: null | any;
    };
  };
  transaction: {
    message: {
      accountKeys: {
        pubkey: string;
        signer: boolean;
        writable: boolean;
      }[];
      instructions: {
        accounts: number[];
        data: string;
        programId: string;
      }[];
      recentBlockhash: string;
    };
    signatures: string[];
  };
}

export interface TokenBalance {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

export interface EntityLabel {
  address: string;
  label: string;
  type: string;
  confidence: number;
}

export interface WalletActivity {
  totalTransactions: number;
  uniqueInteractions: number;
  volumeStats: {
    incoming: number;
    outgoing: number;
  };
  recentActivity: {
    date: string;
    count: number;
  }[];
} 