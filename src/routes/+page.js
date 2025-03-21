import * as d3 from 'd3';


function calculateCorrelation(x, y) {
  const n = x.length;
  if(n === 0) return 0;
  
  const validPairs = x.map((xi, i) => [xi, y[i]])
    .filter(pair => !isNaN(pair[0]) && !isNaN(pair[1]));
  
  if(validPairs.length < 2) return 0;
  
  const xVals = validPairs.map(p => p[0]);
  const yVals = validPairs.map(p => p[1]);
  
  const xMean = d3.mean(xVals);
  const yMean = d3.mean(yVals);
  
  const numerator = d3.sum(xVals.map((x, i) => (x - xMean) * (yVals[i] - yMean)));
  const denominator = Math.sqrt(
    d3.sum(xVals.map(x => Math.pow(x - xMean, 2))) *
    d3.sum(yVals.map(y => Math.pow(y - yMean, 2)))
  );
  
  return denominator === 0 ? 0 : numerator / denominator;
}


function processColumnName(name) {
  return name.replace('Niche ', '');
}


function getNonRankingColumns(data) {
  const firstRow = data[0];
  return Object.keys(firstRow)
    .filter(key => {
      return !key.toLowerCase().includes('ranking') && 
             !key.includes('University Name'); // 排除大学名称列
    })
    .map(processColumnName);
}


function convertToNumeric(value) {
  if (typeof value === 'number') return value;
  if (value === 'No Ranking' || value === '') return NaN;

  if (typeof value === 'string' && value.endsWith('%')) {
    return parseFloat(value) / 100;
  }
  

  const gradeMap = {
    'A+': 4.3, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  
  if (gradeMap[value] !== undefined) {
    return gradeMap[value];
  }
  
  return parseFloat(value);
}

export async function load({ fetch }) {
  try {
    const res = await fetch('/data.csv');
    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    const dataset = d3.csvParse(text, d3.autoType);
    
    const rankingColumns = [
      '2023 US News Ranking',
      '2022 QS World Ranking', 
      '2023 THE World Ranking',
      '2022 RUR World Reputation Ranking',
      '2023 CSRankings'
    ];
    
    const featureColumns = getNonRankingColumns(dataset);
    

    const correlations = rankingColumns.map(ranking => {
      const rankingData = dataset
        .map(d => d[ranking])
        .filter(d => d !== 'No Ranking' && !isNaN(d));
      
      return {
        ranking,
        correlations: featureColumns.map(feature => ({
          feature,
          correlation: calculateCorrelation(
            rankingData,
            dataset
              .filter(d => d[ranking] !== 'No Ranking' && !isNaN(d[ranking]))
              .map(d => convertToNumeric(d[feature.includes('Niche') ? feature : `Niche ${feature}`]))
          )
        }))
      };
    });

    return { 
      dataset,
      rankingColumns,
      numericColumns: featureColumns,
      correlations 
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      error: error.message,
      dataset: [],
      rankingColumns: [],
      numericColumns: [],
      correlations: []
    };
  }
} 