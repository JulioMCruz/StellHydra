import { storage } from '../../_lib/storage.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      res.json(transaction);
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ message: 'Failed to fetch transaction' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}