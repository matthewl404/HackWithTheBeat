const languageSelect = document.getElementById('language-select');
const songInput = document.getElementById('song-input');
const startGameBtn = document.getElementById('start-game');
const toggleLeaderboardBtn = document.getElementById('toggle-leaderboard');
const leaderboardDiv = document.getElementById('leaderboard');
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
let player;
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

function startGame() {
  currentSnippet = codeSnippets[languageSelect.value][0];
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


const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
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

function onYouTubeIframeAPIReady() {
  // player created on Start Game click
}

startGameBtn.addEventListener('click', () => {
  const videoId = extractVideoID(songInput.value.trim());
  if (!videoId) {
    alert("Please enter a valid YouTube URL.");
    return;
  }
  
  homeScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  if (player) {
    player.loadVideoById(videoId);
  } else {
    player = new YT.Player('player', {
      height: '360',
      width: '640',
      videoId: videoId,
      events: {
        'onReady': (event) => event.target.playVideo()
      }
    });
  }
});
                              
