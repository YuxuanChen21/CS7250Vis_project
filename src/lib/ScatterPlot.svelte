<script>
  import * as d3 from 'd3';
  
  export let data = [];
  export let ranking = '';
  export let xAttribute = '';
  export let width = 800;
  export let height = 500;
  export let isGrouped = false;
  
  // 设置图表边距
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // 使用响应式声明代替 $derived
  let chartData;
  $: {
    if (!data || !xAttribute || !ranking) {
      chartData = {
        points: [],
        xDomain: [0, 1],
        yDomain: [0, 1]
      };
    } else {
      // 提取所有点
      const points = data.map(d => ({
        name: d['University Name'],
        x: d[xAttribute],
        y: d[ranking],
        schoolsList: d.schoolsList,
        count: d.count || 1
      }));
      
      // 计算 x 和 y 的域
      const xValues = points.map(d => d.x);
      const yValues = points.map(d => d.y);
      
      const xDomain = [
        d3.min(xValues) * 0.9,
        d3.max(xValues) * 1.1
      ];
      
      const yDomain = [
        d3.min(yValues) * 0.9,
        d3.max(yValues) * 1.1
      ];
      
      // 处理特殊情况：如果最小值是0或接近0
      if (xDomain[0] === 0 || Math.abs(xDomain[0]) < 0.001) {
        xDomain[0] = 0;
        xDomain[1] = d3.max(xValues) * 1.2;
      }
      
      if (yDomain[0] === 0 || Math.abs(yDomain[0]) < 0.001) {
        yDomain[0] = 0;
        yDomain[1] = d3.max(yValues) * 1.2;
      }
      
      chartData = { points, xDomain, yDomain };
    }
  }
  
  // 设置比例尺
  $: xScale = d3.scaleLinear()
    .domain(chartData.xDomain)
    .range([0, innerWidth]);
  
  $: yScale = d3.scaleLinear()
    .domain(chartData.yDomain)
    .range([innerHeight, 0]);
    
  // 处理悬停状态
  let hoveredPoint = null;
  
  // 计算圆点半径
  function getRadius(count) {
    if (!isGrouped) return 6;
    return Math.max(6, Math.min(15, Math.sqrt(count) * 3));
  }
</script>

<div class="scatter-plot">
  <svg {width} {height}>
    <g transform="translate({margin.left}, {margin.top})">
      <!-- X轴 -->
      <g transform="translate(0, {innerHeight})">
        <line x1="0" y1="0" x2="{innerWidth}" y2="0" stroke="black" />
        {#each xScale.ticks(5) as tick}
          <g transform="translate({xScale(tick)}, 0)">
            <line y2="5" stroke="black" />
            <text dy="1em" text-anchor="middle">{tick}</text>
          </g>
        {/each}
        <text 
          x="{innerWidth / 2}" 
          y="35" 
          text-anchor="middle"
          font-weight="bold"
        >
          {xAttribute}
        </text>
      </g>
      
      <!-- Y轴 -->
      <g>
        <line x1="0" y1="0" x2="0" y2="{innerHeight}" stroke="black" />
        {#each yScale.ticks(5) as tick}
          <g transform="translate(0, {yScale(tick)})">
            <line x2="-5" stroke="black" />
            <text dx="-0.5em" dy="0.3em" text-anchor="end">{tick}</text>
          </g>
        {/each}
        <text 
          transform="rotate(-90)" 
          x="-{innerHeight / 2}" 
          y="-40" 
          text-anchor="middle"
          font-weight="bold"
        >
          {ranking}
        </text>
      </g>
      
      <!-- 数据点 -->
      {#each chartData.points as point}
        <circle
          cx="{xScale(point.x)}"
          cy="{yScale(point.y)}"
          r="{getRadius(point.count)}"
          fill={isGrouped ? "orange" : "steelblue"}
          stroke={hoveredPoint === point ? "black" : "none"}
          stroke-width="2"
          opacity="0.7"
          on:mouseenter={() => hoveredPoint = point}
          on:mouseleave={() => hoveredPoint = null}
        />
      {/each}
      
      <!-- 悬停提示 -->
      {#if hoveredPoint}
        <g transform="translate({xScale(hoveredPoint.x)}, {yScale(hoveredPoint.y) - 15})">
          <rect
            x="-150"
            y={isGrouped && hoveredPoint.schoolsList ? -60 : -30}
            width="300"
            height={isGrouped && hoveredPoint.schoolsList ? 60 : 30}
            fill="white"
            stroke="black"
            rx="3"
          />
          <text 
            text-anchor="middle" 
            dy="-40"
            font-size="12px"
            font-weight="bold"
          >
            {hoveredPoint.name}
          </text>
          <text 
            text-anchor="middle" 
            dy="-20"
            font-size="12px"
          >
            {xAttribute}: {hoveredPoint.x.toFixed(2)}, {ranking}: {hoveredPoint.y.toFixed(2)}
          </text>
          {#if isGrouped && hoveredPoint.schoolsList}
            <text 
              text-anchor="middle" 
              dy="0"
              font-size="10px"
              class="schools-list"
            >
              {#if hoveredPoint.schoolsList.length > 100}
                {hoveredPoint.schoolsList.substring(0, 100)}...
              {:else}
                {hoveredPoint.schoolsList}
              {/if}
            </text>
          {/if}
        </g>
      {/if}
    </g>
  </svg>
</div>

<style>
  .scatter-plot {
    background-color: #f9f9f9;
    border-radius: 5px;
    padding: 10px;
  }
  
  text {
    font-size: 12px;
  }
  
  .schools-list {
    font-style: italic;
  }
  
  circle {
    cursor: pointer;
    transition: r 0.2s;
  }
  
  circle:hover {
    r: 8;
  }
</style> 