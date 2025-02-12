import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [messageStr, setMessageStr] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = "0xf9B0D94F1145B9e37285C6F86Ba3Bd7F5C8E9dDd";
  const contractABI = abi.abi;

  useEffect(() => {
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, [contractABI]);

  useEffect(() => {
    const getAllWaves = async () => {
      try {
        const { ethereum } = window;
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
  
          /*
           * Call the getAllWaves method from your Smart Contract
           */
          const waves = await wavePortalContract.getAllWaves();
          
  
          /*
           * We only need address, timestamp, and message in our UI so let's
           * pick those out
           */
          let wavesCleaned = [];
          waves.forEach(wave => {
            wavesCleaned.push({
              address: wave.waver,
              timestamp: new Date(wave.timestamp * 1000),
              message: wave.message
            });
          });
  
          /*
           * Store our data in React State
           */
          setAllWaves(wavesCleaned);
        } else {
          console.log("Ethereum object doesn't exist!")
        }
      } catch (error) {
        console.log(error);
      }
    }

    const checkIfWalletIsConnected = async () => {
      try {
        const { ethereum } = window;
        
        if (!ethereum) {
          console.log("Make sure you have metamask!");
          return;
        } else {
          console.log("We have the ethereum object", ethereum);
        }
        
        /*
        * Check if we're authorized to access the user's wallet
        */
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account)
          getAllWaves();
        } else {
          console.log("No authorized account found")
        }
      } catch (error) {
        console.log(error);
      }
    }

    checkIfWalletIsConnected();
  }, [contractABI]);


  /**
  * Implement your connectWallet method here
  */
   const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(messageStr, { gasLimit: 300000 });

        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());        
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
}
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="Brazil">🇧🇷</span> Hey there!
        </div>

        <div className="bio">
        I am danicuki and I have a YouTube Channel? Isn't it awesome? Connect your Ethereum wallet and wave at me!
        </div>

        <p>
          Write your message here: &nbsp;
          <input type="text" value={messageStr} onChange={(e) => setMessageStr(e.target.value)} />
        </p>
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
