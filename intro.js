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

  const TOTAL = 18240;

  // Compute a pleasing grid shape
  const ASPECT = window.innerWidth / window.innerHeight;
  const COLS = Math.round(Math.sqrt(TOTAL * ASPECT));
  const ROWS = Math.ceil(TOTAL / COLS);

  // Compute dot size dynamically so grid fits screen
  const GAP = 2; // keep small
  const dotWidth = (window.innerWidth - GAP * COLS) / COLS;
  const dotHeight = (window.innerHeight - GAP * ROWS) / ROWS;
  const DOT = Math.min(dotWidth, dotHeight);

  introGrid.style("grid-template-columns", `repeat(${COLS}, ${DOT}px)`);
  introGrid.style("grid-auto-rows", `${DOT}px`);
  introGrid.style("gap", `${GAP}px`);

  introGrid
    .selectAll(".co2-dot")
    .data(d3.range(TOTAL))
    .enter()
    .append("div")
    .attr("class", "co2-dot")
    .style("width", `${DOT}px`)
    .style("height", `${DOT}px`);

  dotCountText.textContent =
    `This screen shows ${TOTAL.toLocaleString()} gray dots—each representing a share of Earth’s atmosphere.`;

  defineSubsets(COLS, ROWS);
  applyDotState(0);
  console.log("Calculated dot count:", TOTAL);
  console.log("Rendered dot count:", introGrid.selectAll(".co2-dot").size());
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

  const relX = 0.5;
  const relY = 0.5;

  const co2_col = Math.floor(W * relX);
  const co2_row = Math.floor(H * relY);

  CO2_INDEX = co2_row * cols + co2_col;
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

const scrollHint = document.querySelector("#scroll-hint");


function showStep(step) {

    if (scrollHint) {
    scrollHint.classList.remove("visible");
  }
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

    }, 3000);
    
    setTimeout(() => {
      if (scrollHint) {
        scrollHint.classList.add("visible");
      }
    }, 3800);

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
