const songInput = document.getElementById('song-input');
const startGameBtn = document.getElementById('start-game');
const toggleLeaderboardBtn = document.getElementById('toggle-leaderboard');
const leaderboardDiv = document.getElementById('leaderboard');
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
let player;
let currentSnippetIndex = 0;
let currentSnippet = '';
let currentCharIndex = 0;
let bpm = 80;
let beatInterval;
let lastBeatTime = 0;
let score = 0;
let correctChars = 0;
let totalChars = 0;
let onBeatHits = 0;
let fullTranscript = '';
let transcriptChunks = [];
let currentChunkIndex = 0;

function getNextChunk() {
  currentChunkIndex++;
  if (currentChunkIndex >= transcriptChunks.length) {
    return { chunk: null, completedAll: true };
  }
  return { chunk: transcriptChunks[currentChunkIndex], completedAll: false };
}

function processTranscript(text) {
  return text.split(/(?<=[.!?])\s+/).filter(chunk => chunk.length > 10);
}

function prepareNewSnippet() {
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
}
  
async function startGame() {
  const transcript = document.getElementById('user-transcript').value.trim();
  if (!transcript) {
    alert("Please paste a transcript first");
    return;
  }
  
  fullTranscript = transcript;
  transcriptChunks = processTranscript(fullTranscript);
  currentChunkIndex = 0;
  
  if (transcriptChunks.length === 0) {
    alert("Couldn't extract usable text from transcript");
    return;
  }
  currentSnippet = transcriptChunks[0];
  prepareNewSnippet();
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
  const next = getNextChunk();
  const accuracy = Math.round((correctChars / totalChars) * 100) || 0;
  const timing = Math.round((onBeatHits / totalChars) * 100) || 0;
  if (player && player.pauseVideo) {
    player.pauseVideo();
  }
  if (next.completedAll) {
    alert(`Perfect! You completed the entire transcript!\nFinal Score: ${score}\nAccuracy: ${accuracy}%\nTiming: ${timing}%`);
    endGame();
  } else if (next.chunk) {
    if (confirm(`Score: ${score}\nContinue to next part?`)) {
      currentSnippet = next.chunk;
      prepareNewSnippet();
      if (player && player.playVideo) {
        player.playVideo();
      }
    } else {
      endGame();
    }
  }
}

  function endGame() {
    document.getElementById('code-input').value = '';
    gameScreen.style.display = 'none';
    homeScreen.style.display = 'block';
    document.getElementById('transcript-box').style.display = 'none';
    clearInterval(beatInterval);
    if (player && player.pauseVideo) {
      player.pauseVideo();
    }
  }

document.getElementById('code-input').addEventListener('keypress', checkKeyPress);
document.getElementById('back-button').addEventListener('click', endGame);

startGameBtn.addEventListener('click', () => {
  const videoId = extractVideoID(songInput.value.trim());
  if (!videoId) {
    alert("Please enter a valid YouTube URL first");
    return;
  }
  homeScreen.style.display = 'none';
  document.getElementById('transcript-box').style.display = 'block';
  if (player) {
    player.loadVideoById(videoId);
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
document.getElementById('start-with-transcript').addEventListener('click', startGame);



const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
tag.onerror = function() {
  alert("Failed to load YouTube API. Please check your internet connection.");
  startGameBtn.disabled = true;
};
document.head.appendChild(tag);

function checkInputs() {
  startGameBtn.disabled = !(songInput.value.trim() !== '');
}

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
  
