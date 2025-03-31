<script>
    import * as d3 from 'd3';
  
    let { 
      data,      // Array of {x: number, y: number} points
      xLabel,    // Feature name
      yLabel,    // Ranking name
      width = 300, 
      height = 300,
      color 
    } = $props();
  
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
  
    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x))
      .nice()
      .range([0, innerWidth]);
  
    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y))
      .nice()
      .range([innerHeight, 0]);
  
    // Calculate correlation for the title
    function calculateCorrelation(data) {
      if (data.length < 2) return null;
      
      const xMean = d3.mean(data, d => d.x);
      const yMean = d3.mean(data, d => d.y);
      
      let numerator = 0;
      let xSquaredSum = 0;
      let ySquaredSum = 0;
      
      for (const point of data) {
        const xDiff = point.x - xMean;
        const yDiff = point.y - yMean;
        numerator += xDiff * yDiff;
        xSquaredSum += xDiff * xDiff;
        ySquaredSum += yDiff * yDiff;
      }
      
      const denominator = Math.sqrt(xSquaredSum * ySquaredSum);
      return denominator === 0 ? null : numerator / denominator;
    }
  
    const correlation = calculateCorrelation(data);
  </script>
  
  <div class="scatter-plot">
    <h4>
      {yLabel} vs {xLabel}
      {#if correlation !== null}
        <span class="correlation">(r = {correlation.toFixed(3)})</span>
      {/if}
    </h4>
    
    <svg {width} {height}>
      <g transform="translate({margin.left}, {margin.top})">
        <!-- X-axis -->
        <g transform="translate(0, {innerHeight})">
          {#each xScale.ticks(5) as tick}
            <g transform="translate({xScale(tick)}, 0)">
              <line y2="6" stroke="currentColor" />
              <text y="9" dy="0.71em" text-anchor="middle">{tick}</text>
            </g>
          {/each}
          <text
            x={innerWidth / 2}
            y="35"
            text-anchor="middle"
          >{xLabel}</text>
        </g>
  
        <!-- Y-axis -->
        <g>
          {#each yScale.ticks(5) as tick}
            <g transform="translate(0, {yScale(tick)})">
              <line x2="-6" stroke="currentColor" />
              <text x="-9" dy="0.32em" text-anchor="end">{tick}</text>
            </g>
          {/each}
          <text
            transform="rotate(-90)"
            x={-innerHeight / 2}
            y="-40"
            text-anchor="middle"
          >{yLabel}</text>
        </g>
  
        <!-- Scatter points -->
        {#each data as point}
          <circle
            cx={xScale(point.x)}
            cy={yScale(point.y)}
            r="4"
            fill={color}
            opacity="0.6"
          />
        {/each}
  
        <!-- Regression line -->
        {#if correlation !== null}
          {@const regression = d3.regressionLinear()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .domain([0, innerWidth])}
          {@const regressionLine = regression(data)}
          <path
            d={`M ${regressionLine[0]} L ${regressionLine[1]}`}
            stroke={color}
            stroke-width="2"
            stroke-opacity="0.5"
            fill="none"
          />
        {/if}
      </g>
    </svg>
  </div>
  
  <style>
    .scatter-plot {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  
    h4 {
      margin: 0 0 1rem 0;
      text-align: center;
    }
  
    .correlation {
      font-weight: normal;
      color: #666;
    }
  
    svg {
      font: 10px sans-serif;
    }
  
    line {
      stroke: #ddd;
    }
  </style>