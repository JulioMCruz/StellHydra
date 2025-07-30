import { storage } from '../_lib/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Basic validation
    if (!req.body.address || !req.body.network) {
      return res.status(400).json({ message: 'Address and network are required' });
    }
    
    const wallet = await storage.createOrUpdateWallet(req.body);
    res.json(wallet);
  } catch (error) {
    console.error('Wallet creation error:', error);
    res.status(500).json({ message: 'Failed to create/update wallet' });
  }
}