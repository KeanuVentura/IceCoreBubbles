let chartHasDrawn = false;
let drawingInProgress = false;
const chartContainer = d3.select("#chart");

let initialDrawComplete = false;
let legend;

let svg, xScale, yScale, line, width, height, g;
let dataByCore = {};

let margin = { top: 40, right: 40, bottom: 50, left: 60 };
let legendPadding = 20;

d3.csv("data/dataset1.csv").then(rawData => {
  const data = rawData.map(d => ({
    depth: +d.depth,
    gasage: +d.gasage,
    co2: +d["[CO2]"],
    core: +d.core
  }));

  dataByCore = d3.group(data, d => d.core);
});

function getPathLength(pathD) {
  const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  tempPath.setAttribute("d", pathD);
  return tempPath.getTotalLength();
}

const chartObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (
      entry.isIntersecting &&
      !chartHasDrawn &&
      !drawingInProgress &&
      dataByCore.size > 0
    ) {
      drawingInProgress = true;
      document.body.classList.add("noscroll");
      initChart();
    }
  });
}, { threshold: 0.95 });

chartObserver.observe(document.querySelector("#scrolly-graphic"));

function initChart() {
  chartContainer.selectAll("*").remove();

  const containerWidth = chartContainer.node().clientWidth;
  const containerHeight = chartContainer.node().clientHeight;

  width = containerWidth * 0.8;
  height = containerHeight * 0.8;

  svg = chartContainer
    .append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight);

  g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  xScale = d3.scaleLinear()
    .range([0, width])
    .domain(d3.extent([...dataByCore.values()].flat(), d => d.gasage));

  yScale = d3.scaleLinear()
    .range([height, 0])
    .domain(d3.extent([...dataByCore.values()].flat(), d => d.co2));

  line = d3.line()
    .x(d => xScale(d.gasage))
    .y(d => yScale(d.co2))
    .curve(d3.curveMonotoneX);

  const color = d3.scaleOrdinal()
    .domain([3, 4])
    .range(["#1f77b4", "#ff7f0e"]);

  for (const [core, values] of dataByCore) {
    values.sort((a, b) => a.gasage - b.gasage);

    const path = g.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", color(core))
      .attr("stroke-width", 2)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("class", `core-line core-${core}`)
      .attr("d", line);

    const totalLength = path.node().getTotalLength();

    if (!initialDrawComplete) {
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .on("end", () => {
          initialDrawComplete = true;
          chartHasDrawn = true;
          drawingInProgress = false;

          path.attr("stroke-dasharray", null)
              .attr("stroke-dashoffset", null);

          document.body.classList.remove("noscroll");
        });
    }
  }

  // X axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .attr("class", "x-axis")
    .call(d3.axisBottom(xScale).ticks(6));

  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Gas Age (years)");

  // Y axis
  g.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale).ticks(6));

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .text("CO₂ (ppm)");

  // Legend
  legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform",
      `translate(${margin.left + width - 120}, ${margin.top + height - 60})`
    )
    .style("opacity", initialDrawComplete ? 1 : 0);

  const legendData = [
    { core: 3, color: "#1f77b4" },
    { core: 4, color: "#ff7f0e" }
  ];

  legend.selectAll("legend-item")
    .data(legendData)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 22})`)
    .each(function (d) {
      const gItem = d3.select(this);

      gItem.append("circle")
        .attr("r", 6)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("fill", d.color);

      gItem.append("text")
        .attr("x", 12)
        .attr("y", 4)
        .attr("font-size", "14px")
        .attr("fill", "#333")
        .text(`Core ${d.core}`);
    });

  if (!initialDrawComplete) {
    setTimeout(() => {
      legend.transition().duration(600).style("opacity", 1);
    }, 3200);
  }
}

function zoomToRange(xRange) {
  const base = svg.transition()
    .duration(1400)
    .ease(d3.easeCubicInOut);

  xScale.domain(xRange);

  svg.selectAll("path.core-line")
    .transition(base)
    .attr("d", d => line(d));

  svg.select(".x-axis")
    .transition(base)
    .call(d3.axisBottom(xScale).ticks(5));

  const visible = [...dataByCore.values()]
    .flat()
    .filter(d => d.gasage >= xRange[0] && d.gasage <= xRange[1]);

  yScale.domain(d3.extent(visible, d => d.co2));

  svg.selectAll("path.core-line")
    .transition(base)
    .delay(150)
    .attr("d", d => line(d));

  svg.select(".y-axis")
    .transition(base)
    .delay(150)
    .call(d3.axisLeft(yScale).ticks(5));
}

function moveLegend(position) {
  const t = svg.transition().duration(1200).ease(d3.easeCubicInOut);

  if (position === "top-right") {
    legend.transition(t)
      .attr("transform",
        `translate(${margin.left + width - 120}, ${margin.top + 20})`
      );
  }

  if (position === "bottom-right") {
    legend.transition(t)
      .attr("transform",
        `translate(${margin.left + width - 120}, ${margin.top + height - 60})`
      );
  }
}

const scroller = scrollama();

function handleStepEnter(response) {
  d3.selectAll(".step").classed("is-active", (d, i) => i === response.index);

  if (response.index === 0) {
    zoomFullView();
  } else if (response.index === 1) {
    zoomInhale();
  } else if (response.index === 2) {
    zoomExhale();
  } else if (response.index === 3) {
    zoomReset();
  }
}

function initScroller() {
  scroller
    .setup({
      step: ".step",
      offset: 0.6,
      debug: false
    })
    .onStepEnter(handleStepEnter);

  window.addEventListener("resize", scroller.resize);
}

initScroller();

const inhaleRange = [59000, 64000];
const exhaleRange = [68000, 72000];

function zoomFullView() {
  const fullX = d3.extent([...dataByCore.values()].flat(), d => d.gasage);
  zoomToRange(fullX);
  moveLegend("bottom-right");
}

function zoomInhale() {
  zoomToRange(inhaleRange);
  moveLegend("top-right");
}

function zoomExhale() {
  zoomToRange(exhaleRange);
  moveLegend("bottom-right");
}

function zoomReset() {
  zoomFullView();
  moveLegend("bottom-right");
}
