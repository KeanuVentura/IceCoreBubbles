let isPlaying = false;
let playInterval = null;

let depthData = [];
let groupedDepth = new Map();
let depthBrush = null;

let depthSvg, depthWidth, depthHeight;
let depthX, depthY;
let depthLineGen;
let depthPath;
let depthDot;
let xAxisG, yAxisG;

let currentCore = 3;

const slider = document.getElementById("depth-slider");
const coreSelect = document.getElementById("core-select");
const playBtn = document.getElementById("depth-play-btn");
const clearSelectionBtn = document.getElementById("clear-selection");
const tooltip = document.getElementById("depth-tooltip");

let readDepth = document.getElementById("read-depth");
let readCO2 = document.getElementById("read-co2");
let readAge = document.getElementById("read-age");

clearSelectionBtn.style.display = "none";

/* ================================
   LOAD DATA
================================ */
d3.csv("data/dataset1.csv").then(raw => {
  depthData = raw.map(d => ({
    depth: +d.depth,
    co2: +d["[CO2]"],
    gasage: +d.gasage,
    core: +d.core
  }));

  groupedDepth = d3.group(depthData, d => d.core);
  initDepthChart();
  updateCore(currentCore);
});

/* ================================
   INITIAL CHART BUILD
================================ */
function initDepthChart() {
  const svgEl = d3.select("#depth-svg");

  depthWidth = svgEl.node().clientWidth;
  depthHeight = svgEl.node().clientHeight;

  depthSvg = svgEl.append("g")
    .attr("transform", "translate(60,20)");

  const innerW = depthWidth - 120;
  const innerH = depthHeight - 80;

  depthX = d3.scaleLinear().range([0, innerW]);
  depthY = d3.scaleLinear().range([0, innerH]);

  depthLineGen = d3.line()
    .x(d => depthX(d.co2))
    .y(d => depthY(d.depth))
    .curve(d3.curveMonotoneY);

  depthPath = depthSvg.append("path")
    .attr("class", "depth-line")
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2);

  depthDot = depthSvg.append("circle")
    .attr("class", "depth-dot")
    .attr("r", 5);

  xAxisG = depthSvg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${innerH})`);

  yAxisG = depthSvg.append("g")
    .attr("class", "y-axis");

  depthSvg.append("text")
    .attr("class", "x-label")
    .attr("x", innerW / 2)
    .attr("y", innerH + 45)
    .attr("text-anchor", "middle")
    .text("CO₂ (ppm)");

  depthSvg.append("text")
    .attr("class", "y-label")
    .attr("x", -innerH / 2)
    .attr("y", -45)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Depth (m)");

  depthSvg.append("rect")
    .attr("id", "selection-rect")
    .attr("fill", "rgba(0,120,255,0.15)")
    .attr("stroke", "rgba(0,120,255,0.5)")
    .attr("stroke-width", 1)
    .style("display", "none");

  initBrush(innerW, innerH);

  svgEl.on("mousemove", handleTooltipMove);
  svgEl.on("mouseleave", () => tooltip.style.opacity = 0);
}

/* ================================
   CORE UPDATE
================================ */
function updateCore(core) {
  currentCore = +core;

  let data = groupedDepth.get(currentCore);
  if (!data) return;

  data = data.slice().sort((a, b) => a.depth - b.depth);

  const innerW = depthWidth - 120;
  const innerH = depthHeight - 80;

  depthX.domain(d3.extent(data, d => d.co2));
  depthY.domain(d3.extent(data, d => d.depth));

  depthPath.datum(data).attr("d", depthLineGen);

  xAxisG.call(d3.axisBottom(depthX).ticks(6));
  yAxisG.call(d3.axisLeft(depthY).ticks(6));

  slider.value = 0;
  updateDotPosition(0);

  clearSelection();
}

/* ================================
   DOT MOTION
================================ */
function updateDotPosition(sliderValue) {
  const node = depthPath.node();
  if (!node) return;

  const totalLength = node.getTotalLength();
  const pos = (sliderValue / 100) * totalLength;
  const pt = node.getPointAtLength(pos);

  depthDot.attr("cx", pt.x).attr("cy", pt.y);

  updateReadout(pos, totalLength);
}

function updateReadout(pos, totalLength) {
  const data = groupedDepth.get(currentCore);
  const idx = Math.floor((pos / totalLength) * (data.length - 1));
  const d = data[idx];

  readDepth.textContent = d.depth.toFixed(1);
  readCO2.textContent = d.co2.toFixed(1);
  readAge.textContent = d.gasage.toLocaleString();
}

/* ================================
   PLAY / PAUSE
================================ */
function startDepthPlayback() {
  if (playBtn.innerText === "Replay") {
    slider.value = 0;
    updateDotPosition(0);
  }

  if (isPlaying) return;
  isPlaying = true;
  playBtn.innerText = "Pause";

  playInterval = setInterval(() => {
    let v = +slider.value;

    if (v >= +slider.max) {
      stopDepthPlayback(true);
      return;
    }
    slider.value = v + 1;
    updateDotPosition(+slider.value);
  }, 50);
}

function stopDepthPlayback(isFinished = false) {
  isPlaying = false;
  clearInterval(playInterval);
  playInterval = null;

  playBtn.innerText = isFinished ? "Replay" : "Play";
}

playBtn.addEventListener("click", () => {
  if (!isPlaying) startDepthPlayback();
  else stopDepthPlayback(false);
});

/* ================================
   TOOLTIP
================================ */
function handleTooltipMove(event) {
  const svgNode = depthSvg.node();
  const [mx, my] = d3.pointer(event, svgNode);

  const data = groupedDepth.get(currentCore);
  if (!data) return;

  let closest = null;
  let minDist = Infinity;

  data.forEach(d => {
    const sx = depthX(d.co2);
    const sy = depthY(d.depth);
    const dist = Math.hypot(mx - sx, my - sy);

    if (dist < minDist) {
      minDist = dist;
      closest = d;
    }
  });

  if (!closest || minDist > 25) {
    tooltip.style.opacity = 0;
    return;
  }

  tooltip.style.opacity = 1;

  const tooltipWidth = tooltip.offsetWidth;
  const vw = window.innerWidth;

  let leftPos = event.clientX + 15;
  if (event.clientX + tooltipWidth + 40 > vw) {
    leftPos = event.clientX - tooltipWidth - 15;
  }

  tooltip.style.left = leftPos + "px";
  tooltip.style.top = event.clientY + 15 + "px";

  tooltip.innerHTML = `
    <strong>Depth:</strong> ${closest.depth.toFixed(1)} m<br>
    <strong>CO₂:</strong> ${closest.co2.toFixed(1)} ppm<br>
    <strong>Gas Age:</strong> ${closest.gasage.toLocaleString()} yrs
  `;
}

/* ================================
   BRUSH
================================ */
function initBrush(innerW, innerH) {
  depthBrush = d3.brush()
    .extent([[0, 0], [innerW, innerH]])
    .on("brush", brushed)
    .on("end", brushEnd);

  depthSvg.append("g")
    .attr("class", "brush")
    .call(depthBrush);
}

function brushed(event) {
  if (!event.selection) return;

  const [[x0, y0], [x1, y1]] = event.selection;

  d3.select("#selection-rect")
    .style("display", "block")
    .attr("x", x0)
    .attr("y", y0)
    .attr("width", x1 - x0)
    .attr("height", y1 - y0);
}

function brushEnd(event) {
  if (!event.selection) return;

  const [[x0, y0], [x1, y1]] = event.selection;

  computeSelectionStats(x0, y0, x1, y1);
  clearSelectionBtn.style.display = "inline-block";
}

/* ================================
   SELECTION STATS
================================ */
function computeSelectionStats(x0, y0, x1, y1) {
  const data = groupedDepth.get(currentCore);

  const selected = data.filter(d => {
    const sx = depthX(d.co2);
    const sy = depthY(d.depth);
    return sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1;
  });

  if (selected.length === 0) {
    clearSelection();
    return;
  }

  const meanDepth = d3.mean(selected, d => d.depth);
  const meanCO2 = d3.mean(selected, d => d.co2);
  const meanAge = d3.mean(selected, d => d.gasage);

  document.getElementById("depth-readout").innerHTML = `
    <p><strong>Selection Mean Values:</strong></p>
    <p>Mean Depth: ${meanDepth.toFixed(1)} m</p>
    <p>Mean CO₂: ${meanCO2.toFixed(1)} ppm</p>
    <p>Mean Gas Age: ${Math.round(meanAge).toLocaleString()} years</p>
  `;
}

/* ================================
   CLEAR SELECTION
================================ */
function clearSelection() {
  d3.select("#depth-svg").select(".brush").call(depthBrush.move, null);

  d3.select("#selection-rect")
    .style("display", "none")
    .attr("width", 0)
    .attr("height", 0);

  clearSelectionBtn.style.display = "none";

  document.getElementById("depth-readout").innerHTML = `
    <p><strong>Depth:</strong> <span id="read-depth">—</span> m</p>
    <p><strong>CO₂:</strong> <span id="read-co2">—</span> ppm</p>
    <p><strong>Gas Age:</strong> <span id="read-age">—</span> years</p>
  `;

  readDepth = document.getElementById("read-depth");
  readCO2 = document.getElementById("read-co2");
  readAge = document.getElementById("read-age");

  updateDotPosition(+slider.value);
}

clearSelectionBtn.addEventListener("click", clearSelection);

/* ================================
   EVENTS
================================ */
slider.addEventListener("input", () => {
  stopDepthPlayback();
  updateDotPosition(+slider.value);
});

coreSelect.addEventListener("change", e => {
  stopDepthPlayback();
  updateCore(+e.target.value);
});
