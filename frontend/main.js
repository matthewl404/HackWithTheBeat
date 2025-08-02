const languageSelect = document.getElementById('language-select');
const songInput = document.getElementById('song-input');
const startGameBtn = document.getElementById('start-game');
const toggleLeaderboardBtn = document.getElementById('toggle-leaderboard');
const leaderboardDiv = document.getElementById('leaderboard');

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
