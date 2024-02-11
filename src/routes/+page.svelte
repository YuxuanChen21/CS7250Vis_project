<script>
	import './style.css';

	// data comes from the load function in +page.js
	export let data;

	// default features to visualize
	let xFeature = 'strikeout';
	let yFeature = 'hit';
	let colorFeature = 'all_star';
</script>

<div class="container">
	<div>{data.dataset[0].name}</div>
	<div>{xFeature} = {data.dataset[0][xFeature]}</div>
	<div>{yFeature} = {data.dataset[0][yFeature]}</div>
	<div>{colorFeature} = {data.dataset[0][colorFeature]}</div>
</div>

<style>
	.container {
		/* set the font */
		font-family: system-ui, sans-serif;
		font-size: 16px;
	}
</style>
