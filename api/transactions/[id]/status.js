import { storage } from '../../_lib/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { status, txHash } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const transaction = await storage.updateTransactionStatus(id, status, txHash);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Transaction status update error:', error);
    res.status(500).json({ message: 'Failed to update transaction status' });
  }
}