# Dead Man's Switch — Ethereum Smart Contract

Decentralizovani Dead Man's Switch mehanizam implementiran kao 
Solidity pametni ugovor na Ethereum blockchainu.

## Opis
Vlasnik periodično potvrđuje prisustvo (checkIn). Ako potvrda 
izostane u definisanom roku, naslednik može preuzeti deponovana 
sredstva i poruku ostavljenu od vlasnika.

## Tehnologije
- Solidity ^0.8.20
- Hardhat + Mocha + Chai (testiranje)
- Ethers.js v6
- React (frontend)
- Sepolia testnet (deploy)

## Pokretanje

### Smart contract
```bash
npm install
npx hardhat test
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Ugovor na Sepoliji
`0x04bc5f18054ac45e9fb517a1c46d3f12f21c2bd9`
