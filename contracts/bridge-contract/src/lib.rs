#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, String, Symbol, Vec,
};

// Events
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BridgeEvent {
    BridgeInitiated {
        user: Address,
        from_token: Address,
        to_chain: String,
        amount: i128,
        bridge_id: String,
    },
    BridgeCompleted {
        bridge_id: String,
        tx_hash: String,
    },
    BridgeFailed {
        bridge_id: String,
        reason: String,
    },
}

// Data structures
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BridgeRequest {
    pub user: Address,
    pub from_token: Address,
    pub to_chain: String,
    pub to_address: String,
    pub amount: i128,
    pub fee: i128,
    pub status: BridgeStatus,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BridgeStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

// Storage keys
const BRIDGE_REQUESTS: Symbol = symbol_short!("BRIDGE");
const ADMIN: Symbol = symbol_short!("ADMIN");
const BRIDGE_FEE: Symbol = symbol_short!("FEE");
const SUPPORTED_TOKENS: Symbol = symbol_short!("TOKENS");
const SUPPORTED_CHAINS: Symbol = symbol_short!("CHAINS");

#[contract]
pub struct StellHydraBridge;

#[contractimpl]
impl StellHydraBridge {
    /// Initialize the bridge contract
    pub fn initialize(
        env: Env,
        admin: Address,
        bridge_fee_bps: u32, // Fee in basis points (100 = 1%)
    ) {
        // Ensure contract is not already initialized
        if env.storage().instance().has(&ADMIN) {
            panic!("Contract already initialized");
        }

        admin.require_auth();

        // Set admin
        env.storage().instance().set(&ADMIN, &admin);
        
        // Set bridge fee (in basis points)
        env.storage().instance().set(&BRIDGE_FEE, &bridge_fee_bps);

        // Initialize supported tokens and chains as empty vectors
        let empty_tokens: Vec<Address> = Vec::new(&env);
        let empty_chains: Vec<String> = Vec::new(&env);
        env.storage().instance().set(&SUPPORTED_TOKENS, &empty_tokens);
        env.storage().instance().set(&SUPPORTED_CHAINS, &empty_chains);
    }

    /// Add supported token for bridging
    pub fn add_supported_token(env: Env, token: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let mut tokens: Vec<Address> = env
            .storage()
            .instance()
            .get(&SUPPORTED_TOKENS)
            .unwrap_or_else(|| Vec::new(&env));
        
        tokens.push_back(token);
        env.storage().instance().set(&SUPPORTED_TOKENS, &tokens);
    }

    /// Add supported chain for bridging
    pub fn add_supported_chain(env: Env, chain: String) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let mut chains: Vec<String> = env
            .storage()
            .instance()
            .get(&SUPPORTED_CHAINS)
            .unwrap_or_else(|| Vec::new(&env));
        
        chains.push_back(chain);
        env.storage().instance().set(&SUPPORTED_CHAINS, &chains);
    }

    /// Initiate a bridge transaction
    pub fn initiate_bridge(
        env: Env,
        user: Address,
        from_token: Address,
        to_chain: String,
        to_address: String,
        amount: i128,
    ) -> String {
        user.require_auth();

        // Validate inputs
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Check if token is supported
        let supported_tokens: Vec<Address> = env
            .storage()
            .instance()
            .get(&SUPPORTED_TOKENS)
            .unwrap_or_else(|| Vec::new(&env));
        
        if !supported_tokens.contains(&from_token) {
            panic!("Token not supported");
        }

        // Check if chain is supported
        let supported_chains: Vec<String> = env
            .storage()
            .instance()
            .get(&SUPPORTED_CHAINS)
            .unwrap_or_else(|| Vec::new(&env));
        
        if !supported_chains.contains(&to_chain) {
            panic!("Chain not supported");
        }

        // Calculate fee
        let fee_bps: u32 = env.storage().instance().get(&BRIDGE_FEE).unwrap_or(0);
        let fee = (amount * fee_bps as i128) / 10000;
        let net_amount = amount - fee;

        // Generate bridge ID
        let bridge_id = format!(
            "bridge_{}_{}", 
            env.ledger().sequence(),
            env.ledger().timestamp()
        );

        // Transfer tokens from user to contract
        let token_client = token::Client::new(&env, &from_token);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // Create bridge request
        let bridge_request = BridgeRequest {
            user: user.clone(),
            from_token: from_token.clone(),
            to_chain: to_chain.clone(),
            to_address,
            amount: net_amount,
            fee,
            status: BridgeStatus::Pending,
            timestamp: env.ledger().timestamp(),
        };

        // Store bridge request
        env.storage()
            .persistent()
            .set(&bridge_id.clone(), &bridge_request);

        // Emit event
        env.events().publish(
            (symbol_short!("BRIDGE"), symbol_short!("INIT")),
            BridgeEvent::BridgeInitiated {
                user,
                from_token,
                to_chain,
                amount: net_amount,
                bridge_id: bridge_id.clone(),
            },
        );

        bridge_id
    }

    /// Complete a bridge transaction (called by admin/relayer)
    pub fn complete_bridge(env: Env, bridge_id: String, tx_hash: String) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let mut bridge_request: BridgeRequest = env
            .storage()
            .persistent()
            .get(&bridge_id)
            .expect("Bridge request not found");

        // Update status
        bridge_request.status = BridgeStatus::Completed;
        env.storage()
            .persistent()
            .set(&bridge_id, &bridge_request);

        // Emit event
        env.events().publish(
            (symbol_short!("BRIDGE"), symbol_short!("COMPLETE")),
            BridgeEvent::BridgeCompleted {
                bridge_id,
                tx_hash,
            },
        );
    }

    /// Fail a bridge transaction and refund user
    pub fn fail_bridge(env: Env, bridge_id: String, reason: String) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let mut bridge_request: BridgeRequest = env
            .storage()
            .persistent()
            .get(&bridge_id)
            .expect("Bridge request not found");

        // Update status
        bridge_request.status = BridgeStatus::Failed;
        
        // Refund tokens to user (minus fee for gas costs)
        let token_client = token::Client::new(&env, &bridge_request.from_token);
        token_client.transfer(
            &env.current_contract_address(),
            &bridge_request.user,
            &bridge_request.amount,
        );

        env.storage()
            .persistent()
            .set(&bridge_id, &bridge_request);

        // Emit event
        env.events().publish(
            (symbol_short!("BRIDGE"), symbol_short!("FAILED")),
            BridgeEvent::BridgeFailed {
                bridge_id,
                reason,
            },
        );
    }

    /// Get bridge request details
    pub fn get_bridge_request(env: Env, bridge_id: String) -> BridgeRequest {
        env.storage()
            .persistent()
            .get(&bridge_id)
            .expect("Bridge request not found")
    }

    /// Get supported tokens
    pub fn get_supported_tokens(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&SUPPORTED_TOKENS)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Get supported chains
    pub fn get_supported_chains(env: Env) -> Vec<String> {
        env.storage()
            .instance()
            .get(&SUPPORTED_CHAINS)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Get bridge fee in basis points
    pub fn get_bridge_fee(env: Env) -> u32 {
        env.storage().instance().get(&BRIDGE_FEE).unwrap_or(0)
    }

    /// Admin function to withdraw collected fees
    pub fn withdraw_fees(env: Env, token: Address, to: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let token_client = token::Client::new(&env, &token);
        let balance = token_client.balance(&env.current_contract_address());
        
        if balance > 0 {
            token_client.transfer(&env.current_contract_address(), &to, &balance);
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
        Address, Env, IntoVal,
    };

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, StellHydraBridge);
        let client = StellHydraBridgeClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let fee_bps = 50u32; // 0.5%

        client.initialize(&admin, &fee_bps);

        assert_eq!(client.get_bridge_fee(), fee_bps);
    }

    #[test]
    fn test_add_supported_token() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, StellHydraBridge);
        let client = StellHydraBridgeClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let token = Address::generate(&env);

        client.initialize(&admin, &50u32);
        client.add_supported_token(&token);

        let supported_tokens = client.get_supported_tokens();
        assert_eq!(supported_tokens.len(), 1);
        assert_eq!(supported_tokens.get(0).unwrap(), token);
    }
}