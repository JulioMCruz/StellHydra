#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Symbol,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceData {
    pub price: i128,
    pub decimals: u32,
    pub timestamp: u64,
    pub source: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenPair {
    pub base: String,
    pub quote: String,
}

// Storage keys
const ADMIN: Symbol = symbol_short!("ADMIN");
const ORACLES: Symbol = symbol_short!("ORACLES");
const PRICES: Symbol = symbol_short!("PRICES");

#[contract]
pub struct PriceOracle;

#[contractimpl]
impl PriceOracle {
    /// Initialize the price oracle
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Contract already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&ADMIN, &admin);

        // Initialize empty oracle list
        let empty_oracles: Map<Address, bool> = Map::new(&env);
        env.storage().instance().set(&ORACLES, &empty_oracles);
    }

    /// Add oracle address (only admin)
    pub fn add_oracle(env: Env, oracle: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let mut oracles: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&ORACLES)
            .unwrap_or_else(|| Map::new(&env));

        oracles.set(oracle, true);
        env.storage().instance().set(&ORACLES, &oracles);
    }

    /// Remove oracle address (only admin)
    pub fn remove_oracle(env: Env, oracle: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let mut oracles: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&ORACLES)
            .unwrap_or_else(|| Map::new(&env));

        oracles.remove(oracle);
        env.storage().instance().set(&ORACLES, &oracles);
    }

    /// Update price (only authorized oracles)
    pub fn update_price(
        env: Env,
        oracle: Address,
        base_token: String,
        quote_token: String,
        price: i128,
        decimals: u32,
        source: String,
    ) {
        oracle.require_auth();

        // Check if oracle is authorized
        let oracles: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&ORACLES)
            .unwrap_or_else(|| Map::new(&env));

        if !oracles.get(oracle).unwrap_or(false) {
            panic!("Unauthorized oracle");
        }

        let token_pair = TokenPair {
            base: base_token,
            quote: quote_token,
        };

        let price_data = PriceData {
            price,
            decimals,
            timestamp: env.ledger().timestamp(),
            source,
        };

        env.storage().persistent().set(&token_pair, &price_data);

        // Emit price update event
        env.events().publish(
            (symbol_short!("PRICE"), symbol_short!("UPDATE")),
            (token_pair, price_data),
        );
    }

    /// Get latest price for token pair
    pub fn get_price(env: Env, base_token: String, quote_token: String) -> Option<PriceData> {
        let token_pair = TokenPair {
            base: base_token,
            quote: quote_token,
        };

        env.storage().persistent().get(&token_pair)
    }

    /// Get price with staleness check
    pub fn get_price_with_staleness_check(
        env: Env,
        base_token: String,
        quote_token: String,
        max_staleness: u64,
    ) -> Option<PriceData> {
        let price_data = Self::get_price(env.clone(), base_token, quote_token)?;
        let current_time = env.ledger().timestamp();

        if current_time - price_data.timestamp > max_staleness {
            None // Price is too stale
        } else {
            Some(price_data)
        }
    }

    /// Check if oracle is authorized
    pub fn is_oracle_authorized(env: Env, oracle: Address) -> bool {
        let oracles: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&ORACLES)
            .unwrap_or_else(|| Map::new(&env));

        oracles.get(oracle).unwrap_or(false)
    }

    /// Get all authorized oracles
    pub fn get_oracles(env: Env) -> Map<Address, bool> {
        env.storage()
            .instance()
            .get(&ORACLES)
            .unwrap_or_else(|| Map::new(&env))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    #[test]
    fn test_initialize_and_add_oracle() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PriceOracle);
        let client = PriceOracleClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let oracle = Address::generate(&env);

        client.initialize(&admin);
        client.add_oracle(&oracle);

        assert!(client.is_oracle_authorized(&oracle));
    }

    #[test]
    fn test_update_and_get_price() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PriceOracle);
        let client = PriceOracleClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let oracle = Address::generate(&env);

        client.initialize(&admin);
        client.add_oracle(&oracle);

        let base = String::from_str(&env, "XLM");
        let quote = String::from_str(&env, "USD");
        let price = 1000000i128; // $0.10 with 8 decimals
        let decimals = 8u32;
        let source = String::from_str(&env, "StellarX");

        client.update_price(&oracle, &base, &quote, &price, &decimals, &source);

        let price_data = client.get_price(&base, &quote).unwrap();
        assert_eq!(price_data.price, price);
        assert_eq!(price_data.decimals, decimals);
        assert_eq!(price_data.source, source);
    }
}