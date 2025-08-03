#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Map, Symbol, Vec, BytesN
};

// Data structures
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BridgeRequest {
    pub user: Address,
    pub from_token: Address,
    pub to_chain: Symbol,
    pub to_address: BytesN<32>,
    pub amount: i128,
    pub fee: i128,
    pub status: u32, // 0: Pending, 1: Processing, 2: Completed, 3: Failed
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BridgeConfig {
    pub admin: Address,
    pub fee_recipient: Address,
    pub base_fee: i128,
    pub fee_percentage: u32, // basis points (e.g., 100 = 1%)
    pub min_amount: i128,
    pub max_amount: i128,
    pub is_paused: bool,
}

// Storage keys
const CONFIG: Symbol = symbol_short!("CONFIG");
const REQUESTS: Symbol = symbol_short!("REQUESTS");
const COUNTER: Symbol = symbol_short!("COUNTER");

#[contract]
pub struct StellarBridge;

#[contractimpl]
impl StellarBridge {
    /// Initialize the bridge contract
    pub fn initialize(
        env: Env,
        admin: Address,
        fee_recipient: Address,
        base_fee: i128,
        fee_percentage: u32,
        min_amount: i128,
        max_amount: i128,
    ) {
        admin.require_auth();

        let config = BridgeConfig {
            admin: admin.clone(),
            fee_recipient,
            base_fee,
            fee_percentage,
            min_amount,
            max_amount,
            is_paused: false,
        };

        env.storage().instance().set(&CONFIG, &config);
        env.storage().instance().set(&COUNTER, &0u64);

        // Emit initialization event
        env.events().publish(
            (symbol_short!("BRIDGE"), symbol_short!("INIT")),
            admin,
        );
    }

    /// Create a new bridge request
    pub fn create_bridge_request(
        env: Env,
        user: Address,
        from_token: Address,
        to_chain: Symbol,
        to_address: BytesN<32>,
        amount: i128,
    ) -> u64 {
        user.require_auth();

        let config: BridgeConfig = env.storage().instance().get(&CONFIG).unwrap();
        
        // Check if bridge is not paused
        if config.is_paused {
            panic!("Bridge is paused");
        }

        // Validate amount
        if amount < config.min_amount || amount > config.max_amount {
            panic!("Invalid amount");
        }

        // Calculate fee
        let fee = config.base_fee + (amount * config.fee_percentage as i128) / 10000;

        // Get next request ID
        let mut counter: u64 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&COUNTER, &counter);

        // Create bridge request
        let request = BridgeRequest {
            user: user.clone(),
            from_token: from_token.clone(),
            to_chain,
            to_address,
            amount,
            fee,
            status: 0, // Pending
            timestamp: env.ledger().timestamp(),
        };

        // Store request
        let mut requests: Map<u64, BridgeRequest> = env.storage().instance().get(&REQUESTS).unwrap_or(Map::new(&env));
        requests.set(counter, request.clone());
        env.storage().instance().set(&REQUESTS, &requests);

        // Transfer tokens from user (amount + fee)
        let total_amount = amount + fee;
        let token_client = token::Client::new(&env, &from_token);
        token_client.transfer(&user, &env.current_contract_address(), &total_amount);

        // Emit bridge initiated event
        env.events().publish(
            (symbol_short!("BRIDGE"), symbol_short!("CREATED")),
            (counter, user, amount),
        );

        counter
    }

    /// Get bridge request by ID
    pub fn get_bridge_request(env: Env, request_id: u64) -> Option<BridgeRequest> {
        let requests: Map<u64, BridgeRequest> = env.storage().instance().get(&REQUESTS).unwrap_or(Map::new(&env));
        requests.get(request_id)
    }

    /// Update bridge request status (admin only)
    pub fn update_request_status(
        env: Env,
        request_id: u64,
        new_status: u32,
        tx_hash: Option<BytesN<32>>,
    ) {
        let config: BridgeConfig = env.storage().instance().get(&CONFIG).unwrap();
        config.admin.require_auth();

        let mut requests: Map<u64, BridgeRequest> = env.storage().instance().get(&REQUESTS).unwrap_or(Map::new(&env));
        
        if let Some(mut request) = requests.get(request_id) {
            request.status = new_status;
            requests.set(request_id, request);
            env.storage().instance().set(&REQUESTS, &requests);

            // Emit status update event
            env.events().publish(
                (symbol_short!("BRIDGE"), symbol_short!("STATUS")),
                (request_id, new_status),
            );
        }
    }

    /// Get bridge configuration
    pub fn get_config(env: Env) -> BridgeConfig {
        env.storage().instance().get(&CONFIG).unwrap()
    }

    /// Update bridge configuration (admin only)
    pub fn update_config(
        env: Env,
        fee_recipient: Option<Address>,
        base_fee: Option<i128>,
        fee_percentage: Option<u32>,
        min_amount: Option<i128>,
        max_amount: Option<i128>,
        is_paused: Option<bool>,
    ) {
        let mut config: BridgeConfig = env.storage().instance().get(&CONFIG).unwrap();
        config.admin.require_auth();

        if let Some(recipient) = fee_recipient {
            config.fee_recipient = recipient;
        }
        if let Some(fee) = base_fee {
            config.base_fee = fee;
        }
        if let Some(percentage) = fee_percentage {
            config.fee_percentage = percentage;
        }
        if let Some(min) = min_amount {
            config.min_amount = min;
        }
        if let Some(max) = max_amount {
            config.max_amount = max;
        }
        if let Some(paused) = is_paused {
            config.is_paused = paused;
        }

        env.storage().instance().set(&CONFIG, &config);

        // Emit config update event
        env.events().publish(
            (symbol_short!("BRIDGE"), symbol_short!("CONFIG")),
            config.admin.clone(),
        );
    }

    /// Get total number of bridge requests
    pub fn get_request_count(env: Env) -> u64 {
        env.storage().instance().get(&COUNTER).unwrap_or(0)
    }

    /// Emergency withdraw (admin only)
    pub fn emergency_withdraw(
        env: Env,
        token: Address,
        to: Address,
        amount: i128,
    ) {
        let config: BridgeConfig = env.storage().instance().get(&CONFIG).unwrap();
        config.admin.require_auth();

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &to, &amount);

        // Emit emergency withdraw event
        env.events().publish(
            (symbol_short!("BRIDGE"), symbol_short!("EMERGENCY")),
            (to, amount),
        );
    }
}