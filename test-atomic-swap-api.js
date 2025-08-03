#!/usr/bin/env node

// Simple test script for atomic swap API endpoints
const BASE_URL = 'http://localhost:3000/api/atomic-swap';

async function testAPI(endpoint, method = 'GET', body = null) {
  console.log(`\n🧪 Testing ${method} ${endpoint}`);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Atomic Swap API Tests...\n');
  
  // Test health endpoint
  await testAPI('/health');
  
  // Test simulation endpoint
  await testAPI('/simulate');
  
  // Test get all swaps (should be empty initially)
  await testAPI('/all');
  
  // Test relayer metrics
  await testAPI('/relayer/metrics');
  
  // Test initiate swap
  const swapRequest = {
    fromChain: 'stellar',
    toChain: 'ethereum',
    fromToken: 'XLM',
    toToken: 'ETH',
    fromAmount: '100',
    toAmount: '0.04',
    userAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    counterpartyAddress: '0x742d35Cc6634C0532925a3b8D88C2F2a1e9C7e93',
    timelock: 3600
  };
  
  const swapResult = await testAPI('/initiate', 'POST', swapRequest);
  
  if (swapResult && swapResult.swapId) {
    // Test get swap status
    await testAPI(`/status/${swapResult.swapId}`);
    
    // Wait a moment for relayer tasks to be created
    console.log('\n⏳ Waiting 2 seconds for relayer tasks...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check status again
    await testAPI(`/status/${swapResult.swapId}`);
    
    // Test complete swap (for testing)
    await testAPI(`/complete/${swapResult.swapId}`, 'POST');
    
    // Final status check
    await testAPI(`/status/${swapResult.swapId}`);
  }
  
  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);