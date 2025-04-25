<script>
  import ScatterPlot from '$lib/ScatterPlot.svelte';
  import * as d3 from 'd3';
  
  export let data;
  

  const rankingAttributes = [
    '2023 US News Ranking',
    '2022 QS World Ranking',
    '2023 THE World Ranking',
    '2022 RUR World Reputation Ranking',
    '2023 CSRankings'
  ];
  

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
  
 
  let xAttribute = '2022 QS World Ranking';
  let yAttribute = 'Undergraduate Population';
  

  let processedData = [];
  let groupedData = [];
  
  
  $: {
    if (data?.dataset && xAttribute && yAttribute) {
      console.log('Processing data:', {
        'X-axis': xAttribute,
        'Y-axis': yAttribute
      });
      
      // Process all valid data points
      const validData = data.dataset.map(d => {
        // Process X-axis data (ranking)
        let xValue = d[xAttribute];
        // Process Y-axis data (attribute)
        let yValue = d[yAttribute];
        
        // Convert X-axis value (ranking)
        if (typeof xValue === 'string') {
          if (xValue === 'No Ranking') {
            xValue = null;
          } else {
            xValue = parseFloat(xValue);
          }
        }
        

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
        console.log('No valid data points');
        processedData = [];
        groupedData = [];
      } else {
        
        processedData = validData.map(d => ({
          'University Name': d.name,
          [xAttribute]: d.x,
          [yAttribute]: d.y
        }));
        
        
        const sortedData = [...validData].sort((a, b) => a.x - b.x);
        

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
        

        groupedData = groupedSchools.map(g => {
          const avgRank = d3.mean(g.schools, d => d.x);
          const avgValue = d3.mean(g.schools, d => d.y);
          const schoolNames = g.schools.map(d => d.name).join(", ");
          
          return {
            'University Name': `Rank ${g.startRank}-${g.endRank} schools (${g.schools.length})`,
            schoolsList: schoolNames,
            [xAttribute]: avgRank,
            [yAttribute]: avgValue,
            count: g.schools.length
          };
        });

        console.log('Grouped data:', {
          'Original data points': processedData.length,
          'Grouped data points': groupedData.length,
          'Sample group': groupedData[0]
        });
      }
    } else {
      processedData = [];
      groupedData = [];
    }
  }
  

  let showGroupedData = true;
</script>

<div class="container">
  <div class="scatter-plot-section">
    <h3>University Rankings and Attributes Scatter Plot (Grouped)</h3>
    <div class="controls">
      <div class="select-group">
        <label>
          Select X-axis (horizontal) ranking:
          <select bind:value={xAttribute}>
            {#each rankingAttributes as attribute}
              <option value={attribute}>{attribute}</option>
            {/each}
          </select>
        </label>
      </div>
      
      <div class="select-group">
        <label>
          Select Y-axis (vertical) attribute:
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
          Show grouped data (group every 5 ranks)
        </label>
      </div>
    </div>
    
    <div>
      <p>Original data points: {processedData.length}</p>
      <p>Grouped data points: {groupedData.length}</p>
      <p>X-axis (Ranking): {xAttribute}</p>
      <p>Y-axis (Attribute): {yAttribute}</p>
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
      <p>No available data points</p>
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
