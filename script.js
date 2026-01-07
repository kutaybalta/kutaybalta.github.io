const wheel = document.getElementById("wheel");
const ctx = wheel.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resetBtn = document.getElementById("resetBtn");
const roundEl = document.getElementById("round");
const remainingEl = document.getElementById("remaining");
const lastEliminatedEl = document.getElementById("lastEliminated");
const eliminatedList = document.getElementById("eliminatedList");
const winnerCard = document.getElementById("winnerCard");
const winnerName = document.getElementById("winnerName");

let districts = [];
let remaining = [];
let eliminated = [];
let currentRotation = 0;
let spinning = false;
let round = 0;

const palette = [
  "#3f5f5a",
  "#587b74",
  "#78938a",
  "#9aa9a2",
  "#b9bdb7",
  "#8a9485",
  "#6c7a70",
  "#4f6762",
];

// TODO: Add special elimination effects here.
// Example format:
// const specialEliminations = {
//   1744: { message: "Your message here.", image: "images/your-photo.jpg" },
// };
const specialEliminations = {
  2076: { message: "Beyza koyduk mu", image: "nah.jpeg" },  
  2012: { message: "Beyza koyduk mu", image: "nah.jpeg" },
  1542: { message: "Beyza koyduk mu", image: "nah.jpeg" },

  1591: { message: "Zena koyduk mu", image: "nah.jpeg" },
  2082: { message: "Zena koyduk mu", image: "nah.jpeg" },
  1104: { message: "Zena koyduk mu", image: "nah.jpeg" },
  1185: { message: "Zena koyduk mu", image: "nah.jpeg" },
  2033: { message: "Zena koyduk mu", image: "nah.jpeg" },

  1281: { message: "Mehmet koyduk mu", image: "nah.jpeg" },
  1215: { message: "Mehmet koyduk mu", image: "nah.jpeg" },

  1740: { message: "Bengü koyduk mu", image: "nah.jpeg" },
  1690: { message: "Bengü koyduk mu", image: "nah.jpeg" },
  1679: { message: "Bengü koyduk mu", image: "nah.jpeg" },

  1239: { message: "Kutay koyduk mu", image: "nah.jpeg" },
  1436: { message: "Kutay koyduk mu", image: "nah.jpeg" },
  1200: { message: "Kutay koyduk mu", image: "nah.jpeg" },
  1108: { message: "Kutay koyduk mu", image: "nah.jpeg" },
};

const specialModal = document.getElementById("specialModal");
const specialMessage = document.getElementById("specialMessage");
const specialImage = document.getElementById("specialImage");
const specialMedia = document.getElementById("specialMedia");
const closeModal = document.getElementById("closeModal");

const STORAGE_KEY = "ilce-eliminated-ids";

function loadEliminatedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveEliminatedIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    // Ignore storage errors (private mode, disabled storage, etc.)
  }
}

function formatEliminated(item) {
  return `${item.name} — ${item.province}`;
}

function resizeCanvas() {
  const size = Math.min(wheel.parentElement.clientWidth - 40, 520);
  const pixelRatio = window.devicePixelRatio || 1;
  wheel.width = size * pixelRatio;
  wheel.height = size * pixelRatio;
  wheel.style.width = `${size}px`;
  wheel.style.height = `${size}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawWheel();
}

function colorForIndex(index, total) {
  if (total <= palette.length) {
    return palette[index % palette.length];
  }
  const hue = (index * 360) / total;
  return `hsl(${hue}, 55%, 64%)`;
}

function drawWheel() {
  const size = wheel.width / (window.devicePixelRatio || 1);
  const center = size / 2;
  ctx.clearRect(0, 0, size, size);

  const count = remaining.length || districts.length;
  if (!count) {
    return;
  }

  const angle = (Math.PI * 2) / count;
  const radius = center - 12;

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(currentRotation);

  for (let i = 0; i < count; i += 1) {
    const start = i * angle;
    const end = start + angle;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colorForIndex(i, count);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (count <= 24) {
      ctx.save();
      ctx.rotate(start + angle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(20, 16, 12, 0.9)";
      ctx.font = "14px 'Newsreader', serif";
      ctx.translate(radius - 14, 6);
      ctx.rotate(Math.PI / 2);
      const label = remaining[i] || districts[i];
      ctx.fillText(label.name, 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(center, center, 54, 0, Math.PI * 2);
  ctx.fillStyle = "#fff8ef";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e8d6c2";
  ctx.stroke();

  ctx.font = "600 16px 'Work Sans', sans-serif";
  ctx.fillStyle = "#3a2a1e";
  ctx.textAlign = "center";
  ctx.fillText(`${remaining.length} left`, center, center + 6);
}

function updateUI() {
  roundEl.textContent = round;
  remainingEl.textContent = remaining.length;
  lastEliminatedEl.textContent = eliminated[0] || "-";
  eliminatedList.innerHTML = "";

  eliminated.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    eliminatedList.appendChild(li);
  });

  if (remaining.length === 1) {
    winnerCard.hidden = false;
    winnerName.textContent = `${remaining[0].name} — ${remaining[0].province}`;
    spinBtn.disabled = true;
  } else {
    winnerCard.hidden = true;
    spinBtn.disabled = spinning || remaining.length === 0;
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spin() {
  if (spinning || remaining.length <= 1) {
    return;
  }

  spinning = true;
  spinBtn.disabled = true;

  const count = remaining.length;
  const selectedIndex = Math.floor(Math.random() * count);
  const anglePer = (Math.PI * 2) / count;
  const targetAngle = (selectedIndex + 0.5) * anglePer;
  const pointerAngle = -Math.PI / 2;
  const desiredRotation = pointerAngle - targetAngle;

  const extraTurns = 4 + Math.floor(Math.random() * 3);
  let finalRotation = desiredRotation + extraTurns * Math.PI * 2;
  if (finalRotation < currentRotation) {
    const diff = currentRotation - finalRotation;
    finalRotation += Math.ceil(diff / (Math.PI * 2)) * Math.PI * 2;
  }

  const startRotation = currentRotation;
  const duration = 3800;
  const start = performance.now();

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    currentRotation = startRotation + (finalRotation - startRotation) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin(selectedIndex);
    }
  }

  requestAnimationFrame(animate);
}

function showSpecialElimination(item) {
  const config = specialEliminations[item.id];
  if (!config) {
    return;
  }
  specialMessage.textContent = config.message || "";
  if (config.image) {
    specialImage.src = config.image;
    specialImage.alt = config.message || `${item.name} image`;
    specialMedia.hidden = false;
  } else {
    specialImage.removeAttribute("src");
    specialImage.alt = "";
    specialMedia.hidden = true;
  }
  specialModal.hidden = false;
}

function finishSpin(selectedIndex) {
  const eliminatedItem = remaining.splice(selectedIndex, 1)[0];
  eliminated.unshift(formatEliminated(eliminatedItem));
  const storedIds = loadEliminatedIds();
  if (!storedIds.includes(eliminatedItem.id)) {
    storedIds.push(eliminatedItem.id);
    saveEliminatedIds(storedIds);
  }
  round += 1;
  currentRotation = currentRotation % (Math.PI * 2);
  spinning = false;
  showSpecialElimination(eliminatedItem);
  updateUI();
  drawWheel();
}

function reset() {
  const storedIds = loadEliminatedIds();
  remaining = districts
    .filter((item) => !storedIds.includes(item.id))
    .map((item) => ({ ...item }));
  eliminated = districts
    .filter((item) => storedIds.includes(item.id))
    .map((item) => formatEliminated(item))
    .slice(0, 200);
  currentRotation = 0;
  round = 0;
  spinning = false;
  updateUI();
  drawWheel();
}

async function loadData() {
  try {
    const response = await fetch("turkiye_il_ilce.json");
    if (!response.ok) {
      throw new Error("Failed to load JSON");
    }
    const data = await response.json();
    districts = data.districts.map((d) => ({
      id: d.id,
      name: d.name,
      province: d.province.name,
    }));
    reset();
  } catch (error) {
    districts = [
      { id: 1, name: "Kadikoy", province: "Istanbul" },
      { id: 2, name: "Cankaya", province: "Ankara" },
      { id: 3, name: "Konak", province: "Izmir" },
      { id: 4, name: "Muratpasa", province: "Antalya" },
      { id: 5, name: "Yildirim", province: "Bursa" },
      { id: 6, name: "Seyhan", province: "Adana" },
    ];
    reset();
    lastEliminatedEl.textContent = "JSON load failed";
  }
}

spinBtn.addEventListener("click", spin);
resetBtn.addEventListener("click", reset);
closeModal.addEventListener("click", () => {
  specialModal.hidden = true;
});
specialModal.addEventListener("click", (event) => {
  if (event.target === specialModal) {
    specialModal.hidden = true;
  }
});
window.addEventListener("resize", resizeCanvas);

loadData().then(resizeCanvas);
