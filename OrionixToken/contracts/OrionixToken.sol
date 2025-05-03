// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OrionixToken is ERC20, Ownable {
    constructor(address initialOwner) 
        ERC20("Orionix", "ORX") 
        Ownable(initialOwner)
    {
        // Emite 1,000,000 de tokeni către creator
        // 18 decimale este standardul pentru ERC20
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    // Funcția pentru a emite mai multe tokeni (doar proprietarul poate face asta)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 