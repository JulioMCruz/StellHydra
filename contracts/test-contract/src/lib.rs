#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TestData {
    pub message: String,
    pub count: u32,
    pub creator: Address,
    pub timestamp: u64,
}

// Storage keys
const OWNER: Symbol = symbol_short!("OWNER");
const DATA: Symbol = symbol_short!("DATA");
const COUNTER: Symbol = symbol_short!("COUNTER");

#[contract]
pub struct StellHydraTest;

#[contractimpl]
impl StellHydraTest {
    /// Initialize the test contract
    pub fn initialize(env: Env, owner: Address, initial_message: String) {
        if env.storage().instance().has(&OWNER) {
            panic!("Contract already initialized");
        }

        owner.require_auth();

        // Set owner
        env.storage().instance().set(&OWNER, &owner);
        
        // Set initial counter
        env.storage().instance().set(&COUNTER, &0u32);

        // Set initial data
        let initial_data = TestData {
            message: initial_message,
            count: 0,
            creator: owner,
            timestamp: env.ledger().timestamp(),
        };
        env.storage().instance().set(&DATA, &initial_data);

        // Emit initialization event
        env.events().publish(
            (symbol_short!("TEST"), symbol_short!("INIT")),
            &initial_data,
        );
    }

    /// Update the message (only owner)
    pub fn update_message(env: Env, new_message: String) {
        let owner: Address = env.storage().instance().get(&OWNER).unwrap();
        owner.require_auth();

        let mut data: TestData = env.storage().instance().get(&DATA).unwrap();
        let mut counter: u32 = env.storage().instance().get(&COUNTER).unwrap_or(0);

        // Update data
        data.message = new_message;
        data.timestamp = env.ledger().timestamp();
        counter += 1;
        data.count = counter;

        // Store updated data
        env.storage().instance().set(&DATA, &data);
        env.storage().instance().set(&COUNTER, &counter);

        // Emit update event
        env.events().publish(
            (symbol_short!("TEST"), symbol_short!("UPDATE")),
            &data,
        );
    }

    /// Get current data
    pub fn get_data(env: Env) -> TestData {
        env.storage().instance().get(&DATA).unwrap()
    }

    /// Get current counter
    pub fn get_counter(env: Env) -> u32 {
        env.storage().instance().get(&COUNTER).unwrap_or(0)
    }

    /// Get owner
    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&OWNER).unwrap()
    }

    /// Simple greeting function for testing
    pub fn hello(env: Env, name: String) -> String {
        format!("Hello, {}! Welcome to StellHydra on Stellar!", name)
    }

    /// Increment counter (anyone can call)
    pub fn increment(env: Env) -> u32 {
        let mut counter: u32 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&COUNTER, &counter);

        // Update data
        let mut data: TestData = env.storage().instance().get(&DATA).unwrap();
        data.count = counter;
        data.timestamp = env.ledger().timestamp();
        env.storage().instance().set(&DATA, &data);

        // Emit increment event
        env.events().publish(
            (symbol_short!("TEST"), symbol_short!("INC")),
            counter,
        );

        counter
    }

    /// Reset counter (only owner)
    pub fn reset(env: Env) {
        let owner: Address = env.storage().instance().get(&OWNER).unwrap();
        owner.require_auth();

        env.storage().instance().set(&COUNTER, &0u32);

        // Update data
        let mut data: TestData = env.storage().instance().get(&DATA).unwrap();
        data.count = 0;
        data.timestamp = env.ledger().timestamp();
        env.storage().instance().set(&DATA, &data);

        // Emit reset event
        env.events().publish(
            (symbol_short!("TEST"), symbol_short!("RESET")),
            0u32,
        );
    }

    /// Get contract info
    pub fn get_info(env: Env) -> String {
        format!("StellHydra Test Contract - Ledger: {}, Timestamp: {}", 
                env.ledger().sequence(), 
                env.ledger().timestamp())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, StellHydraTest);
        let client = StellHydraTestClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let message = String::from_str(&env, "Hello StellHydra!");

        client.initialize(&owner, &message);

        let data = client.get_data();
        assert_eq!(data.message, message);
        assert_eq!(data.count, 0);
        assert_eq!(data.creator, owner);
    }

    #[test]
    fn test_hello_function() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, StellHydraTest);
        let client = StellHydraTestClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let message = String::from_str(&env, "Test");
        client.initialize(&owner, &message);

        let name = String::from_str(&env, "Alice");
        let greeting = client.hello(&name);
        
        assert!(greeting.contains(&name));
        assert!(greeting.contains(&String::from_str(&env, "StellHydra")));
    }

    #[test]
    fn test_increment_and_reset() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, StellHydraTest);
        let client = StellHydraTestClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let message = String::from_str(&env, "Test");
        client.initialize(&owner, &message);

        // Test increment
        assert_eq!(client.increment(), 1);
        assert_eq!(client.increment(), 2);
        assert_eq!(client.get_counter(), 2);

        // Test reset
        client.reset();
        assert_eq!(client.get_counter(), 0);
    }

    #[test]
    fn test_update_message() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, StellHydraTest);
        let client = StellHydraTestClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let initial_message = String::from_str(&env, "Initial");
        client.initialize(&owner, &initial_message);

        let new_message = String::from_str(&env, "Updated");
        client.update_message(&new_message);

        let data = client.get_data();
        assert_eq!(data.message, new_message);
        assert_eq!(data.count, 1);
    }
}