<script>
  import * as d3 from 'd3';
  
  let { 
    data, 
    features, 
    colorScale,
    width = 500, 
    height = 500 
  } = $props();
  
  if (!colorScale) {
    colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.ranking))
      .range(d3.schemeCategory10);
  }

  const margin = 60;
  const radius = Math.min(width, height) / 2 - margin;
  
 
  function getPolygonPoints(values) {
    const points = [];
    const angleStep = (Math.PI * 2) / features.length;
    
    values.forEach((value, i) => {
      const safeValue = value === null || value === undefined || isNaN(value) ? 0 : value;
      const angle = i * angleStep - Math.PI / 2;
      points.push([
        radius * safeValue * Math.cos(angle) + width/2,
        radius * safeValue * Math.sin(angle) + height/2
      ]);
    });
    
    return points.map(point => point.join(',')).join(' ');
  }
  

  function getAxes() {
    const axes = [];
    const angleStep = (Math.PI * 2) / features.length;
    
    features.forEach((feature, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x2 = radius * Math.cos(angle) + width/2;
      const y2 = radius * Math.sin(angle) + height/2;
      
      axes.push({
        line: {
          x1: width/2,
          y1: height/2,
          x2,
          y2
        },
        label: {
          x: x2 + (x2 - width/2) * 0.15,
          y: y2 + (y2 - height/2) * 0.15,
          text: feature
        }
      });
    });
    
    return axes;
  }
  

  const correlationScale = d3.scaleLinear()
    .domain([-1, 1])
    .range([0, 1]);

  let axes = $state(getAxes());
  

  $effect(() => {
    axes = getAxes();
  });
</script>

<div class="radar-chart">
  <svg {width} {height}>

    {#each [0.2, 0.4, 0.6, 0.8, 1] as level}
      <polygon
        points={getPolygonPoints(features.map(() => level))}
        fill="none"
        stroke="#ccc"
        stroke-width="0.5"
      />
    {/each}
    

    {#each axes as axis}
      <line
        x1={axis.line.x1}
        y1={axis.line.y1}
        x2={axis.line.x2}
        y2={axis.line.y2}
        stroke="#999"
        stroke-width="1"
      />
      <text
        x={axis.label.x}
        y={axis.label.y}
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="12px"
      >
        {axis.label.text}
      </text>
    {/each}
    

    {#each data as item}
      <polygon
        points={getPolygonPoints(features.map(f => {
          const corr = item.correlations.find(c => c.feature === f)?.correlation;
          return corr === null || corr === undefined || isNaN(corr) ? 
            0 : correlationScale(corr);
        }))}
        fill={colorScale(item.ranking)}
        fill-opacity="0.2"
        stroke={colorScale(item.ranking)}
        stroke-width="2"
      />
    {/each}
    

    {#each data as item, i}
      <g transform="translate(10, {20 + i * 20})">
        <rect
          width="15"
          height="15"
          fill={colorScale(item.ranking)}
        />
        <text
          x="20"
          y="12"
          font-size="12px"
        >
          {item.ranking}
        </text>
      </g>
    {/each}
  </svg>
</div>

<style>
  .radar-chart {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style> 