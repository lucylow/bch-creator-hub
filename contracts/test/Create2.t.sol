// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/NFTMarketplace.sol";

contract Create2Test is Test {
    bytes32 constant SALT =
        bytes32(uint256(0x1111));

    address constant SIGNER = address(0x1234);

    function testCreate2Address() public {
        address deployer = address(this);

        // Get creation code
        bytes memory creationCode = type(NFTMarketplace).creationCode;
        bytes memory encodedArgs = abi.encode(SIGNER);
        bytes memory bytecode = abi.encodePacked(creationCode, encodedArgs);

        // Calculate predicted CREATE2 address
        address predicted = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            deployer,
                            SALT,
                            keccak256(bytecode)
                        )
                    )
                )
            )
        );

        // Deploy using CREATE2
        address deployed;
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), SALT)
        }

        require(deployed != address(0), "Deployment failed");
        assertEq(deployed, predicted, "CREATE2 address mismatch");

        // Verify contract is functional
        NFTMarketplace marketplace = NFTMarketplace(deployed);
        assertEq(marketplace.signer(), SIGNER, "Signer mismatch");
    }

    function testCreate2Determinism() public {
        address deployer = address(this);
        bytes memory creationCode = type(NFTMarketplace).creationCode;
        bytes memory encodedArgs = abi.encode(SIGNER);
        bytes memory bytecode = abi.encodePacked(creationCode, encodedArgs);

        // Deploy first instance
        address deployed1;
        assembly {
            deployed1 := create2(0, add(bytecode, 0x20), mload(bytecode), SALT)
        }

        // Try to deploy second instance (should fail or be same)
        address deployed2;
        assembly {
            deployed2 := create2(0, add(bytecode, 0x20), mload(bytecode), SALT)
        }

        // Second deployment should either fail (revert) or be same address
        // In practice, it will revert, but we check they're the same if both succeed
        if (deployed2 != address(0)) {
            assertEq(deployed1, deployed2, "Non-deterministic deployment");
        }
    }
}


