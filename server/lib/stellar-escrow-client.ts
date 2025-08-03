import * as StellarSdk from '@stellar/stellar-sdk';
import { Contract, scValToNative, nativeToScVal, Address } from '@stellar/stellar-sdk';

export interface StellarEscrowConfig {
  contractId: string;
  network: 'testnet' | 'mainnet';
  rpcUrl: string;
  secretKey: string;
}

export interface StellarEscrowData {
  id: string;
  maker: string;
  amount: string;
  asset: string;
  hashLock: string;
  timeLock: number;
  status: number;
  secret?: string;
  createdAt: number;
}

export class StellarEscrowClient {
  private server: StellarSdk.SorobanRpc.Server;
  private keypair: StellarSdk.Keypair;
  private contract: Contract;
  private networkPassphrase: string;

  constructor(config: StellarEscrowConfig) {
    this.server = new StellarSdk.SorobanRpc.Server(config.rpcUrl);
    this.keypair = StellarSdk.Keypair.fromSecret(config.secretKey);
    this.contract = new Contract(config.contractId);
    this.networkPassphrase = config.network === 'mainnet' 
      ? StellarSdk.Networks.PUBLIC 
      : StellarSdk.Networks.TESTNET;
  }

  /**
   * Initialize the contract (if needed)
   */
  async initialize(): Promise<string> {
    const account = await this.server.getAccount(this.keypair.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call('initialize'))
      .setTimeout(30)
      .build();

    transaction.sign(this.keypair);
    
    const response = await this.server.sendTransaction(transaction);
    return response.hash;
  }

  /**
   * Create a new escrow
   */
  async createEscrow(
    maker: string,
    amount: string,
    asset: string,
    hashLock: string,
    timeLocks: { withdrawal: number; refund: number }
  ): Promise<{ escrowId: string; txHash: string }> {
    const account = await this.server.getAccount(this.keypair.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.contract.call(
          'create_escrow',
          nativeToScVal(Address.fromString(maker)),
          nativeToScVal(BigInt(amount)),
          nativeToScVal(Address.fromString(asset)),
          nativeToScVal(Buffer.from(hashLock, 'hex')),
          nativeToScVal({
            withdrawal: timeLocks.withdrawal,
            refund: timeLocks.refund,
          })
        )
      )
      .setTimeout(30)
      .build();

    transaction.sign(this.keypair);
    
    const response = await this.server.sendTransaction(transaction);
    
    if (response.status === 'SUCCESS' && response.resultXdr) {
      const result = StellarSdk.xdr.TransactionResult.fromXDR(response.resultXdr, 'base64');
      const escrowId = scValToNative(result.result().results()[0].tr().invokeHostFunctionResult().success()[0]);
      
      return {
        escrowId: Buffer.from(escrowId).toString('hex'),
        txHash: response.hash,
      };
    }
    
    throw new Error(`Failed to create escrow: ${response.status}`);
  }

  /**
   * Lock an escrow
   */
  async lockEscrow(escrowId: string, resolver: string): Promise<string> {
    const account = await this.server.getAccount(this.keypair.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.contract.call(
          'lock_escrow',
          nativeToScVal(Buffer.from(escrowId, 'hex')),
          nativeToScVal(Address.fromString(resolver))
        )
      )
      .setTimeout(30)
      .build();

    transaction.sign(this.keypair);
    
    const response = await this.server.sendTransaction(transaction);
    
    if (response.status === 'SUCCESS') {
      return response.hash;
    }
    
    throw new Error(`Failed to lock escrow: ${response.status}`);
  }

  /**
   * Complete an escrow with secret
   */
  async completeEscrow(escrowId: string, secret: string, resolver: string): Promise<string> {
    const account = await this.server.getAccount(this.keypair.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.contract.call(
          'complete_escrow',
          nativeToScVal(Buffer.from(escrowId, 'hex')),
          nativeToScVal(Buffer.from(secret, 'hex')),
          nativeToScVal(Address.fromString(resolver))
        )
      )
      .setTimeout(30)
      .build();

    transaction.sign(this.keypair);
    
    const response = await this.server.sendTransaction(transaction);
    
    if (response.status === 'SUCCESS') {
      return response.hash;
    }
    
    throw new Error(`Failed to complete escrow: ${response.status}`);
  }

  /**
   * Refund an escrow
   */
  async refundEscrow(escrowId: string): Promise<string> {
    const account = await this.server.getAccount(this.keypair.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.contract.call(
          'refund_escrow',
          nativeToScVal(Buffer.from(escrowId, 'hex'))
        )
      )
      .setTimeout(30)
      .build();

    transaction.sign(this.keypair);
    
    const response = await this.server.sendTransaction(transaction);
    
    if (response.status === 'SUCCESS') {
      return response.hash;
    }
    
    throw new Error(`Failed to refund escrow: ${response.status}`);
  }

  /**
   * Get escrow details
   */
  async getEscrow(escrowId: string): Promise<StellarEscrowData | null> {
    const account = await this.server.getAccount(this.keypair.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.contract.call(
          'get_escrow',
          nativeToScVal(Buffer.from(escrowId, 'hex'))
        )
      )
      .setTimeout(30)
      .build();

    const response = await this.server.simulateTransaction(transaction);
    
    if (response.results && response.results[0].result) {
      const result = scValToNative(response.results[0].result.retval);
      
      if (!result) return null;
      
      return {
        id: Buffer.from(result.id).toString('hex'),
        maker: result.maker,
        amount: result.amount.toString(),
        asset: result.asset,
        hashLock: Buffer.from(result.hash_lock).toString('hex'),
        timeLock: result.time_lock,
        status: result.status,
        secret: result.secret ? Buffer.from(result.secret).toString('hex') : undefined,
        createdAt: result.created_at,
      };
    }
    
    return null;
  }

  /**
   * Get contract statistics
   */
  async getStats(): Promise<{
    totalEscrows: number;
    pending: number;
    locked: number;
    completed: number;
    refunded: number;
  }> {
    const account = await this.server.getAccount(this.keypair.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call('get_stats'))
      .setTimeout(30)
      .build();

    const response = await this.server.simulateTransaction(transaction);
    
    if (response.results && response.results[0].result) {
      const [totalEscrows, pending, locked, completed, refunded] = scValToNative(
        response.results[0].result.retval
      );
      
      return {
        totalEscrows: Number(totalEscrows),
        pending: Number(pending),
        locked: Number(locked),
        completed: Number(completed),
        refunded: Number(refunded),
      };
    }
    
    throw new Error('Failed to get contract statistics');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getStats();
      return true;
    } catch {
      return false;
    }
  }
}