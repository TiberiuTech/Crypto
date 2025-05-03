const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OrionixToken", function () {
  let OrionixToken;
  let orionixToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    OrionixToken = await ethers.getContractFactory("OrionixToken");
    orionixToken = await OrionixToken.deploy(owner.address);
  });

  describe("Deployment", function () {
    it("Ar trebui să seteze numele și simbolul corect", async function () {
      expect(await orionixToken.name()).to.equal("Orionix");
      expect(await orionixToken.symbol()).to.equal("ORX");
    });

    it("Ar trebui să atribuie supply-ul total owner-ului", async function () {
      const ownerBalance = await orionixToken.balanceOf(owner.address);
      expect(await orionixToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Ar trebui să emită 1,000,000 de tokeni cu 18 decimale", async function () {
      const expectedSupply = ethers.parseEther("1000000");
      expect(await orionixToken.totalSupply()).to.equal(expectedSupply);
    });
  });

  describe("Tranzacții", function () {
    it("Ar trebui să permită transferul de tokeni între conturi", async function () {
      // Transfer 50 tokeni de la owner la addr1
      await orionixToken.transfer(addr1.address, ethers.parseEther("50"));
      const addr1Balance = await orionixToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.parseEther("50"));

      // Transfer 20 tokeni de la addr1 la addr2
      await orionixToken.connect(addr1).transfer(addr2.address, ethers.parseEther("20"));
      const addr2Balance = await orionixToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.parseEther("20"));
    });

    it("Ar trebui să eșueze dacă expeditorul nu are suficienți tokeni", async function () {
      const initialOwnerBalance = await orionixToken.balanceOf(owner.address);
      await expect(
        orionixToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(orionixToken, "ERC20InsufficientBalance");
      expect(await orionixToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Mint", function () {
    it("Ar trebui să permită owner-ului să emită tokeni noi", async function () {
      await orionixToken.mint(addr1.address, ethers.parseEther("100"));
      expect(await orionixToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Ar trebui să eșueze dacă altcineva încearcă să emită tokeni", async function () {
      await expect(
        orionixToken.connect(addr1).mint(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(orionixToken, "OwnableUnauthorizedAccount");
    });
  });
}); 