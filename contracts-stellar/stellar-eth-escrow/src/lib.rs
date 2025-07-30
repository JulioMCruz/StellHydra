#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, symbol_short, Address, Bytes, Env, Map, Symbol, Vec,
};

#[contract]
pub struct StellarEthEscrow;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: Bytes,
    pub maker: Address,
    pub amount: i128,
    pub asset: Address,
    pub hash_lock: Bytes,
    pub time_lock: u64,
    pub status: u32, // 0: pending, 1: locked, 2: completed, 3: refunded
    pub secret: Option<Bytes>,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TimeLocks {
    pub withdrawal: u64,
    pub refund: u64,
}

// Storage keys
const ESCROWS: Symbol = symbol_short!("ESCROWS");
const COUNTER: Symbol = symbol_short!("COUNTER");

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    EscrowExists = 2,
    EscrowNotFound = 3,
    InvalidStatus = 4,
    InvalidSecret = 5,
    TimelockExpired = 6,
    TimelockNotExpired = 7,
}

#[contractimpl]
impl StellarEthEscrow {
    /// Initialize the contract
    pub fn initialize(env: Env) {
        let counter: u64 = 0;
        env.storage().instance().set(&COUNTER, &counter);
        
        let escrows: Map<Bytes, Escrow> = Map::new(&env);
        env.storage().instance().set(&ESCROWS, &escrows);
    }

    /// Create a new escrow
    pub fn create_escrow(
        env: Env,
        maker: Address,
        amount: i128,
        asset: Address,
        hash_lock: Bytes,
        time_locks: TimeLocks,
    ) -> Result<Bytes, Error> {
        // Validate inputs
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Check authorization
        maker.require_auth();

        // Generate unique escrow ID
        let escrow_id = Self::generate_escrow_id(&env, &maker, amount, &asset);

        // Get existing escrows
        let mut escrows: Map<Bytes, Escrow> = env
            .storage()
            .instance()
            .get(&ESCROWS)
            .unwrap_or_else(|| Map::new(&env));

        // Check if escrow already exists
        if escrows.contains_key(escrow_id.clone()) {
            return Err(Error::EscrowExists);
        }

        // Create escrow
        let escrow = Escrow {
            id: escrow_id.clone(),
            maker: maker.clone(),
            amount,
            asset: asset.clone(),
            hash_lock: hash_lock.clone(),
            time_lock: time_locks.withdrawal,
            status: 0, // pending
            secret: None,
            created_at: env.ledger().timestamp(),
        };

        // Store escrow
        escrows.set(escrow_id.clone(), escrow.clone());
        env.storage().instance().set(&ESCROWS, &escrows);

        // Emit event
        env.events().publish(
            (symbol_short!("created"),),
            (escrow_id.clone(), maker.clone(), amount, asset.clone()),
        );

        Ok(escrow_id)
    }

    /// Lock escrow (called by resolver after Ethereum side is locked)
    pub fn lock_escrow(
        env: Env,
        escrow_id: Bytes,
        resolver: Address,
    ) -> Result<(), Error> {
        // Check authorization
        resolver.require_auth();

        // Get escrows
        let mut escrows: Map<Bytes, Escrow> = env
            .storage()
            .instance()
            .get(&ESCROWS)
            .unwrap_or_else(|| Map::new(&env));

        // Get escrow
        let mut escrow = escrows.get(escrow_id.clone()).ok_or(Error::EscrowNotFound)?;

        // Check escrow status
        if escrow.status != 0 {
            return Err(Error::InvalidStatus);
        }

        // Update escrow status
        escrow.status = 1; // locked

        // Store updated escrow
        escrows.set(escrow_id.clone(), escrow);
        env.storage().instance().set(&ESCROWS, &escrows);

        // Emit event
        env.events().publish(
            (symbol_short!("locked"),),
            (escrow_id, resolver),
        );

        Ok(())
    }

    /// Complete escrow by revealing secret
    pub fn complete_escrow(
        env: Env,
        escrow_id: Bytes,
        secret: Bytes,
        resolver: Address,
    ) -> Result<(), Error> {
        // Check authorization
        resolver.require_auth();

        // Get escrows
        let mut escrows: Map<Bytes, Escrow> = env
            .storage()
            .instance()
            .get(&ESCROWS)
            .unwrap_or_else(|| Map::new(&env));

        // Get escrow
        let mut escrow = escrows.get(escrow_id.clone()).ok_or(Error::EscrowNotFound)?;

        // Check escrow status
        if escrow.status != 1 {
            return Err(Error::InvalidStatus);
        }

        // Verify hash lock
        let computed_hash = Self::compute_hash_lock(&env, &secret);
        if computed_hash != escrow.hash_lock {
            return Err(Error::InvalidSecret);
        }

        // Check timelock
        if env.ledger().timestamp() > escrow.time_lock {
            return Err(Error::TimelockExpired);
        }

        // Update escrow
        escrow.status = 2; // completed
        escrow.secret = Some(secret.clone());

        // Store updated escrow
        escrows.set(escrow_id.clone(), escrow);
        env.storage().instance().set(&ESCROWS, &escrows);

        // Note: In a real implementation, you would transfer the assets here
        // using the Stellar token interface

        // Emit event
        env.events().publish(
            (symbol_short!("completed"),),
            (escrow_id, resolver, secret),
        );

        Ok(())
    }

    /// Refund escrow after timelock expires
    pub fn refund_escrow(env: Env, escrow_id: Bytes) -> Result<(), Error> {
        // Get escrows
        let mut escrows: Map<Bytes, Escrow> = env
            .storage()
            .instance()
            .get(&ESCROWS)
            .unwrap_or_else(|| Map::new(&env));

        // Get escrow
        let mut escrow = escrows.get(escrow_id.clone()).ok_or(Error::EscrowNotFound)?;

        // Check authorization (only maker can refund)
        escrow.maker.require_auth();

        // Check escrow status
        if escrow.status != 0 && escrow.status != 1 {
            return Err(Error::InvalidStatus);
        }

        // Check timelock
        if env.ledger().timestamp() <= escrow.time_lock {
            return Err(Error::TimelockNotExpired);
        }

        // Update escrow status
        escrow.status = 3; // refunded

        // Store updated escrow
        escrows.set(escrow_id.clone(), escrow.clone());
        env.storage().instance().set(&ESCROWS, &escrows);

        // Note: In a real implementation, you would refund the assets here
        // using the Stellar token interface

        // Emit event
        env.events().publish(
            (symbol_short!("refunded"),),
            (escrow_id, escrow.maker),
        );

        Ok(())
    }

    /// Get escrow details
    pub fn get_escrow(env: Env, escrow_id: Bytes) -> Option<Escrow> {
        let escrows: Map<Bytes, Escrow> = env
            .storage()
            .instance()
            .get(&ESCROWS)
            .unwrap_or_else(|| Map::new(&env));
        
        escrows.get(escrow_id)
    }

    /// Get all escrows for a maker
    pub fn get_escrows_by_maker(env: Env, maker: Address) -> Vec<Escrow> {
        let escrows: Map<Bytes, Escrow> = env
            .storage()
            .instance()
            .get(&ESCROWS)
            .unwrap_or_else(|| Map::new(&env));

        let mut result = Vec::new(&env);
        
        for (_, escrow) in escrows.iter() {
            if escrow.maker == maker {
                result.push_back(escrow);
            }
        }
        
        result
    }

    /// Helper function to generate unique escrow ID
    fn generate_escrow_id(
        env: &Env,
        maker: &Address,
        amount: i128,
        asset: &Address,
    ) -> Bytes {
        // Get and increment counter
        let mut counter: u64 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&COUNTER, &counter);

        // Create unique data for hashing
        let timestamp = env.ledger().timestamp();
        let sequence = env.ledger().sequence();
        
        // Create unique data for hashing using timestamp, sequence, and counter
        let data_bytes = Bytes::from_slice(env, &[
            (timestamp >> 56) as u8,
            (timestamp >> 48) as u8,
            (timestamp >> 40) as u8,
            (timestamp >> 32) as u8,
            (timestamp >> 24) as u8,
            (timestamp >> 16) as u8,
            (timestamp >> 8) as u8,
            timestamp as u8,
            (sequence >> 24) as u8,
            (sequence >> 16) as u8,
            (sequence >> 8) as u8,
            sequence as u8,
            (counter >> 56) as u8,
            (counter >> 48) as u8,
            (counter >> 40) as u8,
            (counter >> 32) as u8,
            (counter >> 24) as u8,
            (counter >> 16) as u8,
            (counter >> 8) as u8,
            counter as u8,
            (amount >> 120) as u8,
            (amount >> 112) as u8,
            (amount >> 104) as u8,
            (amount >> 96) as u8,
            (amount >> 88) as u8,
            (amount >> 80) as u8,
            (amount >> 72) as u8,
            (amount >> 64) as u8,
            (amount >> 56) as u8,
            (amount >> 48) as u8,
            (amount >> 40) as u8,
            (amount >> 32) as u8,
            (amount >> 24) as u8,
            (amount >> 16) as u8,
            (amount >> 8) as u8,
            amount as u8,
        ]);
        
        env.crypto().sha256(&data_bytes).into()
    }

    /// Helper function to compute hash lock (SHA256)
    fn compute_hash_lock(env: &Env, secret: &Bytes) -> Bytes {
        env.crypto().sha256(secret).into()
    }

    /// Get contract statistics
    pub fn get_stats(env: Env) -> (u64, u32, u32, u32, u32) {
        let escrows: Map<Bytes, Escrow> = env
            .storage()
            .instance()
            .get(&ESCROWS)
            .unwrap_or_else(|| Map::new(&env));

        let total_count = escrows.len();
        let mut pending = 0;
        let mut locked = 0;
        let mut completed = 0;
        let mut refunded = 0;

        for (_, escrow) in escrows.iter() {
            match escrow.status {
                0 => pending += 1,
                1 => locked += 1,
                2 => completed += 1,
                3 => refunded += 1,
                _ => {}
            }
        }

        let counter: u64 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        
        (counter, pending, locked, completed, refunded)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::{Address as _, Ledger}, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarEthEscrow, ());
        let client = StellarEthEscrowClient::new(&env, &contract_id);

        client.initialize();

        let (counter, pending, locked, completed, refunded) = client.get_stats();
        assert_eq!(counter, 0);
        assert_eq!(pending, 0);
        assert_eq!(locked, 0);
        assert_eq!(completed, 0);
        assert_eq!(refunded, 0);
    }

    #[test]
    fn test_create_escrow() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarEthEscrow, ());
        let client = StellarEthEscrowClient::new(&env, &contract_id);

        client.initialize();

        let maker = Address::generate(&env);
        let asset = Address::generate(&env);
        let amount = 1000i128;
        let hash_lock = Bytes::from_slice(&env, b"test_hash_lock_32_bytes_exactly");
        let time_locks = TimeLocks {
            withdrawal: env.ledger().timestamp() + 3600, // 1 hour
            refund: env.ledger().timestamp() + 7200,     // 2 hours
        };

        let escrow_id = client.create_escrow(&maker, &amount, &asset, &hash_lock, &time_locks);
        let escrow = client.get_escrow(&escrow_id).unwrap();
        
        assert_eq!(escrow.maker, maker);
        assert_eq!(escrow.amount, amount);
        assert_eq!(escrow.asset, asset);
        assert_eq!(escrow.status, 0); // pending
    }

    #[test]
    fn test_complete_escrow_flow() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarEthEscrow, ());
        let client = StellarEthEscrowClient::new(&env, &contract_id);

        client.initialize();

        let maker = Address::generate(&env);
        let resolver = Address::generate(&env);
        let asset = Address::generate(&env);
        let amount = 1000i128;
        
        // Create secret and hash
        let secret = Bytes::from_slice(&env, b"my_secret_32_bytes_exactly_here!");
        let hash_lock: Bytes = env.crypto().sha256(&secret).into();
        
        let time_locks = TimeLocks {
            withdrawal: env.ledger().timestamp() + 3600, // 1 hour
            refund: env.ledger().timestamp() + 7200,     // 2 hours
        };

        // Create escrow
        let escrow_id = client.create_escrow(&maker, &amount, &asset, &hash_lock, &time_locks);

        // Lock escrow
        client.lock_escrow(&escrow_id, &resolver);

        // Verify escrow is locked
        let escrow = client.get_escrow(&escrow_id).unwrap();
        assert_eq!(escrow.status, 1); // locked

        // Complete escrow with correct secret
        client.complete_escrow(&escrow_id, &secret, &resolver);

        // Verify escrow is completed
        let escrow = client.get_escrow(&escrow_id).unwrap();
        assert_eq!(escrow.status, 2); // completed
        assert_eq!(escrow.secret, Some(secret));
    }

    #[test]
    fn test_refund_escrow() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarEthEscrow, ());
        let client = StellarEthEscrowClient::new(&env, &contract_id);

        client.initialize();

        let maker = Address::generate(&env);
        let asset = Address::generate(&env);
        let amount = 1000i128;
        let hash_lock = Bytes::from_slice(&env, b"test_hash_lock_32_bytes_exactly");
        
        // Set timelock to simulate expired state for testing
        // First, advance the ledger time
        env.ledger().with_mut(|li| {
            li.timestamp = 1000; // Set a base timestamp
        });
        
        let time_locks = TimeLocks {
            withdrawal: 500, // Set withdrawal timelock in the past
            refund: env.ledger().timestamp() + 7200,
        };

        // Create escrow
        let escrow_id = client.create_escrow(&maker, &amount, &asset, &hash_lock, &time_locks);

        // Try to refund (should succeed since timelock expired)
        client.refund_escrow(&escrow_id);

        // Verify escrow is refunded
        let escrow = client.get_escrow(&escrow_id).unwrap();
        assert_eq!(escrow.status, 3); // refunded
    }

    #[test]
    fn test_complete_escrow_with_correct_secret() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarEthEscrow, ());
        let client = StellarEthEscrowClient::new(&env, &contract_id);

        client.initialize();

        let maker = Address::generate(&env);
        let resolver = Address::generate(&env);
        let asset = Address::generate(&env);
        let amount = 1000i128;
        
        let secret = Bytes::from_slice(&env, b"correct_secret_32_bytes_exactly!");
        let hash_lock: Bytes = env.crypto().sha256(&secret).into();
        
        let time_locks = TimeLocks {
            withdrawal: env.ledger().timestamp() + 3600,
            refund: env.ledger().timestamp() + 7200,
        };

        // Create and lock escrow
        let escrow_id = client.create_escrow(&maker, &amount, &asset, &hash_lock, &time_locks);
        client.lock_escrow(&escrow_id, &resolver);

        // Complete escrow with correct secret
        client.complete_escrow(&escrow_id, &secret, &resolver);

        // Verify escrow is completed
        let escrow = client.get_escrow(&escrow_id).unwrap();
        assert_eq!(escrow.status, 2); // completed
        assert_eq!(escrow.secret, Some(secret));
    }
}