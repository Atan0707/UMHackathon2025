# ZakatChain: Transparent Islamic Charity Distribution

A decentralized platform revolutionizing zakat (Islamic charity) distribution through blockchain technology, ensuring complete transparency and accountability.

## 🌟 Features

- **Transparent Tracking**: Real-time monitoring of zakat funds from collection to distribution
- **Smart Contract Automation**: Rules-based distribution following Islamic principles
- **Full Transparency**: Immutable transaction records on Ethereum
- **Payment Method**: Use stablecoin for payment and distribution process

## 🚀 Technology Stack

- **Frontend**: Next.js 15 with App Router and TurboPack
- **Blockchain**: Ethereum smart contracts via ethers.js
- **Web3 Integration**: Reown AppKit for seamless wallet connections
- **Blockchain Indexer**: Uses The Graph to query real-time data from blockchain

## 🌐 Impact

ZakatChain increases confidence in charitable giving by providing:

- 100% transparency in fund distribution
- Real-time tracking of impact metrics
- Digital receipts for tax purposes

## 💻 Project Architecture

![image](https://github.com/user-attachments/assets/8a2a8ded-dea4-47fb-b11d-a95d167dd560)

Zakat that have been collected will be stored inside the blockchain via our own API, and will mint a MYR-stablecoin, based on amount collected.

For example; RM100 = 100ZKT

![image](https://github.com/user-attachments/assets/517c2f33-e266-4275-acc3-a8982f51e964)

This is the one of the distribution that we called ZakatCredit. User receive a certain amount of Zakat, that can be used with registered merchant. The idea is from MyKasih, where Zakat recipient will have to use their IC to pay for item with creditted money to their IC. Some of the stablecoin will be linked to the recipient to be used at a certain merchant such as Mydin. 

Merchant then can claim back the money from Zakat Negeri, which will then burn the token and removed it from the supply.

![image](https://github.com/user-attachments/assets/4b28179d-58ed-4489-9bd7-af6b138926a8)

For any zakat activities, such as house repairing and food supply, we've created a function to burn or remove the token from circulation, and processes it to fiat, to ensure all the Zakat funds will be tracked in much more transaprent manners.

## 🛠️ Getting Started

First, install the dependencies:

```bash
yarn
```

Then, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.


