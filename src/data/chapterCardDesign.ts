export const chapterNotations: Record<string, string> = {
  'Abstract Class':'abstract → override',
  'Hash Table':'key → hash → value', 'Linked List':'node → next → node', 'Skip List':'level 3 → 2 → 1', 'Sorted Set':'member + score → rank',
  'Race Condition':'read → check → write', 'Lua Script':'check → update → return', 'Admission Control':'FIFO → rate + active',
  'Constructor Chaining':'A() → B()', 'super & this':'super / this', 'Field Hiding':'A.x / B.x', 'Method Overriding':'A ref → B.f()', '@Override':'@Override → compile', 'Method Overloading':'f(int) / f(String)', 'Compile-time Binding':'type → signature',
  'Pointer Basics':'&value → p → *p', 'Pointer Arithmetic':'p + 1 → next element', 'Double Pointer':'pp → p → value', 'Pointer Array & Array Pointer':'int *p[3]\nint (*p)[3]', 'String Pointer':'char *p → "abc"', 'String Copy':'*dst++ = *src++', 'String Reverse':'left ↔ right', 'Pointer Parameter':'&value → function', 'Function Pointer':'fp → function()', 'Dynamic Memory':'malloc → use → free', 'Struct Pointer':'ptr → member', 'Nested Struct':'outer.inner.member', 'sizeof & Array':'sizeof(a) / sizeof(p)', 'Linked List Pointers':'head → node → next', 'Linked List Reverse':'next → prev',
  'String Indexing':'s[i] / s[-1]', 'String Slicing':'s[start:end:step]', 'String Split':'"a,b" → ["a", "b"]', 'String Join':'["a", "b"] → "a,b"', 'List Basics & Methods':'append / pop / sort', 'List Slicing':'items[start:end]', '2D Lists':'rows[i][j]', 'List Concatenation':'list + list / list * n', 'Shallow Copy & Mutability':'a → inner ← b',
};
const categoryColors: Record<string, string> = {
  'Data Structures': '#fd8072',
  'Concurrency': '#f28f36',
  'Booking System': '#cea600',
  'Java': '#7cc058',
  'C': '#00c9a0',
  'Python': '#00c4dd',
};
export const chapterCardColor = (category: string, index: number, chapterCount: number) => {
  const base = categoryColors[category] ?? '#cea600';
  const r = parseInt(base.slice(1, 3), 16) / 255;
  const g = parseInt(base.slice(3, 5), 16) / 255;
  const b = parseInt(base.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = delta === 0 ? 0 : max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  // Move continuously through a restrained color range in chapter order.
  const progress = Math.min(1, Math.max(0, index / Math.max(1, chapterCount - 1)));
  const hueShift = progress * 10;
  const lightnessShift = progress * 7.5;
  return `hsl(${hue + hueShift} ${saturation * 100}% ${Math.min(82, Math.max(30, lightness * 100 + lightnessShift))}%)`;
};
