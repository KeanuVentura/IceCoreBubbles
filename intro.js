const floatingDot = document.querySelector("#floating-co2-dot");
let currentStep = 0;

const slides = document.querySelectorAll(".slide");
const dotCountText = document.querySelector("#dot-count-text");

const leftArrow = document.querySelector("#left-arrow");
const rightArrow = document.querySelector("#right-arrow");

const introGrid = d3.select("#intro-grid");

let TRAPPED_SET = new Set();
let CO2_INDEX = null;

document.body.classList.add("noscroll");

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

function applyDotState(step) {
  const dots = introGrid.selectAll(".co2-dot");

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

  if (step === 4) {
    dots.style("opacity", 0);
    dots.classed("co2-single", false);
  }
}

function showStep(step) {
  slides.forEach(s => s.classList.remove("active"));
  slides[step].classList.add("active");

  applyDotState(step);

  leftArrow.style.display = step === 0 ? "none" : "flex";
  rightArrow.style.display = step === slides.length - 1 ? "none" : "flex";

  if (step === 4) {
    document.body.classList.remove("noscroll");

    const dots = introGrid.selectAll(".co2-dot").nodes();
    const realDot = dots[CO2_INDEX];
    const rect = realDot.getBoundingClientRect();

    const startX = rect.left + rect.width / 2 + window.scrollX;
    const startY = rect.top + rect.height / 2 + window.scrollY;

    floatingDot.style.left = startX + "px";
    floatingDot.style.top = startY + "px";
    floatingDot.style.opacity = 1;

    introGrid.style.opacity = 0;

    floatingDot.classList.remove("bounce-3", "bounce-3b");
    void floatingDot.offsetWidth; 

    const landingY = window.innerHeight - 80;
    const landingX = window.innerWidth / 2;

    setTimeout(() => {

      floatingDot.style.top = landingY + "px";
      floatingDot.style.left = landingX + "px";

      setTimeout(() => {
        floatingDot.classList.add("bounce-3");

        setTimeout(() => {
          floatingDot.classList.remove("bounce-3");
          void floatingDot.offsetWidth; // reflow
          floatingDot.classList.add("bounce-3b");
        }, 3000);

      }, 600);

    }, 5000);

  } else {
    introGrid.style.opacity = 1;
    floatingDot.style.opacity = 0;

    floatingDot.classList.remove("bounce-3", "bounce-3b");
    void floatingDot.offsetWidth;
  }
}

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

buildGrid();
window.addEventListener("resize", buildGrid);
