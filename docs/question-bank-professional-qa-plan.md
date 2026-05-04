# Question Bank Professional QA Plan (Planning-Only)

Scope: planning artifact only.  
No question banks, metadata, or taxonomies were modified.

## Global QA Standard (All Subjects)
- Expected grades: define supported grade band explicitly per subject (G1-G6 if active).
- Difficulty levels: minimum `easy`, `medium`, `hard`; optional `adaptive` flags if used.
- Required metadata:
  - `subject`
  - `grade`
  - `topic`
  - `subtopic`
  - `difficulty`
  - unique question ID
  - answer schema (`single_choice` / `multi_choice` / `open` where applicable)
  - source/revision fields for traceability
- Required answer checks:
  - one canonical correct answer (or documented multi-correct policy)
  - answer key consistency with prompt wording
  - deterministic scoring behavior
- Required distractor checks:
  - plausible but clearly incorrect
  - no duplicate distractors
  - no distractor that can be interpreted as partially correct unless explicitly allowed
- Required Hebrew wording checks:
  - age-appropriate Hebrew
  - no ambiguous pronouns
  - no robotic/translated phrasing
  - clean RTL punctuation and numerals
- Required pedagogic checks:
  - progression from foundational to advanced
  - no hidden prerequisite jumps
  - alignment with expected curriculum outcomes
- Sample size recommendation:
  - minimum 120-item review per subject for launch gate
  - include at least 20 items per active grade segment
  - include at least 10 items per high-risk topic/subtopic

## Subject QA Plans

## Math
- Expected grades: G1-G6
- Expected topics: number sense, operations, fractions, decimals, word problems, basic geometry crossover
- Expected subtopics: place value, addition/subtraction strategies, multiplication/division fluency, fraction comparison, ratio basics
- Difficulty levels: easy/medium/hard by grade
- Required metadata: include operation type and representation type (symbolic/verbal/visual)
- Required answer checks: verify arithmetic determinism and unit correctness
- Required distractor checks: common-error distractors only (carry/borrow/place-value mistakes), never random noise
- Required Hebrew wording checks: concise instructions, no overloaded sentence structure
- Required pedagogic checks: concept-before-speed ordering
- Sample size recommendation: 150 items (launch gate)
- Launch blockers:
  - missing grade-topic coverage map
  - >3% answer key defects in audit sample
  - high ambiguity in wording
- Non-blocking polish items:
  - improve contextual story diversity
  - normalize terminology across grades

## Geometry
- Expected grades: G2-G6
- Expected topics: shapes, angles, perimeter, area, spatial reasoning, symmetry
- Expected subtopics: polygon identification, angle classification, perimeter formulas, area counting/modeling
- Difficulty levels: easy/medium/hard by grade
- Required metadata: figure type, visual dependency, formula dependency
- Required answer checks: numeric and conceptual correctness against diagram assumptions
- Required distractor checks: reflect real misconceptions (area/perimeter confusion)
- Required Hebrew wording checks: explicit directional language in RTL layout
- Required pedagogic checks: visual literacy progression
- Sample size recommendation: 120 items
- Launch blockers:
  - diagram-dependent items lacking clear textual fallback
  - frequent area/perimeter labeling ambiguity
- Non-blocking polish items:
  - broaden real-world geometry contexts
  - improve visual consistency notes

## Hebrew
- Expected grades: G1-G6
- Expected topics: comprehension, vocabulary, grammar, spelling, sentence completion
- Expected subtopics: root patterns (where relevant), tense agreement, reading comprehension inference
- Difficulty levels: easy/medium/hard by grade and language level
- Required metadata: language-domain tag (grammar/comprehension/vocab), text length bucket
- Required answer checks: grammar agreement, orthography correctness, accepted variants policy
- Required distractor checks: linguistically plausible distractors without accidental correctness
- Required Hebrew wording checks: native-grade fluency, no machine-like text, no unnatural punctuation
- Required pedagogic checks: supports comprehension-first and gradual grammar depth
- Sample size recommendation: 180 items
- Launch blockers:
  - non-native phrasing prevalence
  - mismatch between correct answer and accepted Hebrew variants
- Non-blocking polish items:
  - improve stylistic consistency across units
  - expand culturally familiar examples

## English
- Expected grades: G3-G6 (or active configured band)
- Expected topics: vocabulary, grammar, reading comprehension, sentence structure
- Expected subtopics: tense, subject-verb agreement, prepositions, short passage inference
- Difficulty levels: easy/medium/hard by grade
- Required metadata: CEFR-like internal band or equivalent level marker
- Required answer checks: grammar correctness and context fit
- Required distractor checks: common learner mistakes, avoid trick distractors
- Required Hebrew wording checks: Hebrew instruction clarity for bilingual tasks
- Required pedagogic checks: balance between form and meaning
- Sample size recommendation: 130 items
- Launch blockers:
  - grade-level lexical mismatch
  - inconsistent answer rubric for close synonyms
- Non-blocking polish items:
  - increase topical variety
  - improve distractor naturalness

## Science
- Expected grades: G3-G6
- Expected topics: life science, matter, energy, earth/environment, scientific thinking
- Expected subtopics: states of matter, simple ecosystems, force/motion basics, observation vs conclusion
- Difficulty levels: easy/medium/hard by grade
- Required metadata: concept family + misconception tag
- Required answer checks: factual accuracy and age-appropriate simplification
- Required distractor checks: misconception-based distractors, no outdated science facts
- Required Hebrew wording checks: clear term explanations for technical vocabulary
- Required pedagogic checks: concept grounding before terminology load
- Sample size recommendation: 120 items
- Launch blockers:
  - factual inaccuracies
  - concept-grade mismatch
- Non-blocking polish items:
  - add more experiment-context prompts
  - increase cross-topic integration items

## Homeland / Geography
- Expected grades: G3-G6
- Expected topics: maps, regions, population/environment, national context, basic civic-geographic literacy
- Expected subtopics: direction/map symbols, geographic features, locality vs country scale, human-environment connection
- Difficulty levels: easy/medium/hard by grade
- Required metadata: map-literacy tag, regional context tag
- Required answer checks: geographic fact correctness and map interpretation validity
- Required distractor checks: plausible location/feature confusion without ambiguity
- Required Hebrew wording checks: unambiguous place naming and prepositions
- Required pedagogic checks: local-to-global progression
- Sample size recommendation: 110 items
- Launch blockers:
  - map legend/scale ambiguity
  - outdated factual references
- Non-blocking polish items:
  - improve relevance with contemporary local examples
  - standardize terminology variants

## Future Audit Outputs Required (Post-Simulation)

## Output root
- `reports/content-quality-audit/<timestamp>/`

## Required artifact sets
- `questions-bank-quality-audit`
  - defect log by severity
  - answer-key mismatch report
  - distractor quality summary
- `subject-coverage-audit`
  - coverage matrix by subject/grade/topic/subtopic
  - gap list with severity tags
- `pedagogic-sample-review`
  - pedagogic reviewer notes
  - before/after suggestion set
  - launch-blocker recommendation list

## Launch Gate Decision Rule (Planned)
- Block launch if any subject has unresolved critical content defects.
- Block launch if any subject lacks minimum grade/topic coverage.
- Allow launch with documented waivers only for low-risk polish items.
