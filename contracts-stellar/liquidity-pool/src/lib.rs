#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
    token::{self, TokenClient},
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolInfo {
    pub token_a: Address,
    pub token_b: Address,
    pub reserve_a: i128,
    pub reserve_b: i128,
    pub total_shares: i128,
    pub fee_rate: u32, // Basis points (e.g., 30 = 0.3%)
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidityPosition {
    pub owner: Address,
    pub shares: i128,
    pub token_a_deposited: i128,
    pub token_b_deposited: i128,
}

// Storage keys
const POOL_INFO: Symbol = symbol_short!("POOL");
const ADMIN: Symbol = symbol_short!("ADMIN");
const POSITIONS: Symbol = symbol_short!("POS");

#[contract]
pub struct LiquidityPool;

#[contractimpl]
impl LiquidityPool {
    /// Initialize liquidity pool
    pub fn initialize(
        env: Env,
        admin: Address,
        token_a: Address,
        token_b: Address,
        fee_rate: u32,
    ) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Pool already initialized");
        }

        admin.require_auth();

        let pool_info = PoolInfo {
            token_a: token_a.clone(),
            token_b: token_b.clone(),
            reserve_a: 0,
            reserve_b: 0,
            total_shares: 0,
            fee_rate,
        };

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&POOL_INFO, &pool_info);

        // Emit pool creation event
        env.events().publish(
            (symbol_short!("POOL"), symbol_short!("CREATE")),
            (token_a, token_b, fee_rate),
        );
    }

    /// Add liquidity to the pool
    pub fn add_liquidity(
        env: Env,
        user: Address,
        amount_a_desired: i128,
        amount_b_desired: i128,
        amount_a_min: i128,
        amount_b_min: i128,
    ) -> (i128, i128, i128) {
        user.require_auth();

        let mut pool_info: PoolInfo = env.storage().instance().get(&POOL_INFO).unwrap();

        let (amount_a, amount_b, liquidity_shares) = if pool_info.total_shares == 0 {
            // First liquidity provision
            let shares = (amount_a_desired * amount_b_desired).sqrt();
            (amount_a_desired, amount_b_desired, shares)
        } else {
            // Calculate optimal amounts
            let amount_b_optimal = (amount_a_desired * pool_info.reserve_b) / pool_info.reserve_a;
            let (amount_a, amount_b) = if amount_b_optimal <= amount_b_desired {
                (amount_a_desired, amount_b_optimal)
            } else {
                let amount_a_optimal = (amount_b_desired * pool_info.reserve_a) / pool_info.reserve_b;
                (amount_a_optimal, amount_b_desired)
            };

            // Check slippage protection
            if amount_a < amount_a_min || amount_b < amount_b_min {
                panic!("Insufficient liquidity amounts");
            }

            // Calculate liquidity shares
            let shares_a = (amount_a * pool_info.total_shares) / pool_info.reserve_a;
            let shares_b = (amount_b * pool_info.total_shares) / pool_info.reserve_b;
            let shares = shares_a.min(shares_b);

            (amount_a, amount_b, shares)
        };

        // Transfer tokens to pool
        let token_a_client = TokenClient::new(&env, &pool_info.token_a);
        let token_b_client = TokenClient::new(&env, &pool_info.token_b);

        token_a_client.transfer(&user, &env.current_contract_address(), &amount_a);
        token_b_client.transfer(&user, &env.current_contract_address(), &amount_b);

        // Update pool state
        pool_info.reserve_a += amount_a;
        pool_info.reserve_b += amount_b;
        pool_info.total_shares += liquidity_shares;

        env.storage().instance().set(&POOL_INFO, &pool_info);

        // Update user position
        let position_key = (user.clone(), symbol_short!("LP"));
        let mut position: LiquidityPosition = env
            .storage()
            .persistent()
            .get(&position_key)
            .unwrap_or(LiquidityPosition {
                owner: user.clone(),
                shares: 0,
                token_a_deposited: 0,
                token_b_deposited: 0,
            });

        position.shares += liquidity_shares;
        position.token_a_deposited += amount_a;
        position.token_b_deposited += amount_b;

        env.storage().persistent().set(&position_key, &position);

        // Emit liquidity added event
        env.events().publish(
            (symbol_short!("POOL"), symbol_short!("ADD_LIQ")),
            (user, amount_a, amount_b, liquidity_shares),
        );

        (amount_a, amount_b, liquidity_shares)
    }

    /// Remove liquidity from pool
    pub fn remove_liquidity(
        env: Env,
        user: Address,
        liquidity_shares: i128,
        amount_a_min: i128,
        amount_b_min: i128,
    ) -> (i128, i128) {
        user.require_auth();

        let mut pool_info: PoolInfo = env.storage().instance().get(&POOL_INFO).unwrap();
        let position_key = (user.clone(), symbol_short!("LP"));
        let mut position: LiquidityPosition = env
            .storage()
            .persistent()
            .get(&position_key)
            .unwrap();

        if position.shares < liquidity_shares {
            panic!("Insufficient liquidity shares");
        }

        // Calculate withdrawal amounts
        let amount_a = (liquidity_shares * pool_info.reserve_a) / pool_info.total_shares;
        let amount_b = (liquidity_shares * pool_info.reserve_b) / pool_info.total_shares;

        // Check slippage protection
        if amount_a < amount_a_min || amount_b < amount_b_min {
            panic!("Insufficient withdrawal amounts");
        }

        // Transfer tokens to user
        let token_a_client = TokenClient::new(&env, &pool_info.token_a);
        let token_b_client = TokenClient::new(&env, &pool_info.token_b);

        token_a_client.transfer(&env.current_contract_address(), &user, &amount_a);
        token_b_client.transfer(&env.current_contract_address(), &user, &amount_b);

        // Update pool state
        pool_info.reserve_a -= amount_a;
        pool_info.reserve_b -= amount_b;
        pool_info.total_shares -= liquidity_shares;

        env.storage().instance().set(&POOL_INFO, &pool_info);

        // Update user position
        position.shares -= liquidity_shares;
        position.token_a_deposited = (position.token_a_deposited * position.shares) / (position.shares + liquidity_shares);
        position.token_b_deposited = (position.token_b_deposited * position.shares) / (position.shares + liquidity_shares);

        env.storage().persistent().set(&position_key, &position);

        // Emit liquidity removed event
        env.events().publish(
            (symbol_short!("POOL"), symbol_short!("REM_LIQ")),
            (user, amount_a, amount_b, liquidity_shares),
        );

        (amount_a, amount_b)
    }

    /// Swap tokens
    pub fn swap(
        env: Env,
        user: Address,
        token_in: Address,
        amount_in: i128,
        amount_out_min: i128,
    ) -> i128 {
        user.require_auth();

        let mut pool_info: PoolInfo = env.storage().instance().get(&POOL_INFO).unwrap();

        let (reserve_in, reserve_out, token_out) = if token_in == pool_info.token_a {
            (pool_info.reserve_a, pool_info.reserve_b, pool_info.token_b.clone())
        } else if token_in == pool_info.token_b {
            (pool_info.reserve_b, pool_info.reserve_a, pool_info.token_a.clone())
        } else {
            panic!("Invalid token");
        };

        // Calculate output amount with fee
        let amount_in_with_fee = amount_in * (10000 - pool_info.fee_rate as i128) / 10000;
        let amount_out = (amount_in_with_fee * reserve_out) / (reserve_in + amount_in_with_fee);

        if amount_out < amount_out_min {
            panic!("Insufficient output amount");
        }

        // Transfer tokens
        let token_in_client = TokenClient::new(&env, &token_in);
        let token_out_client = TokenClient::new(&env, &token_out);

        token_in_client.transfer(&user, &env.current_contract_address(), &amount_in);
        token_out_client.transfer(&env.current_contract_address(), &user, &amount_out);

        // Update reserves
        if token_in == pool_info.token_a {
            pool_info.reserve_a += amount_in;
            pool_info.reserve_b -= amount_out;
        } else {
            pool_info.reserve_b += amount_in;
            pool_info.reserve_a -= amount_out;
        }

        env.storage().instance().set(&POOL_INFO, &pool_info);

        // Emit swap event
        env.events().publish(
            (symbol_short!("POOL"), symbol_short!("SWAP")),
            (user, token_in, token_out, amount_in, amount_out),
        );

        amount_out
    }

    /// Get pool information
    pub fn get_pool_info(env: Env) -> PoolInfo {
        env.storage().instance().get(&POOL_INFO).unwrap()
    }

    /// Get user liquidity position
    pub fn get_position(env: Env, user: Address) -> Option<LiquidityPosition> {
        let position_key = (user, symbol_short!("LP"));
        env.storage().persistent().get(&position_key)
    }
}