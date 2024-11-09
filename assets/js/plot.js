class ElectionMap {
  constructor(mapId, selectId) {
    this.mapId = mapId;
    this.selectId = selectId;
    this.contestTitle = '';
    this.resultsPromise = null;
    this.consolidationsPromise = Promise.resolve('');
    this.precinctMapPromise = Promise.resolve({});
    this.cityMapPromise = Promise.resolve({});

    let map = document.querySelector(mapId);
    map.addEventListener('dragover', (evt) => evt.preventDefault());
    map.addEventListener('drop', (evt) => {
      evt.preventDefault();
      if (evt.dataTransfer && evt.dataTransfer.files) {
        const file = evt.dataTransfer.files[0];
        const contentsPromise = file.text().then((data) => d3.csvParse(data));
        this.loadData(contentsPromise, file.name);
      }
    });
  }

  loadData(resultsPromise, resultsFileName) {
    this.resultsPromise = resultsPromise;

    const electionId = resultsFileName.split('_')[0];

    // if the consolidations can't be found, return an empty string
    this.consolidationsPromise = fetch(`/assets/election_results/${electionId}_consolidations.txt`).then((r) => r.text()).catch(() => "");

    // this is a little fraught, but old CSVs don't have numeric IDs
    let precinctMapId = (parseInt(electionId, 10) > 38) ? 'smc_prec_202x.json' : 'smc_prec_201x.json';
    this.precinctMapPromise = d3.json(`/assets/maps/${precinctMapId}`);

    this.cityMapPromise = d3.json('/assets/maps/smc_cities.json');
    if (this.selectId) this.updateSelect();
  }

  loadPath(filePath) {
    this.loadData(d3.csv(filePath), filePath.split('/').pop());
  }

  contests() {
    return this.resultsPromise.then((results) => {
      let races = {};
      for (const r of results) {
        if (!(r.Contest_title in races)) {
          races[r.Contest_title] = {};
        }

        const candidate = r.candidate_name || r.Candidate_name;
        if (!(candidate in races[r.Contest_title])) {
          races[r.Contest_title][candidate] = 0;
        }
        const votes = ('total_votes' in r) ? parseFloat(r.total_votes) : (parseFloat(r.Absentee_votes) + parseFloat(r.Early_votes) + parseFloat(r.Election_Votes));
        races[r.Contest_title][candidate] += votes;
      }
      return races;
    });
  }

  getMergedPrecincts(contestTitle) {
    return Promise.all([this.consolidationsPromise, this.resultsPromise, this.precinctMapPromise]).then(
      ([consolidations, results, precincts]) => {
        const districts = {};
        const consolidationMap = {};
  
        /// extract the results into something more usable
        for (const r of results) {
          if (r.Contest_title !== contestTitle) continue;
  
          const precinctId = r.Precinct_name || r.Precinct_Name;
          if (!(precinctId in districts)) {
            consolidationMap[precinctId] = precinctId;
            districts[precinctId] = {
              'precincts': [],
              'registeredVoters': parseFloat(r.Reg_voters),
              'totalBallots': parseFloat(r.total_ballots || r.Ballots),
              'votes': {},
            };
          }
          const votes = ('total_votes' in r) ? parseFloat(r.total_votes) : (parseFloat(r.Absentee_votes) + parseFloat(r.Early_votes) + parseFloat(r.Election_Votes));
          districts[precinctId].votes[r.candidate_name || r.Candidate_name] = votes;
        }
  
        // add in the consolidations; this should be robust to an empty consolidation file
        const allConsolidations = consolidations.split('\n');
        this.contestTitle = allConsolidations.shift();
        for (const c of allConsolidations) {
          if (!c) continue;
          const precincts = c.split(' ');
          let precinctsSet = false;
          for (const precinct of precincts) {
            if (precinct in districts) {
              if (precinctsSet) {
                console.warn('Multiple precincts match ', c);
                continue;
              }
              districts[precinct].precincts = precincts;
              for (const p of precincts) {
                consolidationMap[p] = precinct;
              }
              precinctsSet = true;
            }
          }
          // // this is too noisy for city/school board contests
          // if (!precinctsSet) console.warn('No precincts match ', c);
        }
        for (const [p, d] of Object.entries(districts)) {
          if (!d.precincts.length) {
            console.warn(`Precinct ${p} was not consolidated.`);
            d.precincts.push(p);
          }
        }
  
        // add the data to the map
        const path = d3.geoPath();
        const bounds = path.bounds(precincts.features[0]);
        const features = [];
        for (const feature of precincts.features) {
          let precinct = feature.properties.precinct;
          if (precinct in consolidationMap) precinct = consolidationMap[precinct];
          if (!(precinct in districts)) {
            // wipe any properties from previous iterations
            feature.properties = {'precinct': feature.properties.precinct};
            features.push(feature);
            continue;
          }
          Object.assign(feature.properties, districts[precinct]);
          const [lowBound, highBound] = path.bounds(feature);
          if (lowBound[0] < bounds[0][0]) bounds[0][0] = lowBound[0];
          if (lowBound[1] < bounds[0][1]) bounds[0][1] = lowBound[1];
          if (highBound[0] > bounds[1][0]) bounds[1][0] = highBound[0];
          if (highBound[1] > bounds[1][1]) bounds[1][1] = highBound[1];
          features.push(feature);
        }
  
        return {
          'type': 'FeatureCollection',
          'bounds': { 'type': 'MultiPoint', 'coordinates': bounds },
          features,
        };
      }
    );
  }

  plot(contestName) {
    let selected = null;
    let totalResults = null;
    let candidateColors = null;

    d3.select('.curplot').remove();
    d3.select('.curtip').remove();
    const graph = d3.select(this.mapId).append('g').attr('class', 'curplot');
    const tooltip = d3.select(this.mapId).append('foreignObject')
      .attr('class', 'curtip')
      .attr('width', '300px')
      .attr('height', '600px')
      .attr('pointer-events', 'none');
  
    function onClick(evt, d) {
      if (evt.defaultPrevented) return;
      graph
        .selectAll('.selected')
        .classed('selected', false)
        .attr('stroke', 'transparent')
        .attr('stroke-dasharray', '');
      tooltip.select('div').remove();
      if (d === selected) {
        selected = null;
        return;
      }
      selected = d;
      const [x, y] = d3.pointer(evt);
      if (d.properties && d.properties.votes) {
        const precinctList = d.properties.precincts.map(
          (p) => p === d.properties.precinct ? `<strong>${p}</strong>` : p
        ).join(' ');
        const votes = totalResults.map(([v, _]) => `<span style="color:${candidateColors[v](1)}">${v}</span> ${d.properties.votes[v]}`).join('<br />');
        tooltip
          .attr('x', `${x + 10}px`)
          .attr('y', `${y}px`)
          .append('xhtml:div')
          .style('background-color', 'white')
          .style('border-radius', '4px')
          .style('padding', '4px')
          .html(`<span style="font-size:smaller">Pct ${precinctList}</span><br />${votes}`);
      }
      d3.select(evt.target)
        .classed('selected', true)
        .attr('stroke', '#303030')
        .attr('stroke-dasharray', '4 2');
    }
  
    return Promise.all([this.cityMapPromise, this.getMergedPrecincts(contestName), this.contests()]).then(
      ([cities, precincts, contestMap]) => {
        const bounds = document.querySelector(this.mapId).getBoundingClientRect();
        const projection = d3.geoEquirectangular().fitSize([bounds.width, bounds.height], precincts.bounds);
        const project = d3.geoPath().projection(projection);
        const sortContest = (x) => Object.entries(x).sort((a, b) => b[1] - a[1]);
  
        totalResults = sortContest(contestMap[contestName]);
        if (!totalResults) {
          console.error('Bad contestName', contestName);
          return;
        }
        candidateColors = Object.fromEntries(totalResults.map((v, ix) => {
          const highColor = (ix < 9) ? d3.schemeSet1[ix] : '#999999'; 
          return [v[0], d3.scaleLinear().domain([-0.1, 1]).range(['white', highColor])];
        }));
  
        const precinctMap = graph.selectAll('.precinct')
          .data(precincts.features)
          .enter().append('path')
          .attr('class', 'precinct')
          .attr('d', project)
          .attr('stroke', 'transparent')
          .attr('fill', ({properties}) => {
            const candidates = sortContest(properties.votes || {});
            if (!candidates.length || !candidates[0][1]) return 'transparent';
            if (candidates[1] && candidates[0][1] === candidates[1][1]) {
              // if there's a tie, mix the colors
              const c1 = candidateColors[candidates[0][0]](candidates[0][1] / properties.totalBallots);
              const c2 = candidateColors[candidates[1][0]](candidates[1][1] / properties.totalBallots);
              return d3.interpolate(c1, c2)(0.5);
            }
            return candidateColors[candidates[0][0]](candidates[0][1] / properties.totalBallots);
          })
          .on('click', onClick)
          .append('title')
          .text(({properties}) => `Precinct ${properties.precinct}`)
          .exit().remove();
    
        const cityMap = graph.selectAll('.city')
          .data(cities.features)
          .enter().append('path')
          .attr('class', 'city')
          .attr('d', project)
          .attr('fill', 'transparent')
          .attr('stroke', 'black')
          .attr('pointer-events', 'none')
          .attr('stroke-opacity', ({properties}) => properties.NAME.match('Incorporated') ? 1 : 0.4)
          .exit().remove();
  
        const zoom = d3.zoom()
          .scaleExtent([0.6, 10])
          .translateExtent([[-50, -50], [bounds.width + 50, bounds.height + 50]])
          .on('zoom', ({transform}) => graph.transition().attr('transform', transform));
        graph.call(zoom);
      }
    );
  }

  updateSelect() {
    let selectElem = document.querySelector(this.selectId);
    // remove all the child options
    while (selectElem.firstChild) selectElem.removeChild(selectElem.firstChild);
    // now replace the data
    this.contests().then((contestMap) => {
      const allContests = Object.entries(contestMap).sort();
      for (const [contest, votes] of allContests) {
        const elem = document.createElement('option');
        elem.textContent = contest;
        elem.setAttribute('value', contest);
        selectElem.appendChild(elem);
      }
      selectElem.onchange = () => {
        this.plot(selectElem.value);
      };
      this.plot(allContests[0][0]);
    });
  }
}
