import { HeliusTransaction, fetchWalletTransactions, fetchEnhancedTransaction } from './solana';

export interface TransactionPattern {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  transactions: string[];
  metadata: Record<string, any>;
}

export interface WalletRiskReport {
  overallRiskScore: number;
  patterns: TransactionPattern[];
  riskFactors: {
    name: string;
    score: number;
    description: string;
  }[];
  recommendations: string[];
}

// Advanced pattern detection for specific transaction behaviors
export async function detectTransactionPatterns(address: string): Promise<TransactionPattern[]> {
  const transactions = await fetchWalletTransactions(address, 1000);
  const patterns: TransactionPattern[] = [];

  // Track temporal patterns
  const timeMap = new Map<number, number>();
  const valueMap = new Map<number, number>();
  
  // Track interaction patterns
  const interactionMap = new Map<string, number>();
  const roundedAmounts = new Set<number>();
  
  // Process transactions
  for (const tx of transactions) {
    const hour = Math.floor((tx.blockTime * 1000) / (60 * 60 * 1000));
    timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
    
    if (tx.amount) {
      valueMap.set(hour, (valueMap.get(hour) || 0) + tx.amount);
      
      // Check for round numbers (potential wash trading)
      if (Math.floor(tx.amount) === tx.amount) {
        roundedAmounts.add(tx.amount);
      }
    }
    
    if (tx.source && tx.source !== address) {
      interactionMap.set(tx.source, (interactionMap.get(tx.source) || 0) + 1);
    }
    if (tx.destination && tx.destination !== address) {
      interactionMap.set(tx.destination, (interactionMap.get(tx.destination) || 0) + 1);
    }
  }

  // Detect rapid succession transactions
  const rapidSuccessionThreshold = 5;
  for (const [hour, count] of timeMap) {
    if (count >= rapidSuccessionThreshold) {
      const hourTransactions = transactions.filter(tx => 
        Math.floor((tx.blockTime * 1000) / (60 * 60 * 1000)) === hour
      );
      
      patterns.push({
        type: 'RAPID_SUCCESSION',
        description: 'Multiple transactions executed in rapid succession',
        severity: count > 10 ? 'high' : 'medium',
        confidence: 0.8,
        transactions: hourTransactions.map(tx => tx.signature),
        metadata: {
          hour,
          count,
          totalValue: valueMap.get(hour) || 0
        }
      });
    }
  }

  // Detect circular trading patterns
  const frequentInteractions = Array.from(interactionMap.entries())
    .filter(([_, count]) => count >= 3);
  
  if (frequentInteractions.length > 0) {
    const circularTxs = transactions.filter(tx =>
      frequentInteractions.some(([addr]) => 
        tx.source === addr || tx.destination === addr
      )
    );
    
    if (circularTxs.length >= 3) {
      patterns.push({
        type: 'CIRCULAR_TRADING',
        description: 'Potential circular trading pattern detected',
        severity: 'high',
        confidence: 0.7,
        transactions: circularTxs.map(tx => tx.signature),
        metadata: {
          participants: frequentInteractions.map(([addr]) => addr),
          totalInteractions: frequentInteractions.reduce((sum, [_, count]) => sum + count, 0)
        }
      });
    }
  }

  // Detect wash trading patterns
  if (roundedAmounts.size > 0) {
    const roundedTxs = transactions.filter(tx => 
      tx.amount && roundedAmounts.has(tx.amount)
    );
    
    if (roundedTxs.length >= 3) {
      patterns.push({
        type: 'WASH_TRADING',
        description: 'Potential wash trading using round numbers',
        severity: 'high',
        confidence: 0.6,
        transactions: roundedTxs.map(tx => tx.signature),
        metadata: {
          roundedAmounts: Array.from(roundedAmounts),
          frequency: roundedTxs.length
        }
      });
    }
  }

  // Detect layering patterns
  const valueRanges = new Map<string, number>();
  transactions.forEach(tx => {
    if (tx.amount) {
      const range = Math.floor(tx.amount / 10) * 10;
      valueRanges.set(range.toString(), (valueRanges.get(range.toString()) || 0) + 1);
    }
  });
  
  const suspiciousRanges = Array.from(valueRanges.entries())
    .filter(([_, count]) => count >= 5);
  
  if (suspiciousRanges.length >= 2) {
    patterns.push({
      type: 'LAYERING',
      description: 'Potential layering pattern with similar value ranges',
      severity: 'medium',
      confidence: 0.65,
      transactions: transactions
        .filter(tx => tx.amount && suspiciousRanges
          .some(([range]) => Math.floor(tx.amount! / 10) * 10 === Number(range)))
        .map(tx => tx.signature),
      metadata: {
        valueRanges: suspiciousRanges,
        totalOccurrences: suspiciousRanges.reduce((sum, [_, count]) => sum + count, 0)
      }
    });
  }

  return patterns;
}

// Calculate risk score based on various factors
export async function generateRiskReport(
  address: string,
  patterns: TransactionPattern[]
): Promise<WalletRiskReport> {
  const transactions = await fetchWalletTransactions(address, 100);
  
  // Initialize risk factors
  const riskFactors = [
    {
      name: 'Transaction Patterns',
      score: 0,
      description: 'Risk based on detected suspicious patterns'
    },
    {
      name: 'Volume Analysis',
      score: 0,
      description: 'Risk based on transaction volumes and frequencies'
    },
    {
      name: 'Interaction Analysis',
      score: 0,
      description: 'Risk based on interaction with other addresses'
    },
    {
      name: 'Temporal Analysis',
      score: 0,
      description: 'Risk based on timing patterns'
    }
  ];

  // Calculate pattern-based risk
  const patternRisk = patterns.reduce((risk, pattern) => {
    const severityScore = pattern.severity === 'high' ? 1 :
                         pattern.severity === 'medium' ? 0.6 : 0.3;
    return risk + (severityScore * pattern.confidence);
  }, 0) / Math.max(patterns.length, 1);

  riskFactors[0].score = patternRisk;

  // Calculate volume-based risk
  const totalVolume = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const avgVolume = totalVolume / transactions.length;
  const volumeRisk = Math.min(avgVolume / 1000, 1); // Normalize to 0-1

  riskFactors[1].score = volumeRisk;

  // Calculate interaction-based risk
  const uniqueInteractions = new Set<string>();
  transactions.forEach(tx => {
    if (tx.source) uniqueInteractions.add(tx.source);
    if (tx.destination) uniqueInteractions.add(tx.destination);
  });
  
  const interactionRisk = Math.min(uniqueInteractions.size / 50, 1);
  riskFactors[2].score = interactionRisk;

  // Calculate temporal risk
  const timeMap = new Map<number, number>();
  transactions.forEach(tx => {
    const hour = Math.floor((tx.blockTime * 1000) / (60 * 60 * 1000));
    timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
  });
  
  const maxTransactionsPerHour = Math.max(...Array.from(timeMap.values()));
  const temporalRisk = Math.min(maxTransactionsPerHour / 20, 1);
  riskFactors[3].score = temporalRisk;

  // Calculate overall risk score
  const overallRiskScore = (
    patternRisk * 0.4 +
    volumeRisk * 0.3 +
    interactionRisk * 0.15 +
    temporalRisk * 0.15
  );

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (patternRisk > 0.7) {
    recommendations.push('Investigate suspicious transaction patterns');
  }
  if (volumeRisk > 0.7) {
    recommendations.push('Review high-volume transactions');
  }
  if (interactionRisk > 0.7) {
    recommendations.push('Analyze frequent interaction partners');
  }
  if (temporalRisk > 0.7) {
    recommendations.push('Examine unusual transaction timing patterns');
  }

  return {
    overallRiskScore,
    patterns,
    riskFactors,
    recommendations
  };
} 