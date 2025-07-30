import { storage } from '../../../server/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fromToken, toToken } = req.query;
    const prices = await storage.getDexPrices(fromToken.toUpperCase(), toToken.toUpperCase());
    res.json(prices);
  } catch (error) {
    console.error('DEX prices error:', error);
    res.status(500).json({ message: 'Failed to fetch DEX prices' });
  }
}