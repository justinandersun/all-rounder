# All-Rounder v2 Requirements
1. Reduce the test from 15 events to 10. The official events should be: Squat, Bench, Deadlift, Pullups, Pushups, Plank, Broad Jump, 300-Yard Shuttle, 1.5-Mile Run, and Half-Mile Swim.
2. Make every event worth exactly 10 points. Remove the current 10/5/1 hierarchy and completion bonus. The test should total exactly 100 points from 10 events × 10 points.
3. Remove the old events entirely. Eliminate Overhead Press, Dead Hang, Farmer Carry, Deep Squat, Floor Rise, and Single-Leg Balance.
4. Change the grading vocabulary. Replace the current interpretations with:
   - A — Advanced
   - B — Intermediate
   - C — Beginner
   - D — Underperforming
5. Add demographic inputs to the calculator. The calculator should collect:
   - age
   - sex
   - bodyweight
6. Do not apply age, sex, and bodyweight uniformly to every event. Each event should use only variables justified by its underlying norms:
   - Squat / Bench / Deadlift: bodyweight + sex, with age adjustment if supported
   - Pullups: age + sex
   - Pushups: age + sex
   - Plank: age + sex
   - Broad Jump: sex + age
   - Shuttle: sex + age
   - Run: sex + age
   - Swim: sex + age
   Bodyweight should not make running, swimming, or shuttle standards easier.
7. Use four performance anchors within each event. Each event should have benchmark levels corresponding to:
   - Advanced
   - Intermediate
   - Beginner
   - Underperforming
   The scoring function should interpolate those performances onto the 0–10 scale rather than treating only one benchmark as “full credit.”
8. Treat 10 points as the Advanced benchmark. A user meeting or exceeding the Advanced threshold gets 10/10. Performance beyond it produces no bonus points.
9. Define the barbell tests as 3-rep tests. Squat, bench, and deadlift scores should use the heaviest load successfully completed for three clean consecutive reps. One or two reps at a heavier weight do not count.
10. Define Pullups as maximum consecutive strict reps. No time limit. Full dead hang to chin clearly above the bar, without kipping.
11. Define Pushups as a timed test: Maximum reps in 2 minutes with hand-release.
12. Define Plank as maximum hold time. Use a strict forearm plank and stop the clock when the athlete can no longer maintain the required position.
13. Define Broad Jump as maximum distance. Use a two-foot standing takeoff, allow arm swing, give three attempts, and record the best valid jump measured to the nearest heel.
14. Keep the 300-Yard Shuttle rather than replacing it with a sprint. It provides a distinct anaerobic/change-of-direction test alongside the broad jump, run, and swim.
15. Continue using the 1.5-mile run and half-mile swim as timed events. Lower time = better score. Exact 0–10 scoring bands should come from the demographic benchmark work rather than the old fixed decrement formulas.
16. Require all ten events to occur within ten hours. The user can perform them in any order for a personal attempt. Do not require them to be performed consecutively.
17. Publish a recommended order without requiring it for personal attempts. I’d display:
- Broad Jump
- Pullups
- Squat
- Bench
- Deadlift
- Pushups
- Plank
- 300-Yard Shuttle
- 1.5-Mile Run
- Half-Mile Swim
18. Require all ten events for an official score/grade. If any event is skipped, show the result as Incomplete, rather than calculating a misleading letter grade from nine events.
19. Move the test/calculator substantially higher on the page. The current live version still leads with substantial “Why It Matters” and “How It Works” copy before the actual standard. all-rounder-five.vercel.app I’d make the hierarchy:
    - Hero
    - demographic inputs
    - personalized 10-event test
    - score/grade
    - explanation
    - methodology/sources/disclaimer as one condensed section
20. Shorten the hero to the essential proposition. Something like:
   The All-Rounder
   A General Physical Fitness Test
   10 events. 10 hours. 100 points.
   Then one sentence explaining that it measures broad physical capability rather than specialization.
21. Make the personalized standards the main visual object. After entering demographics, the user should immediately see all ten personalized Advanced / Intermediate / Beginner benchmarks, not merely one generic target.
22. Allow users to enter actual performance directly beside each benchmark. As they enter results, calculate:
    - event score /10
    - running total /100
    - current overall grade
   This should feel like a scorecard rather than just a reference table.
23. Show the user where they sit within each event. For example:
    - Bench: 8/10 · Intermediate
    - Run: 5/10 · Beginner
    - Swim: 9/10 · Advanced
24. Rewrite the methodology around the new model. The current copy says the test represents a single fixed intermediate standard and does not adjust downward with age. Explain instead that benchmarks are calibrated by relevant demographic variables using published norms and performance standards where available.
25. Remove outdated references from the methodology. In particular, the current rationale emphasizes floor-rise and single-leg-balance research even though those events would no longer be part of the test. Replace them with evidence supporting the actual ten events and the broader domains they measure.
26. Keep the disclaimer. The current language correctly says the All-Rounder is independently developed, has not been clinically validated as a complete fitness assessment, and is not a medical diagnostic.
27. Add concise expandable rules for every event. Each row should have a “Rules” disclosure covering valid reps, attempts, equipment, timing, and failure conditions. This becomes especially important now that people may compare scores.
28. Design the benchmark data as configuration, not hardcoded UI logic. Age bands, sex categories, scoring anchors, and event rules are still going to evolve as we finish the evidence review. Put those values in one structured data layer so calibration changes don’t require rewriting the application.
30. Version the standard. Display something subtle like All-Rounder Standard v0.2. Once people begin saving/comparing scores, changing benchmarks silently will become problematic. A score of 78 under one scoring model needs to remain identifiable as such.
31. Update the UI. Make it cleaner. Make the background a topographic map. Remove unnecessary borders.

The biggest conceptual change is that the app should stop being “Can you meet these ten fixed benchmarks?” and become:
“Given your age, sex, and body size where relevant, how advanced is your general physical fitness across ten distinct capacities?”