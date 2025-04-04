<script>
  import ScatterPlot from '$lib/ScatterPlot.svelte';
  import * as d3 from 'd3';
  
  export let data;
  
  // 定义排名列
  const rankingAttributes = [
    '2023 US News Ranking',
    '2022 QS World Ranking',
    '2023 THE World Ranking',
    '2022 RUR World Reputation Ranking',
    '2023 CSRankings'
  ];
  
  // 定义其他属性列
  const otherAttributes = [
    'Acceptance Rate',
    'Average SAT',
    'Nobel Prizes',
    'Undergraduate Population',
    'Niche Academic Grade',
    'Niche Athletic Grade',
    'Niche Campus Grade',
    'Niche Campus Food Grade',
    'Niche Diversity Grade',
    'Niche Dorms Grade',
    'Niche Location Grade',
    'Niche Overall Grade',
    'Niche Party Scene Grade',
    'Niche Professors Grade',
    'Niche Safety Grade',
    'Niche Student Life Grade',
    'Niche Value Grade'
  ];
  
  // 初始化选择的属性（X轴为排名，Y轴为其他属性）
  let xAttribute = '2022 QS World Ranking';
  let yAttribute = 'Undergraduate Population';
  
  // 用于存储处理后的数据
  let processedData = [];
  let groupedData = [];
  
  // 当选择或数据变化时处理数据
  $: {
    if (data?.dataset && xAttribute && yAttribute) {
      console.log('处理数据中:', {
        x轴: xAttribute,
        y轴: yAttribute
      });
      
      // 处理所有有效的数据点
      const validData = data.dataset.map(d => {
        // 处理 X 轴数据（排名）
        let xValue = d[xAttribute];
        // 处理 Y 轴数据（属性）
        let yValue = d[yAttribute];
        
        // 转换 X 轴值（排名）
        if (typeof xValue === 'string') {
          if (xValue === 'No Ranking') {
            xValue = null;
          } else {
            xValue = parseFloat(xValue);
          }
        }
        
        // 转换 Y 轴值（属性）
        if (typeof yValue === 'string') {
          if (yValue.endsWith('%')) {
            yValue = parseFloat(yValue) / 100;
          } else if (/^[A-F][+-]?$/.test(yValue)) {
            const gradeMap = {
              'A+': 4.3, 'A': 4.0, 'A-': 3.7,
              'B+': 3.3, 'B': 3.0, 'B-': 2.7,
              'C+': 2.3, 'C': 2.0, 'C-': 1.7,
              'D+': 1.3, 'D': 1.0, 'D-': 0.7,
              'F': 0.0
            };
            yValue = gradeMap[yValue];
          } else {
            yValue = parseFloat(yValue);
          }
        }

        return {
          name: d['University Name'],
          x: xValue,
          y: yValue
        };
      }).filter(d => 
        d.x !== null && 
        d.y !== null && 
        !isNaN(d.x) && 
        !isNaN(d.y)
      );

      if (validData.length === 0) {
        console.log('没有有效的数据点');
        processedData = [];
        groupedData = [];
      } else {
        // 使用原始数据，不进行标准化
        processedData = validData.map(d => ({
          'University Name': d.name,
          [xAttribute]: d.x,
          [yAttribute]: d.y
        }));
        
        // 对数据按排名顺序分组并聚合
        // 首先按排名排序
        const sortedData = [...validData].sort((a, b) => a.x - b.x);
        
        // 按排名顺序每5所学校分为一组
        const groupedSchools = [];
        for (let i = 0; i < sortedData.length; i += 5) {
          const group = sortedData.slice(i, i + 5);
          if (group.length > 0) {
            groupedSchools.push({
              schools: group,
              startRank: i + 1,
              endRank: i + group.length
            });
          }
        }
        
        // 计算每组的平均值
        groupedData = groupedSchools.map(g => {
          const avgRank = d3.mean(g.schools, d => d.x);
          const avgValue = d3.mean(g.schools, d => d.y);
          const schoolNames = g.schools.map(d => d.name).join(", ");
          
          return {
            'University Name': `第${g.startRank}-${g.endRank}名学校 (${g.schools.length}所)`,
            schoolsList: schoolNames,
            [xAttribute]: avgRank,
            [yAttribute]: avgValue,
            count: g.schools.length
          };
        });

        console.log('分组后的数据:', {
          原始数据点: processedData.length,
          分组数据点: groupedData.length,
          示例分组: groupedData[0]
        });
      }
    } else {
      processedData = [];
      groupedData = [];
    }
  }
  
  // 是否显示分组数据
  let showGroupedData = true;
</script>

<div class="container">
  <div class="scatter-plot-section">
    <h3>大学排名与属性散点图 (分组聚合)</h3>
    <div class="controls">
      <div class="select-group">
        <label>
          选择X轴(横轴)排名：
          <select bind:value={xAttribute}>
            {#each rankingAttributes as attribute}
              <option value={attribute}>{attribute}</option>
            {/each}
          </select>
        </label>
      </div>
      
      <div class="select-group">
        <label>
          选择Y轴(纵轴)属性：
          <select bind:value={yAttribute}>
            {#each otherAttributes as attribute}
              <option value={attribute}>{attribute}</option>
            {/each}
          </select>
        </label>
      </div>
      
      <div class="select-group">
        <label>
          <input type="checkbox" bind:checked={showGroupedData}>
          显示分组数据 (每5个排名分组)
        </label>
      </div>
    </div>
    
    <div>
      <p>原始数据点数量: {processedData.length}</p>
      <p>分组后数据点数量: {groupedData.length}</p>
      <p>X轴 (排名): {xAttribute}</p>
      <p>Y轴 (属性): {yAttribute}</p>
    </div>
    
    {#if (showGroupedData ? groupedData : processedData).length > 0}
      <ScatterPlot
        data={showGroupedData ? groupedData : processedData}
        ranking={yAttribute}
        xAttribute={xAttribute}
        width={800}
        height={500}
        isGrouped={showGroupedData}
      />
    {:else}
      <p>没有可用的数据点</p>
    {/if}
  </div>
</div>

<style>
  .container {
    padding: 20px;
    font-family: system-ui, sans-serif;
  }
  
  .scatter-plot-section {
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    margin-bottom: 20px;
  }
  
  .select-group {
    margin: 1rem 0;
  }
  
  select {
    margin-left: 0.5rem;
    padding: 0.25rem;
    border-radius: 4px;
  }
</style> 