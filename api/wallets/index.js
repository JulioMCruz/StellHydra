import { storage } from '../../server/storage.js';
import { insertWalletSchema } from '../../shared/schema.js';
import { z } from 'zod';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const validatedData = insertWalletSchema.parse(req.body);
    const wallet = await storage.createOrUpdateWallet(validatedData);
    res.json(wallet);
  } catch (error) {
    console.error('Wallet creation error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid wallet data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to create/update wallet' });
    }
  }
}