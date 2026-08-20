/* ============================================================
   Cartographer — fps.js
   Render performance benchmark across canvas sizes 1024–8192.
   Measures frame times for idle, pan, zoom scenarios.
   Median frame time must stay ≤16.67ms (60fps budget).
   ============================================================ */

(function() {
  'use strict';

  var CANVAS_SIZES = [1024, 2048, 4096, 8192];
  var SCENARIOS = ['idle', 'pan', 'zoom'];
  var FRAME_BUDGET_MS = 16.67;
  var FRAMES_TO_MEASURE = 180; // 3 seconds @ 60fps

  var results = {};

  function newProject(size) {
    Exporter.newProject(size, size, size + '×' + size);
    populateMap(size);
  }

  function populateMap(size) {
    // Procedural terrain with seeded RNG for consistency
    var seed = 42;
    function seededRand() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    }

    // Paint procedural landmass circles
    var landLayer = Layers.getLayer('landmass');
    var terrainLayer = Layers.getLayer('terrain');
    if (!landLayer || !terrainLayer) return;

    // Fill with some terrain (simplified - just paint on the layer canvas directly)
    var ctx = landLayer.canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    for (var i = 0; i < 40; i++) {
      var x = seededRand() * size;
      var y = seededRand() * size;
      var r = 80 + seededRand() * 120;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    landLayer.dirty = true;

    // Add rivers (vector objects)
    var riverLayer = Layers.getLayer('rivers');
    if (riverLayer) {
      for (var i = 0; i < 5; i++) {
        var pts = [];
        var x = seededRand() * size;
        var y = seededRand() * size;
        for (var j = 0; j < 20; j++) {
          x += (seededRand() - 0.5) * 40;
          y += (seededRand() - 0.5) * 40;
          x = Math.max(10, Math.min(size - 10, x));
          y = Math.max(10, Math.min(size - 10, y));
          pts.push({x: x, y: y});
        }
        riverLayer.objects.push({type: 'path', points: pts, width: 3 + seededRand() * 2});
      }
    }

    // Add symbols
    var symbolLayer = Layers.getLayer('symbols');
    if (symbolLayer) {
      var categories = Object.keys(Sym.SYMBOLS);
      for (var i = 0; i < 80; i++) {
        var cat = categories[Math.floor(seededRand() * categories.length)];
        var items = Sym.SYMBOLS[cat].items;
        if (!items || !items.length) continue;
        var item = items[Math.floor(seededRand() * items.length)];
        var x = seededRand() * size;
        var y = seededRand() * size;
        var rot = Math.floor(seededRand() * 360);
        symbolLayer.objects.push({
          id: item.id,
          x: x, y: y,
          size: 30 + seededRand() * 40,
          rotation: rot,
          wear: seededRand() * 0.3
        });
      }
    }

    // Add labels
    var labelLayer = Layers.getLayer('labels');
    if (labelLayer) {
      var cultures = Object.keys(Names.CULTURES);
      for (var i = 0; i < 60; i++) {
        var culture = cultures[Math.floor(seededRand() * cultures.length)];
        var feature = Names.featureList()[Math.floor(seededRand() * Names.featureList().length)];
        var name = Names.generate(culture, feature, 'en', Math.floor(seededRand() * 1e9));
        var x = seededRand() * size;
        var y = seededRand() * size;
        labelLayer.objects.push({
          id: 'lbl_' + Math.random().toString(36).substr(2, 9),
          x: x, y: y,
          text: name,
          size: 12 + seededRand() * 8,
          font: 'serif',
          color: '#000'
        });
      }
    }

    // Enable grid
    App.grid.enabled = true;
    App.grid.type = 'hex';
    App.grid.size = 64;

    // Fit view
    Cv.resize();
    Cv.fit();
  }

  function measureFrameTimes(scenario, count, callback) {
    var times = [];
    var frameCount = 0;
    var lastTime = performance.now();
    var animProgress = 0;

    function measure() {
      var now = performance.now();
      var delta = now - lastTime;
      lastTime = now;

      if (frameCount > 0) times.push(delta); // skip first frame

      // Apply scenario each frame
      switch (scenario) {
        case 'idle':
          // Just render, no changes
          break;
        case 'pan':
          // Pan across canvas
          animProgress += 0.01;
          var angle = animProgress * Math.PI * 2;
          var dist = 100;
          Cv.panX += Math.cos(angle) * 1;
          Cv.panY += Math.sin(angle) * 1;
          break;
        case 'zoom':
          // Zoom in/out
          animProgress += 0.01;
          var z = 0.5 + Math.sin(animProgress) * 0.4;
          Cv.zoom = Math.max(0.1, Math.min(5, z));
          break;
      }

      // Render
      if (typeof Cv.render === 'function') {
        Cv.render();
      }

      frameCount++;
      if (frameCount < count) {
        requestAnimationFrame(measure);
      } else {
        callback(times);
      }
    }

    requestAnimationFrame(measure);
  }

  function analyzeFrameTimes(times) {
    if (!times.length) return null;
    times.sort(function(a, b) { return a - b; });
    var sum = times.reduce(function(a, b) { return a + b; }, 0);
    return {
      count: times.length,
      min: times[0],
      max: times[times.length - 1],
      mean: sum / times.length,
      median: times[Math.floor(times.length / 2)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)]
    };
  }

  function benchmarkSize(size, onComplete) {
    console.log('[FPS] Benchmarking ' + size + '×' + size);
    newProject(size);

    var sizeResults = {};
    var scenarioIndex = 0;

    function nextScenario() {
      if (scenarioIndex >= SCENARIOS.length) {
        results[size] = sizeResults;
        onComplete(size);
        return;
      }

      var scenario = SCENARIOS[scenarioIndex];
      console.log('  ' + scenario + '...');

      measureFrameTimes(scenario, FRAMES_TO_MEASURE, function(times) {
        var stats = analyzeFrameTimes(times);
        sizeResults[scenario] = stats;
        var pass = stats.median <= FRAME_BUDGET_MS ? 'PASS' : 'FAIL';
        console.log('    [' + pass + '] median: ' + stats.median.toFixed(2) + 'ms (budget: ' + FRAME_BUDGET_MS.toFixed(2) + 'ms)');
        scenarioIndex++;
        setTimeout(nextScenario, 500); // brief pause between scenarios
      });
    }

    nextScenario();
  }

  function runAllBenchmarks() {
    console.log('[FPS] Starting benchmarks...');
    var sizeIndex = 0;

    function nextSize() {
      if (sizeIndex >= CANVAS_SIZES.length) {
        setTimeout(reportResults, 500);
        return;
      }

      var size = CANVAS_SIZES[sizeIndex];
      benchmarkSize(size, function() {
        sizeIndex++;
        setTimeout(nextSize, 1000);
      });
    }

    nextSize();
  }

  function reportResults() {
    console.log('\n[FPS] ========== BENCHMARK RESULTS ==========\n');
    var allPass = true;

    CANVAS_SIZES.forEach(function(size) {
      if (!results[size]) return;
      console.log('Canvas: ' + size + '×' + size);

      SCENARIOS.forEach(function(scenario) {
        var stats = results[size][scenario];
        if (!stats) return;

        var pass = stats.median <= FRAME_BUDGET_MS;
        var icon = pass ? '✓' : '✗';
        allPass = allPass && pass;

        console.log('  ' + icon + ' ' + scenario.padEnd(8) + ': ' +
          'median=' + stats.median.toFixed(2) + 'ms, ' +
          'p95=' + stats.p95.toFixed(2) + 'ms, ' +
          'p99=' + stats.p99.toFixed(2) + 'ms');
      });
      console.log('');
    });

    if (allPass) {
      console.log('[FPS] ✓ ALL TESTS PASS - 60fps maintained across all sizes');
    } else {
      console.log('[FPS] ✗ SOME TESTS FAILED - frame budget exceeded');
    }
    console.log('==========================================\n');
    return allPass;
  }

  // Export for testing
  window.FPSBench = {
    run: runAllBenchmarks,
    results: results
  };

  // Auto-run if in test mode
  if (window.location.hash === '#fps-bench') {
    window.addEventListener('load', function() {
      setTimeout(runAllBenchmarks, 1000);
    });
  }
})();
