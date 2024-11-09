---
title: General Election Results
date: 2024-11-09 15:15
category: general
tags: elections
author: Roderick
---
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js" integrity="sha512-MefNfAGJ/pEy89xLOFs3V6pYPs6AmUhXJrRlydI/9wZuGrqxmrdQ80zKHUcyadAcpH67teDZcBeS6oMJLPtTqw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js" integrity="sha512-4UKI/XKm3xrvJ6pZS5oTRvIQGIzZFoXR71rRBb1y2N+PbwAsKa5tPl2J6WvbEvwN3TxQCm8hMzsl/pO+82iRlg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
Here are the preliminary results for San Mateo County elections as of November 8th, 2024:

<svg style="width: 100%; height: 600px" id="map"></svg>
<select id="contestPicker"></select>
<script src="/assets/js/plot.js"></script>
<script>
  const map = new ElectionMap('#map', '#contestPicker');
  map.loadPath('/assets/election_results/48_ElectionResults_11-08.csv');
</script>

A few quick directions (copied from the last election):
 - Hover over a precinct to see its name or click on it to see the results for that consolidation. The precinct name will be highlighted among the list of precincts that the county has merged together. Candidate names will be colored matching their colors on the map.
 - There isn't a legend yet. The intensity of the color maps to the percentage of the total votes a candidate or measure received; a candidate winning with 90% of the vote will have a much darker color than one winning a precinct with 40% of the vote.
 - The colors are assigned in sequence from the highest to lowest total ballot items across the county. Red is always the highest right now (the overall winner of the county), but at some point I would like to find a better color palette for color blindness.
 - You can also try dragging and dropping other CSV files from the [county elections office](https://www.smcacre.org/elections/past-elections-results) onto the map to view previous elections (or draft results).
