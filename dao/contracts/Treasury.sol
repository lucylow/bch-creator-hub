// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Treasury
/// @notice Simple treasury controlled by a role (e.g., TIMELOCK_ROLE). Only the timelock should be granted the role.
contract Treasury is AccessControl {
    bytes32 public constant TIMELOCK_ROLE = keccak256("TIMELOCK_ROLE");

    event EtherReceived(address indexed sender, uint256 amount);
    event EtherReleased(address indexed to, uint256 amount);
    event ERC20Released(address indexed token, address indexed to, uint256 amount);

    constructor(address timelock) {
        // Grant the timelock role to timelock (or whoever should call)
        _setupRole(TIMELOCK_ROLE, timelock);
        _setRoleAdmin(TIMELOCK_ROLE, TIMELOCK_ROLE);
    }

    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // Release ETH from treasury; only callable by timelock
    function releaseEther(address payable to, uint256 amount) external onlyRole(TIMELOCK_ROLE) {
        require(address(this).balance >= amount, "Treasury: insufficient balance");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Treasury: ETH transfer failed");
        emit EtherReleased(to, amount);
    }

    // Release ERC20 tokens
    function releaseERC20(address token, address to, uint256 amount) external onlyRole(TIMELOCK_ROLE) {
        IERC20(token).transfer(to, amount);
        emit ERC20Released(token, to, amount);
    }
}


