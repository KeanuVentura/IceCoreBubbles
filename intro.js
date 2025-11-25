let currentStep = 0;

const slides = document.querySelectorAll(".slide");
const dotCountText = document.querySelector("#dot-count-text");

const leftArrow = document.querySelector("#left-arrow");
const rightArrow = document.querySelector("#right-arrow");

const introGrid = d3.select("#intro-grid");
const overlayDot = document.querySelector("#single-dot-overlay");

let TRAPPED_SET = new Set();
let CO2_INDEX = null;

document.body.classList.add("noscroll");

// ----------------------------
// BUILD DOT GRID
// ----------------------------
function buildGrid() {
  introGrid.selectAll("*").remove();

  const container = document.getElementById("intro-grid");
  const DOT = 6;
  const GAP = 3;

  const w = container.clientWidth;
  const h = container.clientHeight;

  const COLS = Math.floor(w / (DOT + GAP));
  const ROWS = Math.floor(h / (DOT + GAP));
  const TOTAL = COLS * ROWS;

  introGrid.style("grid-template-columns", `repeat(${COLS}, ${DOT}px)`);
  introGrid.style("gap", `${GAP}px`);

  introGrid
    .selectAll(".co2-dot")
    .data(d3.range(TOTAL))
    .enter()
    .append("div")
    .attr("class", "co2-dot");

  dotCountText.textContent =
    `This screen shows ${TOTAL.toLocaleString()} gray dots—each representing a share of Earth’s atmosphere.`;

  defineSubsets(COLS, ROWS);
  applyDotState(0);
}

function defineSubsets(cols, rows) {
  const W = Math.floor(cols * 0.15);
  const H = Math.floor(rows * 0.15);

  TRAPPED_SET = new Set();

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      TRAPPED_SET.add(r * cols + c);
    }
  }

  CO2_INDEX = Math.floor((H / 2) * cols + W / 2);
}

// ----------------------------
// DOT STATE LOGIC PER STEP
// ----------------------------
function applyDotState(step) {
  const dots = introGrid.selectAll(".co2-dot");

  // reset all
  dots
    .classed("trapped", false)
    .classed("co2-single", false)
    .style("opacity", 1);

  if (step === 2) {
    dots.classed("trapped", (d, i) => TRAPPED_SET.has(i));
  }

  if (step === 3) {
    dots.classed("trapped", (d, i) => TRAPPED_SET.has(i));
    dots.classed("co2-single", (d, i) => i === CO2_INDEX);
  }

  // ⭐ Slide 4: keep only the CO₂ dot
  if (step === 4) {
    // fade out non-CO2 dots smoothly
    dots
      .filter((d, i) => i !== CO2_INDEX)
      .transition()
      .duration(600)
      .style("opacity", 0);
  
    // keep CO2 dot as-is, no animation or change
    dots
      .filter((d, i) => i === CO2_INDEX)
      .style("opacity", 1)
      .classed("co2-single", true);
  }
}

// ----------------------------
// SLIDE TRANSITIONS
// ----------------------------
function showStep(step) {
  slides.forEach(s => s.classList.remove("active"));

  slides[step].classList.add("active");

  applyDotState(step);

  leftArrow.style.display = step === 0 ? "none" : "flex";
  rightArrow.style.display = step === slides.length - 1 ? "none" : "flex";

  // ⭐ Unlock scrolling on final slide
  if (step === 4) {
    document.body.classList.remove("noscroll");
  }
}

// ----------------------------
// BUTTON LOGIC
// ----------------------------
rightArrow.addEventListener("click", () => {
  if (currentStep < slides.length - 1) {
    currentStep++;
    showStep(currentStep);
  }
});

leftArrow.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
});

// ----------------------------
// INITIALIZATION
// ----------------------------
buildGrid();
window.addEventListener("resize", buildGrid);
