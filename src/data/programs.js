// Ported verbatim from FitTrac_v13_Progress.html PROGRAMS array
// TB_WAVES and helper functions are kept here so getSchedule() works identically

export const DEFAULT_1RM = {
  squat: 145, bench: 100, deadlift: 135,
  row: 60, ohp: 65, pullups: 1,
};

export const TB_WAVES = {
  operator:  [
    {sets:3,reps:5,pct:0.70},{sets:3,reps:5,pct:0.80},{sets:3,reps:3,pct:0.90},
    {sets:3,reps:5,pct:0.75},{sets:3,reps:5,pct:0.85},{sets:3,reps:2,pct:0.95},
  ],
  zulu:      [
    {sets:3,reps:5,pct:0.70},{sets:3,reps:5,pct:0.80},{sets:4,reps:3,pct:0.90},
    {sets:3,reps:5,pct:0.70},{sets:3,reps:5,pct:0.80},{sets:4,reps:3,pct:0.90},
  ],
  fighter:   [
    {sets:3,reps:5,pct:0.70},{sets:3,reps:5,pct:0.80},{sets:3,reps:3,pct:0.90},
    {sets:3,reps:5,pct:0.70},{sets:3,reps:5,pct:0.80},{sets:3,reps:3,pct:0.90},
  ],
  gladiator: [
    {sets:5,reps:5,pct:0.70},{sets:5,reps:5,pct:0.80},{sets:5,reps:3,pct:0.90},
    {sets:5,reps:5,pct:0.75},{sets:5,reps:5,pct:0.85},{sets:5,reps:3,pct:0.95},
  ],
  mass:      [
    {sets:4,reps:6,pct:0.75},{sets:4,reps:5,pct:0.80},{sets:4,reps:3,pct:0.90},
    {sets:4,reps:6,pct:0.75},{sets:4,reps:4,pct:0.85},{sets:4,reps:3,pct:0.90},
  ],
  greyman:   [
    {sets:3,reps:6,pct:0.70},{sets:3,reps:5,pct:0.80},{sets:3,reps:3,pct:0.90},
    {sets:3,reps:6,pct:0.70},{sets:3,reps:5,pct:0.80},{sets:3,reps:3,pct:0.90},
    {sets:3,reps:6,pct:0.75},{sets:3,reps:5,pct:0.85},{sets:3,reps:3,pct:0.90},
    {sets:3,reps:1,pct:0.95},{sets:3,reps:6,pct:0.75},{sets:3,reps:5,pct:0.85},
  ],
};

function roundToIncrement(weight, inc = 2.5) {
  return Math.round(weight / inc) * inc;
}

function get1RM(key, oneRMs = {}) {
  return (oneRMs && oneRMs[key]) ? oneRMs[key] : DEFAULT_1RM[key] || 100;
}

function buildTBSchedule(waveKey, lifts, twoWorkouts = false, oneRMs = {}) {
  const wave = TB_WAVES[waveKey];
  if (!twoWorkouts) {
    return wave.map((w, i) => ({
      day: `Week ${i + 1} — ${w.sets}x${w.reps} @ ${Math.round(w.pct * 100)}%`,
      exercises: lifts.map(l => ({
        name: l.name,
        sets: w.sets,
        reps: w.reps,
        weight_key: l.key,
        target_weight: roundToIncrement(get1RM(l.key, oneRMs) * w.pct),
      })),
    }));
  } else {
    const days = [];
    wave.forEach((w, i) => {
      ['A', 'B'].forEach((ab, j) => {
        const liftSet = j === 0 ? lifts.slice(0, 3) : lifts.slice(3);
        days.push({
          day: `Week ${i + 1} Workout ${ab} — ${w.sets}x${w.reps} @ ${Math.round(w.pct * 100)}%`,
          exercises: liftSet.map(l => ({
            name: l.name,
            sets: w.sets,
            reps: w.reps,
            weight_key: l.key,
            target_weight: roundToIncrement(get1RM(l.key, oneRMs) * w.pct),
          })),
        });
      });
    });
    return days;
  }
}

// PROGRAMS array — getSchedule now accepts (oneRMs, weights) params
export const PROGRAMS = [
  {
    id: 'operator',
    name: 'Foundation',
    goal: 'Strength',
    days: 3,
    freq: '3x/week',
    color: ['#1d4ed8', '#1e3a8a'],
    desc: 'The foundational wave periodization protocol. 3 days/week, linear progression over 6 weeks with 2 strength clusters. You pick a main lift cluster (Squat, Bench, Deadlift, OHP). Retest 1RMs every 6–12 weeks.',
    getSchedule: (oneRMs = {}) => buildTBSchedule('operator', [
      {name:'Squat', key:'squat'},
      {name:'Bench Press', key:'bench'},
      {name:'Deadlift', key:'deadlift'},
      {name:'Overhead Press', key:'ohp'},
    ], false, oneRMs),
  },
  {
    id: 'zulu',
    name: 'Split Strength',
    goal: 'Strength (A/B Split)',
    days: 4,
    freq: '4x/week',
    color: ['#d97706', '#92400e'],
    desc: '4 days/week, alternating Workout A and B. More volume than Foundation. Workout A: Squat, Bench, Row. Workout B: Deadlift, OHP, Pull-ups. Track your progression each session.',
    getSchedule: (oneRMs = {}) => buildTBSchedule('zulu', [
      {name:'Squat', key:'squat'},
      {name:'Bench Press', key:'bench'},
      {name:'Barbell Row', key:'row'},
      {name:'Deadlift', key:'deadlift'},
      {name:'Overhead Press', key:'ohp'},
      {name:'Pull-ups', key:'pullups'},
    ], true, oneRMs),
  },
  {
    id: 'fighter',
    name: 'Minimalist',
    goal: 'Strength + Performance',
    days: 2,
    freq: '2x/week',
    color: ['#dc2626', '#7f1d1d'],
    desc: 'Minimum effective dose — 2 days/week. Designed for people with demanding schedules. Perfect if you need to maintain strength while doing heavy conditioning or sport training.',
    getSchedule: (oneRMs = {}) => buildTBSchedule('fighter', [
      {name:'Squat', key:'squat'},
      {name:'Bench Press', key:'bench'},
      {name:'Deadlift', key:'deadlift'},
      {name:'Overhead Press', key:'ohp'},
    ], false, oneRMs),
  },
  {
    id: 'gladiator',
    name: 'Iron Volume',
    goal: 'Max Strength',
    days: 3,
    freq: '3x/week',
    color: ['#ea580c', '#7c2d12'],
    desc: 'High volume strength protocol — 5 sets instead of 3. For intermediate/advanced lifters. Week 6 uses a descending rep scheme. Retest every 6–12 weeks.',
    getSchedule: (oneRMs = {}) => buildTBSchedule('gladiator', [
      {name:'Squat', key:'squat'},
      {name:'Bench Press', key:'bench'},
      {name:'Deadlift', key:'deadlift'},
      {name:'Overhead Press', key:'ohp'},
    ], false, oneRMs),
  },
  {
    id: 'mass',
    name: 'Mass',
    goal: 'Hypertrophy + Strength',
    days: 3,
    freq: '3x/week',
    color: ['#7c3aed', '#4c1d95'],
    desc: 'Higher rep ranges (4x6) focused on size and strength. No minimum rest — keep rest short between sets. 3 days/week, 6-week wave.',
    getSchedule: (oneRMs = {}) => buildTBSchedule('mass', [
      {name:'Squat', key:'squat'},
      {name:'Bench Press', key:'bench'},
      {name:'Deadlift', key:'deadlift'},
      {name:'Overhead Press', key:'ohp'},
    ], false, oneRMs),
  },
  {
    id: 'greyman',
    name: 'Long Cycle',
    goal: 'Long-cycle Strength',
    days: 3,
    freq: '3x/week',
    color: ['#4b5563', '#1f2937'],
    desc: '12-week long-cycle protocol. Two 6-week blocks with progressively heavier loading. The most comprehensive percentage-based barbell program in the app.',
    getSchedule: (oneRMs = {}) => buildTBSchedule('greyman', [
      {name:'Squat', key:'squat'},
      {name:'Bench Press', key:'bench'},
      {name:'Deadlift', key:'deadlift'},
      {name:'Overhead Press', key:'ohp'},
    ], false, oneRMs),
  },
  {
    id: 'cardio',
    name: 'Cardio & Endurance',
    goal: 'Endurance',
    days: 5,
    freq: '5x/week',
    color: ['#db2777', '#9d174d'],
    desc: '5-day cardio plan mixing steady-state and interval training. Includes dedicated 12-3-30 treadmill days. Good for fat loss and building a Zone 2 base.',
    getSchedule: () => [
      { day: 'Monday / Friday — SBR (Strength + Base Run)', exercises: [
        {name:'Strength session (see TB protocol)', sets:1, reps:'complete', weight_key:null},
        {name:'Base Run 30–45 min', sets:1, reps:'complete', weight_key:null},
      ]},
      { day: 'Tuesday — 12-3-30 Treadmill', exercises: [
        {name:'12-3-30 Treadmill (12% incline, 3 mph, 30 min)', sets:1, reps:'30 min', weight_key:null, note:'Use the 12-3-30 timer in HR Monitor. Target Zone 2 heart rate throughout.'},
      ]},
      { day: 'Wednesday — DOP Circuit', exercises: [
        {name:'DOP Circuit (push-ups, pull-ups, dips)', sets:5, reps:10, weight_key:null},
        {name:'Core Work 10 min', sets:1, reps:'complete', weight_key:null},
      ]},
      { day: 'Thursday — Easy Run or 12-3-30', exercises: [
        {name:'Easy Run 30 min (conversational pace)', sets:1, reps:'complete', weight_key:null, note:'Or substitute 12-3-30 if you prefer low-impact'},
      ]},
      { day: 'Sunday — Active Recovery', exercises: [
        {name:'Light walk or mobility 20 min', sets:1, reps:'complete', weight_key:null},
        {name:'Stretching / foam roll', sets:1, reps:'complete', weight_key:null},
      ]},
    ],
  },
  {
    id: 'stronglifts',
    name: '5x5 Linear Progression',
    goal: 'Strength',
    days: 3,
    freq: '3x/week',
    color: ['#2563eb', '#1e40af'],
    desc: 'Classic beginner barbell program. 3 days/week, alternating Workout A and B. Squat every session, add 5 lbs each time.',
    getSchedule: (_, weights = {}) => [
      { day: 'Workout A — Squat / Bench / Row', exercises: [
        {name:'Squat',        sets:5, reps:5, weight_key:'sl_squat',    target_weight: weights.sl_squat    || 45},
        {name:'Bench Press',  sets:5, reps:5, weight_key:'sl_bench',    target_weight: weights.sl_bench    || 45},
        {name:'Barbell Row',  sets:5, reps:5, weight_key:'sl_row',      target_weight: weights.sl_row      || 45},
      ]},
      { day: 'Workout B — Squat / OHP / Deadlift', exercises: [
        {name:'Squat',          sets:5, reps:5, weight_key:'sl_squat',    target_weight: weights.sl_squat    || 45},
        {name:'Overhead Press', sets:5, reps:5, weight_key:'sl_ohp',      target_weight: weights.sl_ohp      || 45},
        {name:'Deadlift',       sets:1, reps:5, weight_key:'sl_deadlift', target_weight: weights.sl_deadlift || 135},
      ]},
    ],
  },
  {
    id: 'starting_strength',
    name: 'Barbell Foundations 3x5',
    goal: 'Strength',
    days: 3,
    freq: '3x/week',
    color: ['#ea580c', '#9a3412'],
    desc: 'A foundational barbell program for beginners. 3 days/week, two alternating workouts. Focus on the big 4 lifts with linear progression every session.',
    getSchedule: (_, weights = {}) => [
      { day: 'Workout A — Squat / Bench / Deadlift', exercises: [
        {name:'Squat',       sets:3, reps:5, weight_key:'ss_squat',    target_weight: weights.ss_squat    || 45},
        {name:'Bench Press', sets:3, reps:5, weight_key:'ss_bench',    target_weight: weights.ss_bench    || 45},
        {name:'Deadlift',    sets:1, reps:5, weight_key:'ss_deadlift', target_weight: weights.ss_deadlift || 135},
      ]},
      { day: 'Workout B — Squat / OHP / Deadlift', exercises: [
        {name:'Squat',          sets:3, reps:5, weight_key:'ss_squat',    target_weight: weights.ss_squat    || 45},
        {name:'Overhead Press', sets:3, reps:5, weight_key:'ss_ohp',      target_weight: weights.ss_ohp      || 45},
        {name:'Deadlift',       sets:1, reps:5, weight_key:'ss_deadlift', target_weight: weights.ss_deadlift || 135},
      ]},
    ],
  },
  {
    id: 'simple_sinister',
    name: 'Swing & Get-Up Daily',
    goal: 'Strength & Conditioning',
    days: 6,
    freq: 'Daily practice',
    color: ['#64748b', '#1e293b'],
    desc: 'Classic daily kettlebell practice. 100 one-arm swings + 10 Turkish get-ups every day. Goal: complete all swings under 5 min, all get-ups under 10 min.',
    getSchedule: (_, weights = {}) => [
      { day: 'Daily Practice', exercises: [
        {name:'KB One-Arm Swing',  sets:10, reps:10, note:'Alternate hands each set. 10 sets of 10 = 100 total. Goal: all 100 in under 5 min', weight_key:'kb_swing', target_weight: weights.kb_swing || 35},
        {name:'Turkish Get-Up',    sets:10, reps:1,  note:'5 per side, alternating. Goal: all 10 in under 10 min. Move slowly — own every position', weight_key:'kb_tgu', target_weight: weights.kb_tgu || 18},
      ]},
      { day: 'Light / Test Day (2x/week)', exercises: [
        {name:'KB One-Arm Swing',  sets:5, reps:10, note:'Light day — use a lighter bell or reduce sets', weight_key:'kb_swing', target_weight: weights.kb_swing || 35},
        {name:'Turkish Get-Up',    sets:6, reps:1,  note:'3 per side — practice the movement, do not grind', weight_key:'kb_tgu', target_weight: weights.kb_tgu || 18},
      ]},
    ],
  },
  {
    id: 'enter_kettlebell',
    name: 'KB Press Builder',
    goal: 'Strength',
    days: 5,
    freq: '5x/week',
    color: ['#b91c1c', '#7f1d1d'],
    desc: 'Pressing-focused kettlebell program. Clean & Press ladders build serious overhead strength. Goal: press half your bodyweight.',
    getSchedule: (_, weights = {}) => [
      { day: 'Press Day A — Clean & Press + Swing', exercises: [
        {name:'KB Clean & Press (Ladder 1-2-3)', sets:3, reps:6, note:'1 rep, rest, 2 reps, rest, 3 reps = 1 ladder. Do 3 ladders per side.', weight_key:'kb_press', target_weight: weights.kb_press || 26},
        {name:'KB Two-Hand Swing', sets:5, reps:20, note:'Hardstyle — hike, hinge, explode. Not a squat.', weight_key:'kb_swing2', target_weight: weights.kb_swing2 || 44},
      ]},
      { day: 'Variety Day — Swings + Get-Ups', exercises: [
        {name:'KB One-Arm Swing', sets:10, reps:10, note:'Program Minimum — 100 swings, alternate hands', weight_key:'kb_swing', target_weight: weights.kb_swing || 35},
        {name:'Turkish Get-Up',   sets:10, reps:1,  note:'5 per side — stay slow and deliberate', weight_key:'kb_tgu', target_weight: weights.kb_tgu || 18},
      ]},
      { day: 'Press Day B — Clean & Press + Swing', exercises: [
        {name:'KB Clean & Press (Ladder 1-2-3-4)', sets:3, reps:10, note:'Progress from A: add a rung when 3 ladders feels easy.', weight_key:'kb_press', target_weight: weights.kb_press || 26},
        {name:'KB Two-Hand Swing', sets:5, reps:20, note:'Match the weight from Press Day A', weight_key:'kb_swing2', target_weight: weights.kb_swing2 || 44},
      ]},
      { day: 'Variety Day B — Snatches', exercises: [
        {name:'KB Snatch', sets:10, reps:10, note:'10 per side. Build to 100 snatches in 5 min with 24kg (men) for ROP completion', weight_key:'kb_snatch', target_weight: weights.kb_snatch || 26},
      ]},
      { day: 'Press Day C — Heavy Day', exercises: [
        {name:'KB Clean & Press (Max Ladder)', sets:2, reps:15, note:'Go for your longest ladder today. 5 rungs = beast territory', weight_key:'kb_press', target_weight: weights.kb_press || 26},
        {name:'KB Two-Hand Swing', sets:3, reps:20, note:'Reduced volume on heavy press day', weight_key:'kb_swing2', target_weight: weights.kb_swing2 || 44},
      ]},
    ],
  },
  {
    id: 'kb_muscle',
    name: 'KB Muscle Gain',
    goal: 'Hypertrophy',
    days: 4,
    freq: '4x/week',
    color: ['#059669', '#064e3b'],
    desc: 'Double kettlebell hypertrophy program. Clean & Press, Front Squat, Row, and Swing for full-body muscle gain. Needs two matched bells.',
    getSchedule: (_, weights = {}) => [
      { day: 'Push — Double KB Press & Squat', exercises: [
        {name:'Double KB Clean & Press', sets:5, reps:5, note:'Clean to rack each rep. Full lockout overhead.', weight_key:'kb_dbl_press', target_weight: weights.kb_dbl_press || 26},
        {name:'Double KB Front Squat',   sets:5, reps:5, note:'Bells in rack position, squat to parallel or below.', weight_key:'kb_dbl_squat', target_weight: weights.kb_dbl_squat || 26},
        {name:'KB Push-Up (weighted vest or slow tempo)', sets:3, reps:10, note:'3-second descent, pause, explode up.', weight_key:null, target_weight:null},
      ]},
      { day: 'Pull — Double KB Row & Hinge', exercises: [
        {name:'Double KB Row',       sets:5, reps:5, note:'Hinge to 45 degrees, pull bells to hips.', weight_key:'kb_dbl_row', target_weight: weights.kb_dbl_row || 26},
        {name:'Double KB Deadlift',  sets:5, reps:5, note:'Both bells between feet. Hip hinge — not a squat.', weight_key:'kb_dbl_dl', target_weight: weights.kb_dbl_dl || 35},
        {name:'Pull-Ups / Chin-Ups', sets:3, reps:5, note:'Add KB hanging from feet if bodyweight is easy', weight_key:'kb_pullup', target_weight: weights.kb_pullup || 0},
      ]},
      { day: 'Conditioning — Swings & Carries', exercises: [
        {name:'KB Two-Hand Swing',  sets:10, reps:10, note:'100 swings. Power and speed.', weight_key:'kb_swing2', target_weight: weights.kb_swing2 || 44},
        {name:'KB Farmer Carry',    sets:4,  reps:1,  note:'Carry both bells 40-50 meters.', weight_key:'kb_dbl_press', target_weight: weights.kb_dbl_press || 26},
        {name:'KB Goblet Squat',    sets:3,  reps:10, note:'One bell at chest, squat deep.', weight_key:'kb_swing', target_weight: weights.kb_swing || 35},
      ]},
      { day: 'Full Body — Complexes', exercises: [
        {name:'KB Complex: Clean + Press + Squat + Row', sets:5, reps:5, note:'5 reps of each movement without setting the bell down = 1 set. Per side. Start light.', weight_key:'kb_press', target_weight: weights.kb_press || 26},
        {name:'Turkish Get-Up', sets:6, reps:1, note:'3 per side after the complex.', weight_key:'kb_tgu', target_weight: weights.kb_tgu || 26},
      ]},
    ],
  },
];

import { MIL_PROGRAMS, MIL_IDS } from './militaryPrograms';
PROGRAMS.push(...MIL_PROGRAMS);

export { MIL_IDS };
export const TB_IDS = ['operator', 'zulu', 'fighter', 'gladiator', 'mass', 'greyman'];
export const STANDALONE_IDS = ['stronglifts', 'starting_strength', 'cardio'];
export const KB_IDS = ['simple_sinister', 'enter_kettlebell', 'kb_muscle'];

export const LIFT_LABELS = {
  squat: 'Squat', bench: 'Bench Press', deadlift: 'Deadlift',
  ohp: 'Overhead Press', row: 'Barbell Row', pullups: 'Pull-ups (lbs added)',
};
