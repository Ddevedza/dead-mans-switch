import ConnectWallet from "./ConnectWallet";
import { useState, useEffect } from 'react';
import OwnerDashboard from "./OwnerDashboard";
import CreateContract from "./CreateContract";
import BeneficiaryPortal from "./BeneficiaryPortal";
import { ethers } from 'ethers';
import { CONTRACT_ABI } from './contract.js';

// Glavna komponenta aplikacije, koja upravlja povezivanjem walleta, kreiranjem ugovora i prikazom odgovarajuceg dashboarda shodno ulozi korisnika
function App() {
  const [adresa, setAdresa] = useState(null); // adresa korisnika
  const [contractAddress, setContractAddress] = useState(null); // adresa contracta
  const [role, setRole] = useState(null); // uloga korisnika - owner ili beneficiary
  const [contractInput, setContractInput] = useState(""); // unos adrese contracta

  // Funkcija za postavljanje adrese contracta iz inputa
  function handleContractInput() {
      setContractAddress(contractInput);
  }

  // Funkcija koja se poziva kada se korisnik poveze sa walletom
  function handleConnect(adresa) {
    console.log("Adresa primljena:", adresa);
    setAdresa(adresa);
    setContractAddress(null);
    setRole(null);
  }

  // Funkcija koja se poziva kada se kreira novi ugovor
  function handleContractCreated(contractAddress) {
    setContractAddress(contractAddress);
    setRole("owner");
  }

  // Proveravamo ulogu korisnika kada se promeni adresa ili adresa contracta
  useEffect(() => {
    async function checkRole() {
      if (!adresa || !contractAddress) return;

      console.log("Proveravam ulogu za adresu:", adresa);
      console.log("Contract adresa:", contractAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

      let owner;
      let beneficiary;

      // citamo vlasnika
      try {
        console.log("Citam owner...");
        owner = await contract.owner();
        console.log("Owner:", owner);
      } catch (error) {
        console.error("Greska pri citanju ownera:", error);
        // ako ne mozemo citati ownera, probamo samo beneficiary
        try {
          beneficiary = await contract.beneficiary();
          console.log("Beneficiary:", beneficiary);
          if (adresa.toLowerCase() === beneficiary.toLowerCase()) {
            setRole("beneficiary");
          } else {
            setRole(null);
          }
        } catch (e) {
          console.error("Greska pri citanju beneficiary:", e);
          setRole(null);
        }
        return;
      }

      // citamo naslednika
      try {
        console.log("Citam beneficiary...");
        beneficiary = await contract.beneficiary();
        console.log("Beneficiary:", beneficiary);
      } catch (error) {
        console.error("Greska pri citanju beneficiary:", error);
        setRole(null);
        return;
      }

      // Poredimo adrese i postavljamo ulogu
      if (adresa.toLowerCase() === owner.toLowerCase()) {
        setRole("owner");
      } else if (adresa.toLowerCase() === beneficiary.toLowerCase()) {
        setRole("beneficiary");
      } else {
        setRole(null);
      }
    }
    checkRole();
  }, [adresa, contractAddress]);

  return (
    <div>
      <ConnectWallet onConnect={handleConnect} />
      {/* Ako nije kreiran contract, prikazujemo formu za kreiranje */}
      {adresa && !contractAddress && (
        <div>
          <CreateContract adresa={adresa} onContractCreated={handleContractCreated} />
          <hr />
          <h3>Ili unesi adresu postojećeg ugovora</h3>
          <input
              type="text"
              placeholder="Adresa ugovora"
              value={contractInput}
              onChange={(e) => setContractInput(e.target.value)}
          />
          <button onClick={handleContractInput}>Pristupi ugovoru</button>
        </div>
      )}
      {/* Shodno ulozi prikazujemo odgovarajuci dashboard */}
      {contractAddress && role === "owner" && (
        <OwnerDashboard adresa={adresa} contractAddress={contractAddress} />
      )}
      {contractAddress && role === "beneficiary" && (
        <BeneficiaryPortal adresa={adresa} contractAddress={contractAddress} />
      )}
      {contractAddress && role === null && (
        <p>Niste autorizovani za ovaj ugovor.</p>
      )}
    </div>
  );
}

export default App;