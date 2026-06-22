// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DeadMansSwitch {
    uint256 public lastCheckIn; //timestamp poslednjeg check-ina
    uint256 public checkInInterval; //koliko sekundi izmedju check-inova
    uint256 public createdAt; // kad je kreiran sam contract

    bool public triggered; // da li je switch okinut
    bool public isRevocable; // da li vlasnik moze raskinuti ugovor
    bool public isBeneficiaryChangeable; // da li vlasnik moze promeniti naslednika
    bool public isMessageChangeable; // da li je dozvoljeno menjanje poruke od strane vlasnika

    address public owner; // vlasnik switch-a
    address public beneficiary; // naslednik

    string public encryptedMessageCID; // hash poruke na IPFS-u

    // Event line

    // event vlasnika i vremena check-ina
    event CheckIn(address indexed owner, uint256 timestamp);

      // event naslednika, primljene cifre i vremena transfera
    event TriggerSwitch(address indexed beneficiary, uint256 amount, uint256 timestamp);

        // event depozitovanog novca - vlasnik i cifra
    event FundsDeposited(address indexed owner, uint256 amount);

        // event zamene naslednika - nov nasledni, stari naslednik
    event UpdatedBeneficiary(address indexed beneficiary, address indexed _beneficiary);

        // event zamene poruke - nova poruka, stara poruka
    event UpdateMessage(string novaPoruka, string staraPoruka);

        // event raskidanja, vracanje sredstva i vreme ponistenja
    event TriggerRevoke(address indexed owner, uint256 amount, uint256 timestamp);

    // Modifier-i

    // modifier za proveru da li je vlasnik trenutno pri pametnom ugovoru
    modifier onlyOwner {
    require(msg.sender == owner, "Nije vlasnik");
        _; 
    }

    // provera da li je switch aktiviran (ako nije)
    modifier notTriggered{
        require(!triggered, "Switch je vec okinut");
        _;
    }

    // provera da li je switch aktiviran (ako jeste)
    modifier isTriggered{
        require(triggered, "Switch nije okinut");
        _;
    }
    
    // modifier za proveru da li je naslednik trenutno pri pametnom ugovoru
    modifier onlyBeneficiary {
    require(msg.sender == beneficiary, "Nije naslednik");
        _; 
    }

    // modifier za proveru da li je istekao tajmer
    modifier intervalEnd {
    require(block.timestamp >= lastCheckIn + checkInInterval, "Nije naslednik");
        _; 
    }

    // modifier za proveru da li ugovor omogucava promenu naslednika
    modifier beneficiaryChangeCheck {
    require(isBeneficiaryChangeable, "Nije dozvoljena promena naslednika");
        _; 
    }

    // modifier za proveru da li ugovor omogucava promenu poruke vlasnika
    modifier messageChangeCheck {
    require(isMessageChangeable, "Nije dozvoljena promena poruke");
        _; 
    }

    // modifier za proveru da li ugovor moze biti raskinut
    modifier revokeCheck {
    require(isRevocable, "Nije dozvoljeno raskidanje ugovora");
        _; 
    }

    // Constructor
        
    // vlasnik definise naslednika i vremenski interval prijavljivanja
    constructor (address _beneficiary, uint256 _checkInInterval, bool _isRevocable, bool _isBeneficiaryChangeable, bool _isMessageChangeable){

        owner = msg.sender; // definisanje vlasnika - kreator ugovora je vlasnik

        lastCheckIn = block.timestamp; // trenutno vreme
        createdAt = lastCheckIn; // kreirano i checkirano je u trenutnom vremenu prvi put

        beneficiary = _beneficiary; // naslednik
        checkInInterval = _checkInInterval; // na koliko je provera

        isRevocable = _isRevocable; // da li je moguce raskinuti ugovor
        isBeneficiaryChangeable = _isBeneficiaryChangeable; // da li vlasnik sme promeniti naslednika
        isMessageChangeable = _isMessageChangeable; // da li je dozvoljena promena poruke vlasnika u bilo kom trenutku
    }

    // Funkcije

    // vlasnik vrsi check-in kako bi se resetovao tajmer
    function checkIn() public onlyOwner notTriggered {

        // ukoliko je vec izvrsen switch
        lastCheckIn = block.timestamp;

        // emitujemo vlasnika i vreme checkin-a
        emit CheckIn(msg.sender, block.timestamp);
        }
    
    // funkcija za primanje nasledstva ukoliko je switch aktiviran i ukoliko je istekao interval
    function triggerSwitch() public onlyBeneficiary notTriggered intervalEnd{
        triggered = true;

        uint256 amount = address(this).balance;
        (bool success, ) = beneficiary.call{value: amount}(""); // naslednik prima nasledstvo u nivou balansa vlasnika
        require(success, "Transfer nije uspeo"); // provera slanja

        // emitujemo naslednika, primljenu cifru i vreme transfera
        emit TriggerSwitch(beneficiary, amount, block.timestamp);        
    }

    // vracamo enkriptovanu poruku iz memorije
    function getMessage() public view onlyBeneficiary isTriggered returns (string memory){

        return encryptedMessageCID; 
        
    }

    // funkcija za definisanje sume koju vlasnik zeli da kreira za naslednika
    function depositFunds() public payable onlyOwner notTriggered{
        uint256 amount = msg.value; // iznos koji je korisnik poslao

        // emitovanje depozitovanog novca - vlasnik i cifra
        emit FundsDeposited(owner, amount);
    }

    // funkcija u slucaju da vlasnik zeli da promeni naslednika - ukoliko je dozvoljeno
    function updateBeneficiary(address _beneficiary) public onlyOwner notTriggered beneficiaryChangeCheck{

        // emitovanje zamene naslednika - nov naslednik, stari naslednik
        emit UpdatedBeneficiary(beneficiary, _beneficiary);

        beneficiary = _beneficiary;
    } 


    // promena prvobitne poruke vlasnika
    function updateMessage(string memory  _encryptedMessageCID) public onlyOwner notTriggered messageChangeCheck{

        // emitovanje zamene poruke - nova poruka, stara poruka
        emit UpdateMessage(encryptedMessageCID, _encryptedMessageCID);

        encryptedMessageCID=_encryptedMessageCID; // promena prethodne poruke

    }

    // raskidanje ugovora - ukoliko je moguce (isRevocable = true)
    function revokeContract() public onlyOwner revokeCheck notTriggered {
        triggered = true;

        uint256 amount = address(this).balance;
        (bool success, ) = owner.call{value: amount}(""); // naslednik prima nasledstvo u nivou balansa vlasnika
        require(success, "Transfer nije uspeo"); // provera slanja

        // emitujemo raskidanje, vracanje sredstva i vreme ponistenja
        emit TriggerRevoke(owner, amount, block.timestamp);   
    }

    // funkciju za proveru balansa koji je pripremljen
    function getBalance() public view returns (uint256){
        
        return address(this).balance;
    }

    // provera koliko je vremena ostalo pre nego sto ugovor istekne
    function timeUntilTrigger() public view returns (uint256){
        
        // provera da li je trenutno vreme vece od roka
        if (block.timestamp >= lastCheckIn + checkInInterval) {
            return 0;
        }
        // ukoliko nije vracamo koliko je ostalo jos do isteka
        return lastCheckIn + checkInInterval - block.timestamp;
    }
}
