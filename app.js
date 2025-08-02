const languageSelect = document.getElementById('language-select');
const songInput = document.getElementById('song-input');
const startGameBtn = document.getElementById('start-game');
const toggleLeaderboardBtn = document.getElementById('toggle-leaderboard');
const leaderboardDiv = document.getElementById('leaderboard');
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
let player;

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
                              
