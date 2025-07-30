import { storage } from '../../server/storage.js';
import { insertTransactionSchema } from '../../shared/schema.js';
import { z } from 'zod';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const validatedData = insertTransactionSchema.parse(req.body);
    const transaction = await storage.createTransaction(validatedData);
    res.json(transaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid transaction data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to create transaction' });
    }
  }
}