// DOM Elements
const songInput = document.getElementById('song-input');
const startGameBtn = document.getElementById('start-game');
const toggleLeaderboardBtn = document.getElementById('toggle-leaderboard');
const leaderboardDiv = document.getElementById('leaderboard');
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const transcriptBox = document.getElementById('transcript-box');
const codeInput = document.getElementById('code-input');
const codeDisplay = document.getElementById('code-display');
const bpmSlider = document.getElementById('bpm-slider');
const bpmValue = document.getElementById('bpm-value');

// Game State
let player = null;
let currentSnippet = '';
let currentCharIndex = 0;
let bpm = 100;
let beatInterval = null;
let beatTimeout = null;
let lastBeatTime = 0;
let score = 0;
let correctChars = 0;
let totalChars = 0;
let onBeatHits = 0;
let fullTranscript = '';
let transcriptChunks = [];
let currentChunkIndex = 0;
let isOnBeat = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  homeScreen.style.display = 'block';
  gameScreen.style.display = 'none';
  transcriptBox.style.display = 'none';
  leaderboardDiv.style.display = 'none';
  checkInputs();
});

// YouTube API
function onYouTubeIframeAPIReady() {
  console.log("YouTube API ready");
}

// Game Functions
async function startGame() {
  const btn = document.getElementById('start-with-transcript');
  const transcript = document.getElementById('user-transcript').value.trim();
  
  showSpinner(btn);
  btn.textContent = 'Processing...';

  try {
    if (!transcript) throw new Error("Please paste a transcript first");
    
    fullTranscript = transcript;
    transcriptChunks = processTranscript(fullTranscript);
    currentChunkIndex = 0;
    
    if (transcriptChunks.length === 0) {
      throw new Error("Couldn't extract usable text from transcript");
    }
    
    currentSnippet = transcriptChunks[0];
    prepareNewSnippet();
    
    startBeat();
    codeInput.focus();
    gameScreen.style.display = 'block';
    transcriptBox.style.display = 'none';
    
  } catch (error) {
    alert(error.message);
    homeScreen.style.display = 'block';
  } finally {
    hideSpinner(btn);
    btn.textContent = 'Start Typing Game';
  }
}

function startBeat() {
  const beatDuration = 60000 / bpm;
  clearInterval(beatInterval);
  clearTimeout(beatTimeout);
  
  // Start animation immediately
  lastBeatTime = Date.now();
  isOnBeat = true;
  document.getElementById('beat-outline').style.boxShadow = '0 0 15px #66ff66';
  
  beatInterval = setInterval(() => {
    lastBeatTime = Date.now();
    isOnBeat = true;
    document.getElementById('beat-outline').style.boxShadow = '0 0 15px #66ff66';
    
    beatTimeout = setTimeout(() => {
      isOnBeat = false;
      document.getElementById('beat-outline').style.boxShadow = 'none';
    }, beatDuration * 0.2);
  }, beatDuration);
}

function checkKeyPress(e) {
  if (e.key.length > 1 || e.ctrlKey || e.altKey || e.metaKey) return;
  
  e.preventDefault();
  
  const currentTime = Date.now();
  const beatWindow = 60000 / bpm * 0.2;
  const isOnBeatNow = Math.abs(currentTime - lastBeatTime) < beatWindow;

  if (e.key === currentSnippet[currentCharIndex]) {
    const span = document.createElement('span');
    span.className = 'char-highlight';
    span.textContent = e.key;
    
    if (isOnBeatNow) {
      span.classList.add('on-beat');
      score += 2;
      onBeatHits++;
      
      // Visual feedback
      document.getElementById('beat-indicator').style.backgroundColor = '#66ff66';
      setTimeout(() => {
        document.getElementById('beat-indicator').style.backgroundColor = '#66ccff';
      }, 300);
    } else {
      score += 1;
    }
    
    codeDisplay.replaceChild(span, codeDisplay.childNodes[currentCharIndex]);
    correctChars++;
    currentCharIndex++;
  } else if (e.key !== 'Shift') {
    const span = document.createElement('span');
    span.className = 'char-highlight incorrect';
    span.textContent = currentSnippet[currentCharIndex];
    codeDisplay.replaceChild(span, codeDisplay.childNodes[currentCharIndex]);
  }
  
  updateDisplay();
  
  if (currentCharIndex >= currentSnippet.length) {
    clearInterval(beatInterval);
    showResults();
  }
}

// Helper Functions
function showSpinner(button) {
  button.classList.add('button-loading');
  const spinner = document.createElement('span');
  spinner.className = 'loading-spinner';
  button.appendChild(spinner);
  button.disabled = true;
}

function hideSpinner(button) {
  button.classList.remove('button-loading');
  const spinner = button.querySelector('.loading-spinner');
  if (spinner) button.removeChild(spinner);
  button.disabled = false;
}

function processTranscript(text) {
  return text.split(/(?<=[.!?])\s+/).filter(chunk => chunk.length > 10);
}

function prepareNewSnippet() {
  codeDisplay.innerHTML = '';
  currentSnippet.split('').forEach(char => {
    const span = document.createElement('span');
    span.textContent = char;
    codeDisplay.appendChild(span);
  });
  codeInput.value = '';
  currentCharIndex = 0;
  score = 0;
  correctChars = 0;
  totalChars = 0;
  onBeatHits = 0;
  updateDisplay();
}

function updateDisplay() {
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
  const timing = correctChars > 0 ? Math.round((onBeatHits / correctChars) * 100) : 0;
  document.getElementById('score-display').textContent = 
    `Score: ${score} | Accuracy: ${accuracy}% | Timing: ${timing}%`;
}

function showResults() {
  const next = getNextChunk();
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
  const timing = correctChars > 0 ? Math.round((onBeatHits / correctChars) * 100) : 0;
  
  if (player && player.pauseVideo) player.pauseVideo();
  
  if (next.completedAll) {
    const videoTitle = player?.getVideoData?.()?.title || songInput.value;
    saveRunToHistory({
      score,
      accuracy,
      timing,
      videoTitle,
      words: currentSnippet.length
    });
    alert(`Perfect! You completed the entire transcript!\nFinal Score: ${score}\nAccuracy: ${accuracy}%\nTiming: ${timing}%`);
    endGame();
  } else if (next.chunk && confirm(`Score: ${score}\nContinue to next part?`)) {
    currentSnippet = next.chunk;
    prepareNewSnippet();
    if (player && player.playVideo) player.playVideo();
  } else {
    endGame();
  }
}

function endGame() {
  codeInput.value = '';
  gameScreen.style.display = 'none';
  homeScreen.style.display = 'block';
  transcriptBox.style.display = 'none';
  clearInterval(beatInterval);
  if (player && player.pauseVideo) player.pauseVideo();
}

// YouTube Integration
startGameBtn.addEventListener('click', async () => {
  const videoId = extractVideoID(songInput.value.trim());
  if (!videoId) {
    alert("Please enter a valid YouTube URL first");
    return;
  }

  showSpinner(startGameBtn);
  startGameBtn.textContent = 'Loading Video...';
  
  try {
    homeScreen.style.display = 'none';
    transcriptBox.style.display = 'block';

    // Wait for YT API to load
    await new Promise((resolve, reject) => {
      const checkReady = setInterval(() => {
        if (typeof YT !== 'undefined' && YT.Player) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkReady);
        reject(new Error("YouTube API failed to load"));
      }, 5000);
    });

    if (player) {
      player.loadVideoById(videoId);
    } else {
      player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: videoId,
        events: {
          'onReady': (event) => event.target.playVideo(),
          'onError': () => { throw new Error("Error loading video"); }
        }
      });
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
    homeScreen.style.display = 'block';
    transcriptBox.style.display = 'none';
  } finally {
    hideSpinner(startGameBtn);
    startGameBtn.textContent = 'Start Game';
  }
});

// History System
function saveRunToHistory(runData) {
  const history = JSON.parse(localStorage.getItem('rhythmcode_history') || '[]');
  history.push({
    ...runData,
    date: new Date().toISOString()
  });
  localStorage.setItem('rhythmcode_history', JSON.stringify(history));
}

function renderLeaderboard() {
  const leaderboardList = document.getElementById('leaderboard-list');
  leaderboardList.innerHTML = '';
  
  const history = JSON.parse(localStorage.getItem('rhythmcode_history') || '[]')
    .sort((a, b) => b.score - a.score);

  if (history.length === 0) {
    leaderboardList.innerHTML = '<li>No history yet. Play some games!</li>';
    return;
  }

  history.forEach((run, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${run.videoTitle || 'Custom Text'}</strong><br>
      Score: ${run.score} | Accuracy: ${run.accuracy}%<br>
      ${new Date(run.date).toLocaleDateString()}
    `;
    if (index === 0) li.classList.add('top-score');
    leaderboardList.appendChild(li);
  });
}

// Event Listeners
codeInput.addEventListener('keydown', checkKeyPress);
document.getElementById('back-button').addEventListener('click', endGame);
document.getElementById('start-with-transcript').addEventListener('click', async function() {
  const btn = this;
  showSpinner(btn);
  btn.textContent = 'Processing...';
  try {
    await startGame();
  } catch (error) {
    alert(error.message);
    homeScreen.style.display = 'block';
  } finally {
    hideSpinner(btn);
    btn.textContent = 'Start Typing Game';
  }
});

toggleLeaderboardBtn.addEventListener('click', () => {
  if (leaderboardDiv.style.display === 'none') {
    renderLeaderboard();
    leaderboardDiv.style.display = 'block';
  } else {
    leaderboardDiv.style.display = 'none';
  }
});

songInput.addEventListener('input', () => {
  startGameBtn.disabled = !songInput.value.trim();
});

document.getElementById('user-transcript').addEventListener('input', () => {
  document.getElementById('start-with-transcript').disabled = 
    !document.getElementById('user-transcript').value.trim();
});

bpmSlider.addEventListener('input', (e) => {
  bpm = e.target.value;
  bpmValue.textContent = bpm;
  if (beatInterval) startBeat();
});

function checkInputs() {
  startGameBtn.disabled = !songInput.value.trim();
  document.getElementById('start-with-transcript').disabled = 
    !document.getElementById('user-transcript').value.trim();
}

// Utilities
function extractVideoID(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/watch\?v=)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getNextChunk() {
  currentChunkIndex++;
  if (currentChunkIndex >= transcriptChunks.length) {
    return { chunk: null, completedAll: true };
  }
  return { chunk: transcriptChunks[currentChunkIndex], completedAll: false };
}
