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

// Constants
const BEAT_WINDOW_PERCENTAGE = 0.2; // 20% of beat duration counts as "on beat"
const ERROR_MESSAGES = {
  NO_TRANSCRIPT: "Please paste a transcript first",
  NO_USABLE_TEXT: "Couldn't extract usable text from transcript",
  YOUTUBE_API_FAILED: "YouTube API failed to load",
  INVALID_YOUTUBE_URL: "Please enter a valid YouTube URL first"
};

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
  
  // Initialize YouTube API if already loaded
  if (window.YT && YT.Player) {
    onYouTubeIframeAPIReady();
  }
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
    if (!transcript) throw new Error(ERROR_MESSAGES.NO_TRANSCRIPT);
    
    fullTranscript = transcript;
    transcriptChunks = processTranscript(fullTranscript);
    currentChunkIndex = 0;
    
    if (transcriptChunks.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_USABLE_TEXT);
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
    }, beatDuration * BEAT_WINDOW_PERCENTAGE);
  }, beatDuration);
}

function checkKeyPress(e) {
  // Allow normal typing behavior for alphanumeric keys
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    
    // Get the typed character
    const typedChar = e.key;
    totalChars++; // Count every key press as an attempt

    // Create a new span for the typed character
    const typedSpan = document.createElement('span');
    typedSpan.className = 'typed-char';
    typedSpan.textContent = typedChar;
    
    // Check if the typed character matches the current target character
    if (typedChar === currentSnippet[currentCharIndex]) {
      typedSpan.classList.add('correct');
      
      // Check if typed on beat
      const currentTime = Date.now();
      const beatWindow = (60000 / bpm) * BEAT_WINDOW_PERCENTAGE;
      const isOnBeatNow = Math.abs(currentTime - lastBeatTime) < beatWindow;

      if (isOnBeatNow) {
        typedSpan.classList.add('on-beat');
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
      
      correctChars++;
    } else {
      typedSpan.classList.add('incorrect');
    }
    
    // Insert the typed character before the next target character
    if (currentCharIndex < codeDisplay.children.length) {
      codeDisplay.insertBefore(typedSpan, codeDisplay.children[currentCharIndex]);
    } else {
      codeDisplay.appendChild(typedSpan);
    }
    
    currentCharIndex++;
    updateDisplay();
    
    // Check if snippet completed
    if (currentCharIndex >= currentSnippet.length) {
      clearInterval(beatInterval);
      setTimeout(showResults, 500); // Small delay before showing results
    }
  }
  // Handle backspace
  else if (e.key === 'Backspace') {
    e.preventDefault();
    if (currentCharIndex > 0) {
      currentCharIndex--;
      totalChars--; // Decrement total attempts
      if (codeDisplay.children[currentCharIndex].classList.contains('correct')) {
        correctChars--; // Decrement correct count if needed
      }
      // Remove the last typed character
      if (codeDisplay.children.length > currentCharIndex) {
        codeDisplay.removeChild(codeDisplay.children[currentCharIndex]);
      }
      updateDisplay();
    }
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
  if (!text || text.trim().length === 0) return [];
  
  let textChunks = text.match(/[^.!?]+[.!?]/g);
  if (!textChunks) {
    textChunks = text.split(/\r?\n/);
  }
  
  return textChunks
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 10);
}

function prepareNewSnippet() {
  codeDisplay.innerHTML = '';
  currentSnippet.split('').forEach(char => {
    const span = document.createElement('span');
    span.textContent = char;
    span.className = 'char-highlight';
    codeDisplay.appendChild(span);
  });
  codeInput.value = '';
  currentCharIndex = 0;
  score = 0;
  correctChars = 0;
  totalChars = 0;
  onBeatHits = 0;
  updateDisplay();
  
  // Ensure input is focused and ready
  codeInput.focus();
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
    alert(ERROR_MESSAGES.INVALID_YOUTUBE_URL);
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
        reject(new Error(ERROR_MESSAGES.YOUTUBE_API_FAILED));
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
  
  // Add clear history button at the top
  const clearButton = document.createElement('button');
  clearButton.textContent = 'Clear History';
  clearButton.className = 'clear-history-btn';
  clearButton.addEventListener('click', clearHistory);
  leaderboardList.appendChild(clearButton);

  const history = JSON.parse(localStorage.getItem('rhythmcode_history') || '[]')
    .sort((a, b) => b.score - a.score);

  if (history.length === 0) {
    const emptyMsg = document.createElement('li');
    emptyMsg.textContent = 'No history yet. Play some games!';
    leaderboardList.appendChild(emptyMsg);
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

function clearHistory() {
  if (confirm('Are you sure you want to clear all game history?')) {
    localStorage.removeItem('rhythmcode_history');
    renderLeaderboard();
  }
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
