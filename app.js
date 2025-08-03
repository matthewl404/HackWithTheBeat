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

document.addEventListener('DOMContentLoaded', () => {
  const homeScreen = document.getElementById('home-screen');
  const gameScreen = document.getElementById('game-screen');
  const transcriptBox = document.getElementById('transcript-box');

  // Set initial visibility
  homeScreen.style.display = 'block';
  gameScreen.style.display = 'none';
  transcriptBox.style.display = 'none';
});

function onYouTubeIframeAPIReady() {
  // makes things work
}


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
  if (spinner) {
    button.removeChild(spinner);
  }
  button.disabled = false;
}

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
  const btn = document.getElementById('start-with-transcript');
  const transcript = document.getElementById('user-transcript').value.trim();
  
  // Show spinner immediately
  showSpinner(btn);
  btn.textContent = 'Processing...';

  try {
    if (!transcript) {
      throw new Error("Please paste a transcript first");
    }
    
    fullTranscript = transcript;
    transcriptChunks = processTranscript(fullTranscript);
    currentChunkIndex = 0;
    
    if (transcriptChunks.length === 0) {
      throw new Error("Couldn't extract usable text from transcript");
    }
    
    currentSnippet = transcriptChunks[0];
    prepareNewSnippet();
    
    const beatDuration = 60000 / bpm;
    beatInterval = setInterval(() => {
      lastBeatTime = Date.now();
      animateBeat();
    }, beatDuration);
    
    document.getElementById('code-input').focus();
    gameScreen.style.display = 'block';
    if (player && player.playVideo) player.playVideo();
    document.getElementById('transcript-box').style.display = 'none';
    
  } catch (error) {
    alert(error.message);
    homeScreen.style.display = 'block';
    leaderboardContainer.style.display = 'block';
  } finally {
    hideSpinner(btn);
    btn.textContent = 'Start Typing Game';
  }
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
    saveRunToHistory({
      score,
      accuracy,
      timing,
      videoTitle: player && player.getVideoData ? player.getVideoData().title : songInput.value,
      words: currentSnippet.length
    });
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
    leaderboardContainer.style.display = 'block';
    document.getElementById('transcript-box').style.display = 'none';
    clearInterval(beatInterval);
    if (player && player.pauseVideo) {
      player.pauseVideo();
    }
  }

document.getElementById('code-input').addEventListener('keypress', checkKeyPress);
document.getElementById('back-button').addEventListener('click', endGame);

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
    document.getElementById('transcript-box').style.display = 'block';

    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
      throw new Error("YouTube API failed to load");
    }

    if (player) {
      player.loadVideoById(videoId);
    } else {
      player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: videoId,
        events: {
          'onReady': (event) => {
          
          },
          'onError': () => {
            throw new Error("Error loading video");
          }
        }
      });
    }
  } catch (error) {
    alert(error.message);
    homeScreen.style.display = 'block';
    document.getElementById('transcript-box').style.display = 'none';
  } finally {
    hideSpinner(startGameBtn);
    startGameBtn.textContent = 'Start Game';
  }
});
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
    renderLeaderboard();
    leaderboardDiv.style.display = leaderboardDiv.style.display === 'block' ? 'none' : 'block';
  } else {
    leaderboardDiv.style.display = 'none';
  }
});

function extractVideoID(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/watch\?v=)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
function saveRunToHistory({ score, accuracy, timing, videoTitle, words }) {
  const history = JSON.parse(localStorage.getItem('rhythmcode_history') || '[]');
  history.push({
    score,
    accuracy,
    timing,
    videoTitle,
    words,
    date: new Date().toISOString()
  });
  localStorage.setItem('rhythmcode_history', JSON.stringify(history));
}
function renderLeaderboard() {
  const leaderboardList = document.getElementById('leaderboard-list');
  leaderboardList.innerHTML = '';
  let history = JSON.parse(localStorage.getItem('rhythmcode_history') || '[]');
  // Sort by highest accuracy
  history = history.sort((a, b) => b.accuracy - a.accuracy);

  if (history.length === 0) {
    leaderboardList.innerHTML = '<li>No history yet.</li>';
    return;
  }

  history.forEach(run => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${run.videoTitle}</strong><br>
      Score: ${run.score} | Accuracy: ${run.accuracy}% | Timing: ${run.timing}%<br>
      Words: ${run.words} | Date: ${new Date(run.date).toLocaleString()}
    `;
    leaderboardList.appendChild(li);
  });
}