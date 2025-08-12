import axios from 'axios';

// Backend API URL - update this for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create an axios instance for backend proxy calls
const webacyApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export interface ThreatRiskResponse {
  riskScore: number;
  flags: string[];
  details: {
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

export interface SanctionCheckResponse {
  isSanctioned: boolean;
  details: {
    source: string;
    reason: string;
    date: string;
  }[];
}

export interface ApprovalRiskResponse {
  approvals: {
    spender: string;
    riskScore: number;
    flags: string[];
  }[];
}

export interface ExposureRiskResponse {
  exposureScore: number;
  riskExposures: {
    address: string;
    riskScore: number;
    type: string;
  }[];
}

export interface ContractRiskResponse {
  riskScore: number;
  flags: string[];
  analysis: {
    category: string;
    findings: string[];
    severity: 'low' | 'medium' | 'high';
  }[];
}

export async function getThreatRisks(address: string): Promise<ThreatRiskResponse> {
  try {
    const response = await webacyApi.post('/api/webacy/threat_risks', { address });
    return response.data;
  } catch (error) {
    console.error('Error fetching threat risks:', error);
    // Return a default response instead of throwing
    return {
      riskScore: 0,
      flags: [],
      details: []
    };
  }
}

export async function getSanctionChecks(address: string): Promise<SanctionCheckResponse> {
  try {
    const response = await webacyApi.post('/api/webacy/sanction_checks', { address });
    return response.data;
  } catch (error) {
    console.error('Error fetching sanction checks:', error);
    // Return a default response
    return {
      isSanctioned: false,
      details: []
    };
  }
}

export async function getApprovalRisks(address: string): Promise<ApprovalRiskResponse> {
  try {
    const response = await webacyApi.post('/api/webacy/approval_risks', { address });
    return response.data;
  } catch (error) {
    console.error('Error fetching approval risks:', error);
    // Return a default response
    return {
      approvals: []
    };
  }
}

export async function getExposureRisk(address: string): Promise<ExposureRiskResponse> {
  try {
    const response = await webacyApi.post('/api/webacy/exposure_risk', { address });
    return response.data;
  } catch (error) {
    console.error('Error fetching exposure risk:', error);
    // Return a default response
    return {
      exposureScore: 0,
      riskExposures: []
    };
  }
}

export async function getContractRisk(address: string): Promise<ContractRiskResponse> {
  try {
    const response = await webacyApi.post('/api/webacy/contract_risk', { address });
    return response.data;
  } catch (error) {
    console.error('Error fetching contract risk:', error);
    // Return a default response
    return {
      riskScore: 0,
      flags: [],
      analysis: []
    };
  }
}

export async function getComprehensiveRiskAnalysis(address: string) {
  try {
    const [
      threatRisks,
      sanctionChecks,
      approvalRisks,
      exposureRisk,
      contractRisk
    ] = await Promise.all([
      getThreatRisks(address),
      getSanctionChecks(address),
      getApprovalRisks(address),
      getExposureRisk(address),
      getContractRisk(address)
    ]);

    return {
      threatRisks,
      sanctionChecks,
      approvalRisks,
      exposureRisk,
      contractRisk,
      overallRiskScore: calculateOverallRiskScore({
        threatRisks,
        sanctionChecks,
        approvalRisks,
        exposureRisk,
        contractRisk
      })
    };
  } catch (error) {
    console.error('Error fetching comprehensive risk analysis:', error);
    // Return a default response with zero risk
    return {
      threatRisks: { riskScore: 0, flags: [], details: [] },
      sanctionChecks: { isSanctioned: false, details: [] },
      approvalRisks: { approvals: [] },
      exposureRisk: { exposureScore: 0, riskExposures: [] },
      contractRisk: { riskScore: 0, flags: [], analysis: [] },
      overallRiskScore: 0
    };
  }
}

function calculateOverallRiskScore(data: {
  threatRisks: ThreatRiskResponse;
  sanctionChecks: SanctionCheckResponse;
  approvalRisks: ApprovalRiskResponse;
  exposureRisk: ExposureRiskResponse;
  contractRisk: ContractRiskResponse;
}): number {
  // Weighted average of different risk scores
  const weights = {
    threatRisks: 0.3,
    sanctionChecks: 0.2,
    approvalRisks: 0.15,
    exposureRisk: 0.2,
    contractRisk: 0.15
  };

  let score = 0;
  score += data.threatRisks.riskScore * weights.threatRisks;
  score += (data.sanctionChecks.isSanctioned ? 1 : 0) * weights.sanctionChecks;
  score += (data.approvalRisks.approvals.reduce((acc, curr) => acc + curr.riskScore, 0) / 
           Math.max(data.approvalRisks.approvals.length, 1)) * weights.approvalRisks;
  score += data.exposureRisk.exposureScore * weights.exposureRisk;
  score += data.contractRisk.riskScore * weights.contractRisk;

  return Math.min(Math.max(score, 0), 1); // Ensure score is between 0 and 1
} 