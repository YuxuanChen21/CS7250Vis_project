<script>
  import './style.css';
  import RadarChart from '$lib/RadarChart.svelte';
  
  let { data } = $props();
  

  if (data.error) {
    console.error('Data loading error:', data.error);
  }
  

  let selectedRankings = $state([data.rankingColumns?.[0] || '']);

  let selectedFeatures = $state(data.numericColumns?.slice(0, 6) || []);
  

  let filteredData = $derived(
    data.correlations?.filter(d => selectedRankings.includes(d.ranking)) || []
  );
</script>

{#if data.error}
  <div class="error">
    Error loading data: {data.error}
  </div>
{:else}
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
              onchange={(e) => {
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
              onchange={(e) => {
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
      <div class="chart">
        <RadarChart
          data={filteredData}
          features={selectedFeatures}
          width={800}
          height={600}
        />
      </div>
    {/if}
  </div>
{/if}

<style>
  .container {
    padding: 20px;
    font-family: system-ui, sans-serif;
  }
  
  .error {
    color: red;
    padding: 20px;
    text-align: center;
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
  
  label {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .chart {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
  }
</style> 