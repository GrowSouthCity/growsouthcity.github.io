---
title: Election Results
date: 2022-11-22 22:04
category: general
tags: elections
author: Roderick
---
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js" integrity="sha512-MefNfAGJ/pEy89xLOFs3V6pYPs6AmUhXJrRlydI/9wZuGrqxmrdQ80zKHUcyadAcpH67teDZcBeS6oMJLPtTqw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js" integrity="sha512-4UKI/XKm3xrvJ6pZS5oTRvIQGIzZFoXR71rRBb1y2N+PbwAsKa5tPl2J6WvbEvwN3TxQCm8hMzsl/pO+82iRlg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<svg style="width: 100%; height: 600px" id="map"></svg>
<select id="contestPicker"></select>
<script src="/assets/js/plot.js"></script>

Hover over a precinct to see its name or click on it to see the results for that consolidation; the precinct name will be highlighted among the list of precincts that the county has merged together.
Unfortunately, the county has screwed up the consolidations/precinct names in this election so there are going to be some gaps in the map until those are manually corrected.
The colors are assigned in sequence from the highest to lowest total ballot items across the county; red is always the highest right now, but at some point I would like to find a better color palette for color blindness.
You can also try dragging and dropping other CSV files from the [county elections office](https://www.smcacre.org/elections/past-elections-results) onto the map to view previous elections (or draft results).
