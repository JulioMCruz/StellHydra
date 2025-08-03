default: build

all: clean build test

test: build
	cargo test

build:
	stellar contract build
	@ls -la ../target/wasm32v1-none/release/*.wasm

fmt:
	cargo fmt --all

clean:
	cargo clean

deploy-testnet:
	stellar contract deploy \
		--wasm ../target/wasm32v1-none/release/simple_test.wasm \
		--source alice \
		--network testnet

install-deps:
	stellar contract install --wasm ../target/wasm32v1-none/release/simple_test.wasm \
		--source alice \
		--network testnet

setup-network:
	stellar network add \
		--global testnet \
		--rpc-url https://soroban-testnet.stellar.org:443 \
		--network-passphrase "Test SDF Network ; September 2015"

fund-alice:
	stellar keys fund alice --network testnet

invoke-hello:
	stellar contract invoke \
		--id $(CONTRACT_ID) \
		--source alice \
		--network testnet \
		-- hello \
		--to "Stellar"

.PHONY: default all test build fmt clean deploy-testnet install-deps setup-network fund-alice invoke-hello