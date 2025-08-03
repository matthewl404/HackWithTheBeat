const languageSelect = document.getElementById('language-select');
const songInput = document.getElementById('song-input');
const startGameBtn = document.getElementById('start-game');
const toggleLeaderboardBtn = document.getElementById('toggle-leaderboard');
const leaderboardDiv = document.getElementById('leaderboard');
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
let player;
let currentSnippetIndex = 0;

const codeSnippets = {
  python: [
    'print("Hello")',
    'x = 5',
    'for i in range(3):',
    'def greet(name):',
    'if x > 0:'
  ],
  javascript: [
    'console.log("Hello")',
    'let x = 5',
    'for(let i=0; i<3; i++)',
    'function greet(name)',
    'if (x > 0)'
  ]
};
let currentSnippet = '';
let currentCharIndex = 0;
let bpm = 80;
let beatInterval;
let lastBeatTime = 0;
let score = 0;
let correctChars = 0;
let totalChars = 0;
let onBeatHits = 0;

function getNextSnippet() {
  currentSnippetIndex = (currentSnippetIndex + 1) % codeSnippets[languageSelect.value].length;
  return codeSnippets[languageSelect.value][currentSnippetIndex];
}

function startGame() {
  currentSnippet = getNextSnippet();
  const codeDisplay = document.getElementById('code-display');
  codeDisplay.innerHTML = '';
  
  currentSnippet.split('').forEach(char => {
    const span = document.createElement('span');
    span.textContent = char;
    codeDisplay.appendChild(span);
  });
  
  document.getElementById('code-input').value = '';
  currentCharIndex = 0;
  score = 0;
  correctChars = 0;
  totalChars = 0;
  onBeatHits = 0;
  updateDisplay();
  
  const beatDuration = 60000 / bpm;
  beatInterval = setInterval(() => {
    lastBeatTime = Date.now();
    animateBeat();
  }, beatDuration);
  
  document.getElementById('code-input').focus();
}

function animateBeat() {
  const indicator = document.getElementById('beat-indicator');
  indicator.style.transform = 'scale(1.5)';
  setTimeout(() => {
    indicator.style.transform = 'scale(1)';
  }, 100);
}

function checkKeyPress(e) {
  if (e.key.length > 1) return;
  const currentTime = Date.now();
  const isOnBeat = Math.abs(currentTime - lastBeatTime) < 200;

  if (e.key === currentSnippet[currentCharIndex]) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const codeDisplay = document.getElementById('code-display');
    const span = document.createElement('span');
    span.className = 'char-highlight';
    span.textContent = e.key;
    if (isOnBeat) {
      span.style.color = '#66ff66';
      score += 2;
      onBeatHits++;
    } else {
      span.style.color = '#66ccff';
      score += 1;
    }
    codeDisplay.replaceChild(span, codeDisplay.childNodes[currentCharIndex]);
    
    correctChars++;
    currentCharIndex++;
  } else {
    // Wrong character feedback
    const codeDisplay = document.getElementById('code-display');
    const span = document.createElement('span');
    span.className = 'char-highlight';
    span.textContent = currentSnippet[currentCharIndex];
    span.style.color = '#ff3366';
    codeDisplay.replaceChild(span, codeDisplay.childNodes[currentCharIndex]);
  }
  totalChars++;
  updateDisplay();
  
  if (currentCharIndex >= currentSnippet.length) {
    clearInterval(beatInterval);
    showResults();
  }
}

function updateDisplay() {
  const accuracy = Math.round((correctChars / totalChars) * 100) || 0;
  const timing = Math.round((onBeatHits / totalChars) * 100) || 0;
  document.getElementById('score-display').textContent = 
    `Score: ${score} | Accuracy: ${accuracy}% | Timing: ${timing}%`;
}

function showResults() {
  alert(`Completed!\nScore: ${score}\nAccuracy: ${Math.round((correctChars/totalChars)*100)}%\nTiming: ${Math.round((onBeatHits/totalChars)*100)}%`);
}

document.getElementById('code-input').addEventListener('keypress', checkKeyPress);
document.getElementById('back-button').addEventListener('click', () => {
  document.getElementById('code-input').value = '';
  gameScreen.style.display = 'none';
  homeScreen.style.display = 'block';
  clearInterval(beatInterval);
});
startGameBtn.addEventListener('click', () => {
  startGameBtn.disabled = true;
  startGameBtn.textContent = 'Loading...';
  const videoId = extractVideoID(songInput.value.trim());
  if (!videoId) {
    alert("Please enter a valid YouTube URL.");
    startGameBtn.disabled = false;
    startGameBtn.textContent = 'Start Game';
    return;
  }
homeScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  
  if (player) {
    player.loadVideoById(videoId);
    startGameBtn.disabled = false;
    startGameBtn.textContent = 'Start Game';
  } else {
    player = new YT.Player('player', {
      height: '360',
      width: '640',
      videoId: videoId,
      events: {
        'onReady': (event) => {
          event.target.playVideo();
          startGame();
          startGameBtn.disabled = false;
          startGameBtn.textContent = 'Start Game';
        },
        'onError': () => {
          alert("Error loading video")
          startGameBtn.disabled = false;
          startGameBtn.textContent = 'Start Game';
        }
      }
    });
  }
});




const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
tag.onerror = function() {
  alert("Failed to load YouTube API. Please check your internet connection.");
  startGameBtn.disabled = true;
};
document.head.appendChild(tag);

function checkInputs() {
  if (languageSelect.value && songInput.value.trim() !== '') {
    startGameBtn.disabled = false;
  } else {
    startGameBtn.disabled = true;
  }
}

languageSelect.addEventListener('change', checkInputs);
songInput.addEventListener('input', checkInputs);

toggleLeaderboardBtn.addEventListener('click', () => {
  if (leaderboardDiv.style.display === 'none') {
    leaderboardDiv.style.display = 'block';
  } else {
    leaderboardDiv.style.display = 'none';
  }
});

function extractVideoID(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/watch\?v=)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
  
