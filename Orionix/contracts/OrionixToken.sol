// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OrionixToken is ERC20, ERC20Burnable, Ownable {
    constructor(address initialOwner)
        ERC20("Orionix", "ORX")
        Ownable(initialOwner)
    {
        // Mint 1,000,000 tokens initial (cu 18 zecimale)
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 