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
    'print("Hello World")',
    'x = 10\ny = 5\nprint(x + y)',
    'def greet(name):\n    print(f"Hello, {name}!")',
    'for i in range(5):\n    print(i)',
    'numbers = [1, 2, 3]\nsquared = [n**2 for n in numbers]',
    'try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print("Cannot divide by zero")'
  ],
  javascript: [
    'console.log("Hello World")',
    'const x = 10;\nconst y = 5;\nconsole.log(x + y)',
    'function greet(name) {\n    console.log(`Hello, ${name}!`)\n}',
    'for (let i = 0; i < 5; i++) {\n    console.log(i)\n}',
    'const numbers = [1, 2, 3];\nconst squared = numbers.map(n => n**2)',
    'fetch("https://api.example.com/data")\n    .then(response => response.json())\n    .catch(error => console.error("Error:", error))'
  ],
  java: [
    'System.out.println("Hello World");',
    'int x = 10;\nint y = 5;\nSystem.out.println(x + y);',
    'public static void greet(String name) {\n    System.out.println("Hello, " + name);\n}',
    'for (int i = 0; i < 5; i++) {\n    System.out.println(i);\n}',
    'List<Integer> numbers = Arrays.asList(1, 2, 3);\nList<Integer> squared = numbers.stream().map(n -> n*n).collect(Collectors.toList());',
    'try {\n    int result = 10 / 0;\n} catch (ArithmeticException e) {\n    System.out.println("Cannot divide by zero");\n}'
  ],
  html: [
  '<!DOCTYPE html>\n<html>\n<head>\n    <title>Page Title</title>\n</head>',
    '<body>\n    <h1>Main Heading</h1>\n    <p>Paragraph text</p>\n</body>',
    '<ul>\n    <li>Item 1</li>\n    <li>Item 2</li>\n</ul>',
    '<form>\n    <input type="text" placeholder="Enter name">\n    <button type="submit">Submit</button>\n</form>',
    '<div class="container">\n    <header>Header</header>\n    <main>Content</main>\n</div>',
    '<a href="https://example.com" target="_blank">Visit Example</a>'
  ],
  css: [
    'body {\n    font-family: Arial;\n    margin: 0;\n}',
    '.container {\n    display: flex;\n    justify-content: center;\n}',
    'button {\n    padding: 10px 20px;\n    background-color: blue;\n    color: white;\n}',
    '@media (max-width: 600px) {\n    .sidebar {\n        display: none;\n    }\n}',
    'h1 {\n    color: #333;\n    text-align: center;\n    margin-bottom: 20px;\n}',
    'a:hover {\n    text-decoration: none;\n    color: red;\n}'
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
  const snippets = codeSnippets[languageSelect.value];
  if (currentSnippetIndex >= snippets.length - 1) {
    currentSnippetIndex = 0;
    return {snippet: snippets[0], completedAll: true};
  }
  currentSnippetIndex++;
  return {snippet: snippets[currentSnippetIndex], completedAll: false};
}

function startGame() {
  const next = getNextSnippet();
  currentSnippet = next.snippet;
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
  const next = getNextSnippet();
  const accuracy = Math.round((correctChars / totalChars) * 100) || 0;
  const timing = Math.round((onBeatHits / totalChars) * 100) || 0;
  if (player && player.pauseVideo) {
    player.pauseVideo();
  }
  alert(`Completed!\nScore: ${score}\nAccuracy: ${Math.round((correctChars/totalChars)*100)}%\nTiming: ${Math.round((onBeatHits/totalChars)*100)}%`);
}
  
  document.getElementById('code-input').value = '';
  currentCharIndex = 0;
  score = 0;
  correctChars = 0;
  totalChars = 0;
  onBeatHits = 0;
  updateDisplay();
  document.getElementById('code-input').focus();
}
document.getElementById('code-input').addEventListener('keypress', checkKeyPress);
document.getElementById('back-button').addEventListener('click', () => {
  document.getElementById('code-input').value = '';
  gameScreen.style.display = 'none';
  homeScreen.style.display = 'block';
  clearInterval(beatInterval);
  if (player && player.pauseVideo) {
    player.pauseVideo();
  }
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
  
