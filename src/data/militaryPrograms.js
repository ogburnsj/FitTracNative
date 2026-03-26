// Military fitness prep programs
// Structure: 12 weeks, assessment days at weeks 4, 8, 12
// Assessment days = simulated test — record scores to track progress
// All timed/bodyweight exercises use weight_key: null

// ── Helpers ───────────────────────────────────────────────────────────────────

function ex(name, sets, reps, note = null) {
  return { name, sets, reps, weight_key: null, target_weight: null, note };
}

function exWeighted(name, sets, reps, weight_key, target_weight, note = null) {
  return { name, sets, reps, weight_key, target_weight, note };
}

function day(label, exercises) {
  return { day: label, exercises };
}

function assessmentBadge(testName) {
  return `⚑ ASSESSMENT — ${testName}`;
}

// ── USMC PFT Prep (12 weeks · 4x/week) ───────────────────────────────────────
// Tiers: Foundation (W1–3) → Assess (W4) → Build (W5–7) → Assess (W8) → Peak (W9–11) → Final Test (W12)

function buildPFTSchedule() {
  const weeks = [];

  // Phase 1 — Foundation (weeks 1–3)
  const foundationRun = [2.0, 2.5, 3.0];
  const foundationIntervals = ['6×400m', '8×400m', '6×800m'];
  const foundationSets = [3, 4, 5];

  for (let i = 0; i < 3; i++) {
    const w = i + 1;
    const sets = foundationSets[i];
    weeks.push([
      day(`Week ${w} · Run — Easy ${foundationRun[i]} mi`, [
        ex('Easy Run', 1, 'for time', `${foundationRun[i]} miles at a comfortable conversational pace. Focus on form and breathing.`),
        ex('Leg Swings', 2, 20, 'Dynamic hip opener — 10 forward/back, 10 lateral per leg'),
        ex('Strides', 4, '100m', '~90% effort, walk back to recover'),
      ]),
      day(`Week ${w} · Upper — Pull/Push/Plank`, [
        ex('Pull-ups', sets, 'max', `${sets} sets to near-failure. Rest 2–3 min. Log total reps.`),
        ex('Push-ups', sets, 25, 'Strict form — chest to ground, full lockout'),
        ex('Dead Hang', 3, 'for time', 'Hang from bar as long as possible. Builds grip and shoulder stability for pull-ups.'),
        ex('Forearm Plank', 3, 'for time', 'Hold for 60 sec minimum. Rest 60 sec between sets.'),
      ]),
      day(`Week ${w} · Run — Intervals ${foundationIntervals[i]}`, [
        ex('Warm-up Jog', 1, '10 min', 'Easy pace to loosen up'),
        ex(`Intervals ${foundationIntervals[i]}`, 1, 'for time', 'Target: 10–15 sec faster than 3-mile race pace per mile. Rest 90 sec between reps.'),
        ex('Cool-down Jog', 1, '10 min', 'Easy pace'),
      ]),
      day(`Week ${w} · Upper — Volume`, [
        ex('Pull-up Ladder', 1, '1–2–3–4–5', 'Go up and down the ladder with minimal rest. Rest 1 min between full ladders.'),
        ex('Push-ups', sets + 1, 20, 'Controlled tempo — 2 sec down, explode up'),
        ex('Australian Pull-ups', 3, 15, 'Use a low bar or rings. Builds horizontal pulling strength.'),
        ex('Forearm Plank', 4, 'for time', 'Target: 90 sec hold each set'),
      ]),
    ]);
  }

  // Assessment — Week 4
  weeks.push([
    day(`Week 4 · ${assessmentBadge('USMC PFT Simulation')}`, [
      ex('Pull-ups', 1, 'max', 'ONE max set — dead hang, full ROM. Log your count. This is your baseline.'),
      ex('Forearm Plank', 1, 'for time', 'Hold until failure. Log your time in MM:SS.'),
      ex('3-Mile Run', 1, 'for time', 'Log your finish time in MM:SS. Goal: establish your baseline.'),
    ]),
    day('Week 4 · Recovery — Light Upper', [
      ex('Dead Hang', 3, 'for time', '3×30 sec — light, no strain'),
      ex('Push-ups', 3, 15, 'Easy, slow tempo'),
      ex('Shoulder Rolls / Mobility', 1, '10 min', 'Focus on rotator cuff and thoracic spine'),
    ]),
    day('Week 4 · Recovery — Easy Run', [
      ex('Easy Run', 1, 'for time', '2 miles easy. No pace pressure.'),
      ex('Hip Flexor Stretch', 1, '5 min', '60 sec per side, 2–3 rounds'),
    ]),
    day('Week 4 · Mobility + Core', [
      ex('Dead Hang', 2, '30 sec', 'Passive stretch'),
      ex('Side Plank', 3, 'for time', '45 sec each side'),
      ex('Hollow Body Hold', 3, '30 sec', 'Shoulders and heels 6 inches off ground'),
    ]),
  ]);

  // Phase 2 — Build (weeks 5–7)
  const buildRun = [3.0, 3.5, 4.0];
  const buildIntervals = ['8×400m', '5×800m', '4×1200m'];
  const buildSets = [5, 6, 6];

  for (let i = 0; i < 3; i++) {
    const w = i + 5;
    const sets = buildSets[i];
    weeks.push([
      day(`Week ${w} · Run — Tempo ${buildRun[i]} mi`, [
        ex('Warm-up', 1, '1 mile', 'Easy pace'),
        ex('Tempo Run', 1, 'for time', `${buildRun[i] - 1} miles at uncomfortable-but-controlled effort. ~85% max HR.`),
        ex('Cool-down', 1, '0.5 mile', 'Easy jog + walk'),
      ]),
      day(`Week ${w} · Upper — Max Effort`, [
        ex('Pull-ups', sets, 'max', `${sets} sets — rest 3 min between. Log each set's reps.`),
        ex('Push-ups', 4, 30, "If you can't hit 30, go to failure each set"),
        ex('Commando Pull-ups', 3, 8, 'Alternate head side each rep — builds oblique and lat recruitment'),
        ex('Forearm Plank', 4, 'for time', 'Target: 2 min hold each set'),
      ]),
      day(`Week ${w} · Run — Intervals ${buildIntervals[i]}`, [
        ex('Warm-up', 1, '10 min', 'Easy jog + dynamic warmup'),
        ex(`Intervals ${buildIntervals[i]}`, 1, 'for time', 'Rest 2 min between reps. Push pace.'),
        ex('Strides', 4, '100m', 'After intervals — focus on form'),
        ex('Cool-down', 1, '10 min', 'Easy jog'),
      ]),
      day(`Week ${w} · Upper — Strength Endurance`, [
        ex('Pull-ups Every Minute (EMOM)', 1, '10 min', '5 reps at the top of each minute for 10 minutes. Scale down if needed.'),
        ex('Push-up Pyramid', 1, 'pyramid', '5–10–15–20–15–10–5 — rest 30 sec between levels'),
        ex('Hanging Knee Raise', 3, 15, 'From dead hang — controlled'),
        ex('Forearm Plank', 3, 'for time', 'Target: 2:30 hold'),
      ]),
    ]);
  }

  // Assessment — Week 8
  weeks.push([
    day(`Week 8 · ${assessmentBadge('USMC PFT Simulation')}`, [
      ex('Pull-ups', 1, 'max', 'Max set — compare to Week 4. Note improvement.'),
      ex('Forearm Plank', 1, 'for time', 'Hold until failure. Compare to Week 4.'),
      ex('3-Mile Run', 1, 'for time', 'Race effort. Compare time to Week 4 baseline.'),
    ]),
    day('Week 8 · Recovery', [
      ex('Easy Run', 1, 'for time', '2 miles, easy'),
      ex('Dead Hang', 3, '30 sec', 'Passive decompression'),
      ex('Full Body Stretch', 1, '15 min', 'Focus on hip flexors, lats, and hamstrings'),
    ]),
    day('Week 8 · Mobility', [
      ex('Yoga Flow / Mobility Work', 1, '20 min', 'Any mobility work — focus on overhead position and hip flexors'),
    ]),
    day('Week 8 · Light Upper', [
      ex('Scap Pull-ups', 3, 10, 'Depress and retract scapulae only — active shoulder health'),
      ex('Push-ups', 2, 15, 'Easy — maintain movement pattern'),
      ex('Side Plank', 2, '45 sec', 'Each side'),
    ]),
  ]);

  // Phase 3 — Peak (weeks 9–11)
  const peakRun = [4.0, 4.5, 3.5];
  const peakIntervals = ['10×400m', '6×800m', '4×1 mi'];
  const peakSets = [6, 7, 5];

  for (let i = 0; i < 3; i++) {
    const w = i + 9;
    const sets = peakSets[i];
    weeks.push([
      day(`Week ${w} · Run — ${i === 2 ? 'Taper' : 'Peak'} ${peakRun[i]} mi`, [
        ex('Warm-up', 1, '1 mile', 'Easy'),
        ex(i === 2 ? 'Moderate Run' : 'Race-Pace Run', 1, 'for time', i === 2 ? `${peakRun[i]} miles at moderate effort — keep it fresh for test week.` : `${peakRun[i]} miles at goal 3-mile race pace.`),
        ex('Strides', 4, '100m', 'Sharp turnover'),
      ]),
      day(`Week ${w} · Upper — Peak`, [
        ex('Pull-ups', sets, 'max', `${sets} max sets. Push for a new rep PR.`),
        ex('Hand-Release Push-ups', 4, 30, 'Touch chest and hips to ground, lift hands, then press up'),
        ex('Pull-up Negatives', 3, 5, '5-second descent only. Extreme eccentric load.'),
        ex('Forearm Plank', 3, 'for time', 'Target: 3 min hold'),
      ]),
      day(`Week ${w} · Run — Intervals ${peakIntervals[i]}`, [
        ex('Warm-up', 1, '10 min', 'Easy jog + drills'),
        ex(`Intervals ${peakIntervals[i]}`, 1, 'for time', '~5K race effort per rep. Full recovery between reps.'),
        ex('Cool-down', 1, '10 min', 'Easy jog'),
      ]),
      day(`Week ${w} · Upper — Maintenance`, [
        ex('Pull-ups', 3, 'max', 'Stop 2 reps short of failure — save the tank'),
        ex('Push-ups', 3, 25, 'Crisp form'),
        ex('Forearm Plank', 3, '2 min', 'Controlled hold'),
      ]),
    ]);
  }

  // Final Test — Week 12
  weeks.push([
    day('Week 12 · Taper — Easy Day', [
      ex('Easy Jog', 1, '20 min', 'Very easy — shake out the legs'),
      ex('Dead Hang', 2, '30 sec', 'Passive decompression'),
    ]),
    day(`Week 12 · ${assessmentBadge('USMC PFT — FINAL TEST')}`, [
      ex('Pull-ups', 1, 'max', 'This is the test. ONE set, maximum reps, dead hang. Record count.'),
      ex('Forearm Plank', 1, 'for time', 'Hold to absolute failure. Record MM:SS.'),
      ex('3-Mile Run', 1, 'for time', 'Race. Record your time. Compare to Weeks 4 and 8.'),
    ]),
    day('Week 12 · Recovery', [
      ex('Easy Walk or Light Jog', 1, '20 min', 'Active recovery only'),
      ex('Full Body Stretch', 1, '15 min', ''),
    ]),
    day('Week 12 · Reflect + Reset', [
      ex('Review Progress', 1, 'log', 'Compare Week 4, 8, and 12 scores. Plan next block.'),
    ]),
  ]);

  return weeks.flat();
}

// ── Army AFT Prep (12 weeks · 4x/week) ───────────────────────────────────────
// Events: 3-rep max deadlift, hand-release push-ups, sprint-drag-carry, plank, 2-mile run

function buildAFTSchedule(oneRMs = {}) {
  const baseDL = oneRMs.deadlift || 185;

  function dlWeight(pct) {
    return Math.round((baseDL * pct) / 5) * 5;
  }

  const weeks = [];

  // Phase 1 — Foundation (W1–3)
  const dlPcts = [0.65, 0.70, 0.75];
  const runDist = ['2 mi', '2.5 mi', '3 mi'];

  for (let i = 0; i < 3; i++) {
    const w = i + 1;
    const pct = dlPcts[i];
    weeks.push([
      day(`Week ${w} · Strength + Push`, [
        exWeighted('Deadlift', 4, 5, 'deadlift', dlWeight(pct), `Working at ${Math.round(pct * 100)}% of your 1RM. Focus on form.`),
        ex('Hand-Release Push-ups', 4, 15, 'Touch chest and hips fully, lift hands off ground, then press up'),
        ex('Plank', 3, 'for time', 'Hold 90 sec each set. Rest 60 sec.'),
      ]),
      day(`Week ${w} · Cardio — Easy Run`, [
        ex('Easy Run', 1, 'for time', `${runDist[i]} at conversational pace`),
        ex('Leg Swings', 2, 20, 'Dynamic hip warmup'),
        ex('Strides', 4, '100m', 'Relaxed sprint form'),
      ]),
      day(`Week ${w} · SDC Practice + Core`, [
        ex('Sprint-Drag-Carry Practice', 4, '1 length', '50m each direction. Sprint out, drag back a weighted object (use what you have), carry and return. Record your time.'),
        ex('Farmer Carry', 3, '50m', 'Heavy — 40 lb dumbbells if available'),
        ex('Hollow Body Hold', 3, '30 sec', 'Press lower back to floor — no arch'),
        ex('Plank', 3, 'for time', '90 sec hold'),
      ]),
      day(`Week ${w} · Run Intervals`, [
        ex('Warm-up', 1, '10 min', 'Easy jog'),
        ex('Intervals 6×400m', 1, 'for time', 'Target: 2-mile goal pace per rep. Rest 90 sec.'),
        ex('Cool-down', 1, '10 min', 'Easy jog'),
      ]),
    ]);
  }

  // Assessment — Week 4
  weeks.push([
    day(`Week 4 · ${assessmentBadge('Army AFT Simulation')}`, [
      exWeighted('3-Rep Max Deadlift', 3, 3, 'deadlift', null, 'Build to your true 3-rep max today. Record the weight.'),
      ex('Hand-Release Push-ups (2 min)', 1, 'max', 'Maximum reps in 2 minutes. Record count.'),
      ex('Sprint-Drag-Carry', 1, 'for time', '5×50m: sprint, drag, lateral, carry, sprint. Record MM:SS.'),
      ex('Plank', 1, 'for time', 'Hold to failure. Record MM:SS.'),
      ex('2-Mile Run', 1, 'for time', 'Record time. Establishes your baseline.'),
    ]),
    day('Week 4 · Recovery', [
      ex('Easy Walk or Light Jog', 1, '20 min', ''),
      ex('Full Body Stretch', 1, '15 min', 'Focus on hamstrings, hip flexors, shoulders'),
    ]),
    day('Week 4 · Mobility + Light Core', [
      ex('Hip 90/90 Stretch', 3, '60 sec', 'Each side'),
      ex('Thoracic Rotation', 2, 10, 'Each side'),
      ex('Dead Bug', 3, 10, 'Opposite arm/leg, controlled tempo'),
    ]),
    day('Week 4 · Active Recovery', [
      ex('Easy Run', 1, 'for time', '2 miles, very easy'),
    ]),
  ]);

  // Phase 2 — Build (W5–7)
  const buildDLPcts = [0.78, 0.82, 0.85];

  for (let i = 0; i < 3; i++) {
    const w = i + 5;
    const pct = buildDLPcts[i];
    weeks.push([
      day(`Week ${w} · Strength + Push`, [
        exWeighted('Deadlift', 5, 3, 'deadlift', dlWeight(pct), `${Math.round(pct * 100)}% — 5 sets of 3. Heavy but controlled.`),
        ex('Hand-Release Push-ups', 5, 20, 'Touch and go — maintain cadence'),
        ex('Plank', 4, 'for time', '2 min hold each set'),
      ]),
      day(`Week ${w} · Cardio — Tempo Run`, [
        ex('Warm-up', 1, '1 mile', 'Easy'),
        ex('Tempo Run', 1, 'for time', `${2 + i * 0.5} miles at 85% effort. Uncomfortably fast.`),
        ex('Cool-down', 1, '0.5 mile', 'Easy jog'),
      ]),
      day(`Week ${w} · SDC Conditioning`, [
        ex('Sprint-Drag-Carry AMRAP', 3, '5 min', 'As many full passes as possible in 5 minutes. Rest 3 min.'),
        ex('Kettlebell Swing', 4, 20, '35–40 lb. Explosive hip drive.'),
        ex('Plank', 3, 'for time', '2:30 hold'),
      ]),
      day(`Week ${w} · Run Intervals`, [
        ex('Warm-up', 1, '10 min', ''),
        ex('Intervals 8×400m', 1, 'for time', 'Goal: 2-mile race pace. Rest 2 min.'),
        ex('Cool-down', 1, '10 min', ''),
      ]),
    ]);
  }

  // Assessment — Week 8
  weeks.push([
    day(`Week 8 · ${assessmentBadge('Army AFT Simulation')}`, [
      exWeighted('3-Rep Max Deadlift', 3, 3, 'deadlift', null, 'Build to new 3RM. Compare to Week 4.'),
      ex('Hand-Release Push-ups (2 min)', 1, 'max', 'Max reps. Compare to Week 4.'),
      ex('Sprint-Drag-Carry', 1, 'for time', 'Record MM:SS. Compare to Week 4.'),
      ex('Plank', 1, 'for time', 'Hold to failure. Compare.'),
      ex('2-Mile Run', 1, 'for time', 'Race effort. Compare to Week 4.'),
    ]),
    day('Week 8 · Recovery', [
      ex('Easy Jog', 1, '20 min', 'Very easy'),
      ex('Full Body Stretch', 1, '15 min', ''),
    ]),
    day('Week 8 · Mobility', [
      ex('Hip + Thoracic Mobility', 1, '20 min', 'Full routine'),
    ]),
    day('Week 8 · Light Strength', [
      exWeighted('Deadlift', 3, 3, 'deadlift', dlWeight(0.65), 'Light — focus on perfect setup and hinge'),
      ex('Push-ups', 3, 15, 'Easy tempo'),
    ]),
  ]);

  // Phase 3 — Peak (W9–11) and Final Test (W12)
  const peakDLPcts = [0.88, 0.92, 0.80];

  for (let i = 0; i < 3; i++) {
    const w = i + 9;
    const pct = peakDLPcts[i];
    weeks.push([
      day(`Week ${w} · ${i === 2 ? 'Taper' : 'Peak'} Strength`, [
        exWeighted('Deadlift', i === 2 ? 3 : 5, i === 2 ? 2 : 3, 'deadlift', dlWeight(pct), i === 2 ? 'Taper — save energy for test' : `${Math.round(pct * 100)}% — peak load`),
        ex('Hand-Release Push-ups', i === 2 ? 3 : 5, i === 2 ? 15 : 25, ''),
        ex('Plank', 3, 'for time', '3 min hold'),
      ]),
      day(`Week ${w} · ${i === 2 ? 'Taper' : 'Peak'} Run`, [
        ex('Warm-up', 1, '10 min', ''),
        ex(i === 2 ? 'Easy Run' : 'Tempo Run', 1, 'for time', i === 2 ? '2 miles, easy — legs fresh for test' : '3.5 miles at 85% effort'),
        ex('Strides', 4, '100m', ''),
      ]),
      day(`Week ${w} · SDC + Core`, [
        ex('Sprint-Drag-Carry', 5, 'for time', 'Each pass for time. Best of 5.'),
        ex('Dead Bug', 3, 12, 'Controlled, anti-rotation'),
        ex('Plank', 3, '2:30', ''),
      ]),
      day(`Week ${w} · Intervals`, [
        ex('Warm-up', 1, '10 min', ''),
        ex(i === 2 ? '4×400m Easy-Moderate' : '6×800m', 1, 'for time', i === 2 ? 'Shake out the legs — light effort' : 'Race pace. Full recovery.'),
        ex('Cool-down', 1, '10 min', ''),
      ]),
    ]);
  }

  // Final Test — Week 12
  weeks.push([
    day('Week 12 · Taper Day', [
      ex('Easy Walk', 1, '20 min', 'Save your legs'),
    ]),
    day(`Week 12 · ${assessmentBadge('Army AFT — FINAL TEST')}`, [
      exWeighted('3-Rep Max Deadlift', 3, 3, 'deadlift', null, 'Build to your all-time 3RM. Record weight.'),
      ex('Hand-Release Push-ups (2 min)', 1, 'max', 'Max reps in 2 minutes.'),
      ex('Sprint-Drag-Carry', 1, 'for time', 'Full event — record MM:SS.'),
      ex('Plank', 1, 'for time', 'Hold to failure — record MM:SS.'),
      ex('2-Mile Run', 1, 'for time', 'Race — compare to Weeks 4 and 8.'),
    ]),
    day('Week 12 · Recovery', [
      ex('Easy Jog', 1, '20 min', ''),
      ex('Stretch', 1, '15 min', ''),
    ]),
    day('Week 12 · Reflect + Reset', [
      ex('Review Progress', 1, 'log', 'Compare all three assessments. Identify weaknesses for next block.'),
    ]),
  ]);

  return weeks.flat();
}

// ── Navy PRT Prep (12 weeks · 3x/week) ───────────────────────────────────────
// Events: push-ups (2 min), forearm plank, 1.5-mile run

function buildNavyPRTSchedule() {
  const weeks = [];

  const runDistances = [
    1.5, 1.5, 2.0,  // W1-3
    null,            // W4 assessment
    2.0, 2.5, 2.5,  // W5-7
    null,            // W8 assessment
    2.5, 3.0, 2.0,  // W9-11
    null,            // W12 final
  ];

  const pushupSets = [3, 4, 5, null, 5, 6, 6, null, 6, 7, 5, null];
  const phases = ['Foundation', 'Foundation', 'Foundation', 'Assessment', 'Build', 'Build', 'Build', 'Assessment', 'Peak', 'Peak', 'Taper', 'Final Test'];

  for (let w = 0; w < 12; w++) {
    const weekNum = w + 1;
    const isAssessment = [3, 7, 11].includes(w); // index 3 = week 4, etc.

    if (isAssessment) {
      weeks.push([
        day(`Week ${weekNum} · ${assessmentBadge('Navy PRT Simulation')}`, [
          ex('Push-ups (2 min)', 1, 'max', 'Maximum reps in 2 minutes. Record count.'),
          ex('Forearm Plank', 1, 'for time', 'Hold to failure. Record MM:SS.'),
          ex('1.5-Mile Run', 1, 'for time', 'Race effort. Record MM:SS.'),
        ]),
        day(`Week ${weekNum} · Recovery`, [
          ex('Easy Jog', 1, '20 min', 'Very light'),
          ex('Full Body Stretch', 1, '15 min', ''),
        ]),
        day(`Week ${weekNum} · Light Maintenance`, [
          ex('Push-ups', 3, 15, 'Easy, maintain pattern'),
          ex('Forearm Plank', 2, '60 sec', ''),
          ex('Easy Walk', 1, '20 min', ''),
        ]),
      ]);
    } else {
      const sets = pushupSets[w] || 4;
      const dist = runDistances[w] || 2.0;
      const phase = phases[w];

      weeks.push([
        day(`Week ${weekNum} · ${phase} — Push + Plank`, [
          ex('Push-ups', sets, 'max', `${sets} sets to near-failure. Rest 2 min. Log each set.`),
          ex('Diamond Push-ups', 3, 10, 'Targets triceps — important for push-up endurance'),
          ex('Forearm Plank', 4, 'for time', 'Target: 90 sec each set'),
          ex('Side Plank', 3, 'for time', '60 sec each side'),
        ]),
        day(`Week ${weekNum} · ${phase} — Intervals`, [
          ex('Warm-up', 1, '10 min', 'Easy jog'),
          ex('Intervals 6×400m', 1, 'for time', 'Target: goal 1.5-mile pace per rep. Rest 90 sec.'),
          ex('Cool-down', 1, '10 min', ''),
        ]),
        day(`Week ${weekNum} · ${phase} — Easy Run`, [
          ex('Easy Run', 1, 'for time', `${dist} miles at conversational pace`),
          ex('Strides', 4, '100m', ''),
          ex('Push-ups', 2, 20, 'After run — additional volume'),
          ex('Forearm Plank', 2, 'for time', '2 min hold'),
        ]),
      ]);
    }
  }

  return weeks.flat();
}

// ── General Selection / INDOC Prep (12 weeks · 5x/week) ──────────────────────
// Targets BUD/S PST style: swim, push-ups, sit-ups, pull-ups, run
// Note: Simulate swim with pool laps if available; substitute with extra run if not

function buildSelectionSchedule() {
  const weeks = [];

  for (let w = 0; w < 12; w++) {
    const weekNum = w + 1;
    const isAssessment = [3, 7, 11].includes(w);

    if (isAssessment) {
      weeks.push([
        day(`Week ${weekNum} · ${assessmentBadge('PST Simulation')}`, [
          ex('500-yd Swim (or 500-yd run sub)', 1, 'for time', 'Breast stroke or combat side stroke. Record MM:SS. No swim? Sub 500-yd run.'),
          ex('Push-ups (2 min)', 1, 'max', 'Max reps in 2 minutes. Record count.'),
          ex('Sit-ups (2 min)', 1, 'max', 'Hands behind head, full ROM. Max reps. Record.'),
          ex('Pull-ups (dead hang, no time limit)', 1, 'max', 'Dead hang start and finish. No kipping. Record count.'),
          ex('1.5-Mile Run', 1, 'for time', 'In boots and pants if possible. Record MM:SS.'),
        ]),
        day(`Week ${weekNum} · Recovery Run`, [
          ex('Easy Jog', 1, 'for time', '2 miles, very easy'),
          ex('Full Body Stretch', 1, '20 min', ''),
        ]),
        day(`Week ${weekNum} · Active Recovery`, [
          ex('Mobility Work', 1, '20 min', 'Hips, shoulders, thoracic'),
          ex('Dead Hang', 3, '30 sec', 'Passive decompression'),
        ]),
      ]);
    } else {
      const phase = w < 3 ? 'Foundation' : w < 7 ? 'Build' : w < 11 ? 'Peak' : 'Taper';
      const mult = w < 3 ? 1.0 : w < 7 ? 1.3 : w < 11 ? 1.6 : 1.0;
      const pullSets = Math.round(3 * mult);
      const pushSets = Math.round(4 * mult);

      weeks.push([
        day(`Week ${weekNum} · ${phase} — Upper Body`, [
          ex('Pull-ups', pullSets, 'max', `${pullSets} sets to near-failure. Dead hang. Log each set.`),
          ex('Push-ups', pushSets, 'max', `${pushSets} sets. Rest 90 sec.`),
          ex('Sit-ups', 4, 30, 'Full ROM. Hands behind head.'),
          ex('Dead Hang', 3, 'for time', 'Grip endurance for swim and pull-ups'),
        ]),
        day(`Week ${weekNum} · ${phase} — Swim or Run`, [
          ex('Swim (CSS or Breast Stroke)', 1, 'for time', `${w < 3 ? 400 : w < 7 ? 600 : 800}m. Smooth, efficient technique. No sprinting — build aerobic base.`),
          ex('Push-up / Sit-up Circuit', 3, 'for time', '20 push-ups + 20 sit-ups + rest 60 sec = 1 round. Complete 3 rounds.'),
        ]),
        day(`Week ${weekNum} · ${phase} — Run + Core`, [
          ex('Run', 1, 'for time', `${w < 3 ? 2 : w < 7 ? 3 : 4} miles at moderate effort`),
          ex('Sit-ups EMOM', 1, '10 min', '20 sit-ups at the top of each minute for 10 minutes'),
          ex('Plank', 3, 'for time', '2 min hold'),
        ]),
        day(`Week ${weekNum} · ${phase} — Intervals + Upper`, [
          ex('Run Intervals 6×400m', 1, 'for time', 'Fast — goal run pace. Rest 90 sec.'),
          ex('Pull-ups', 3, 'max', 'After run — simulates muscle fatigue during events'),
          ex('Push-ups', 3, 25, ''),
        ]),
        day(`Week ${weekNum} · ${phase} — PT Grinder`, [
          ex('Pull-up Ladder', 1, '1–5–1', 'Up to 5, back down to 1 — minimal rest'),
          ex('Push-up Circuit', 1, '100 total', 'Break into sets as needed. Rest as little as possible.'),
          ex('Sit-up Circuit', 1, '100 total', 'Break into sets as needed.'),
          ex('Easy Run', 1, 'for time', '2 miles easy — flush out lactic'),
        ]),
      ]);
    }
  }

  return weeks.flat();
}

// ── Ruck March Progression (12 weeks · 3x/week) ──────────────────────────────
// Goal: 12 miles at 35 lb in under 3 hours (15 min/mile)
// Rule: Never increase BOTH weight and distance in the same week

function buildRuckSchedule() {
  const plan = [
    // week, session A (weight lb, dist mi), session B, session C (long ruck)
    { w: 1,  a: [15, 2.0], b: [15, 2.0], c: [20, 3.0], note: 'Break in your boots if needed' },
    { w: 2,  a: [20, 2.0], b: [20, 2.5], c: [20, 4.0], note: '' },
    { w: 3,  a: [20, 2.5], b: [25, 2.5], c: [20, 5.0], note: 'First long ruck — pace yourself' },
    { w: 4,  a: [15, 2.0], b: [20, 2.0], c: null,       note: '⚑ DELOAD — recovery week', assess: false },
    { w: 5,  a: [25, 3.0], b: [25, 3.0], c: [25, 6.0], note: '' },
    { w: 6,  a: [25, 3.0], b: [30, 3.0], c: [25, 6.0], note: '' },
    { w: 7,  a: [30, 3.0], b: [30, 3.5], c: [30, 7.0], note: '' },
    { w: 8,  a: [20, 2.5], b: [25, 2.5], c: null,       note: '⚑ ASSESSMENT RUCK — Week 8', assess: true },
    { w: 9,  a: [30, 3.5], b: [30, 4.0], c: [35, 8.0], note: 'First week at 35 lb' },
    { w: 10, a: [35, 4.0], b: [35, 4.0], c: [35, 9.0], note: '' },
    { w: 11, a: [35, 4.0], b: [35, 4.5], c: [35, 10.0], note: 'Longest training ruck' },
    { w: 12, a: [25, 3.0], b: null,       c: [35, 12.0], note: '⚑ FINAL ASSESSMENT — 12 miles at 35 lb' },
  ];

  const days = [];

  for (const wk of plan) {
    const { w, a, b, c, note, assess } = wk;

    // Session A
    days.push(day(
      `Week ${w} · Ruck A — ${a[0]} lb / ${a[1]} mi${note ? '  ' + note : ''}`,
      [
        ex('Ruck March', 1, 'for time', `${a[0]} lbs in ruck. ${a[1]} miles. Target pace: 15 min/mile (${Math.round(a[1] * 15)} min total). Record actual time.`),
        ex('Foot Care Check', 1, 'log', 'Inspect heels and toes for hot spots or blisters after every ruck.'),
      ]
    ));

    // Session B
    if (b) {
      days.push(day(
        `Week ${w} · Ruck B — ${b[0]} lb / ${b[1]} mi`,
        [
          ex('Ruck March', 1, 'for time', `${b[0]} lbs. ${b[1]} miles. Target pace: 15 min/mile.`),
          ex('Foot Soak + Blister Prevention', 1, 'log', 'Epsom salt soak recommended after longer rucks.'),
        ]
      ));
    } else if (w === 12) {
      days.push(day('Week 12 · Rest Day', [
        ex('Easy Walk', 1, '20 min', 'Stay off your feet as much as possible before the final ruck.'),
      ]));
    }

    // Session C (long ruck or assessment)
    if (c) {
      const isAssessment = assess || w === 8 || w === 12;
      const label = w === 12
        ? `Week 12 · ${assessmentBadge('FINAL RUCK — 12 mi @ 35 lb')}`
        : w === 8
        ? `Week 8 · ${assessmentBadge('Assessment Ruck — 8 mi @ 30 lb')}`
        : `Week ${w} · Long Ruck — ${c[0]} lb / ${c[1]} mi`;

      days.push(day(label, [
        ex('Long Ruck March', 1, 'for time', `${c[0]} lbs. ${c[1]} miles. Target: ${Math.round(c[1] * 15)} min (15 min/mile). Record exact time. ${w === 12 ? 'Army EIB standard: sub 3:00:00.' : ''}`),
        ex('Mid-ruck nutrition', 1, 'log', 'Note what you ate/drank. Electrolytes matter on anything over 6 miles.'),
        ex('Foot + Blister Log', 1, 'log', 'Document any hot spots. Treat immediately.'),
      ]));
    }
  }

  return days;
}

// ── USMC CFT Prep (12 weeks · 3x/week) ───────────────────────────────────────
// Events: 880-yd MTC run, 30-lb Ammo Can Lifts (2 min), 300-yd MANUF course

function buildCFTSchedule() {
  const weeks = [];

  for (let w = 0; w < 12; w++) {
    const weekNum = w + 1;
    const isAssessment = [3, 7, 11].includes(w);
    const phase = w < 3 ? 'Foundation' : w < 7 ? 'Build' : w < 11 ? 'Peak' : 'Taper';

    if (isAssessment) {
      weeks.push([
        day(`Week ${weekNum} · ${assessmentBadge('USMC CFT Simulation')}`, [
          ex('Movement to Contact — 880 yd Run', 1, 'for time', 'In boots and utilities. Sprint 880 yards. Record MM:SS. Goal: sub 3:45 (male 17-25).'),
          ex('Ammo Can Lifts — 2 min', 1, 'max', '30 lb can, overhead press, 2-minute max reps. If no ammo can: use 30 lb dumbbell. Record count.'),
          ex('Maneuver Under Fire Simulation — 300 yd', 1, 'for time', 'Sprint, crawl, drag, carry circuit. Use tire drag or partner drag if available. Record time.'),
        ]),
        day(`Week ${weekNum} · Recovery`, [
          ex('Easy Jog', 1, '20 min', ''),
          ex('Stretch + Mobility', 1, '15 min', ''),
        ]),
        day(`Week ${weekNum} · Light Work`, [
          ex('Ammo Can Practice', 3, 20, '30 lb — 3 easy sets to maintain motor pattern'),
          ex('Easy Run', 1, 'for time', '2 miles easy'),
        ]),
      ]);
    } else {
      weeks.push([
        day(`Week ${weekNum} · ${phase} — MTC Speed`, [
          ex('Warm-up', 1, '10 min', 'Easy jog'),
          ex('880-yd Intervals ×4', 1, 'for time', 'Sprint 880 yards, rest 3 min, repeat 4 times. Record each split.'),
          ex('Sprint Drills', 4, '100m', 'High knees, butt kicks, A-skips — improve acceleration'),
        ]),
        day(`Week ${weekNum} · ${phase} — Ammo Can + MANUF`, [
          ex('Ammo Can Lift Practice', 5, 25, '30 lb overhead. Smooth consistent cadence — endurance over speed.'),
          ex('Lateral Bear Crawl', 4, '25 yd', 'Simulates MANUF low crawl. Each direction.'),
          ex('Fireman Carry Practice', 4, '25 yd', 'Partner or sandbag — builds carry strength for MANUF'),
          ex('Buddy Drag', 4, '25 yd', 'Drag a partner or weighted sled — simulates MANUF body drag'),
        ]),
        day(`Week ${weekNum} · ${phase} — Full Conditioning`, [
          ex('Run', 1, 'for time', `${w < 3 ? 2 : w < 7 ? 3 : 3.5} miles in boots`),
          ex('Ammo Can Lifts', 3, 30, 'After run — simulates MTC → ACL sequence in the CFT'),
          ex('Burpees', 3, 15, 'Full body conditioning — mirrors physical demands of MANUF'),
        ]),
      ]);
    }
  }

  return weeks.flat();
}

// ── Program Definitions ────────────────────────────────────────────────────────

export const MIL_PROGRAMS = [
  {
    id:   'usmc_pft_prep',
    name: 'USMC PFT Prep',
    goal: 'Military Fitness',
    days: 4,
    freq: '4×/week · 12 weeks',
    color: ['#7f1d1d', '#991b1b'],
    desc: 'Build pull-ups, plank endurance, and 3-mile run speed. Assessments at weeks 4, 8, and 12 track your progress toward PFT 1st Class (235+ pts). Pull-ups are the primary discriminator — expect the run volume to be high.',
    getSchedule: () => buildPFTSchedule(),
  },
  {
    id:   'usmc_cft_prep',
    name: 'USMC CFT Prep',
    goal: 'Military Fitness',
    days: 3,
    freq: '3×/week · 12 weeks',
    color: ['#7c2d12', '#9a3412'],
    desc: 'Prepare for the 880-yd Movement to Contact run, 30-lb Ammo Can Lifts (2 min), and Maneuver Under Fire 300-yd course. Assessments at weeks 4, 8, and 12. Heavy focus on short-burst anaerobic capacity and loaded movement.',
    getSchedule: () => buildCFTSchedule(),
  },
  {
    id:   'army_aft_prep',
    name: 'Army AFT Prep',
    goal: 'Military Fitness',
    days: 4,
    freq: '4×/week · 12 weeks',
    color: ['#14532d', '#166534'],
    desc: 'Train for the 5-event Army Fitness Test: 3-rep max deadlift, hand-release push-ups, sprint-drag-carry, plank, and 2-mile run. The AFT replaced the ACFT in June 2025 (Standing Power Throw removed). Combat MOS standard: 350/500 pts.',
    getSchedule: (oneRMs) => buildAFTSchedule(oneRMs),
  },
  {
    id:   'navy_prt_prep',
    name: 'Navy PRT Prep',
    goal: 'Military Fitness',
    days: 3,
    freq: '3×/week · 12 weeks',
    color: ['#1e3a5f', '#1e40af'],
    desc: 'Prepare for the Navy Physical Readiness Test: 2-minute push-ups, forearm plank, and 1.5-mile run. Curl-ups were replaced by the plank in 2022. Two PRTs required per year as of Dec 2025. Assessments at weeks 4, 8, and 12.',
    getSchedule: () => buildNavyPRTSchedule(),
  },
  {
    id:   'selection_prep',
    name: 'Selection Prep',
    goal: 'Military Fitness',
    days: 5,
    freq: '5×/week · 12 weeks',
    color: ['#1c1917', '#292524'],
    desc: 'General INDOC/selection prep targeting BUD/S PST standards: 500-yd swim, push-ups, sit-ups, pull-ups, 1.5-mile run. Also appropriate for MARSOC A&S baseline fitness. High volume — designed for candidates serious about making a competitive class.',
    getSchedule: () => buildSelectionSchedule(),
  },
  {
    id:   'ruck_progression',
    name: 'Ruck Progression',
    goal: 'Military Fitness',
    days: 3,
    freq: '3×/week · 12 weeks',
    color: ['#3b2100', '#78350f'],
    desc: 'Build from 15 lb / 2 miles to 35 lb / 12 miles under 3 hours — the Army EIB / RASP standard. Never increase both weight and distance in the same week. Deload weeks at 4 and 8. Final 12-mile ruck in week 12.',
    getSchedule: () => buildRuckSchedule(),
  },
];

export const MIL_IDS = MIL_PROGRAMS.map(p => p.id);
