// Military fitness test standards — verified March 2026
// Sources: MCO 6100.13A, army.mil/aft, MyNavyHR Guide 5A, StewSmithFitness.com

// ── USMC PFT ─────────────────────────────────────────────────────────────────
// Max score: 300 pts (pull-ups) | 270 pts (push-ups, capped at 70 pts)
// Passing: 150 total, minimum 40 pts per event
// Tiers: 1st Class 235+, 2nd Class 200-234, 3rd Class 150-199

export const USMC_PFT = {
  pullUps: {
    unit: 'reps',
    note: 'Pull-ups preferred (100 pts max). Push-ups allowed but cap total at 270.',
    male: [
      { ageGroup: '17–20', min: 4,  max: 20 },
      { ageGroup: '21–25', min: 5,  max: 23 },
      { ageGroup: '26–30', min: 5,  max: 23 },
      { ageGroup: '31–35', min: 5,  max: 23 },
      { ageGroup: '36–40', min: 5,  max: 21 },
      { ageGroup: '41–45', min: 5,  max: 20 },
      { ageGroup: '46–50', min: 5,  max: 19 },
      { ageGroup: '51+',   min: 4,  max: 19 },
    ],
    female: [
      { ageGroup: '17–20', min: 1,  max: 7  },
      { ageGroup: '21–25', min: 3,  max: 11 },
      { ageGroup: '26–30', min: 4,  max: 12 },
      { ageGroup: '31–35', min: 3,  max: 11 },
      { ageGroup: '36–40', min: 3,  max: 10 },
      { ageGroup: '41–45', min: 2,  max: 8  },
      { ageGroup: '46–50', min: 2,  max: 6  },
      { ageGroup: '51+',   min: 2,  max: 4  },
    ],
  },
  plank: {
    unit: 'mm:ss',
    note: 'Same standard for all ages and genders.',
    allAges: { min: '1:10', max: '3:45' },
  },
  run3Mile: {
    unit: 'mm:ss (slower = fail)',
    male: [
      { ageGroup: '17–20', cutoff: '27:40', perfect: '18:00' },
      { ageGroup: '21–25', cutoff: '27:40', perfect: '18:00' },
      { ageGroup: '26–30', cutoff: '28:00', perfect: '18:00' },
      { ageGroup: '31–35', cutoff: '28:20', perfect: '18:00' },
      { ageGroup: '36–40', cutoff: '28:40', perfect: '18:00' },
      { ageGroup: '41–45', cutoff: '29:20', perfect: '18:30' },
      { ageGroup: '46–50', cutoff: '30:00', perfect: '19:00' },
      { ageGroup: '51+',   cutoff: '33:00', perfect: '19:30' },
    ],
    female: [
      { ageGroup: '17–20', cutoff: '30:50', perfect: '21:00' },
      { ageGroup: '21–25', cutoff: '30:50', perfect: '21:00' },
      { ageGroup: '26–30', cutoff: '31:10', perfect: '21:00' },
      { ageGroup: '31–35', cutoff: '31:30', perfect: '21:00' },
      { ageGroup: '36–40', cutoff: '31:50', perfect: '21:00' },
      { ageGroup: '41–45', cutoff: '32:30', perfect: '21:30' },
      { ageGroup: '46–50', cutoff: '33:30', perfect: '22:00' },
      { ageGroup: '51+',   cutoff: '36:00', perfect: '22:30' },
    ],
  },
};

// ── USMC CFT ─────────────────────────────────────────────────────────────────
// Max score: 300 pts | Passing: 150 total, min 45 pts per event
// Conducted in boots and MCCUU

export const USMC_CFT = {
  movementToContact: {
    unit: 'mm:ss (faster = better)',
    note: '880-yard run in boots and utilities.',
    male: [
      { ageGroup: '17–20', cutoff: '3:45', perfect: '2:40' },
      { ageGroup: '21–25', cutoff: '3:45', perfect: '2:38' },
      { ageGroup: '26–30', cutoff: '3:50', perfect: '2:40' },
      { ageGroup: '31–35', cutoff: '4:00', perfect: '2:45' },
      { ageGroup: '36–40', cutoff: '4:15', perfect: '2:50' },
    ],
    female: [
      { ageGroup: '17–20', cutoff: '5:00', perfect: '3:00' },
      { ageGroup: '21–25', cutoff: '5:00', perfect: '3:00' },
      { ageGroup: '26–30', cutoff: '5:15', perfect: '3:10' },
      { ageGroup: '31–35', cutoff: '5:20', perfect: '3:20' },
      { ageGroup: '36–40', cutoff: '5:30', perfect: '3:30' },
    ],
  },
  ammoCan: {
    unit: 'reps (more = better)',
    note: '30 lb ammo can, overhead press, 2-minute window.',
    male: [
      { ageGroup: '17–20', cutoff: 62,  perfect: 106 },
      { ageGroup: '21–25', cutoff: 67,  perfect: 115 },
      { ageGroup: '26–30', cutoff: 67,  perfect: 116 },
      { ageGroup: '31–35', cutoff: 67,  perfect: 120 },
      { ageGroup: '36–40', cutoff: 67,  perfect: 110 },
    ],
    female: [
      { ageGroup: '17–20', cutoff: 30,  perfect: 66 },
      { ageGroup: '21–25', cutoff: 30,  perfect: 74 },
      { ageGroup: '26–30', cutoff: 30,  perfect: 75 },
      { ageGroup: '31–35', cutoff: 30,  perfect: 72 },
      { ageGroup: '36–40', cutoff: 30,  perfect: 70 },
    ],
  },
  maneuverUnderFire: {
    unit: 'mm:ss (faster = better)',
    note: '300-yard timed shuttle: sprints, crawls, body drag, fireman carry, ammo carry.',
    male: [
      { ageGroup: '17–20', cutoff: '3:25', perfect: '2:05' },
      { ageGroup: '21–25', cutoff: '3:25', perfect: '2:05' },
      { ageGroup: '26–30', cutoff: '3:35', perfect: '2:10' },
      { ageGroup: '31–35', cutoff: '3:45', perfect: '2:15' },
      { ageGroup: '36–40', cutoff: '4:00', perfect: '2:25' },
    ],
    female: [
      { ageGroup: '17–20', cutoff: '4:40', perfect: '2:55' },
      { ageGroup: '21–25', cutoff: '4:40', perfect: '2:55' },
      { ageGroup: '26–30', cutoff: '4:50', perfect: '3:00' },
      { ageGroup: '31–35', cutoff: '5:00', perfect: '3:10' },
      { ageGroup: '36–40', cutoff: '5:15', perfect: '3:20' },
    ],
  },
};

// ── Army AFT (formerly ACFT — renamed Jun 2025, SPT removed) ─────────────────
// 5 events | 0–100 pts each | Min 60 pts per event
// General: 300/500 total | Combat MOS: 350/500 (sex-neutral male standards)

export const ARMY_AFT = {
  note: 'Standing Power Throw removed Jun 2025. 5 events remain.',
  deadlift: {
    unit: 'lbs (3-rep max)',
    male: [
      { ageGroup: '17–21', min60: 150, max100: 340 },
      { ageGroup: '22–26', min60: 150, max100: 340 },
      { ageGroup: '27–31', min60: 150, max100: 340 },
      { ageGroup: '32–36', min60: 140, max100: 320 },
    ],
    female: [
      { ageGroup: '17–21', min60: 120, max100: 270 },
      { ageGroup: '22–26', min60: 120, max100: 270 },
      { ageGroup: '27–31', min60: 110, max100: 250 },
      { ageGroup: '32–36', min60: 100, max100: 230 },
    ],
  },
  handReleasePushUps: {
    unit: 'reps (2 min)',
    male: [
      { ageGroup: '17–21', min60: 15, max100: 60 },
      { ageGroup: '22–26', min60: 15, max100: 60 },
      { ageGroup: '27–31', min60: 15, max100: 55 },
      { ageGroup: '32–36', min60: 12, max100: 50 },
    ],
    female: [
      { ageGroup: '17–21', min60: 10, max100: 50 },
      { ageGroup: '22–26', min60: 10, max100: 50 },
      { ageGroup: '27–31', min60: 10, max100: 45 },
      { ageGroup: '32–36', min60: 8,  max100: 40 },
    ],
  },
  sprintDragCarry: {
    unit: 'mm:ss (5×50m, 40lb kettlebells + 90lb sled)',
    male: [
      { ageGroup: '17–21', min60: '2:28', max100: '1:33' },
      { ageGroup: '22–26', min60: '2:28', max100: '1:33' },
      { ageGroup: '27–31', min60: '2:34', max100: '1:34' },
      { ageGroup: '32–36', min60: '2:40', max100: '1:38' },
    ],
    female: [
      { ageGroup: '17–21', min60: '2:54', max100: '1:48' },
      { ageGroup: '22–26', min60: '2:54', max100: '1:48' },
      { ageGroup: '27–31', min60: '3:00', max100: '1:52' },
      { ageGroup: '32–36', min60: '3:08', max100: '1:58' },
    ],
  },
  plank: {
    unit: 'mm:ss',
    note: 'Same standard for all ages and genders.',
    allAges: { min60: '1:30', max100: '4:20' },
  },
  run2Mile: {
    unit: 'mm:ss',
    male: [
      { ageGroup: '17–21', min60: '18:00', max100: '13:30' },
      { ageGroup: '22–26', min60: '18:00', max100: '13:30' },
      { ageGroup: '27–31', min60: '18:54', max100: '14:00' },
      { ageGroup: '32–36', min60: '19:30', max100: '14:30' },
    ],
    female: [
      { ageGroup: '17–21', min60: '21:00', max100: '15:30' },
      { ageGroup: '22–26', min60: '21:00', max100: '15:30' },
      { ageGroup: '27–31', min60: '22:00', max100: '16:00' },
      { ageGroup: '32–36', min60: '23:00', max100: '16:30' },
    ],
  },
};

// ── Navy PRT ─────────────────────────────────────────────────────────────────
// 3 events: push-ups (2 min), forearm plank, 1.5-mile run
// Curl-ups removed 2022. Two PRTs required per year as of Dec 2025.

export const NAVY_PRT = {
  pushUps: {
    unit: 'reps (2 min)',
    male: [
      { ageGroup: '17–19', min: 42, outstanding: 92 },
      { ageGroup: '20–24', min: 37, outstanding: 100 },
      { ageGroup: '25–29', min: 34, outstanding: 87 },
      { ageGroup: '30–34', min: 31, outstanding: 84 },
      { ageGroup: '35–39', min: 27, outstanding: 80 },
    ],
    female: [
      { ageGroup: '17–19', min: 19, outstanding: 51 },
      { ageGroup: '20–24', min: 16, outstanding: 48 },
      { ageGroup: '25–29', min: 13, outstanding: 46 },
      { ageGroup: '30–34', min: 11, outstanding: 44 },
      { ageGroup: '35–39', min: 9,  outstanding: 43 },
    ],
  },
  plank: {
    unit: 'mm:ss',
    male: [
      { ageGroup: '17–19', min: '1:11', outstanding: '3:24' },
      { ageGroup: '20–24', min: '1:10', outstanding: '3:24' },
      { ageGroup: '25–29', min: '1:09', outstanding: '3:16' },
      { ageGroup: '30–34', min: '1:07', outstanding: '3:12' },
      { ageGroup: '35–39', min: '1:06', outstanding: '3:08' },
    ],
    female: [
      { ageGroup: '17–19', min: '1:01', outstanding: '3:14' },
      { ageGroup: '20–24', min: '1:00', outstanding: '3:10' },
      { ageGroup: '25–29', min: '0:59', outstanding: '3:06' },
      { ageGroup: '30–34', min: '0:58', outstanding: '3:02' },
      { ageGroup: '35–39', min: '0:56', outstanding: '2:59' },
    ],
  },
  run1_5Mile: {
    unit: 'mm:ss (slower = fail)',
    male: [
      { ageGroup: '17–19', cutoff: '12:45', outstanding: '8:15' },
      { ageGroup: '20–24', cutoff: '13:30', outstanding: '8:30' },
      { ageGroup: '25–29', cutoff: '14:00', outstanding: '8:55' },
      { ageGroup: '30–34', cutoff: '14:30', outstanding: '9:20' },
      { ageGroup: '35–39', cutoff: '15:00', outstanding: '9:25' },
    ],
    female: [
      { ageGroup: '17–19', cutoff: '15:00', outstanding: '9:29'  },
      { ageGroup: '20–24', cutoff: '15:30', outstanding: '9:47'  },
      { ageGroup: '25–29', cutoff: '16:08', outstanding: '10:17' },
      { ageGroup: '30–34', cutoff: '16:45', outstanding: '10:46' },
      { ageGroup: '35–39', cutoff: '17:00', outstanding: '10:51' },
    ],
  },
};

// ── BUD/S PST & MARSOC A&S ────────────────────────────────────────────────────

export const SELECTION_STANDARDS = {
  buds_pst: {
    name: 'Navy SEAL BUD/S PST',
    note: 'Meeting minimums gets DEP entry, not BUD/S selection. Target competitive scores.',
    events: [
      { name: '500-yd Swim (breast/side)',    unit: 'mm:ss', minimum: '12:30', competitive: '10:30', optimum: 'sub 8:00' },
      { name: 'Push-ups (2 min)',             unit: 'reps',  minimum: 50,      competitive: 79,      optimum: '80-100+' },
      { name: 'Sit-ups (2 min)',              unit: 'reps',  minimum: 50,      competitive: 79,      optimum: '80-100+' },
      { name: 'Pull-ups (dead hang, no time)',unit: 'reps',  minimum: 10,      competitive: 11,      optimum: '20+' },
      { name: '1.5-mi Run (boots & pants)',   unit: 'mm:ss', minimum: '10:30', competitive: '10:20', optimum: 'sub 9:30' },
    ],
  },
  marsoc_as: {
    name: 'MARSOC A&S (Marine Raiders)',
    note: 'Phase 1 is 23 days. Ruck events are primary discriminator.',
    requirements: [
      { name: 'USMC PFT minimum',    standard: '235 points' },
      { name: 'Ruck marches',        standard: '8–12 mi @ 45+ lb, sub-12 min/mile competitive' },
      { name: 'Swim (MRC phase)',     standard: '2,000m fin swim with 45-lb ruck, 60-min cutoff' },
      { name: 'Water survival',       standard: 'Tread 11 min in uniform, 4 min flotation' },
    ],
  },
};

// ── Ruck March Benchmarks ─────────────────────────────────────────────────────

export const RUCK_BENCHMARKS = [
  { name: 'Army EIB Tactical March', distance: '12 mi', weight: '35 lb', cutoff: '3:00:00', pace: '15:00/mi' },
  { name: 'RASP (Ranger Assessment)', distance: '12 mi', weight: '35 lb', cutoff: '3:00:00', pace: '15:00/mi' },
  { name: 'Ranger School Prep',       distance: '12 mi', weight: '50 lb', cutoff: '2:45:00', pace: '13:45/mi' },
  { name: 'SF Prep (competitive)',    distance: '12 mi', weight: '45 lb', cutoff: '2:20:00', pace: '11:40/mi' },
  { name: 'MARSOC A&S competitive',  distance: '12 mi', weight: '45 lb', cutoff: '2:24:00', pace: '12:00/mi' },
];
