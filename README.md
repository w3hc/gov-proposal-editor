# Gov Proposal Editor

A proposal editor for [Gov](https://github.com/w3hc/gov).

Live demo: [https://gov-proposal-editor.netlify.app/](https://gov-proposal-editor.netlify.app/)

## Motivation

We now have great tools to build DAOs, including [Open Zeppelin's Governor](https://blog.openzeppelin.com/governor-smart-contract/) and [Tally](https://www.tally.xyz/). Gov is a DAO template that combines Governor and ERC-721. Tally's UX is pretty remarkable, Gov Proposal Editor simplifies the proposal submission process leveraging [Web3.Storage](https://web3.storage/) (IPFS + Filcoin), makes it more adapted to Gov and also intends to add a privacy layer thanks to [Medusa Network](https://medusanet.xyz/).

The project started during the [FVM SPACE WARP HACKATHON](https://ethglobal.com/events/spacewarp) (Jan 20 - Feb 10, 2023) organized by ETH Global. 

## Install 

```sh
yarn install
```

Initialize the env file with `cp .env.example .env`, and add your Infura project id. 

Then:

```sh
yarn dev
```

## Credits

Many thanks to [m1guelpf](https://github.com/m1guelpf), author of the [dApp Starter](https://github.com/m1guelpf/dapp-starter).