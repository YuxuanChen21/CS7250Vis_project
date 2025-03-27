<script>
  import './style.css';
  import RadarChart from '$lib/RadarChart.svelte';
  import * as d3 from 'd3';
  
  let { data } = $props();
  
  const colorScale = d3.scaleOrdinal()
    .domain(data.rankingColumns || [])
    .range(d3.schemeCategory10);

  let selectedRankings = $state([data.rankingColumns?.[0] || '']);
  let selectedFeatures = $state(data.numericColumns?.slice(0, 6) || []);
  
  let filteredData = $derived(
    data.correlations?.filter(d => selectedRankings.includes(d.ranking)) || []
  );
</script>

<div class="container">
  <div class="controls">
    <div class="ranking-select">
      <h3>Please select the ranking systems</h3>
      {#each data.rankingColumns || [] as ranking}
        <label>
          <input
            type="checkbox"
            value={ranking}
            checked={selectedRankings.includes(ranking)}
            on:change={(e) => {
              if (e.target.checked) {
                selectedRankings = [...selectedRankings, ranking];
              } else {
                selectedRankings = selectedRankings.filter(r => r !== ranking);
              }
            }}
          />
          {ranking}
        </label>
      {/each}
    </div>
    
    <div class="feature-select">
      <h3>Please select the features (max 6)</h3>
      {#each data.numericColumns || [] as feature}
        <label>
          <input
            type="checkbox"
            value={feature}
            checked={selectedFeatures.includes(feature)}
            disabled={!selectedFeatures.includes(feature) && selectedFeatures.length >= 6}
            on:change={(e) => {
              if (e.target.checked) {
                selectedFeatures = [...selectedFeatures, feature];
              } else {
                selectedFeatures = selectedFeatures.filter(f => f !== feature);
              }
            }}
          />
          {feature}
        </label>
      {/each}
    </div>
  </div>

  {#if filteredData.length > 0 && selectedFeatures.length > 0}
    <!-- 雷达图 -->
    <div class="chart">
      <RadarChart
        data={filteredData}
        features={selectedFeatures}
        {colorScale}
        width={800}
        height={600}
      />
    </div>

    <!-- 相关系数表格 -->
    <div class="correlation-table">
      <h3>Correlation Matrix</h3>
      <table>
        <thead>
          <tr>
            <th>Ranking System</th>
            {#each selectedFeatures as feature}
              <th>{feature}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each filteredData as item}
            <tr>
              <td class="ranking-name" style="color: {colorScale(item.ranking)}">
                {item.ranking}
              </td>
              {#each selectedFeatures as feature}
                {@const correlation = item.correlations.find(c => c.feature === feature)?.correlation}
                <td 
                  class="correlation-cell" 
                  style="background: linear-gradient(to right, 
                    {correlation !== null && !isNaN(correlation) ? 
                      (correlation > 0 ? 'rgba(0, 158, 115, 0.1)' : 'rgba(213, 94, 0, 0.1)') : 'transparent'} 
                      {Math.abs(correlation || 0) * 100}%, 
                    transparent {Math.abs(correlation || 0) * 100}%)"
                >
                  {#if correlation === null || isNaN(correlation)}
                    <span class="insufficient-data">Insufficient data</span>
                  {:else}
                    <span class="correlation-value">
                      {correlation.toFixed(3)}
                    </span>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .container {
    padding: 20px;
    font-family: system-ui, sans-serif;
  }
  
  .controls {
    display: flex;
    gap: 40px;
    margin-bottom: 20px;
  }
  
  .ranking-select,
  .feature-select {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .chart {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .correlation-table {
    margin: 2rem 0;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background: white;
  }

  .correlation-table h3 {
    margin-bottom: 1rem;
    color: #333;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #ddd;
    border-right: 1px solid #ddd;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.9rem;
    color: #333;
  }

  td:last-child, th:last-child {
    border-right: none;
  }

  tr:last-child td {
    border-bottom: none;
  }

  .ranking-name {
    font-weight: 600;
    white-space: nowrap;
  }

  .correlation-cell {
    position: relative;
    text-align: right;
    font-family: monospace;
  }

  .correlation-value {
    position: relative;
    z-index: 1;
  }

  .insufficient-data {
    color: #999;
    font-style: italic;
    font-size: 0.9em;
  }

  tbody tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tbody tr:hover {
    background-color: #f0f0f0;
  }
</style> 