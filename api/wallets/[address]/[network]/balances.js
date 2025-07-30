import { storage } from '../../../_lib/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { address, network } = req.query;
    const { balances } = req.body;
    
    if (!balances || typeof balances !== 'object') {
      return res.status(400).json({ message: 'Valid balances object is required' });
    }

    const wallet = await storage.updateWalletBalances(address, network, balances);
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    res.json(wallet);
  } catch (error) {
    console.error('Wallet balance update error:', error);
    res.status(500).json({ message: 'Failed to update wallet balances' });
  }
}