import * as d3 from 'd3';

export async function load({ fetch }) {
    try {
        const res = await fetch('/data.csv');
        if (!res.ok) {
            throw new Error(`Fail to load data: ${res.status} ${res.statusText}`);
        }
        const text = await res.text();
        const dataset = d3.csvParse(text);


        console.log("Original data:", {
            第一行: dataset[0],
            列: Object.keys(dataset[0])
        });

        return {
            dataset
        };
    } catch (error) {
        console.error('Fail when load data:', error);
        return {
            error: error.message,
            dataset: []
        };
    }
} 
