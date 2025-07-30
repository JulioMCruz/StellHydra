import { storage } from '../../../server/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    const transactions = await storage.getTransactionsByWallet(address);
    res.json(transactions);
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
}