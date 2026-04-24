let allCountries = [];
let currentCountry = null;
let totalPoints = 0;
let roundPotential = 500;
let currentRound = 1;

async function initGame() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,population,region,subregion,languages,borders,currencies,capital,cca3');
        if (!response.ok) throw new Error("API Fetch Failed");
        const data = await response.json();
        
        allCountries = data.filter(c => c.population > 50000);
        
        loadNewRound();
        displayLocalLeaderboard();
    } catch (error) {
        console.error("❌ Init Error:", error);
        document.getElementById('clue-text').innerText = "API Error. Please refresh.";
    }
}


function getCountryNameByCode(code) {
    const country = allCountries.find(c => c.cca3 === code);
    return country ? country.name.common : code;
}

function loadNewRound() {
    if (currentRound > 10) {
        endGame();
        return;
    }

    roundPotential = 500;
    updateUIElements();
    
    currentCountry = allCountries[Math.floor(Math.random() * allCountries.length)];
    
    const flagImg = document.getElementById('country-flag');
    flagImg.src = currentCountry.flags.png;
    
    flagImg.className = "blurred"; 
    flagImg.style.filter = "blur(75px) saturate(2) contrast(1.2)";

    document.getElementById('clue-text').innerText = "High Stakes: You only get ONE guess!";
    document.getElementById('guess-input').value = "";
    document.getElementById('fact-text').innerText = "Correctly guess to reveal facts.";
}

function updateUIElements() {
    document.getElementById('current-potential').innerText = roundPotential;
    document.getElementById('penalty-count').innerText = 500 - roundPotential;
    document.getElementById('round-num').innerText = currentRound;
    document.getElementById('total-points').innerText = totalPoints;
}

window.revealClue = function(type, cost) {
    if (roundPotential <= cost) {
        alert("Not enough points!");
        return;
    }

    roundPotential -= cost;
    updateUIElements();

    let info = "";
    switch(type) {
        case 'region': info = `Region: ${currentCountry.region}`; break;
        case 'subregion': info = `Sub-Region: ${currentCountry.subregion}`; break;
        case 'population': info = `Population: ${currentCountry.population.toLocaleString()}`; break;
        case 'languages': info = `Languages: ${Object.values(currentCountry.languages).join(", ")}`; break;
        case 'currencies':
            const curr = Object.values(currentCountry.currencies)[0];
            info = `Currency: ${curr.name} (${curr.symbol})`;
            break;
        case 'capital': info = `Capital: ${currentCountry.capital?.[0] || "N/A"}`; break;
        case 'borders':
            if (currentCountry.borders?.length > 0) {
                const borderNames = currentCountry.borders.map(code => getCountryNameByCode(code));
                info = `Borders: ${borderNames.join(", ")}`;
            } else {
                info = "Borders: None (Island Nation)";
            }
            break;
    }
    document.getElementById('clue-text').innerText = info;
};

window.checkGuess = function() {
    const userInput = document.getElementById('guess-input').value.trim().toLowerCase();
    const correctAnswer = currentCountry.name.common.toLowerCase();

    const flagImg = document.getElementById('country-flag');
    flagImg.style.filter = "blur(0px)"; 

    if (userInput === correctAnswer) {
        totalPoints += roundPotential;
        document.getElementById('fact-text').innerText = `✅ EXCELLENT! +${roundPotential} pts.`;
        updateUIElements();
        
        setTimeout(() => {
            currentRound++;
            loadNewRound();
        }, 2000);
    } else {
     
        document.getElementById('fact-text').innerText = `❌ WRONG. It was ${currentCountry.name.common}. 0 pts awarded.`;
        
        document.getElementById('current-potential').innerText = "0";
        
        setTimeout(() => {
            currentRound++;
            loadNewRound();
        }, 3000);
    }
};

function endGame() {
    alert(`Game Over! Final Score: ${totalPoints}`);
    const name = prompt("Enter your name for the leaderboard:") || "Explorer";
    
    const scores = JSON.parse(localStorage.getItem('geoScores')) || [];
    scores.push({ name, score: totalPoints, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    
    localStorage.setItem('geoScores', JSON.stringify(scores.slice(0, 10)));
    
    totalPoints = 0;
    currentRound = 1;
    initGame();
}

function displayLocalLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    const scores = JSON.parse(localStorage.getItem('geoScores')) || [];
    list.innerHTML = scores.map(s => `<li>${s.name} - ${s.score} pts</li>`).join("") || "<li>No scores yet</li>";
}

// Run
initGame();