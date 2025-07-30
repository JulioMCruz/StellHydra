import { storage } from '../../server/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fromToken, toToken, fromAmount, fromNetwork, toNetwork } = req.body;
    
    if (!fromToken || !toToken || !fromAmount || !fromNetwork || !toNetwork) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get best rates from DEX prices
    const prices = await storage.getDexPrices(fromToken, toToken);
    const bestPrice = prices[0];
    
    if (!bestPrice) {
      return res.status(404).json({ message: 'No price data available for this token pair' });
    }

    const toAmount = (parseFloat(fromAmount) * parseFloat(bestPrice.rate || '0')).toString();
    const fee = (parseFloat(fromAmount) * parseFloat(bestPrice.fee || '0') / 100).toString();
    
    const simulation = {
      fromAmount,
      toAmount,
      rate: bestPrice.rate,
      fee,
      dexSource: bestPrice.dexName,
      estimatedTime: '3-5 minutes',
      priceImpact: '0.02%',
      minimumReceived: (parseFloat(toAmount) * 0.995).toString() // 0.5% slippage
    };

    res.json(simulation);
  } catch (error) {
    console.error('Bridge simulation error:', error);
    res.status(500).json({ message: 'Failed to simulate bridge transaction' });
  }
}