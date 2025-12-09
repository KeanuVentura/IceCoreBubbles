const NATURAL_PEAK = 280;

const modernMargin = { top: 20, right: 20, bottom: 40, left: 60 };
const modernWidth  = 700 - modernMargin.left - modernMargin.right;
const modernHeight = 420 - modernMargin.top - modernMargin.bottom;

const modernSvg = d3.select("#modern-co2-viz")
  .append("svg")
  .attr("width", modernWidth + modernMargin.left + modernMargin.right)
  .attr("height", modernHeight + modernMargin.top + modernMargin.bottom)
  .append("g")
  .attr("transform", `translate(${modernMargin.left},${modernMargin.top})`);

const mainText      = d3.select("#modern-co2-main");
const subText       = d3.select("#modern-co2-sub");
const modernPlayBtn = d3.select("#modern-co2-play");

console.log("modern.js loaded");

d3.csv("data/modern_co2_cleaned.csv", d => ({
  year: +d.year,
  co2:  +d.deseasonalized          // <-- matches the column name in your CSV
})).then(rows => {
  console.log("Loaded modern CO₂ rows:", rows.length);

  const yearly = Array.from(
    d3.rollup(
      rows,
      v => d3.mean(v, d => d.co2),
      d => d.year
    ),
    ([year, co2]) => ({ year, co2 })
  ).sort((a, b) => d3.ascending(a.year, b.year));

  const x = d3.scaleLinear()
    .domain(d3.extent(yearly, d => d.year))
    .range([0, modernWidth]);

  const y = d3.scaleLinear()
    .domain([260, d3.max(yearly, d => d.co2) + 5])
    .range([modernHeight, 0]);

  // axes
  modernSvg.append("g")
    .attr("class", "modern-axis")
    .attr("transform", `translate(0,${modernHeight})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")));

  modernSvg.append("g")
    .attr("class", "modern-axis")
    .call(d3.axisLeft(y).ticks(6));

  // natural-peak baseline
  modernSvg.append("line")
    .attr("class", "modern-baseline")
    .attr("x1", 0)
    .attr("x2", modernWidth)
    .attr("y1", y(NATURAL_PEAK))
    .attr("y2", y(NATURAL_PEAK));

  modernSvg.append("text")
    .attr("class", "modern-baseline-label")
    .attr("x", modernWidth - 5)
    .attr("y", y(NATURAL_PEAK) - 6)
    .attr("text-anchor", "end")
    .text("Natural ice-core peak (~280 ppm).");

  // line + path
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.co2));

  const path = modernSvg.append("path")
    .datum(yearly)
    .attr("class", "modern-line")
    .attr("fill", "none")
    .attr("stroke", "#8b1e4f")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  const totalLength = path.node().getTotalLength();

  // highlight dot at start
  const highlight = modernSvg.append("circle")
    .attr("class", "modern-highlight-dot")
    .attr("r", 5)
    .attr("fill", "#8b1e4f")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("cx", x(yearly[0].year))
    .attr("cy", y(yearly[0].co2));

  // hide the line initially
  path
    .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
    .attr("stroke-dashoffset", totalLength);

  function formatYearInfo(d) {
    const above = d.co2 - NATURAL_PEAK;
    const pct   = (d.co2 / NATURAL_PEAK - 1) * 100;
    const year  = d.year;

    mainText.text(
      `In ${year}, atmospheric CO₂ was ${d.co2.toFixed(1)} ppm.`
    );

    subText.text(
      `That’s about ${above.toFixed(1)} ppm above the natural ice-core peaks — roughly ${pct.toFixed(0)}% higher than the warmest parts of the last 120,000 years.`
    );
  }

  // show final year by default
    mainText.text(
    "Press “Play the record” to watch CO₂ rise from 1958 to today."
  );

  subText.text(
    "Keep an eye on how far the line climbs above the natural ice-core peak (~280 ppm)."
  );

  function playAnimation() {
    console.log("Play clicked");
    modernPlayBtn.attr("disabled", true).text("Playing…");

    path
      .transition()
      .duration(8000)
      .ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0)
      .tween("move-dot-and-text", function () {
        const l = totalLength;
        return function (t) {
          const point = path.node().getPointAtLength(t * l);
          highlight
            .attr("cx", point.x)
            .attr("cy", point.y);

          const idx = Math.round(t * (yearly.length - 1));
          formatYearInfo(yearly[idx]);
        };
      })
      .on("end", function () {
        modernPlayBtn.attr("disabled", null).text("Play again");
      });
  }

  modernPlayBtn.on("click", playAnimation);
}).catch(err => {
  console.error("Error loading modern CO₂ CSV:", err);
});