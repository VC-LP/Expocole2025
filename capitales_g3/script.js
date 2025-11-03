const startBtn = document.getElementById("start-btn");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const resultEl = document.getElementById("result");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");

let score = 0;
let timeLeft = 40;
let timer;
let currentQuestion = {};

const countries = [
  { country: "Francia", capital: "París", options: ["Madrid", "Roma", "París", "Berlín"] },
  { country: "Japón", capital: "Tokio", options: ["Pekín", "Seúl", "Tokio", "Bangkok"] },
  { country: "Brasil", capital: "Brasilia", options: ["Buenos Aires", "Brasilia", "Lima", "Santiago"] },
  { country: "Egipto", capital: "El Cairo", options: ["El Cairo", "Casablanca", "Argel", "Nairobi"] },
  { country: "Canadá", capital: "Ottawa", options: ["Toronto", "Ottawa", "Vancouver", "Montreal"] },
  { country: "Australia", capital: "Canberra", options: ["Sídney", "Melbourne", "Canberra", "Brisbane"] },
  { country: "Sudáfrica", capital: "Pretoria", options: ["Pretoria", "Ciudad del Cabo", "Durban", "Johannesburgo"] },
  { country: "México", capital: "Ciudad de México", options: ["Bogotá", "Ciudad de México", "Lima", "Caracas"] },
  { country: "Italia", capital: "Roma", options: ["Milán", "Roma", "Venecia", "Florencia"] },
  { country: "Alemania", capital: "Berlín", options: ["Viena", "Zúrich", "Berlín", "Hamburgo"] },
  { country: "Argentina", capital: "Buenos Aires", options: ["Montevideo", "Asunción", "Buenos Aires", "Santiago"] },
  { country: "China", capital: "Pekín", options: ["Shanghái", "Hong Kong", "Pekín", "Cantón"] },
  { country: "España", capital: "Madrid", options: ["Madrid", "Barcelona", "Sevilla", "Valencia"] },
  { country: "Estados Unidos", capital: "Washington D. C.", options: ["Nueva York", "Washington D. C.", "Los Ángeles", "Chicago"] },
  { country: "Reino Unido", capital: "Londres", options: ["Manchester", "Dublín", "Londres", "Liverpool"] },
  { country: "India", capital: "Nueva Delhi", options: ["Bombay", "Bangalore", "Nueva Delhi", "Calcuta"] },
  { country: "Rusia", capital: "Moscú", options: ["San Petersburgo", "Moscú", "Kiev", "Varsovia"] },
  { country: "Chile", capital: "Santiago", options: ["Santiago", "Lima", "Buenos Aires", "Montevideo"] },
  { country: "Suecia", capital: "Estocolmo", options: ["Oslo", "Copenhague", "Helsinki", "Estocolmo"] },
  { country: "Turquía", capital: "Ankara", options: ["Estambul", "Izmir", "Ankara", "Antalya"] }
];


function startGame() {
  score = 0;
  timeLeft = 40;
  scoreEl.textContent = score;
  resultEl.textContent = "";
  startBtn.style.display = "none";
  nextQuestion();
  timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  if (timeLeft <= 0) endGame();
}

function nextQuestion() {
  const randomIndex = Math.floor(Math.random() * countries.length);
  currentQuestion = countries[randomIndex];
  console.log(currentQuestion);
  questionEl.textContent = `¿Cuál es la capital de ${currentQuestion.country}?`;

  optionsEl.innerHTML = "";
  currentQuestion.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.classList.add("option");
    btn.addEventListener("click", () => checkAnswer(opt));
    optionsEl.appendChild(btn);
  });
}

function checkAnswer(selected) {
  if (selected === currentQuestion.capital) {
    score++;
    scoreEl.textContent = score;
    correctSound.play();
    resultEl.textContent = "✅ ¡Correcto!";
    resultEl.textContent =  "👏 ¡Bravo!";
    resultEl.textContent =  "🎉 ¡Exelente!";
  } else {
    wrongSound.play();
    resultEl.textContent = "❌ Incorrecto";
  }
  setTimeout(() => {
    resultEl.textContent = "";
    nextQuestion();
  }, 800);
}

function endGame() {
  clearInterval(timer);
  questionEl.textContent = "⏰ ¡Tiempo terminado!";
  optionsEl.innerHTML = "";
  resultEl.textContent = `Tu puntaje final: ${score}`;
  startBtn.textContent = "Jugar de nuevo";
  startBtn.style.display = "inline-block";
}

startBtn.addEventListener("click", startGame);
