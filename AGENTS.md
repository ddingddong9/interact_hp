# User requirements: keep the interface minimal

- Seventh card: Admission Control. Demonstrate FIFO admission bounded by both per-second rate and active concurrency. Completing an active user frees a slot; admission itself is not seat reservation. Use staged fades and shifts to avoid overlapping user labels.

- Current learning sequence continues with a sixth Lua Script card after Race Condition. Show permission/duplicate/stock checks, atomic decrement and record, early returns, and retry behavior. Lua does not make external DB writes atomic.

- The user authorized a fifth Race Condition card and simulator comparing separate read/check/write with atomic seat acquisition. Preserve the original card navigation. The winning request can be A or B; atomicity does not by itself guarantee FIFO or cross-database consistency.

- Keep the simulator contained rather than stretched across the page. It may be moderately wider than the text: simulator/header/controls max 880px, explanations max 720px, both centered. The user clarified that equal widths are unnecessary. Do not use internal simulator scrolling or fixed stage heights. Fit diagrams to the simulator width and let their aspect ratio determine height; larger data may naturally change the simulator dimensions. Keep core explanations open; advanced complexity, rehashing, and Listpack sections use unboxed collapsible summaries. Use simple comparison tables where they clarify differences.

- Place simulators directly on the page with no enclosing bordered panel or separate tinted background. Reference the supplied yeolyi-style circuit screenshot for thin connecting lines, restrained state emphasis, and open composition. Keep data nodes and controls identifiable.

- Apply the yeolyi.com design reference through consistent Korean body typography, monospace numeric values, shared spacing, and natural visualization sizing without internal scroll areas. Preserve existing home cards and colors. Keep core explanatory content visible; do not add promotional copy.

- In concept explanations, introduce important terminology as Korean (English), for example 키(Key), 충돌(Collision), and 노드(Node). Explain the concepts themselves, not just how to operate the controls. Avoid repeating English translations in every sentence.

- Animation indicators must never cover node contents, bucket labels, or other text. Use a small marker in a dedicated side gap, keep cumulative Span text stationary, and reserve a separate area for incoming-node previews. Apply readability improvements consistently across all four pages.

- Keep diagram labels readable: avoid tiny, faint text for keys, empty states, and stored values. Keep the original muted colors; the user does not want extra contrast. Fit diagrams to the contained simulator width without internal scrolling, as subsequently requested by the user.

- Do not append educational-model disclaimers, Redis connection-status disclaimers, or reference/source links to concept screens. The user explicitly asked to remove these footer statements; keep only useful concept explanations and controls.

- Replace the four existing artwork cards with Hash Table, Linked List, Skip List, and Sorted Set, using the original card design and original card-to-experience navigation.
- The user has now authorized completing all remaining concept modules (Linked List, Skip List, Sorted Set). Keep the home design; do not add unrelated modules or independently redesign it.
- Preserve the original home header, name, self-introduction, interactive monogram, and copyright footer. The user clarified that “concept names only” applies to the four learning cards, not the whole home page. Do not add new slogans, decorative headings, learning-roadmap copy, or promotional text.
- The user explicitly rejected phrases such as “보이지 않는 구조를, 손으로 이해하기”, “데이터가 움직이는 방식을 탐험하세요”, and “작은 자료구조에서 대규모 예매 대기열까지”. Do not reintroduce them or similar filler.
- Keep concept screens visually simple and easy to follow. Use teaching text only where it is needed to explain the current operation; avoid dense dashboards and simultaneous panels.
- These requirements supersede the previous learning-site implementation direction and any conflicting historical art instructions below.

# Current direction

- The user has changed this website into an interactive data structure learning site. The learning content and explanations supersede the earlier art-only copy restrictions and point/line/plane/space sequence below.
- Keep English concept names, Korean teaching copy, keyboard access, touch support, and reduced-motion support.
- Current modules: Hash Table, Linked List, Skip List, Sorted Set. Use clearly labeled educational models; do not claim a live Redis connection.

# Historical art direction (superseded where conflicting)

# Design direction

- For future design and interaction work on this website, always consult the user's reference: https://fff.cmiscm.com/#!/main (Form Follows Function by Jongmin Kim).
- The four projects follow the sequence 점 → 선 → 면 → 공간 (point → line → plane → space).
- User direction for Project 1: express points as planets, with a vast outer-space background.
- Prior Project 1 interactions (planet creation, dragging, gravity, zoom) are disposable, not requirements to preserve. The user explicitly prioritizes visual quality first, with interactions chosen to complement the finished visual direction. Preserve touch, keyboard, and reduced-motion support for whatever interactions are retained.
- The user rejected the first planet implementation's visual quality and specifically directed attention to FFF No. 03, Universe Panorama: https://fff.cmiscm.com/#!/section/universe. Use this individual experience as the primary visual reference, not merely the FFF main poster navigation. Direct inspection shows a full-viewport photographic nebula panorama and a drag-controlled changing viewpoint. The prior sparse dark-background treatment is not an accepted visual target.

- User requires English project names. Current names: Nebula Drift, Blinds, FOLD, Type Drift.
- No decorative titles, taglines, explanations, counters, fake statuses, dates, or other filler copy inside experiments. Use accessible labels; the small English utility controls requested below are the only visible UI text inside experiments. Artwork that intentionally consists of letterforms is distinct from explanatory UI copy. Keep necessary image attribution visibly on the home page and linked to its primary source from the experience.
- Project 1 now prioritizes a photographic Carina Nebula panorama. No requirement to keep the superseded planet-creation interface.

- Shared experiment controls: no left-side button stack. Keep a smaller, 44px outlined close button at right center with a transparent background, and small lowercase English text utilities (`info · fullscreen`) at bottom center. Do not restore dark translucent button discs or decorative text.

- Nebula Drift interaction: a short click creates a black hole at that position, bending and drawing the photographic nebula inward over roughly 6.6 seconds until a single light point remains. Clicking the final point unfolds the universe. Keep drag/pinch distinct from taps, offer keyboard activation, and use a restrained fade for reduced motion. No additional visible instructions or buttons.
- Absorption must sample the original photographic environment beyond the viewport, never shrink or rotate a captured rectangular screen. Preserve distant clouds early, stretch the inner filaments, and confine sparse dust to the region close to the black hole. The whole photograph must not disintegrate into pixels. Keep the non-WebGL fallback stationary with a fade rather than a shrinking rectangle.
- Nebula canvas has no viewport outline. Drag release should glide with smoothly decaying inertia and come to rest; do not resume automatic camera drift. Preserve the utility controls' keyboard focus indicators.
- Nebula Drift now supports unlimited horizontal 360-degree rotation. Wrap the existing photograph with a blended rear overlap; it is an artistic photographic environment, not an actual all-sky survey. Rebase camera and target angles together so inertia never jumps at the seam. Keep the same wrapping in the black-hole sampling and non-WebGL fallback.

- Clicking the final point triggers a separate outward rebirth: localized ignition, fine outward light/dust, and the nebula emerging behind an uneven expanding front. Do not simply reverse the absorption or add a full-screen flash. Reduced motion retains the restrained fade.
- All projects share the FFF-inspired sequence home → centered poster → horizontal slide into the experiment, reversed on exit. Hold the centered poster briefly. Freeze its real artwork layout and use uniform transforms so text never reflows. Restore and measure home without outgoing page transforms before docking to the original poster. Reduced motion uses an immediate page change.
- Once page entry has completely finished and the photograph has loaded, Nebula Drift performs one short, smooth horizontal camera sweep, then comes fully to rest. Any user input cancels the introductory sweep, including input before image loading completes.
- Project 2 is now Blinds (line), replacing Longcat. Use the supplied Girl with a Pearl Earring as a stationary sharp backdrop, covered by very fine horizontal lines carrying a blurred version of the artwork. No literal blind panels, bevels, ladder cords or slat shading. Press and pull downward with mouse or touch to part the lines proportionally to the drag; a simple click must not open them. Release gently closes the aperture. Keep shared transitions, English utility controls, artwork attribution and keyboard/reduced-motion support. Keyboard: arrows position, Enter/Space grabs, Up/Down controls the opening, Enter/Space releases, Escape closes. No Higgsfield generation required.
- Project 3 is FOLD (plane): one original vermilion/ivory orchid photogram print on a warm gallery background. The flower image has a matching dark copper reverse. Pointer motion gives restrained sheet tilt; dragging down raises a paper flap along the chosen horizontal fold. The original print remains visible above the fold while only the overlapping flap changes to dark copper. On release, a substantial fold remains; tapping the folded print closes it. No filler copy inside. Keep touch, keyboard, reduced-motion and shared controls.

# Series cards
- Home has three series books: Data Structures, Concurrency, Booking System. Preserve the self-introduction and monogram.
- Put the series title at the top and chapter links labeled 1p, 2p, etc. inside the cover. Selecting a chapter lifts its paper leaf diagonally upward, then unfolds into that existing simulator. Preserve direct hashes, touch/keyboard operation, and reduced-motion navigation.
- Add future concepts as chapters within these books, not new standalone home cards.

# Java series
- User explicitly authorized a separate Java book while pausing booking work. Its chapters visualize code execution order: Constructor Chaining, super & this, Field Hiding. Show current source line, call stack, one object with inherited fields, and console output; distinguish return values from printing. Preserve Korean explanations and existing series.

- Java Method Overriding chapter contains the attached 2025 second-session Information Processing Engineer practical exam and an undated additional practice. Display year/session on problems; never confuse article creation or study dates with exam dates. Show static vs dynamic method selection, intermediate values, array references and per-object side effects with example addresses.

- Java 5p @Override compares valid/typo methods with and without annotation, with a compilation stage before runtime. Compilation failure must leave stack, object memory and console empty. Include both attached undated practice questions; print appends on one line (C and CP3). Do not generalize @Override behavior to all annotations.

- Java 6p Method Overloading includes all seven supplied examples (five dated exam questions, two undated exercises). Preserve the compile-time signature then runtime override distinction, char promotion and left-to-right concatenation. Recursive snapshots must follow actual left-first calls and unwind order, maintain separate local values and shared array references; the string/array recursion examples each have one method and are not themselves overloads.

- Java 7p Compile-time Binding separates compile-time candidate/signature selection from runtime implementation dispatch. Include A/B declared-type comparison (B instances 100 and 101) and dated 2026 session 1 A.g exam; keep signature fixed at runtime. Series covers grow with chapter count rather than clipping links.

- All Java source listings use syntax colors matching the supplied editor reference: red keywords/operators/annotations, purple types/methods, blue strings/this/super, orange parameter declarations, distinct numbers and comments. Adapt colors to light/dark themes, preserve source lines and the current execution highlight, and keep the unboxed page layout.

- Java memory uses individual boxed reference/value cells and object blocks, with inherited fields grouped inside one object. Reference variables point to object addresses (100 onward); String fields store reference addresses (300 onward) with separate string-value cells. Keep address labels stable across playback and resets, primitive values direct, and this declaration type distinct from actual object type. This explicitly requested boxed memory representation supersedes unboxed-node guidance for memory nodes only.

- Put the Java console/result section last in the simulator, below the memory diagram and before concept explanations.

- Java simulators place source code on the left and memory boxes on the right so execution and references are visible together. Put supporting stack/local information under the right-side memory, keep console below both columns, and stack vertically only on narrow mobile screens.

- Show Java execution-order badges beside source lines, separate from source line numbers. Accumulate distinct visits, merge adjacent explanatory snapshots of the same line, exclude compile-only phases, highlight current visit and allow selecting a badge to return to that step. Condense long repeated histories without covering code.
