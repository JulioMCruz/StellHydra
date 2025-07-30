import { storage } from '../_lib/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Basic validation
    if (!req.body.walletAddress || !req.body.fromNetwork || !req.body.toNetwork || !req.body.fromToken || !req.body.toToken || !req.body.fromAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const transaction = await storage.createTransaction(req.body);
    res.json(transaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
}