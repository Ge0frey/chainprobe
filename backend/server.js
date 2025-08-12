const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Configure CORS for both development and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://chainprobe.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// API Keys (stored securely on server)
const DUNE_API_KEY = process.env.DUNE_API_KEY;
const DD_API_KEY = process.env.DD_API_KEY;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dune API Proxy
app.get('/api/dune/balances/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!DUNE_API_KEY) {
      return res.status(500).json({ error: 'Dune API key not configured' });
    }

    const response = await axios.get(
      `https://api.dune.com/api/echo/beta/balances/svm/${address}`,
      {
        headers: {
          'X-Dune-Api-Key': DUNE_API_KEY
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Dune API Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch token balances',
      message: error.response?.data?.message || error.message
    });
  }
});

// Webacy API Proxy
app.post('/api/webacy/threat_risks', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!DD_API_KEY) {
      return res.status(500).json({ error: 'Webacy API key not configured' });
    }

    const response = await axios.post(
      'https://api.webacy.com/v1/threat_risks',
      { address },
      {
        headers: {
          'Authorization': `Bearer ${DD_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Webacy Threat Risks Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch threat risks',
      message: error.response?.data?.message || error.message
    });
  }
});

app.post('/api/webacy/sanction_checks', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!DD_API_KEY) {
      return res.status(500).json({ error: 'Webacy API key not configured' });
    }

    const response = await axios.post(
      'https://api.webacy.com/v1/sanction_checks',
      { address },
      {
        headers: {
          'Authorization': `Bearer ${DD_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Webacy Sanction Checks Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch sanction checks',
      message: error.response?.data?.message || error.message
    });
  }
});

app.post('/api/webacy/approval_risks', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!DD_API_KEY) {
      return res.status(500).json({ error: 'Webacy API key not configured' });
    }

    const response = await axios.post(
      'https://api.webacy.com/v1/approval_risks',
      { address },
      {
        headers: {
          'Authorization': `Bearer ${DD_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Webacy Approval Risks Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch approval risks',
      message: error.response?.data?.message || error.message
    });
  }
});

app.post('/api/webacy/exposure_risk', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!DD_API_KEY) {
      return res.status(500).json({ error: 'Webacy API key not configured' });
    }

    const response = await axios.post(
      'https://api.webacy.com/v1/exposure_risk',
      { address },
      {
        headers: {
          'Authorization': `Bearer ${DD_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Webacy Exposure Risk Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch exposure risk',
      message: error.response?.data?.message || error.message
    });
  }
});

app.post('/api/webacy/contract_risk', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!DD_API_KEY) {
      return res.status(500).json({ error: 'Webacy API key not configured' });
    }

    const response = await axios.post(
      'https://api.webacy.com/v1/contract_risk',
      { address },
      {
        headers: {
          'Authorization': `Bearer ${DD_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Webacy Contract Risk Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch contract risk',
      message: error.response?.data?.message || error.message
    });
  }
});

// Helius API Proxy
app.post('/api/helius/rpc', async (req, res) => {
  try {
    if (!HELIUS_API_KEY) {
      return res.status(500).json({ error: 'Helius API key not configured' });
    }

    const response = await axios.post(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      req.body
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Helius RPC Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to execute RPC call',
      message: error.response?.data?.message || error.message
    });
  }
});

app.post('/api/helius/transactions', async (req, res) => {
  try {
    const { transactions } = req.body;
    
    if (!HELIUS_API_KEY) {
      return res.status(500).json({ error: 'Helius API key not configured' });
    }

    const response = await axios.post(
      `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`,
      { transactions }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Helius Transactions Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch transaction details',
      message: error.response?.data?.message || error.message
    });
  }
});

app.get('/api/helius/tokens/metadata', async (req, res) => {
  try {
    const { mints } = req.query;
    
    if (!HELIUS_API_KEY) {
      return res.status(500).json({ error: 'Helius API key not configured' });
    }

    const response = await axios.get(
      `https://api.helius.xyz/v0/tokens/metadata?api-key=${HELIUS_API_KEY}&mints=${mints}`
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Helius Metadata Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch token metadata',
      message: error.response?.data?.message || error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 ChainProbe API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
