#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

const COUNTER: Symbol = symbol_short!("COUNTER");

#[contract]
pub struct SimpleTest;

#[contractimpl]
impl SimpleTest {
    /// Initialize the contract
    pub fn init(env: Env) {
        env.storage().instance().set(&COUNTER, &0u32);
    }

    /// Increment counter
    pub fn increment(env: Env) -> u32 {
        let mut counter: u32 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&COUNTER, &counter);
        counter
    }

    /// Get counter value
    pub fn get_count(env: Env) -> u32 {
        env.storage().instance().get(&COUNTER).unwrap_or(0)
    }
}