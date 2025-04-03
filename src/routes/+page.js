import * as d3 from 'd3';


function calculateCorrelation(x, y) {
  const validPairs = x.map((xi, i) => [xi, y[i]])
    .filter(pair => pair[0] !== null && pair[1] !== null);

  if (validPairs.length < 2) {
    console.warn('Not enough valid data pairs for correlation calculation');
    return null;
  }

  const xVals = validPairs.map(p => p[0]);
  const yVals = validPairs.map(p => p[1]);

  const xMean = d3.mean(xVals);
  const yMean = d3.mean(yVals);

  const numerator = d3.sum(xVals.map((x, i) => (x - xMean) * (yVals[i] - yMean)));
  const denominator = Math.sqrt(
    d3.sum(xVals.map(x => Math.pow(x - xMean, 2))) *
    d3.sum(yVals.map(y => Math.pow(y - yMean, 2)))
  );

  if (denominator === 0) {
    console.warn('Zero denominator in correlation calculation');
    return null;
  }

  return -(numerator / denominator);
}


function processColumnName(name) {
  return name.replace('Niche ', '');
}


function getNonRankingColumns(data) {
  const firstRow = data[0];
  return Object.keys(firstRow)
    .filter(key => {
      return !key.toLowerCase().includes('ranking') &&
        !key.includes('University Name');
    })
    .map(processColumnName);
}


function isGradeFeature(feature) {
  const gradeFeatures = [
    'Academic Grade',
    'Athletic Grade',
    'Campus Grade',
    'Campus Food Grade',
    'Diversity Grade',
    'Dorms Grade',
    'Location Grade',
    'Overall Grade',
    'Party Scene Grade',
    'Professors Grade',
    'Safety Grade',
    'Student Life Grade',
    'Value Grade'
  ];
  return gradeFeatures.some(grade => feature.includes(grade));
}


function needsNichePrefix(feature) {
  const nonNicheFeatures = [
    'Acceptance Rate',
    'Average SAT',
    'Nobel Prizes',
    'Undergraduate Population'
  ];
  return !nonNicheFeatures.includes(feature);
}

function convertToNumeric(value, isGradeFeature = false) {
  if (typeof value === 'number') return value;
  if (value === 'No Ranking' || value === '') return null;


  if (isGradeFeature) {
    const gradeMap = {
      'A+': 4.3, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0
    };
    return gradeMap[value] !== undefined ? gradeMap[value] : null;
  }


  if (typeof value === 'string' && value.endsWith('%')) {
    return parseFloat(value) / 100;
  }


  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

export async function load({ fetch }) {
  try {
    const res = await fetch('/data.csv');
    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    const dataset = d3.csvParse(text);

    // console.log("Raw data sample:", dataset.slice(0, 5));
    // console.log("Sample data for Acceptance Rate:", dataset.slice(0, 5).map(d => ({
    //   original: d['Acceptance Rate'],
    //   converted: convertToNumeric(d['Acceptance Rate'])
    // })));
    // console.log("Sample data for Average SAT:", dataset.slice(0, 5).map(d => ({
    //   original: d['Average SAT'],
    //   converted: convertToNumeric(d['Average SAT'])
    // })));
    // console.log("Sample data for Nobel Prizes:", dataset.slice(0, 5).map(d => ({
    //   original: d['Nobel Prizes'],
    //   converted: convertToNumeric(d['Nobel Prizes'])
    // })));

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
        .map(d => convertToNumeric(d[ranking]))
        .filter(d => d !== null);

      // console.log(`Ranking data for ${ranking}:`, rankingData.slice(0, 5));

      return {
        ranking,
        correlations: featureColumns.map(feature => {
          const isGrade = isGradeFeature(feature);
          const featureData = dataset
            .filter(d => convertToNumeric(d[ranking]) !== null)
            .map(d => {
              const featureName = needsNichePrefix(feature) ?
                (feature.includes('Niche') ? feature : `Niche ${feature}`) :
                feature;

              const value = d[featureName];
              const converted = convertToNumeric(value, isGrade);
              // console.log(`Converting ${feature}:`, {
              //   original: value,
              //   isGrade,
              //   converted,
              //   featureName
              // });
              return converted;
            })
            .filter(d => d !== null);

          let correlation = calculateCorrelation(rankingData, featureData);


          if (feature === 'Acceptance Rate' && correlation !== null) {
            correlation = -correlation;
          }

          // console.log(`Correlation for ${ranking} vs ${feature}:`, correlation);

          return {
            feature,
            correlation: correlation ?? 0
          };
        })
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