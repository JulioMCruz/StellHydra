// Ethereum Web3 integration for Sepolia testnet
// Note: In a real implementation, you would install ethers or web3.js

export interface EthereumWallet {
  isAvailable: boolean;
  isConnected: boolean;
  isConnecting?: boolean;
  address: string;
  balance: string;
  chainId: string;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request(args: { method: string; params?: any[] }): Promise<any>;
      on(event: string, callback: (data: any) => void): void;
      removeListener(event: string, callback: (data: any) => void): void;
    };
  }
}

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

export const ethereumService = {
  async isMetaMaskAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
  },

  async connectWallet(): Promise<EthereumWallet> {
    if (!window.ethereum) {
      throw new Error('MetaMask not available. Please install MetaMask extension.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts.length) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }

      // Check if on Sepolia network
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      if (chainId !== SEPOLIA_CHAIN_ID) {
        // Switch to Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              }],
            });
          } else {
            throw new Error(`Failed to switch to Sepolia network: ${switchError.message}`);
          }
        }
      }

      // Re-check chain ID after switching
      const finalChainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      if (finalChainId !== SEPOLIA_CHAIN_ID) {
        throw new Error('Please manually switch to Sepolia Testnet in MetaMask');
      }

      const address = accounts[0];
      const balance = await this.getBalance(address);

      return {
        isAvailable: true,
        isConnected: true,
        address,
        balance,
        chainId: finalChainId,
      };
    } catch (error: any) {
      console.error('Failed to connect Ethereum wallet:', error);
      
      // Provide more specific error messages
      if (error.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection in MetaMask.');
      } else if (error.code === -32002) {
        throw new Error('Connection request pending. Please check MetaMask.');
      } else {
        throw new Error(error.message || 'Failed to connect to MetaMask. Please try again.');
      }
    }
  },

  async getBalance(address: string): Promise<string> {
    if (!window.ethereum) {
      return "0";
    }

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });

      // Convert from wei to ETH (simplified)
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      return balanceInEth.toFixed(6);
    } catch (error) {
      console.error('Failed to fetch Ethereum balance:', error);
      return "0";
    }
  },

  async sendTransaction(transaction: any): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transaction],
      });

      return txHash;
    } catch (error) {
      console.error('Failed to send Ethereum transaction:', error);
      throw error;
    }
  },

  disconnect(): EthereumWallet {
    return {
      isAvailable: this.isMetaMaskAvailable() as any,
      isConnected: false,
      address: "",
      balance: "0",
      chainId: "",
    };
  }
};
