// The All-Rounder Standard: every benchmark, band, and rule lives here.
//
// Calibration changes belong in this file only. If a change alters how any
// performance would score, bump `version` so previously shared results stay
// identifiable as belonging to the older model.
//
// Anchor arrays are always ordered [advanced, intermediate, beginner, unfit].
// Times may be written as "M:SS" strings or as seconds; distances are in inches.
//
// STATUS: provisional. Seed values are adapted from public age- and sex-normed
// tables (see `sources`) pending the full evidence review. Broad jump and
// shuttle anchors have the thinnest published norms and are lowest-confidence.
(function (root) {
  "use strict";

  const STANDARD = {
    version: "1.3",
    status: "provisional",
    timeWindowHours: 10,

    scoring: {
      maxPoints: 10,
      // Points awarded at exactly each anchor; performance is interpolated
      // linearly between anchors. Below Unfit, scores taper to 0 at
      // one further Beginner-to-Unfit gap (or an event's `zeroAt`).
      anchorPoints: { advanced: 10, intermediate: 7.5, beginner: 5, unfit: 2.5 },
    },

    levels: [
      { id: "advanced", label: "Advanced", short: "Adv" },
      { id: "intermediate", label: "Intermediate", short: "Int" },
      { id: "beginner", label: "Beginner", short: "Beg" },
      { id: "unfit", label: "Unfit", short: "Unfit" },
    ],

    // Anchors shown on the scorecard, left to right. Unfit still
    // scores and labels results; it just isn't shown as a target.
    scorecardLevels: ["beginner", "intermediate", "advanced"],

    grades: [
      { min: 90, grade: "A", label: "Advanced" },
      { min: 70, grade: "B", label: "Intermediate" },
      { min: 50, grade: "C", label: "Beginner" },
      { min: -Infinity, grade: "D", label: "Unfit" },
    ],

    // `blend` sexes have no anchors of their own: each anchor is the mean of
    // the listed sexes' anchors.
    sexes: [
      { id: "male", label: "Male" },
      { id: "female", label: "Female" },
      { id: "other", label: "Other", blend: ["male", "female"] },
    ],

    ageBands: [
      { id: "18-29", min: 18, max: 29 },
      { id: "30-39", min: 30, max: 39 },
      { id: "40-49", min: 40, max: 49 },
      { id: "50-59", min: 50, max: 59 },
      { id: "60+", min: 60, max: 120 },
    ],

    bodyweightLbs: { min: 80, max: 500 },

    // Listed in the scorecard order. Any order is allowed for a personal
    // attempt, but all events must fall within `timeWindowHours`.
    events: [
      {
        id: "broad_jump",
        name: "Broad Jump",
        protocol: "Best of 3 jumps",
        direction: "higher",
        input: "feet_inches",
        variables: ["sex", "age"],
        model: "table",
        // Inches. Female ≈ 82% of male; age decline ≈ 5–7% per decade after 30.
        anchors: {
          male: {
            "18-29": [102, 90, 78, 66],
            "30-39": [98, 86, 74, 62],
            "40-49": [92, 80, 68, 56],
            "50-59": [86, 74, 62, 50],
            "60+": [78, 66, 54, 42],
          },
          female: {
            "18-29": [84, 72, 61, 50],
            "30-39": [80, 69, 58, 47],
            "40-49": [75, 64, 54, 43],
            "50-59": [70, 59, 49, 39],
            "60+": [63, 53, 43, 34],
          },
        },
        rules: [
          "Stand behind the line and jump forward off both feet. Swing your arms, but don't step or hop first.",
          "Land on both feet and hold it. Falling back or putting a hand down doesn't count.",
          "Measure from the line to the back of your nearest heel.",
          "Take three jumps and record your best.",
        ],
        sources: ["norms_broad_jump"],
      },
      {
        id: "pullups",
        name: "Pullups",
        protocol: "Max consecutive reps",
        direction: "higher",
        input: "reps",
        variables: ["sex", "age"],
        model: "table",
        // Adapted from USMC PFT pull-up scales (dead hang, no kip).
        anchors: {
          male: {
            "18-29": [18, 12, 6, 2],
            "30-39": [16, 10, 5, 2],
            "40-49": [14, 9, 4, 1],
            "50-59": [12, 7, 3, 1],
            "60+": [9, 5, 3, 1],
          },
          female: {
            "18-29": [10, 6, 3, 1],
            "30-39": [9, 5, 2, 1],
            "40-49": [8, 4, 2, 1],
            "50-59": [6, 3, 2, 1],
            "60+": [5, 3, 2, 1],
          },
        },
        rules: [
          "Start each rep from a dead hang with your arms straight.",
          "Pull until your chin clears the bar. Use any grip.",
          "Don't kip, swing, or kick.",
          "Do as many as you can in one set. There's no time limit, but the set ends if you let go.",
        ],
        sources: ["usmc_pft"],
      },
      {
        id: "pushups",
        name: "Pushups",
        protocol: "Max reps in 2 minutes",
        direction: "higher",
        input: "reps",
        variables: ["sex", "age"],
        model: "table",
        // Adapted from Army ACFT/AFT and Air Force hand-release push-up tables.
        anchors: {
          male: {
            "18-29": [55, 40, 25, 12],
            "30-39": [52, 37, 22, 10],
            "40-49": [47, 33, 19, 8],
            "50-59": [42, 28, 15, 6],
            "60+": [36, 23, 12, 5],
          },
          female: {
            "18-29": [45, 30, 17, 8],
            "30-39": [42, 28, 15, 7],
            "40-49": [38, 25, 13, 6],
            "50-59": [34, 21, 11, 5],
            "60+": [28, 17, 9, 4],
          },
        },
        rules: [
          "Start in a high plank with your hands at shoulder width.",
          "Lower your chest to the floor, lift both hands, put them back, and press up to straight arms.",
          "Keep your body straight. Reps with sagging hips or knees down don't count.",
          "Do as many as you can in 2 minutes. Rest only in the up position.",
        ],
        sources: ["army_aft", "usaf_pfa"],
      },
      {
        id: "plank",
        name: "Plank",
        protocol: "Max forearm hold time",
        direction: "higher",
        input: "time",
        variables: ["sex", "age"],
        model: "table",
        // Adapted from Army ACFT/AFT and Air Force forearm-plank tables. Those
        // scales barely differ by sex, so the male and female anchors are close.
        anchors: {
          male: {
            "18-29": ["3:30", "2:30", "1:30", "0:45"],
            "30-39": ["3:25", "2:25", "1:28", "0:45"],
            "40-49": ["3:20", "2:20", "1:25", "0:40"],
            "50-59": ["3:10", "2:10", "1:20", "0:40"],
            "60+": ["3:00", "2:00", "1:15", "0:35"],
          },
          female: {
            "18-29": ["3:25", "2:25", "1:28", "0:45"],
            "30-39": ["3:20", "2:20", "1:25", "0:45"],
            "40-49": ["3:15", "2:15", "1:22", "0:40"],
            "50-59": ["3:05", "2:05", "1:18", "0:40"],
            "60+": ["2:55", "1:55", "1:12", "0:35"],
          },
        },
        rules: [
          "Hold a forearm plank with your elbows under your shoulders and your body straight.",
          "Start the clock once you're in position.",
          "Stop the clock when your hips sag or pike, a knee touches down, or your arms or feet move.",
          "Take one attempt, with no resets.",
        ],
        sources: ["army_aft", "usaf_pfa"],
      },
      {
        id: "bench",
        name: "Bench Press",
        protocol: "Heaviest 3-rep max",
        direction: "higher",
        input: "lbs",
        variables: ["sex", "bodyweight", "age"],
        model: "bodyweight_ratio",
        ratios: {
          male: [1.25, 0.95, 0.7, 0.45],
          female: [0.8, 0.6, 0.4, 0.25],
        },
        sources: ["strength_standards", "aom_strength"],
        rules: [
          "Record the heaviest weight you press for 3 clean reps in a row.",
          "Touch the bar to your chest without bouncing it, then lock out your elbows.",
          "Keep your head, shoulders, and glutes on the bench and your feet on the floor.",
          "Use a spotter. If the spotter touches the bar, the set doesn't count.",
        ],
      },
      {
        id: "squat",
        name: "Squat",
        protocol: "Heaviest 3-rep max",
        direction: "higher",
        input: "lbs",
        variables: ["sex", "bodyweight", "age"],
        model: "bodyweight_ratio",
        // 3-rep loads as a multiple of bodyweight (≈93% of 1RM standards).
        ratios: {
          male: [1.75, 1.35, 1.0, 0.65],
          female: [1.3, 1.0, 0.7, 0.45],
        },
        sources: ["strength_standards", "aom_strength"],
        rules: [
          "Record the heaviest weight you squat for 3 clean reps in a row.",
          "Squat until your hip crease is below the top of your knee, then stand all the way up.",
          "Use a barbell back squat. A belt is fine; knee wraps and squat suits aren't.",
          "Use safety arms or a spotter. Any help voids the set.",
        ],
      },
      {
        id: "deadlift",
        name: "Deadlift",
        protocol: "Heaviest 3-rep max",
        direction: "higher",
        input: "lbs",
        variables: ["sex", "bodyweight", "age"],
        model: "bodyweight_ratio",
        ratios: {
          male: [2.0, 1.6, 1.2, 0.8],
          female: [1.6, 1.2, 0.9, 0.6],
        },
        sources: ["strength_standards", "aom_strength", "army_aft"],
        rules: [
          "Record the heaviest weight you pull for 3 clean reps in a row.",
          "Use a straight barbell, conventional or sumo. Let the plates settle on the floor between reps.",
          "Stand fully upright at the top. Don't hitch the bar up your thighs.",
          "A belt and chalk are fine; straps aren't.",
        ],
      },
      {
        id: "shuttle",
        name: "Shuttle",
        distance: "300-Yard",
        protocol: "6 round trips of 25 yards",
        direction: "lower",
        input: "seconds",
        variables: ["sex", "age"],
        model: "table",
        // Seconds. Built from coaching and occupational norms; lowest-confidence event.
        anchors: {
          male: {
            "18-29": [60, 67, 75, 85],
            "30-39": [62, 69, 78, 88],
            "40-49": [65, 73, 82, 93],
            "50-59": [69, 78, 88, 100],
            "60+": [75, 85, 96, 110],
          },
          female: {
            "18-29": [67, 75, 84, 95],
            "30-39": [69, 78, 87, 98],
            "40-49": [73, 82, 92, 104],
            "50-59": [78, 88, 99, 112],
            "60+": [85, 96, 108, 123],
          },
        },
        rules: [
          "Mark two lines 25 yards apart and run 6 round trips (300 yards).",
          "Touch each line with your foot.",
          "Start standing. Stop the clock when you cross the line on the last leg.",
          "Take one attempt.",
        ],
        sources: ["norms_shuttle"],
      },
      {
        id: "run",
        name: "Run",
        distance: "1.5-Mile",
        protocol: "Fastest time",
        direction: "lower",
        input: "time",
        variables: ["sex", "age"],
        model: "table",
        // Adapted from Air Force PFA run charts and Cooper Institute norms.
        anchors: {
          male: {
            "18-29": ["9:45", "11:30", "13:30", "15:30"],
            "30-39": ["10:15", "12:00", "14:00", "16:00"],
            "40-49": ["10:50", "12:40", "14:50", "17:00"],
            "50-59": ["11:40", "13:40", "16:00", "18:20"],
            "60+": ["12:45", "15:00", "17:30", "20:00"],
          },
          female: {
            "18-29": ["11:15", "13:15", "15:30", "17:45"],
            "30-39": ["11:45", "13:50", "16:10", "18:30"],
            "40-49": ["12:30", "14:40", "17:00", "19:30"],
            "50-59": ["13:30", "15:50", "18:20", "21:00"],
            "60+": ["14:45", "17:15", "20:00", "23:00"],
          },
        },
        rules: [
          "Run 1.5 miles on a flat, measured course: 6 laps of a 400 m track plus 14 m.",
          "On a treadmill, set at least a 1% incline and don't hold the rails.",
          "Walk if you need to; the clock keeps running.",
          "Take one attempt.",
        ],
        sources: ["usaf_pfa", "cooper"],
      },
      {
        id: "swim",
        name: "Swim",
        distance: "Half-Mile",
        protocol: "Fastest time",
        direction: "lower",
        input: "time",
        variables: ["sex", "age"],
        model: "table",
        // Scaled from Navy PRT 500-yd swim charts to 880 yd.
        anchors: {
          male: {
            "18-29": ["14:00", "17:30", "22:00", "27:00"],
            "30-39": ["14:45", "18:20", "23:00", "28:20"],
            "40-49": ["15:30", "19:15", "24:10", "29:45"],
            "50-59": ["16:30", "20:30", "25:45", "31:40"],
            "60+": ["18:00", "22:30", "28:00", "34:30"],
          },
          female: {
            "18-29": ["15:00", "18:50", "23:40", "29:00"],
            "30-39": ["15:50", "19:45", "24:45", "30:25"],
            "40-49": ["16:40", "20:45", "26:00", "32:00"],
            "50-59": ["17:45", "22:05", "27:40", "34:00"],
            "60+": ["19:20", "24:10", "30:10", "37:00"],
          },
        },
        rules: [
          "Swim 880 yards (about 805 m) using any stroke.",
          "Rest at the walls if you need to, but don't push off the bottom or hold the lane line.",
          "Don't use fins, paddles, pull buoys, or snorkels.",
          "Take one attempt. The clock runs nonstop.",
        ],
        sources: ["navy_prt"],
      },
    ],

    // Age factor applied to bodyweight-ratio anchors (gentle masters-style taper).
    ageFactors: { "18-29": 1, "30-39": 1, "40-49": 0.93, "50-59": 0.85, "60+": 0.76 },
    roundLoadsTo: 5,

    sources: [
      { id: "army_aft", citation: "U.S. Army. <em>FM 7-22, Holistic Health and Fitness</em>, and Army Combat Fitness Test / Army Fitness Test scoring scales (3RM deadlift, hand-release push-up, plank).", url: "https://www.army.mil/aft/" },
      { id: "usaf_pfa", citation: "U.S. Air Force. Physical Fitness Assessment scoring charts, DAFMAN 36-2905 (1.5-mile run, hand-release push-up, forearm plank).", url: "https://www.afpc.af.mil/Career-Management/Fitness-Program/" },
      { id: "usmc_pft", citation: "U.S. Marine Corps. Physical Fitness Test scoring tables, MCO 6100.13 (pull-ups).", url: "https://www.fitness.marines.mil/PFT-CFT_Standards17/" },
      { id: "navy_prt", citation: "U.S. Navy. Physical Readiness Test scoring tables, OPNAVINST 6110.1 (500-yard swim).", url: "https://www.mynavyhr.navy.mil/Support-Services/Readiness-and-Resilience/Physical-Readiness/" },
      { id: "cooper", citation: "The Cooper Institute. Fitness norms for the 1.5-mile run, and &ldquo;Fitness Norms and Fitness Standards are Apples and Oranges.&rdquo;", url: "https://www.cooperinstitute.org/" },
      { id: "strength_standards", citation: "Published bodyweight-relative strength standards for the squat, bench press, and deadlift (e.g., ExRx.net strength standards).", url: "https://exrx.net/Testing/WeightLifting/StrengthStandards" },
      { id: "aom_strength", citation: "McKay, Brett &amp; Kate, with Matt Reynolds. &ldquo;How Much Ya Bench? Strength Benchmarks for Men.&rdquo; <em>The Art of Manliness</em>, 2021.", url: "https://www.artofmanliness.com/strength/fitness/strength-benchmarks-for-men/" },
      { id: "norms_broad_jump", citation: "Topend Sports. &ldquo;Standing Long (Broad) Jump Test&rdquo; normative tables (provisional; under review).", url: "https://www.topendsports.com/testing/tests/longjump.htm" },
      { id: "norms_shuttle", citation: "Topend Sports. &ldquo;300-yard Shuttle&rdquo; test description and norms (provisional; under review).", url: "https://www.topendsports.com/testing/tests/shuttle-300yard.htm" },
      { id: "kodama", citation: "Kodama, S., et al. &ldquo;Cardiorespiratory Fitness as a Quantitative Predictor of All-Cause Mortality and Cardiovascular Events in Healthy Men and Women.&rdquo; <em>JAMA</em>, 2009; 301(19):2024&ndash;2035.", url: "https://doi.org/10.1001/jama.2009.681" },
      { id: "mandsager", citation: "Mandsager, K., et al. &ldquo;Association of Cardiorespiratory Fitness With Long-term Mortality Among Adults Undergoing Exercise Treadmill Testing.&rdquo; <em>JAMA Network Open</em>, 2018; 1(6):e183605.", url: "https://doi.org/10.1001/jamanetworkopen.2018.3605" },
      { id: "garcia_hermoso", citation: "Garc&iacute;a-Hermoso, A., et al. &ldquo;Muscular Strength as a Predictor of All-Cause Mortality in an Apparently Healthy Population.&rdquo; <em>Archives of Physical Medicine and Rehabilitation</em>, 2018; 99(10):2100&ndash;2113.", url: "https://doi.org/10.1016/j.apmr.2018.01.008" },
      { id: "yang", citation: "Yang, J., et al. &ldquo;Association Between Push-up Exercise Capacity and Future Cardiovascular Events Among Active Adult Men.&rdquo; <em>JAMA Network Open</em>, 2019; 2(2):e188341.", url: "https://doi.org/10.1001/jamanetworkopen.2018.8341" },
    ],
  };

  if (typeof module !== "undefined" && module.exports) module.exports = STANDARD;
  else root.ALL_ROUNDER_STANDARD = STANDARD;
})(typeof window !== "undefined" ? window : globalThis);
