// Sync scores to backend
async function saveScore(level, points) {
    const username = localStorage.getItem('currentUser') || 'Guest';
    const key = level + 'Score';
    const current = parseInt(localStorage.getItem(key) || 0);
    const newScore = current + points;
    
    localStorage.setItem(key, newScore);
    
    const easy = parseInt(localStorage.getItem('easyScore') || 0);
    const medium = parseInt(localStorage.getItem('mediumScore') || 0);
    const hard = parseInt(localStorage.getItem('hardScore') || 0);
    
    await fetch('http://localhost:3000/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, easyScore: easy, mediumScore: medium, hardScore: hard })
    });
}

// Load scores from backend
async function loadScores() {
    const username = localStorage.getItem('currentUser') || 'Guest';
    
    const response = await fetch(`http://localhost:3000/api/get-score/${username}`);
    const data = await response.json();
    
    localStorage.setItem('easyScore', data.easyScore || 0);
    localStorage.setItem('mediumScore', data.mediumScore || 0);
    localStorage.setItem('hardScore', data.hardScore || 0);
}
