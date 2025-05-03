const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployment realizat cu adresa:", deployer.address);

  const token = await ethers.deployContract("OrionixToken", [deployer.address]);
  await token.waitForDeployment();

  console.log("OrionixToken desfășurat la adresa:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 