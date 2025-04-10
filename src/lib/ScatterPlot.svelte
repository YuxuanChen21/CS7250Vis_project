<script>
  import * as d3 from 'd3';
  
  export let data = [];
  export let ranking = '';
  export let xAttribute = '';
  export let width = 800;
  export let height = 500;
  export let isGrouped = false;
  export let showTrendline = true;
  export let regressionMethod = 'leastSquares';
  
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
  
  // 计算线性回归线
  $: regressionLine = (() => {
    if (!chartData.points.length || !showTrendline) return null;
    
    const points = chartData.points;
    const n = points.length;
    let slope, intercept;
    
    if (regressionMethod === 'theilSen') {
      // Theil-Sen估计器（中位数斜率）
      const slopes = [];
      
      // 计算所有点对之间的斜率
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = points[j].x - points[i].x;
          if (dx !== 0) { // 避免除以零
            slopes.push((points[j].y - points[i].y) / dx);
          }
        }
      }
      
      // 取斜率的中位数
      slopes.sort((a, b) => a - b);
      if (slopes.length % 2 === 0) {
        slope = (slopes[slopes.length / 2 - 1] + slopes[slopes.length / 2]) / 2;
      } else {
        slope = slopes[Math.floor(slopes.length / 2)];
      }
      
      // 计算所有可能的截距，然后取中位数
      const intercepts = points.map(p => p.y - slope * p.x);
      intercepts.sort((a, b) => a - b);
      if (intercepts.length % 2 === 0) {
        intercept = (intercepts[intercepts.length / 2 - 1] + intercepts[intercepts.length / 2]) / 2;
      } else {
        intercept = intercepts[Math.floor(intercepts.length / 2)];
      }
    } else {
      // 标准最小二乘法
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      
      points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumX2 += point.x * point.x;
      });
      
      slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      intercept = (sumY - slope * sumX) / n;
    }
    
    // 计算相关系数 (只对最小二乘法有效)
    let correlationText = '';
    if (regressionMethod === 'leastSquares') {
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
      
      points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumX2 += point.x * point.x;
        sumY2 += point.y * point.y;
      });
      
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      const r = denominator !== 0 ? numerator / denominator : 0;
      correlationText = `, r = ${r.toFixed(2)}`;
    }
    
    // 创建线的起点和终点
    return {
      x1: chartData.xDomain[0],
      y1: slope * chartData.xDomain[0] + intercept,
      x2: chartData.xDomain[1],
      y2: slope * chartData.xDomain[1] + intercept,
      equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}${correlationText}`,
      method: regressionMethod === 'theilSen' ? 'Theil-Sen' : 'Least Squares'
    };
  })();
</script>

<div class="scatter-plot">
  <!-- 控制区域 -->
  <div class="controls">
    <label class="control-item">
      <input type="checkbox" bind:checked={showTrendline}>
      Show Trendline
    </label>
    
    <!-- 回归方法选择 -->
    {#if showTrendline}
      <div class="control-item">
        <select bind:value={regressionMethod}>
          <option value="leastSquares">Least Squares</option>
          <option value="theilSen">Theil-Sen (Robust)</option>
        </select>
      </div>
    {/if}
  </div>
  
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
      
      <!-- 线性回归线 -->
      {#if regressionLine && showTrendline}
        <line 
          x1={xScale(regressionLine.x1)} 
          y1={yScale(regressionLine.y1)}
          x2={xScale(regressionLine.x2)} 
          y2={yScale(regressionLine.y2)}
          stroke={regressionMethod === 'theilSen' ? 'green' : 'red'}
          stroke-width="2"
          stroke-dasharray="5,5"
        />
        
        <!-- 显示回归方程和方法 -->
        <text 
          x={innerWidth - 10} 
          y="20" 
          text-anchor="end"
          font-size="12px"
          fill={regressionMethod === 'theilSen' ? 'green' : 'red'}
        >
          {regressionLine.method}: {regressionLine.equation}
        </text>
      {/if}
      
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
  
  .controls {
    margin-bottom: 10px;
    display: flex;
    gap: 10px;
  }
  
  .control-item {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 14px;
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
  
  select {
    padding: 2px 5px;
    border-radius: 3px;
    border: 1px solid #ccc;
    font-size: 12px;
  }
</style> 