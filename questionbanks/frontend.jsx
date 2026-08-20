import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   FRONTEND INTERVIEW READINESS BANK
   For a 2+ YOE full-stack engineer (React / Next / Angular +
   Django / Node). Track status, revise, and drill.
   ============================================================ */

const T = {
  bg: "#E8EBF0",
  grid: "#DCE1E9",
  surface: "#FFFFFF",
  ink: "#111621",
  inkSoft: "#5A6474",
  rule: "#D2D8E2",
  navy: "#22304F",
  navySoft: "#3C4E77",
  slate: "#94A0B2",
  amber: "#B4762A",
  brick: "#B0413A",
  green: "#2C6E52",
};

const STATUS = {
  new: { label: "Not started", short: "—", color: T.slate, bg: "#E3E7ED" },
  learning: { label: "Learning", short: "◐", color: T.amber, bg: "#F7EBDA" },
  revise: { label: "Needs revision", short: "!", color: T.brick, bg: "#F7E0DE" },
  done: { label: "Mastered", short: "✓", color: T.green, bg: "#DCEDE5" },
};
const STATUS_ORDER = ["new", "learning", "revise", "done"];

const LEVELS = {
  basic: { label: "Basic", w: "01" },
  mid: { label: "Mid", w: "02" },
  hard: { label: "Hard", w: "03" },
};

const CATS = [
  { code: "JS", name: "JavaScript core" },
  { code: "TS", name: "TypeScript" },
  { code: "RCT", name: "React" },
  { code: "FWK", name: "Next.js / Angular" },
  { code: "CSS", name: "HTML, CSS & layout" },
  { code: "WEB", name: "Browser, network & perf" },
  { code: "SEC", name: "Security" },
  { code: "A11Y", name: "Accessibility" },
  { code: "SD", name: "Frontend system design" },
  { code: "BE", name: "Backend basics" },
  { code: "MC", name: "Machine coding" },
  { code: "DSA", name: "DSA for frontend" },
  { code: "TST", name: "Testing & tooling" },
  { code: "APP", name: "Mobile & Capacitor" },
  { code: "BHV", name: "Behavioural & project" },
  { code: "RND", name: "Interview round strategy" },
];

const Q = [
  /* ---------------- JAVASCRIPT CORE ---------------- */
  { id: "JS-01", cat: "JS", lv: "basic", q: "Explain var, let and const — scope, hoisting and reassignment.",
    a: ["var: function-scoped, hoisted and initialised to undefined, redeclarable.", "let/const: block-scoped, hoisted but in the Temporal Dead Zone until the declaration line.", "const binds the reference, not the value — object properties can still mutate.", "Follow-up they always ask: what does accessing a let before declaration throw? ReferenceError."] ,
    trap: "Follow-up: is `const arr = []; arr.push(1)` legal? Yes — const freezes the binding, not the contents. Candidates who say 'const means immutable' get caught here." },
  { id: "JS-02", cat: "JS", lv: "basic", q: "What is hoisting? What exactly gets hoisted?",
    a: ["Declarations are registered during the creation phase of the execution context; assignments stay in place.", "Function declarations hoist fully; function expressions and arrow functions hoist only the variable.", "Classes hoist but sit in the TDZ.", "Show a snippet where calling a function declaration before its definition works but the expression version throws."] ,
    trap: "They show `console.log(x); var x = 5;` (undefined) next to the `let` version (ReferenceError) and ask why they differ. 'Both are hoisted' is only half the answer — the difference is initialisation." },
  { id: "JS-03", cat: "JS", lv: "mid", q: "What is a closure? Give a real use case from your own code.",
    a: ["A function plus the lexical environment it was created in, kept alive after the outer function returns.", "Uses: data privacy / module pattern, once(), memoize, debounce/throttle timers, React hooks capturing props.", "Classic trap: var inside a for loop with setTimeout printing the final value — fix with let or an IIFE.", "Mention the memory cost: closures keep their scope chain from being GC'd."] },
  { id: "JS-04", cat: "JS", lv: "mid", q: "How does the `this` keyword resolve?",
    a: ["Four rules in precedence order: new binding, explicit (call/apply/bind), implicit (object before the dot), default (undefined in strict, globalThis otherwise).", "Arrow functions have no own this — they inherit from the enclosing lexical scope, so bind/call cannot change it.", "Losing this: passing obj.method as a callback detaches the receiver.", "In a DOM handler, this is the element for a normal function, not for an arrow."] ,
    trap: "They pass `obj.method` as a callback and ask what `this` is. Then they ask if an arrow function inside a class method fixes it — it does, and knowing why (lexical capture at definition) is the real test." },
  { id: "JS-05", cat: "JS", lv: "mid", q: "Explain prototypal inheritance and the prototype chain.",
    a: ["Every object has an internal [[Prototype]] link, reachable via Object.getPrototypeOf / __proto__.", "Property lookup walks the chain until found or null.", "fn.prototype is the object assigned as [[Prototype]] of instances created with new.", "class syntax is sugar over this; extends sets up the chain and super calls the parent constructor.", "Know the difference between hasOwnProperty and the in operator."] ,
    trap: "Follow-up: what's the difference between `__proto__` and `prototype`? Most candidates use them interchangeably. One is the instance's link, the other is the constructor's property." },
  { id: "JS-06", cat: "JS", lv: "hard", q: "Walk through the event loop: call stack, task queue, microtask queue.",
    a: ["Sync code runs on the stack; when empty, all microtasks drain, then one macrotask, then render.", "Microtasks: promise callbacks, queueMicrotask, MutationObserver. Macrotasks: setTimeout, setInterval, I/O, message events.", "Node adds process.nextTick (before other microtasks) and phases: timers, pending, poll, check (setImmediate), close.", "Be ready to order the output of a snippet mixing setTimeout 0, Promise.resolve().then and sync logs.", "Explain why a long sync loop blocks paint and how to yield with scheduler / setTimeout chunking."] ,
    trap: "They give you a snippet with sync logs, setTimeout(0) and Promise.then and ask for the exact output order. Getting microtasks-before-macrotasks wrong here is an instant signal." },
  { id: "JS-07", cat: "JS", lv: "basic", q: "== vs === and how type coercion works.",
    a: ["=== compares type and value with no conversion; == applies the abstract equality algorithm.", "null == undefined is true, but null == 0 is false.", "NaN !== NaN — use Number.isNaN or Object.is.", "Objects convert via Symbol.toPrimitive → valueOf → toString.", "Rule of thumb for interviews: always use === except the deliberate `x == null` null-ish check."] ,
    trap: "`[] == false` is true, `[] == ![]` is true. You don't need to memorise the table — but you must be able to say the objects coerce via toPrimitive, and that this is why you use ===." },
  { id: "JS-08", cat: "JS", lv: "basic", q: "Difference between shallow and deep copy. How do you deep clone?",
    a: ["Spread and Object.assign copy one level; nested references stay shared.", "structuredClone handles Dates, Maps, Sets, cyclic refs — but not functions or DOM nodes.", "JSON.parse(JSON.stringify(x)) drops undefined, functions, Symbols, converts Dates to strings and throws on cycles.", "Say when a shallow copy is enough — React state updates only need the changed path cloned."] ,
    trap: "They ask you to deep clone an object containing a Date and a function. JSON round-trip silently mangles both — if you offer it without the caveat, that's the trap sprung." },
  { id: "JS-09", cat: "JS", lv: "mid", q: "Promise.all vs allSettled vs race vs any.",
    a: ["all: rejects fast on the first rejection, resolves with an ordered array.", "allSettled: never rejects, gives {status, value|reason} for each.", "race: settles with the first to settle either way — used for timeouts.", "any: first fulfilment, rejects with AggregateError only if all fail.", "Follow-up: how do you run N promises with a concurrency limit of 3? Write the pool."] ,
    trap: "The follow-up is almost always: 'run 100 requests but only 3 at a time.' Promise.all can't do it — they want the pool loop." },
  { id: "JS-10", cat: "JS", lv: "mid", q: "How does async/await work under the hood?",
    a: ["Syntactic sugar over generators + promises; await suspends the function and schedules the rest as a microtask.", "An async function always returns a promise; a throw becomes a rejection.", "Sequential awaits in a loop serialise network calls — hoist the promises and Promise.all them.", "try/catch around await, or .catch on the returned promise; unhandled rejections crash Node."] ,
    trap: "They show a `for` loop with an `await fetch` inside and ask how to speed it up. If you don't spot the serialisation, you've missed the point of the question." },
  { id: "JS-11", cat: "JS", lv: "mid", q: "Explain event bubbling, capturing and delegation.",
    a: ["Capture from window down to target, then bubble back up; addEventListener's third arg picks the phase.", "Delegation: one listener on a parent, use event.target.closest to identify the source — cheap for lists and dynamic rows.", "stopPropagation halts travel; preventDefault only cancels default behaviour; stopImmediatePropagation also blocks sibling listeners on the same node.", "Note which events do not bubble: focus, blur, load, scroll (use focusin/focusout instead)."] ,
    trap: "Which of stopPropagation and preventDefault stops a form submitting? preventDefault. Mixing these up is common and immediately visible." },
  { id: "JS-12", cat: "JS", lv: "basic", q: "call, apply and bind.",
    a: ["call(thisArg, ...args) and apply(thisArg, argsArray) invoke immediately; bind returns a new bound function.", "bind can partially apply arguments; binding twice has no effect.", "A bound function used with new ignores the bound this.", "Common ask: implement Function.prototype.myBind yourself."] ,
    trap: "They ask you to implement bind. The detail almost everyone misses: a bound function used with `new` must ignore the bound `this`." },
  { id: "JS-13", cat: "JS", lv: "mid", q: "Debounce vs throttle — when do you use each?",
    a: ["Debounce: run after N ms of silence — search-as-you-type, autosave, resize end.", "Throttle: run at most once per N ms — scroll handlers, mousemove, infinite scroll triggers.", "Discuss leading vs trailing edge and a cancel/flush method.", "Expect to code both from scratch with correct this and args forwarding."] ,
    trap: "'Which would you use for a search box?' Debounce. 'For infinite scroll?' Throttle. Getting these backwards suggests you've read the definitions but not shipped them." },
  { id: "JS-14", cat: "JS", lv: "hard", q: "What is currying and where is it actually useful?",
    a: ["Transforming f(a,b,c) into f(a)(b)(c) using closures.", "Useful for reusable config: fetchWithBase(url)(path), logger(level)(msg), React event handler factories.", "Implement a curry() that supports both sum(1)(2)(3) and sum(1,2)(3) using fn.length.", "Contrast with partial application — currying is one arg at a time."] ,
    trap: "They ask for a curry that handles both sum(1)(2)(3) and sum(1,2)(3). The key is checking args.length against fn.length and returning either the result or a new curried function." },
  { id: "JS-15", cat: "JS", lv: "mid", q: "Explain the module systems: ESM vs CommonJS.",
    a: ["ESM: static import/export, hoisted, tree-shakeable, live bindings, async loading, top-level await.", "CJS: require is dynamic and synchronous, exports a value copy, cannot be tree-shaken reliably.", "Interop pain: default export interop, __esModule flag, \"type\": \"module\" in package.json.", "Why bundlers prefer ESM: static analysis enables dead-code elimination."] ,
    trap: "Follow-up: why can't you tree-shake `require`? Because it's dynamic and evaluated at runtime, so the bundler can't statically prove what's unused." },
  { id: "JS-16", cat: "JS", lv: "mid", q: "Map vs Object, Set vs Array — when do you reach for each?",
    a: ["Map: any key type, preserves insertion order, .size, iterable, no prototype key collisions — better for frequent add/delete.", "Object: JSON-friendly, string/symbol keys only, faster for small static shapes.", "Set: O(1) membership and dedupe; Array keeps order and index access.", "WeakMap/WeakSet hold weak references — used for private data and caches keyed on DOM nodes."] ,
    trap: "'Why not just use an object as a cache keyed on user objects?' Because object keys stringify to [object Object] and collide — and a Map holds strong references, so a WeakMap is what you actually want." },
  { id: "JS-17", cat: "JS", lv: "hard", q: "How does garbage collection work in JS, and what causes memory leaks?",
    a: ["Mark-and-sweep from GC roots; generational collection for young objects.", "Leak sources: detached DOM nodes held by a JS reference, forgotten intervals/listeners, growing global caches, closures over big objects.", "In React: subscriptions not cleaned in useEffect, stale timers, event listeners on window.", "Debug with Chrome Memory tab heap snapshots and the detached-nodes filter."] ,
    trap: "They ask for a concrete leak you've seen. 'A closure' is too abstract — name a listener on window that a component never removed, or a setInterval that survived unmount." },
  { id: "JS-18", cat: "JS", lv: "basic", q: "Explain the difference between null, undefined and undeclared.",
    a: ["undefined: declared but unassigned, or a missing return / arg.", "null: an explicit empty value you assigned.", "undeclared: never declared — throws ReferenceError on read (typeof is safe).", "typeof null === 'object' is a historical bug worth mentioning.", "?? vs || — nullish coalescing only falls through for null/undefined, not 0 or ''."] ,
    trap: "`const x = data.count || 10` when count is 0. This bug reaches production constantly; ?? is the fix and knowing the distinction is the point." },
  { id: "JS-19", cat: "JS", lv: "mid", q: "Generators and iterators — what problem do they solve?",
    a: ["An iterable exposes Symbol.iterator returning an object with next(); for..of and spread consume it.", "Generators (function*) pause at yield and can receive values back via next(v).", "Uses: lazy infinite sequences, custom iteration, redux-saga, async flow control before async/await.", "Be able to write a custom iterable class or a range generator on the spot."] ,
    trap: "Follow-up: write an infinite ID generator or a range() without allocating an array. If you build the array first, you've missed why generators exist." },
  { id: "JS-20", cat: "JS", lv: "mid", q: "What are Proxy and Reflect used for?",
    a: ["Proxy intercepts fundamental operations (get, set, has, deleteProperty) with traps.", "Real uses: Vue 3 reactivity, MobX, validation layers, mocking, negative array indexes.", "Reflect provides the default behaviour of each trap so you can forward cleanly.", "Cost: proxies are slower and break some engine optimisations — say so."] ,
    trap: "They ask how Vue 3 reactivity works. Proxy traps on get (track dependency) and set (trigger effect) — being able to say that shows you understand the mechanism, not just the API." },
  { id: "JS-21", cat: "JS", lv: "basic", q: "How does array destructuring, spread and rest work — and where do they differ?",
    a: ["Rest collects remaining values in a parameter or pattern; spread expands an iterable.", "Default values only apply for undefined, not null.", "Nested and renamed destructuring: const {a: {b: renamed = 1} = {}} = obj.", "Spread on objects is shallow and copies only own enumerable props."] ,
    trap: "`const {a = 1} = {a: null}` gives null, not 1. Defaults only fire for undefined, and this silently breaks nullable API fields." },
  { id: "JS-22", cat: "JS", lv: "mid", q: "Explain the difference between synchronous, asynchronous, blocking and non-blocking.",
    a: ["Sync/async is about when the result is returned; blocking is about whether the thread can do other work.", "JS is single-threaded but non-blocking via the event loop and host APIs.", "CPU-heavy sync code blocks everything — move to a Web Worker or chunk it.", "Node uses a libuv thread pool for fs and crypto, which is why some \"async\" work is genuinely parallel."] ,
    trap: "'JavaScript is single-threaded, so how does it do parallel network requests?' The requests happen in the host environment, not in JS — the language is single-threaded, the runtime isn't." },
  { id: "JS-23", cat: "JS", lv: "hard", q: "What are Web Workers? When would you use one in a real app?",
    a: ["A separate thread with no DOM access, communicating via postMessage and structured clone.", "Good for: parsing huge CSV/JSON, image processing, crypto, heavy diffing, PDF generation.", "SharedArrayBuffer + Atomics for shared memory (needs COOP/COEP headers).", "Also mention Service Workers as a different thing: network proxy, caching, offline, push."] ,
    trap: "Follow-up: can a Web Worker update the DOM? No. If you say yes, the rest of your answer is discounted. It posts messages back and the main thread renders." },
  { id: "JS-24", cat: "JS", lv: "mid", q: "Explain optional chaining, nullish coalescing and short-circuiting pitfalls.",
    a: ["a?.b?.() stops at null/undefined and yields undefined instead of throwing.", "Combine carefully: a?.b ?? fallback, but (a?.b || fallback) breaks for 0 and ''.", "Optional chaining does not protect against a being undeclared.", "Overusing ?. can hide real data bugs — mention that as a code-review point."] ,
    trap: "They ask whether `a?.b.c` is safe when a exists but b doesn't. It isn't — optional chaining only guards the link it's attached to. You need `a?.b?.c`." },
  { id: "JS-25", cat: "JS", lv: "hard", q: "How does JS handle floating point numbers? Why is 0.1 + 0.2 !== 0.3?",
    a: ["IEEE-754 doubles cannot represent 0.1 exactly in binary.", "Compare with an epsilon, or work in integer minor units — critical in fintech/lending amounts.", "Number.MAX_SAFE_INTEGER is 2^53-1; beyond that use BigInt.", "For money: store paise/cents as integers or use decimal.js; never round with toFixed for accounting."] ,
    trap: "Given an interest calculation, they ask how you'd store the amount. Any answer involving floats for money loses the point immediately in a fintech interview." },
  { id: "JS-26", cat: "JS", lv: "mid", q: "What is the difference between a shallow-equal render check and a deep comparison? Why does JS compare objects by reference?",
    a: ["Objects and arrays are compared by identity, so {} !== {}.", "That's why a new object literal in props re-renders a memoised child every time.", "Fix with useMemo/useCallback, stable keys, or a custom areEqual.", "Deep compare is O(n) and can be slower than the re-render you're avoiding."] ,
    trap: "They show a memoised child re-rendering because the parent passes `style={{margin: 8}}`. Spotting the inline literal as a new reference each render is the whole answer." },
  { id: "JS-27", cat: "JS", lv: "hard", q: "Explain the temporal dead zone and why it exists.",
    a: ["let/const bindings are created at scope entry but uninitialised until evaluated.", "It exists to make const meaningful and to surface use-before-define bugs loudly.", "typeof on a TDZ variable also throws, unlike undeclared.", "Class declarations behave the same way."] ,
    trap: "`typeof undeclaredVar` returns 'undefined' but `typeof letInTDZ` throws. That asymmetry surprises most candidates." },
  { id: "JS-28", cat: "JS", lv: "mid", q: "How do you handle errors properly in async JS?",
    a: ["try/catch around await; .catch for promise chains; both for mixed code.", "An error thrown inside a setTimeout callback escapes the surrounding try/catch.", "Global nets: window.onerror, unhandledrejection, Node's process.on('unhandledRejection').", "Preserve context with Error cause: throw new Error('msg', { cause: err }); custom error classes for typed handling.", "Tie to real work: how you surface API errors to users vs log to Sentry."] ,
    trap: "They ask why the try/catch didn't catch an error thrown inside setTimeout. The callback runs on a later tick with a fresh stack — the surrounding try/catch is long gone." },
  { id: "JS-29", cat: "JS", lv: "basic", q: "Difference between forEach, map, filter, reduce, some, every, find.",
    a: ["forEach returns undefined and can't be broken out of; use for..of when you need break.", "map is 1:1 and must return; filter is a predicate; reduce folds to any shape.", "some/every short-circuit; find/findIndex return the first match.", "Know how to build map and filter using reduce — a common warm-up."] ,
    trap: "'How do you break out of forEach?' You can't. If you answer 'return', you've just described skipping one iteration, not breaking." },
  { id: "JS-30", cat: "JS", lv: "hard", q: "What happens, step by step, when you write `new Foo()`?",
    a: ["A new empty object is created; its [[Prototype]] is set to Foo.prototype.", "Foo runs with this bound to that object.", "If the constructor returns an object, that wins; otherwise this is returned.", "new.target lets a function detect construction; class constructors throw without new."] ,
    trap: "Follow-up: what does an arrow function do with `new`? It throws — arrow functions have no [[Construct]] and no prototype property." },

  /* ---------------- TYPESCRIPT ---------------- */
  { id: "TS-01", cat: "TS", lv: "basic", q: "interface vs type alias — which do you use and why?",
    a: ["Interfaces support declaration merging and are idiomatic for object/class shapes.", "Type aliases handle unions, tuples, mapped and conditional types, primitives.", "Both support extension; interfaces via extends, aliases via intersections.", "Practical answer: interfaces for public API shapes, types for everything computed."] ,
    trap: "They ask which one can be reopened and added to later. Interfaces merge; type aliases throw a duplicate identifier error. That's the deciding factor for library authors." },
  { id: "TS-02", cat: "TS", lv: "basic", q: "any vs unknown vs never vs void.",
    a: ["any disables checking and spreads silently; unknown forces narrowing before use.", "never is the empty type — unreachable code, exhaustive switch checks.", "void is 'no meaningful return', still assignable from any return in callbacks.", "Show the exhaustiveness pattern: default: const _x: never = value."] ,
    trap: "They hand you a value of type unknown and ask you to use it. If you reach for `as any`, the round is over — narrowing with a type guard is the expected move." },
  { id: "TS-03", cat: "TS", lv: "mid", q: "Explain generics with a concrete example you'd write in an app.",
    a: ["Generics parameterise types: function first<T>(arr: T[]): T | undefined.", "Constraints: <T extends { id: string }>; defaults: <T = unknown>.", "Real use: a typed apiClient<TResponse>(url) or a useFetch<T> hook.", "Mention inference — you rarely pass type args explicitly if the signature is right."] ,
    trap: "Follow-up: type a function that takes an object and a key and returns that property's type. If you can't write <T, K extends keyof T>(o: T, k: K): T[K], generics are still surface-level for you." },
  { id: "TS-04", cat: "TS", lv: "mid", q: "What are utility types and which do you use most?",
    a: ["Partial, Required, Pick, Omit, Record, Readonly, ReturnType, Parameters, Awaited, NonNullable.", "Pattern: type FormValues = Pick<User, 'name' | 'email'> keeps the form in sync with the model.", "Record<Status, Config> gives you compile-time exhaustive maps.", "Be able to implement Pick and Partial yourself with mapped types."] ,
    trap: "They ask you to implement Omit from scratch. It needs Pick plus Exclude over keyof — a two-line answer that reveals whether you understand mapped types or just memorised the names." },
  { id: "TS-05", cat: "TS", lv: "hard", q: "Explain mapped types and conditional types.",
    a: ["Mapped: { [K in keyof T]: ... } with modifiers +/-readonly and +/-?.", "Conditional: T extends U ? X : Y, with infer to extract parts (e.g. ReturnType).", "Distributive behaviour over unions, and how [T] extends [U] disables it.", "Template literal types: `on${Capitalize<K & string>}` for typed event maps."] ,
    trap: "Why does `T extends U ? X : Y` behave oddly with a union T? Because conditional types distribute over unions. Wrapping in a tuple `[T] extends [U]` stops it." },
  { id: "TS-06", cat: "TS", lv: "mid", q: "What are discriminated unions and why are they the best pattern for state?",
    a: ["A shared literal tag lets TS narrow the whole object: {status:'loading'} | {status:'success', data:T} | {status:'error', error:E}.", "Kills impossible states like data present while loading is true.", "Pairs with exhaustive switch + never for compile-time completeness.", "Great answer for 'how do you model API state' in a React interview."] ,
    trap: "They give you `{isLoading: boolean, data?: T, error?: E}` and ask what's wrong. It permits isLoading with both data and error set — the impossible state a discriminated union eliminates." },
  { id: "TS-07", cat: "TS", lv: "mid", q: "What are type guards and how do you write a custom one?",
    a: ["Built-in narrowing: typeof, instanceof, in, truthiness, equality.", "User-defined: function isUser(x: unknown): x is User { ... }.", "assertion functions: function assertIsUser(x): asserts x is User.", "Warn that predicates are unchecked promises to the compiler — validate with zod at boundaries."] ,
    trap: "A predicate that returns `x is User` after checking only one property is a lie the compiler believes. They probe whether you know the runtime and the type are now out of sync." },
  { id: "TS-08", cat: "TS", lv: "mid", q: "How do you type React components, props, refs and events?",
    a: ["Prefer plain function components with a typed props object over React.FC (implicit children, generics friction).", "Events: React.ChangeEvent<HTMLInputElement>, React.MouseEvent<HTMLButtonElement>.", "Refs: useRef<HTMLDivElement>(null) vs useRef<number>(0) — the null overload gives a readonly current.", "Generic components and forwardRef typing; ComponentProps<'button'> to extend native props."] ,
    trap: "Why avoid React.FC? Implicit children in older versions and poor generic support. Saying 'no reason, I just use it' is a missed chance to show you've formed an opinion." },
  { id: "TS-09", cat: "TS", lv: "hard", q: "What does strict mode turn on, and what is strictNullChecks solving?",
    a: ["strict enables noImplicitAny, strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, and more.", "Without strictNullChecks, null and undefined are assignable everywhere — the billion-dollar mistake stays live.", "Migration strategy for a legacy codebase: enable per-file with // @ts-check, then flip flags one at a time.", "Explain why you avoid the non-null assertion ! except at proven boundaries."] ,
    trap: "They ask what `!` actually does at runtime. Nothing — it's erased. If you use it to silence an error you haven't proven, you've shipped a crash." },
  { id: "TS-10", cat: "TS", lv: "mid", q: "How do you type an API response you don't control?",
    a: ["Never trust the network: parse with zod/valibot at the boundary and infer the type from the schema.", "z.infer<typeof UserSchema> keeps runtime and compile-time in one source of truth.", "Alternative: generate types from OpenAPI/Swagger or GraphQL codegen.", "Contrast with casting `as User`, which is a lie the compiler cannot check."] ,
    trap: "Follow-up: the API adds a field, or sends null where you expected a string. With `as User` you find out in production; with a parsed schema you find out at the boundary." },
  { id: "TS-11", cat: "TS", lv: "hard", q: "Structural vs nominal typing — what problems does structural typing cause?",
    a: ["TS compares shapes, so any object with the right fields fits.", "Problem: UserId and OrderId are both string and get swapped silently.", "Fix with branded types: type UserId = string & { __brand: 'UserId' }.", "Excess property checks only fire on fresh object literals — explain that surprise."] ,
    trap: "They pass a userId where an orderId is expected and ask why TypeScript allowed it. Both are string — structural typing has no objection, which is why branding exists." },
  { id: "TS-12", cat: "TS", lv: "mid", q: "What is declaration merging and module augmentation? Where have you needed it?",
    a: ["Interfaces and namespaces with the same name merge their members.", "Augmentation: declare module 'express' { interface Request { user?: User } } to add typing for middleware.", "Also used to extend Window, styled-components DefaultTheme, or NodeJS.ProcessEnv.", "Mention .d.ts files for untyped third-party libraries."] ,
    trap: "They ask how you'd add a `user` property to Express's Request without editing node_modules. If you don't know module augmentation, you end up casting to any in every handler." },
];

const Q2 = [
  /* ---------------- REACT ---------------- */
  { id: "RCT-01", cat: "RCT", lv: "basic", q: "What is the virtual DOM and how does reconciliation work?",
    a: ["A lightweight JS description of the UI; React diffs the new tree against the old and patches only what changed.", "Heuristics: different element types replace the subtree; same type updates props in place; keys match children across renders.", "Keys must be stable and unique among siblings — index keys corrupt state on reorder/delete.", "Fiber makes rendering interruptible so React can prioritise urgent updates.", "Push back gently on 'virtual DOM is fast' — it's about a predictable programming model, not raw speed."] ,
    trap: "They ask if the virtual DOM is faster than direct DOM manipulation. It isn't — hand-tuned DOM updates are faster. It buys you a declarative model, and saying that honestly scores better than repeating the marketing line." },
  { id: "RCT-02", cat: "RCT", lv: "basic", q: "Explain useState. Why is state updating asynchronous?",
    a: ["setState schedules a re-render; React batches updates within an event/microtask (automatic batching in 18 for timeouts and promises too).", "Use the functional form setX(prev => prev + 1) when the next value depends on the previous.", "State is per-component-instance and preserved by position in the tree — remounting resets it.", "Lazy init: useState(() => expensiveCompute()) runs only on mount."] ,
    trap: "They log state immediately after calling the setter and ask why it's stale. If your answer is 'setState is async' without explaining the closure over the current render, it's incomplete." },
  { id: "RCT-03", cat: "RCT", lv: "mid", q: "useEffect: dependency array, cleanup, and the common mistakes.",
    a: ["Runs after paint; [] means once on mount; no array means every render.", "Cleanup runs before the next effect and on unmount — cancel subscriptions, timers, aborts.", "Mistakes: missing deps causing stale closures, objects/functions in deps causing loops, fetching in effects instead of a data library.", "StrictMode double-invokes effects in dev to surface missing cleanup.", "Know when NOT to use an effect: derived state, event handlers, and resetting state on prop change (use a key)."] ,
    trap: "'Why does my effect run twice in development?' StrictMode double-invoking to surface missing cleanup. Candidates who 'fix' it by removing StrictMode are hiding a real bug." },
  { id: "RCT-04", cat: "RCT", lv: "mid", q: "useMemo vs useCallback vs React.memo — when is memoisation actually worth it?",
    a: ["useMemo caches a value; useCallback caches a function identity; React.memo skips re-render on shallow-equal props.", "Only helps if the child is expensive or the prop identity leaks into a dep array.", "Memoising everything costs memory and comparison time — measure with the Profiler first.", "React Compiler (19) automates much of this; say that you'd still write stable data shapes.", "Note that memo is defeated by children as JSX props unless those are memoised too."] ,
    trap: "Follow-up: does useCallback prevent the function from being recreated? No — the function literal is still created every render; useCallback only preserves which reference is returned." },
  { id: "RCT-05", cat: "RCT", lv: "mid", q: "useRef — three distinct uses.",
    a: ["DOM access (focus, measure, scroll), mutable instance values that don't trigger renders (timer ids, previous value), and latest-value refs to avoid stale closures.", "Mutating ref.current does not re-render — that's the whole point.", "useImperativeHandle + forwardRef to expose a controlled API from a child.", "Ref callbacks fire with the node on mount and null on unmount."] ,
    trap: "They ask why updating a ref doesn't re-render, then ask how you'd show a value that changes often without re-rendering. Refs plus a direct DOM write is the answer they're fishing for." },
  { id: "RCT-06", cat: "RCT", lv: "mid", q: "useReducer vs useState — when do you switch?",
    a: ["Switch when the next state depends on several fields, transitions are rule-based, or logic is worth unit-testing separately.", "Reducers make state machines explicit and keep dispatch identity stable across renders.", "Pair with a discriminated union action type for exhaustive handling.", "Compare to Redux: same idea, plus a global store, middleware and devtools."] ,
    trap: "'Why not just use several useStates?' Because related fields can go out of sync and each setter triggers its own logic path. They want to hear about invalid intermediate states." },
  { id: "RCT-07", cat: "RCT", lv: "mid", q: "Context API — how it works and why it can hurt performance.",
    a: ["Provider value change re-renders every consumer regardless of which slice they read.", "Fixes: split contexts by update frequency, memoise the value object, push state down, or use a selector-based store (zustand/redux/jotai).", "Context is dependency injection, not a state manager — say that.", "Common interview trap: does a memoised child re-render when context changes? Yes, if it consumes the context."] },
  { id: "RCT-08", cat: "RCT", lv: "hard", q: "Explain controlled vs uncontrolled components and which you pick for a large form.",
    a: ["Controlled: value comes from state, single source of truth, easy validation, but a re-render per keystroke.", "Uncontrolled: DOM owns the value, read via ref or FormData — fast for big forms.", "React Hook Form uses uncontrolled + subscriptions to avoid form-wide renders.", "Mention debouncing validation and field-level isolation for a 50-field loan application form."] ,
    trap: "They hand you a 40-field form that lags on every keystroke and ask you to fix it. If your answer is useMemo, you've missed that the whole form is re-rendering because state lives at the top." },
  { id: "RCT-09", cat: "RCT", lv: "hard", q: "How do you handle data fetching in React today?",
    a: ["Server-side or a cache library (React Query / SWR / RTK Query) rather than raw useEffect.", "You get: request dedupe, caching, background refetch, retries, pagination, optimistic updates, stale-while-revalidate.", "Handle race conditions with AbortController or an ignore flag when you do roll your own.", "Model the four states explicitly: idle, loading, error, empty — plus refetching."] ,
    trap: "'Why not just useEffect with fetch?' Race conditions, no caching, no dedupe, double-fetch in StrictMode, and refetch-on-focus you'd have to build. Listing those is the answer." },
  { id: "RCT-10", cat: "RCT", lv: "hard", q: "What are React 18's concurrent features — transitions, useDeferredValue, Suspense?",
    a: ["startTransition marks an update as interruptible so typing stays responsive while a heavy list re-renders.", "useDeferredValue gives a lagging copy of a value for expensive children.", "Suspense lets a component suspend while data or code loads and shows the nearest fallback.", "Automatic batching now applies to promises, timeouts and native handlers.", "useSyncExternalStore exists so external stores stay tear-free under concurrent rendering."] ,
    trap: "Difference between startTransition and a setTimeout? A transition is interruptible and keeps the old UI visible; a timeout just delays the same blocking render." },
  { id: "RCT-11", cat: "RCT", lv: "hard", q: "What are Server Components and how do they differ from SSR?",
    a: ["RSCs render only on the server and ship a serialised tree — zero JS for that component, direct DB access allowed.", "SSR renders client components to HTML then hydrates; RSC avoids hydration entirely for server parts.", "'use client' marks the boundary; props crossing it must be serialisable (no functions).", "Server Actions let a form post directly to a server function.", "Trade-off: no state, effects or browser APIs in server components."] ,
    trap: "They ask if you can use useState in a server component. No — and knowing the error you'd get, plus that a 'use client' boundary is the fix, shows you've actually built with RSC." },
  { id: "RCT-12", cat: "RCT", lv: "mid", q: "Error boundaries — what do they catch and what do they miss?",
    a: ["Class components with componentDidCatch / getDerivedStateFromError catch render, lifecycle and constructor errors of children.", "They do NOT catch event handlers, async code, SSR, or errors in the boundary itself.", "Pair with a global error hook and Sentry; give a retry/reset path, not just a sad face.", "react-error-boundary is the standard wrapper; mention resetKeys."] ,
    trap: "'Will your error boundary catch a failed fetch inside an onClick?' No. Async and event-handler errors escape it entirely — that's the most common misconception about boundaries." },
  { id: "RCT-13", cat: "RCT", lv: "mid", q: "Custom hooks — rules of hooks and how you'd extract one.",
    a: ["Only call hooks at the top level and only from React functions — because React tracks them by call order in a linked list.", "A custom hook is just a function using hooks; it shares logic, not state.", "Good extractions: useDebounce, usePagination, useLocalStorage, usePermissions, useApi.", "Name and return shape matter: return a tuple for two values, an object for more."] ,
    trap: "Why can't you call a hook inside an if? Because React matches hooks by call index across renders — a conditional call shifts every subsequent hook's state." },
  { id: "RCT-14", cat: "RCT", lv: "hard", q: "How would you render a list of 50,000 rows?",
    a: ["Virtualisation with react-window / TanStack Virtual — render only the visible window plus overscan.", "Variable heights need measurement caching; sticky headers and horizontal virtualisation add complexity.", "Combine with server-side pagination or infinite scroll and a cursor, not offset.", "Also: memoised row component, stable keys, avoid inline object props, content-visibility: auto as a CSS fallback."] ,
    trap: "Follow-up: rows have variable heights. Fixed-height virtualisation breaks, and you need measurement caching — this is where most candidates' answer stops." },
  { id: "RCT-15", cat: "RCT", lv: "mid", q: "Explain the component lifecycle in hooks terms.",
    a: ["Mount: useState init → render → refs attached → useLayoutEffect → paint → useEffect.", "Update: same minus init; cleanup of the previous effect runs before the new one.", "Unmount: all effect cleanups run.", "useLayoutEffect is synchronous before paint — use for measuring to avoid flicker; it blocks paint, so use sparingly."] ,
    trap: "When would you pick useLayoutEffect over useEffect? Measuring or synchronously mutating the DOM before paint to avoid flicker — and knowing it blocks paint is the caveat they want." },
  { id: "RCT-16", cat: "RCT", lv: "mid", q: "How do you optimise a slow React page? Give your actual checklist.",
    a: ["Profile first: React DevTools Profiler flame chart, find the widest commits.", "Cut render scope: split components, lift/lower state, memo the expensive subtrees.", "Cut payload: route-level code splitting with lazy + Suspense, tree-shake, analyse the bundle.", "Cut work: virtualise lists, debounce inputs, move heavy compute to a worker.", "Cut network: cache with React Query, prefetch on hover, paginate.", "Measure again and quote numbers — interviewers want the before/after."] ,
    trap: "They ask what you'd measure first. Any answer that starts with a fix instead of a measurement loses points — 'I'd open the Profiler and record the interaction' is the opener." },
  { id: "RCT-17", cat: "RCT", lv: "hard", q: "What causes 'Cannot update a component while rendering a different component'?",
    a: ["Calling setState of another component during render instead of in an effect or handler.", "Common with a parent-notifying child or a store subscription set up in the render body.", "Fix by moving to useEffect, an event callback, or deriving state instead of syncing it.", "Related: 'Too many re-renders' from calling a setter directly in JSX rather than passing a reference."] ,
    trap: "They show a child calling the parent's setState during render and ask for the fix. Moving it to useEffect works, but the better answer is often deriving the value instead of storing it." },
  { id: "RCT-18", cat: "RCT", lv: "mid", q: "How do you share state across a large app? Compare the options.",
    a: ["Local state → lifted state → context → external store. Escalate only when needed.", "Redux Toolkit: predictable, devtools, middleware; verbose but great for complex domain flows.", "Zustand/Jotai: minimal, selector-based, no provider hell.", "Server state belongs in React Query, not Redux — separating server cache from client UI state is the key insight."] ,
    trap: "'Where does server data live?' If you say Redux, expect a follow-up on cache invalidation, refetching and dedupe that you'd now have to hand-build." },
  { id: "RCT-19", cat: "RCT", lv: "mid", q: "What are portals and when do you need them?",
    a: ["createPortal renders into a different DOM node while keeping React tree context and event bubbling.", "Needed for modals, tooltips, dropdowns escaping overflow:hidden or stacking contexts.", "Remember focus trapping, aria-modal, Escape handling and returning focus on close.", "Events still bubble through the React tree, which surprises people — mention it."] ,
    trap: "Do events from a portal bubble to the React parent or the DOM parent? The React tree parent — which surprises people writing click-outside handlers." },
  { id: "RCT-20", cat: "RCT", lv: "hard", q: "Explain hydration and hydration mismatches.",
    a: ["Hydration attaches listeners to server-rendered HTML; React expects an identical tree.", "Mismatch causes: Date.now(), Math.random(), locale formatting, window checks, browser extensions.", "Fixes: render client-only bits after mount, useId for stable ids, suppressHydrationWarning as a last resort.", "React 18 hydration is selective and can happen out of order with Suspense."] ,
    trap: "They ask why `new Date().toLocaleString()` in a component breaks SSR. Server and client render different strings, so hydration mismatches — render it after mount instead." },
  { id: "RCT-21", cat: "RCT", lv: "basic", q: "Why do we need keys in lists and why is index a bad key?",
    a: ["Keys let React match children between renders instead of comparing by position.", "Index keys break on insert/delete/reorder: state and DOM stay attached to the wrong item.", "Index is acceptable only for static, never-reordered lists.", "Interview demo: a list of inputs where deleting the first row keeps the wrong typed value."] ,
    trap: "They show a list of inputs with index keys, delete the first item, and ask why the typed values shift. That live demo is the question." },
  { id: "RCT-22", cat: "RCT", lv: "mid", q: "Compound components, render props and HOCs — what's the trade-off?",
    a: ["HOC: wraps and injects props; problems with ref forwarding, displayName and wrapper hell.", "Render props: flexible but nests deeply.", "Hooks replaced most of both for logic reuse.", "Compound components (<Tabs><Tabs.List/></Tabs>) share implicit state via context — best for design-system APIs."] ,
    trap: "Why did hooks replace HOCs? Composition without wrapper nesting, no prop-name collisions, and clear data flow. 'Hooks are newer' is not an answer." },
  { id: "RCT-23", cat: "RCT", lv: "hard", q: "How do you implement optimistic UI updates safely?",
    a: ["Apply the change locally, keep the previous snapshot, fire the mutation, roll back on error.", "React Query: onMutate → cancelQueries → setQueryData → context; onError rolls back; onSettled invalidates.", "useOptimistic in React 19 for form actions.", "Discuss where optimism is unsafe: money movement, irreversible approvals — show a pending state instead."] ,
    trap: "They ask whether you'd apply optimistic UI to a loan disbursement. No — irreversible money movement needs a pending state. Applying it everywhere shows poor judgement." },
  { id: "RCT-24", cat: "RCT", lv: "mid", q: "How does React handle events? What's synthetic about SyntheticEvent?",
    a: ["React attaches listeners at the root container (React 17+) and dispatches a normalised event object.", "Gives consistent cross-browser behaviour and lets React batch updates.", "Pooling was removed in 17, so e.persist() is no longer needed.", "Native listeners added via ref bypass React's system — order matters when mixing."] ,
    trap: "'Why does e.target differ from e.currentTarget?' target is where it originated, currentTarget is where the handler is attached. Delegation depends on knowing this." },
  { id: "RCT-25", cat: "RCT", lv: "hard", q: "Design a reusable, accessible Modal component. What's your API?",
    a: ["Props: isOpen, onClose, title, size, closeOnOverlayClick, initialFocusRef, children.", "Portal to body, focus trap, restore focus on close, Escape to close, aria-modal + role=dialog + labelledby.", "Lock body scroll without layout shift (padding-right = scrollbar width).", "Animate with a transition and respect prefers-reduced-motion.", "Bonus: stacked modals and how you manage z-index / a modal manager."] ,
    trap: "They ask what happens to the page behind the modal. If scroll locking, focus trapping and inert content aren't in your answer, you've described a styled div, not a dialog." },
  { id: "RCT-26", cat: "RCT", lv: "mid", q: "What is prop drilling and every way to avoid it?",
    a: ["Passing props through components that don't use them.", "Options: composition (pass JSX as children), context, external store, or restructuring the tree.", "Composition first — it's the cheapest and avoids re-render fan-out.", "Say when drilling two levels is fine: don't add infrastructure for a small tree."] ,
    trap: "They ask why you wouldn't just put everything in context. Because every consumer re-renders on any change, and context makes component reuse harder — it's DI, not a store." },
  { id: "RCT-27", cat: "RCT", lv: "hard", q: "How does React's batching work and when does it not batch?",
    a: ["React 18 batches all updates including promises, setTimeout and native handlers via createRoot.", "flushSync forces a synchronous render — needed before measuring the DOM.", "Legacy ReactDOM.render batched only React event handlers.", "Batching is why reading state right after setState gives the old value."] ,
    trap: "They ask how you'd read the DOM immediately after a state update. flushSync — and knowing it's an escape hatch with a perf cost, not a default, is the follow-up." },
  { id: "RCT-28", cat: "RCT", lv: "mid", q: "How do you test React components?",
    a: ["React Testing Library: query by role/label like a user, avoid testing implementation details.", "userEvent over fireEvent; findBy* for async; MSW to mock the network at the HTTP layer.", "Test behaviour and accessibility, not internal state.", "Cover: renders data, handles error state, disables submit while pending, fires the right callback."] ,
    trap: "'How do you test that a button is disabled while submitting?' If you reach for the component's internal state instead of the rendered disabled attribute, you're testing implementation." },
  { id: "RCT-29", cat: "RCT", lv: "hard", q: "Explain a stale closure bug and how you'd fix it.",
    a: ["A callback captures the values from the render it was created in; if deps are missing, it keeps reading old state.", "Classic: setInterval in useEffect([]) always logging the initial count.", "Fixes: functional setState, correct deps, a ref holding the latest value, or useEventCallback pattern.", "This is one of the highest-signal React questions at 2+ YOE — be able to write both the bug and the fix."] ,
    trap: "They write a setInterval in useEffect([]) that logs count and ask why it always prints 0. Explaining the captured closure — not 'React is weird' — is the pass condition." },
  { id: "RCT-30", cat: "RCT", lv: "mid", q: "How do you structure a large React codebase?",
    a: ["Feature-first folders over type-first: features/loans/{components,hooks,api,types}.", "Shared layer for design system, utils, and api client; keep imports one-directional.", "Barrel files sparingly — they hurt tree-shaking and create cycles.", "Conventions: colocate tests, absolute imports, lint rules for boundaries (eslint-plugin-boundaries)."] ,
    trap: "They ask about barrel files. If you recommend index.ts everywhere without mentioning the tree-shaking and circular-import cost, that's an untested habit." },

  /* ---------------- NEXT.JS / ANGULAR ---------------- */
  { id: "FWK-01", cat: "FWK", lv: "basic", q: "CSR vs SSR vs SSG vs ISR — pick one for a dashboard, a marketing site and a product catalogue.",
    a: ["CSR: fast deploys, poor SEO/TTFB — fine for an authed dashboard.", "SSR: fresh per request, better SEO, higher server cost — good for personalised pages.", "SSG: prebuilt HTML, best performance — marketing/docs.", "ISR: static plus timed or on-demand revalidation — catalogues with thousands of pages.", "Tie the choice to data freshness, SEO need and traffic shape."] },
  { id: "FWK-02", cat: "FWK", lv: "mid", q: "Next.js App Router vs Pages Router — what actually changed?",
    a: ["App Router: server components by default, nested layouts, streaming with Suspense, route handlers, server actions.", "Data fetching moved from getServerSideProps/getStaticProps to async components plus fetch caching options.", "File conventions: layout, page, loading, error, not-found, template.", "Caching layers to explain: request memoisation, Data Cache, Full Route Cache, Router Cache."] },
  { id: "FWK-03", cat: "FWK", lv: "mid", q: "How does Next.js image and font optimisation work, and why does it matter?",
    a: ["next/image: responsive srcset, lazy loading, modern formats, and required width/height or fill to reserve space (kills CLS).", "priority + preload for the LCP image; placeholder=blur for perceived speed.", "next/font self-hosts and inlines font CSS, removing a render-blocking request and layout shift from swap.", "Connect to Core Web Vitals: LCP and CLS are usually image/font problems."] },
  { id: "FWK-04", cat: "FWK", lv: "hard", q: "How do you do auth in Next.js App Router?",
    a: ["httpOnly, Secure, SameSite cookies for the session; never localStorage for tokens.", "Middleware for coarse route protection at the edge; verify properly in the server component or route handler.", "Server actions must re-check authorisation — they are public endpoints.", "Refresh token rotation, and how you propagate the session to server components (cookies() API)."] },
  { id: "FWK-05", cat: "FWK", lv: "mid", q: "What is streaming SSR and what problem does it solve?",
    a: ["The server flushes HTML in chunks so the shell paints before slow data resolves.", "Suspense boundaries define what streams; loading.tsx is a route-level boundary.", "Improves TTFB and FCP without waiting on the slowest query.", "Trade-off: harder error handling and status codes are already sent."] },
  { id: "FWK-06", cat: "FWK", lv: "mid", q: "Explain Angular change detection and how it differs from React.",
    a: ["Zone.js patches async APIs and triggers a check of the component tree after any task.", "Default strategy checks every binding; OnPush only checks on input reference change, events, or async pipe emissions.", "Signals (v16+) enable fine-grained, zoneless reactivity — the direction Angular is moving.", "React re-renders subtrees explicitly on state change; Angular checks bindings dirty-style."] },
  { id: "FWK-07", cat: "FWK", lv: "mid", q: "RxJS: explain switchMap vs mergeMap vs concatMap vs exhaustMap with a use case each.",
    a: ["switchMap: cancel previous — typeahead search.", "mergeMap: run all in parallel — independent uploads.", "concatMap: queue in order — sequential writes.", "exhaustMap: ignore new while active — login button double-click.", "Also cover: unsubscribe with takeUntilDestroyed/async pipe to avoid leaks."] },
  { id: "FWK-08", cat: "FWK", lv: "mid", q: "Angular dependency injection — providers, hierarchical injectors, and providedIn: 'root'.",
    a: ["Injector tree mirrors the module/component tree; the nearest provider wins.", "providedIn: 'root' gives a tree-shakeable singleton.", "Component-level providers create a new instance per component — used for per-form state.", "Tokens for non-class values (InjectionToken) and useClass/useValue/useFactory."] },
  { id: "FWK-09", cat: "FWK", lv: "hard", q: "How do you migrate or coexist between two frameworks in one product?",
    a: ["Strangler pattern: route-level split behind a reverse proxy, migrate page by page.", "Share design tokens and an auth/session layer; avoid sharing runtime state.", "Micro-frontends via Module Federation if teams must deploy independently — call out the bundle duplication and version-skew costs.", "Give the honest answer: prefer one framework unless team autonomy genuinely demands otherwise."] },
  { id: "FWK-10", cat: "FWK", lv: "mid", q: "How does routing work — client-side navigation, code splitting, and route guards?",
    a: ["The router intercepts clicks, pushes history state and swaps the view without a document load.", "Lazy routes split the bundle; prefetch on hover or viewport for perceived instant navigation.", "Guards: redirect unauthenticated users, block navigation on dirty forms (beforeunload for full reloads).", "Preserve scroll position and handle back/forward with popstate."] },
  { id: "FWK-11", cat: "FWK", lv: "mid", q: "What is hydration cost and how do partial/progressive hydration help?",
    a: ["Hydration re-runs component code on the client, so a big page can be interactive far later than it looks ready.", "Islands architecture hydrates only interactive parts; RSC ships no JS for server parts.", "Measure with TBT and INP, not just FCP.", "Astro/Qwik use resumability — worth naming to show breadth."] },
  { id: "FWK-12", cat: "FWK", lv: "hard", q: "How do you handle environment config and secrets in a Next.js app?",
    a: ["NEXT_PUBLIC_* is inlined into the client bundle — anything there is public.", "Server-only secrets stay unprefixed and are read in server components/route handlers; add 'server-only' import guard.", "Runtime vs build-time config: build-time inlining breaks per-environment Docker images.", "Rotate via the platform's secret manager, never commit .env."] },
];

const Q3 = [
  /* ---------------- HTML / CSS / LAYOUT ---------------- */
  { id: "CSS-01", cat: "CSS", lv: "basic", q: "Explain the box model and box-sizing.",
    a: ["content → padding → border → margin; width applies to content by default.", "box-sizing: border-box makes width include padding and border — the standard global reset.", "Margins collapse vertically between siblings and parent/first-child; padding and flex/grid gaps do not.", "Know that percentage padding resolves against the parent's width, even vertically."] },
  { id: "CSS-02", cat: "CSS", lv: "basic", q: "Position values: static, relative, absolute, fixed, sticky.",
    a: ["absolute positions against the nearest positioned ancestor; fixed against the viewport (unless an ancestor has transform/filter/will-change, which creates a containing block).", "sticky needs a threshold (top/bottom) and a scrolling ancestor without overflow:hidden.", "relative offsets visually but keeps its layout space.", "That transform-breaks-fixed gotcha is a favourite senior question."] },
  { id: "CSS-03", cat: "CSS", lv: "mid", q: "Flexbox vs Grid — how do you choose?",
    a: ["Flex is one-dimensional content-driven; Grid is two-dimensional layout-driven.", "flex: 1 is shorthand for 1 1 0%; flex-basis vs width and why min-width:0 fixes overflowing flex children.", "Grid: template areas, minmax, auto-fit vs auto-fill, subgrid.", "Answer with a real layout: app shell in Grid, toolbar in Flex."] },
  { id: "CSS-04", cat: "CSS", lv: "mid", q: "How does CSS specificity and the cascade work?",
    a: ["Order: origin/importance → specificity (inline, id, class/attr/pseudo-class, element) → source order.", "!important overrides everything except a later !important with higher specificity — avoid it.", "Layers (@layer) let you order stylesheets deliberately; :where() has zero specificity, :is() takes its most specific arg.", "Explain how utility CSS (Tailwind) sidesteps specificity wars."] },
  { id: "CSS-05", cat: "CSS", lv: "mid", q: "What creates a stacking context and how does z-index really work?",
    a: ["z-index only works on positioned or flex/grid items; it's scoped to the parent stacking context.", "Contexts are created by: root, position + z-index, opacity < 1, transform, filter, will-change, isolation: isolate.", "A child can never escape its parent's stacking order — hence z-index: 9999 not working.", "Use isolation: isolate to contain a component's layering."] },
  { id: "CSS-06", cat: "CSS", lv: "mid", q: "How do you build a responsive layout without a framework?",
    a: ["Mobile-first min-width media queries, fluid type with clamp(), grid auto-fit with minmax.", "Container queries for component-level responsiveness — the real modern answer.", "Logical properties (inline/block) for RTL support.", "Test with the actual breakpoints of your users' devices, not arbitrary ones."] },
  { id: "CSS-07", cat: "CSS", lv: "mid", q: "What causes layout shift and how do you prevent it?",
    a: ["Images without dimensions, ads/embeds, web fonts swapping, content injected above the fold, animating width/height/top.", "Fix: aspect-ratio and width/height attrs, font-display: optional or size-adjust, skeletons matching final size, reserve space for banners.", "Animate only transform and opacity — they skip layout and paint.", "CLS is a Core Web Vital; quote it in the answer."] },
  { id: "CSS-08", cat: "CSS", lv: "hard", q: "Explain browser rendering: from HTML to pixels.",
    a: ["Parse HTML → DOM, CSS → CSSOM, combine into the render tree, layout (reflow), paint, composite.", "Reflow is triggered by geometry changes and reading offsetHeight/getBoundingClientRect mid-write (layout thrashing).", "Batch reads then writes, or use requestAnimationFrame / ResizeObserver.", "Compositor-only properties (transform, opacity) run off the main thread — that's why they're smooth."] },
  { id: "CSS-09", cat: "CSS", lv: "mid", q: "Compare CSS Modules, CSS-in-JS, Tailwind and plain BEM.",
    a: ["CSS Modules: scoped, zero runtime, build-time — safe default.", "CSS-in-JS: dynamic theming and colocation, but runtime cost and RSC friction (styled-components needs a client boundary).", "Tailwind: no naming, tiny production CSS, consistent scale; readability complaints and the need for component extraction.", "BEM: works anywhere, relies on discipline.", "Give your opinion and the reason — interviewers want a position, not a survey."] },
  { id: "CSS-10", cat: "CSS", lv: "basic", q: "Semantic HTML — why does it matter beyond SEO?",
    a: ["Landmarks (header/nav/main/aside/footer) give screen readers a navigable structure.", "Native elements bring free keyboard behaviour, focus and states: button, a, label, details, dialog.", "div soup means reimplementing accessibility badly.", "One h1 per page and a logical heading order."] },
  { id: "CSS-11", cat: "CSS", lv: "mid", q: "What are the key accessibility rules you actually apply?",
    a: ["Keyboard reachable and visible focus (never outline: none without a replacement).", "Labels tied to inputs, error messages linked with aria-describedby and role=alert.", "Contrast ratio 4.5:1 for body text; don't encode meaning in colour alone.", "ARIA only when native semantics don't exist — the first rule of ARIA is don't use ARIA.", "Test with keyboard-only, VoiceOver/NVDA, and axe DevTools."] },
  { id: "CSS-12", cat: "CSS", lv: "hard", q: "How would you implement dark mode properly?",
    a: ["CSS custom properties for semantic tokens (--surface, --text-muted), swapped by a data-theme attribute or class.", "Respect prefers-color-scheme by default, allow an override, persist the choice.", "Prevent the flash: inline a blocking script that sets the attribute before first paint.", "color-scheme property fixes native form controls and scrollbars."] },
  { id: "CSS-13", cat: "CSS", lv: "mid", q: "Pseudo-classes vs pseudo-elements — and the useful modern selectors.",
    a: ["::before/::after create generated content boxes (need content:); :hover/:focus-visible/:nth-child match states.", ":focus-visible for keyboard-only rings, :focus-within for parent styling, :has() as the parent selector.", ":nth-child vs :nth-of-type difference.", "Content in ::before is invisible to some assistive tech — never put meaning there."] },
  { id: "CSS-14", cat: "CSS", lv: "mid", q: "How do you truncate text on one line and on multiple lines?",
    a: ["Single line: overflow hidden + white-space nowrap + text-overflow ellipsis (needs a constrained width).", "Multi-line: display -webkit-box, -webkit-line-clamp, -webkit-box-orient vertical.", "In flex/grid children add min-width: 0 or the text won't shrink.", "Always keep the full text available via title or a tooltip for accessibility."] },
  { id: "CSS-15", cat: "CSS", lv: "hard", q: "How do CSS animations and transitions differ, and how do you keep them at 60fps?",
    a: ["Transitions need a state change; animations run with keyframes and can loop independently.", "Stick to transform and opacity; avoid animating layout properties.", "will-change promotes to a layer — use sparingly, it costs memory.", "Respect prefers-reduced-motion; use the Web Animations API when you need JS control."] },
  { id: "CSS-16", cat: "CSS", lv: "basic", q: "Difference between display none, visibility hidden, opacity 0 and the hidden attribute.",
    a: ["display:none removes from layout and the accessibility tree.", "visibility:hidden keeps space, removed from a11y tree, not focusable.", "opacity:0 keeps space AND stays focusable and readable by screen readers — a common bug.", "Use the hidden attribute or aria-hidden deliberately; sr-only class for visually hidden but announced text."] },
  { id: "CSS-17", cat: "CSS", lv: "mid", q: "What is the difference between em, rem, %, vh/vw, ch and clamp?",
    a: ["em compounds from the parent's font-size; rem is relative to root — predictable for spacing scales.", "vh on mobile fights the dynamic browser chrome — use dvh/svh/lvh.", "ch for readable measure (~60–75ch line length).", "clamp(min, preferred, max) for fluid type without breakpoints."] },
  { id: "CSS-18", cat: "CSS", lv: "hard", q: "How would you build a design system's theming layer?",
    a: ["Two token tiers: primitives (color-blue-600) and semantic aliases (color-action-primary).", "Ship as CSS variables so runtime theming needs no rebuild; export the same tokens to Figma and to TS types.", "Component variants via data attributes or a class-variance-authority style API.", "Version it, document with Storybook, and add visual regression tests."] },

  /* ---------------- BROWSER / NETWORK / PERF ---------------- */
  { id: "WEB-01", cat: "WEB", lv: "basic", q: "What happens when you type a URL and press Enter?",
    a: ["URL parse → DNS (cache, resolver, root/TLD/authoritative) → TCP handshake → TLS handshake → HTTP request.", "Server responds; browser parses HTML, builds DOM/CSSOM, requests subresources, runs JS, paints.", "Mention HTTP caching, redirects, keep-alive, and HTTP/2 multiplexing.", "This is a depth probe — go as deep as they let you and pause for direction."] },
  { id: "WEB-02", cat: "WEB", lv: "mid", q: "Explain HTTP caching headers.",
    a: ["Cache-Control: max-age, s-maxage, no-cache (revalidate) vs no-store (never save), immutable, stale-while-revalidate.", "Validators: ETag with If-None-Match, Last-Modified with If-Modified-Since → 304.", "Standard strategy: hashed filenames cached for a year immutable; HTML no-cache.", "Distinguish browser cache, CDN cache and service worker cache."] },
  { id: "WEB-03", cat: "WEB", lv: "mid", q: "What is CORS and how do you debug a CORS error?",
    a: ["A browser-enforced policy; the server decides via Access-Control-Allow-Origin and friends.", "Simple vs preflighted requests — custom headers or non-simple content types trigger an OPTIONS preflight.", "Credentials require Allow-Credentials: true and an explicit origin (not *).", "Debug: check the OPTIONS response in Network, not just the failed request. Note it doesn't protect the server — Postman ignores it."] },
  { id: "WEB-04", cat: "WEB", lv: "mid", q: "Cookies vs localStorage vs sessionStorage vs IndexedDB.",
    a: ["Cookies: sent with every matching request, ~4KB, httpOnly/Secure/SameSite — the only safe place for session tokens.", "localStorage: 5–10MB, synchronous, same-origin, readable by any JS (XSS exposure).", "sessionStorage: per tab.", "IndexedDB: async, large, structured — offline data and caches."] },
  { id: "WEB-05", cat: "WEB", lv: "hard", q: "Explain Core Web Vitals and how you'd fix each one.",
    a: ["LCP < 2.5s: optimise the hero image/font, preload, cut server TTFB, avoid client-side-only rendering of the hero.", "INP < 200ms: break long tasks, defer non-critical JS, reduce hydration, use transitions.", "CLS < 0.1: reserve space for media, avoid late-injected content, stable fonts.", "Measure field data (CrUX/RUM) not just Lighthouse lab runs."] },
  { id: "WEB-06", cat: "WEB", lv: "mid", q: "How do you reduce JavaScript bundle size?",
    a: ["Analyse first (source-map-explorer / webpack-bundle-analyzer).", "Route and component-level code splitting; dynamic import for heavy libs (charts, editors, PDF).", "Replace heavy deps: moment → date-fns/Temporal, lodash → per-method imports.", "Tree-shakeable ESM builds, avoid barrel re-exports, drop polyfills for dead browsers via browserslist.", "Compression: Brotli, and preloading only what's on the critical path."] },
  { id: "WEB-07", cat: "WEB", lv: "mid", q: "Explain lazy loading and prefetching strategies.",
    a: ["loading=\"lazy\" for images, IntersectionObserver for custom cases.", "rel=preload for critical resources, prefetch for likely next routes, preconnect for third-party origins, dns-prefetch.", "Prefetch on link hover or viewport entry is the sweet spot for perceived speed.", "Don't preload everything — it competes for bandwidth with the critical path."] },
  { id: "WEB-08", cat: "WEB", lv: "hard", q: "How do WebSockets, SSE and long polling compare?",
    a: ["WebSocket: full duplex, persistent, own protocol upgrade — chat, live collaboration, trading.", "SSE: server→client only, over HTTP, auto-reconnect, simple — notifications, live status feeds.", "Long polling: universal fallback, higher overhead.", "Discuss reconnection with backoff, heartbeats, auth on the socket, and horizontal scaling with a pub/sub adapter (Redis)."] },
  { id: "WEB-09", cat: "WEB", lv: "mid", q: "HTTP/1.1 vs HTTP/2 vs HTTP/3.",
    a: ["1.1: head-of-line blocking per connection, so we used domain sharding and sprites.", "2: multiplexed streams, header compression, server push (now deprecated) — bundling matters less.", "3: QUIC over UDP, removes TCP-level head-of-line blocking, faster handshakes and connection migration.", "Practical impact: fewer hacks needed, but bundle size still matters for parse/execute time."] },
  { id: "WEB-10", cat: "WEB", lv: "mid", q: "What are service workers and how would you add offline support?",
    a: ["A proxy between the app and network with its own lifecycle: install → activate → fetch.", "Strategies: cache-first for static assets, network-first for API, stale-while-revalidate for semi-fresh data.", "Precache the app shell; handle updates and the skipWaiting/clients.claim prompt.", "Pitfalls: stale deploys, cache versioning, and debugging in an incognito-safe way."] },
  { id: "WEB-11", cat: "WEB", lv: "basic", q: "defer vs async vs module scripts.",
    a: ["async: downloads in parallel, executes as soon as ready, order not guaranteed — analytics.", "defer: parallel download, executes in order after HTML parse, before DOMContentLoaded — app code.", "type=module is deferred by default and strict-mode.", "Inline blocking scripts in head are the classic render-blocking mistake."] },
  { id: "WEB-12", cat: "WEB", lv: "mid", q: "Explain the difference between DOMContentLoaded, load, and when your app is 'ready'.",
    a: ["DOMContentLoaded: HTML parsed and deferred scripts run; images may still be loading.", "load: all subresources done.", "Neither means interactive — that's TTI/INP, driven by JS execution and hydration.", "For SPAs, define a custom 'app ready' mark and measure it with the User Timing API."] },
  { id: "WEB-13", cat: "WEB", lv: "hard", q: "How do you debug a performance issue reported only by users on slow devices?",
    a: ["Reproduce with CPU 4–6x throttling and Slow 3G in DevTools Performance panel.", "Look for long tasks (>50ms), forced reflows, excessive re-renders, big JSON parses.", "Add RUM (web-vitals library) and segment by device/network to confirm.", "Fix order: remove work, defer work, then optimise remaining work. Quote a before/after metric."] },
  { id: "WEB-14", cat: "WEB", lv: "mid", q: "What is the IntersectionObserver / ResizeObserver / MutationObserver family for?",
    a: ["IntersectionObserver: visibility without scroll listeners — lazy load, infinite scroll, impression tracking.", "ResizeObserver: element size changes without polling — responsive components, virtualised lists.", "MutationObserver: DOM changes — third-party widget integration, legacy interop.", "All are async and off the main scroll path, which is why they beat scroll/resize handlers."] },
  { id: "WEB-15", cat: "WEB", lv: "mid", q: "How does the browser handle images — formats, srcset, and when to use SVG?",
    a: ["AVIF < WebP < JPEG for size; PNG for lossless, SVG for vectors/icons.", "srcset + sizes serves the right resolution per viewport and DPR; <picture> for art direction and format fallbacks.", "Lazy load below-the-fold, eager + fetchpriority=high for LCP.", "Icons: inline SVG or a sprite, not an icon font (a11y and FOIT issues)."] },
  { id: "WEB-16", cat: "WEB", lv: "hard", q: "What are memory and performance implications of a long-lived SPA?",
    a: ["Leaks accumulate across route changes: listeners, observers, timers, cached responses, detached nodes.", "Unbounded client caches (React Query gcTime, custom stores) grow forever.", "Mitigate: cleanup in effects, cache size limits, periodic heap snapshots in QA, memory tab detached-node checks.", "Real symptom to describe: the app gets slower after an hour of use in an ops team's browser."] },
  { id: "WEB-17", cat: "WEB", lv: "mid", q: "How do you handle file uploads of large files from the browser?",
    a: ["Chunked/multipart upload with resumability, or a presigned URL straight to S3 so the file never touches your API server.", "Show progress with XHR upload events or fetch + streams; allow cancel with AbortController.", "Validate type and size client-side for UX, and again server-side for safety.", "Virus scanning, MIME sniffing and content-disposition on download."] },
  { id: "WEB-18", cat: "WEB", lv: "mid", q: "What is the difference between REST, GraphQL and tRPC from a frontend point of view?",
    a: ["REST: cacheable by URL, simple, but over/under-fetching and n+1 round trips.", "GraphQL: one round trip, client-specified shape, strong tooling — cost: caching complexity, query depth attacks, server complexity.", "tRPC: end-to-end types in a TS monorepo, no schema layer, but TS-only.", "Answer with the trade-off, then say what you'd pick for your product and why."] },

  /* ---------------- SECURITY ---------------- */
  { id: "SEC-01", cat: "SEC", lv: "mid", q: "What is XSS and how do you prevent it in a React app?",
    a: ["Injection of attacker script into your page: stored, reflected, DOM-based.", "React escapes interpolated values by default — the hole is dangerouslySetInnerHTML, href=javascript:, and injected third-party scripts.", "Sanitise with DOMPurify when rendering user HTML; validate URL schemes.", "Defence in depth: a strict Content-Security-Policy with nonces, httpOnly cookies so a token can't be stolen."] },
  { id: "SEC-02", cat: "SEC", lv: "mid", q: "What is CSRF and how is it different from XSS?",
    a: ["CSRF makes the victim's browser send an authenticated request they didn't intend; XSS runs attacker code in your origin.", "Defences: SameSite=Lax/Strict cookies, anti-CSRF tokens, checking Origin/Referer, requiring a custom header.", "Token-in-Authorization-header APIs are largely immune because the header isn't auto-attached.", "XSS defeats every CSRF defence — say that; it's the point interviewers listen for."] },
  { id: "SEC-03", cat: "SEC", lv: "mid", q: "Where do you store JWTs and why?",
    a: ["httpOnly + Secure + SameSite cookie: safe from JS theft, needs CSRF protection.", "localStorage: convenient, but any XSS drains it — avoid for real auth.", "In-memory access token + httpOnly refresh cookie is the strongest common pattern.", "Also: short expiry, rotation, revocation lists, and never putting sensitive claims in a JWT (it's readable)."] },
  { id: "SEC-04", cat: "SEC", lv: "hard", q: "Explain Content Security Policy and how you'd roll one out.",
    a: ["A header restricting which sources can load scripts, styles, frames, connect targets.", "Start in Report-Only with a reporting endpoint, review violations, then enforce.", "Avoid unsafe-inline; use nonces or hashes — Next.js supports nonce injection via middleware.", "Also mention frame-ancestors (clickjacking), HSTS, X-Content-Type-Options."] },
  { id: "SEC-05", cat: "SEC", lv: "mid", q: "OAuth 2.0 / OIDC — walk through the authorization code flow with PKCE.",
    a: ["Client redirects to the auth server with a code_challenge; user authenticates; server returns a code; client exchanges code + code_verifier for tokens.", "PKCE removes the need for a client secret in public clients (SPAs, mobile).", "Implicit flow is deprecated — say why (tokens in the URL fragment).", "Distinguish authentication (OIDC id_token) from authorization (access_token scopes)."] },
  { id: "SEC-06", cat: "SEC", lv: "mid", q: "How do you prevent sensitive data leaking from the frontend?",
    a: ["Nothing in the client is secret: bundle env vars, source maps, network calls are all visible.", "Enforce authorization on the server for every request — hiding a button is not access control.", "Mask PAN/Aadhaar/account numbers in the UI and in logs; avoid PII in analytics and error payloads.", "Disable source maps in production or upload them privately to Sentry."] },
  { id: "SEC-07", cat: "SEC", lv: "hard", q: "What is clickjacking, and how do you defend against it?",
    a: ["Your page framed invisibly over a decoy so the user clicks something they can't see.", "Defence: CSP frame-ancestors 'none' (or an allowlist); legacy X-Frame-Options.", "Frame-busting JS is unreliable.", "Relevant if your app can be embedded in a partner portal — then use an allowlist, not none."] },
  { id: "SEC-08", cat: "SEC", lv: "mid", q: "How do you handle authorization in the UI without leaking capability?",
    a: ["Server returns the user's permissions; UI renders from that, but the API enforces independently.", "Route guards + component-level <Can permission=...> wrappers; deny by default.", "Never ship admin-only code paths that reveal internal endpoints — code-split them.", "Audit-log privileged actions; think about maker-checker flows in fintech."] },
  { id: "SEC-09", cat: "SEC", lv: "mid", q: "What are the risks of third-party scripts and how do you manage them?",
    a: ["They run with full privileges in your origin: can read the DOM, cookies (non-httpOnly), and exfiltrate.", "Controls: Subresource Integrity, CSP allowlists, sandboxed iframes, loading via a tag manager with review.", "Performance cost too — they're often the biggest main-thread blocker.", "Vendor review and a kill switch matter in regulated products."] },
  { id: "SEC-10", cat: "SEC", lv: "hard", q: "Name the OWASP Top 10 items most relevant to a frontend engineer.",
    a: ["Broken access control (top item) — client-side checks aren't controls.", "Injection (XSS), identification/auth failures (session handling), security misconfiguration (headers, CORS *).", "Vulnerable components — dependency scanning, npm audit, Dependabot, lockfile discipline.", "SSRF via a naive proxy endpoint you built for the frontend."] },
];

const Q4 = [
  /* ---------------- FRONTEND SYSTEM DESIGN ---------------- */
  { id: "SD-01", cat: "SD", lv: "mid", q: "Framework: how do you attack any frontend system design round?",
    a: ["1) Clarify requirements and scope. 2) Functional + non-functional (perf, a11y, i18n, offline, scale). 3) API/data model contract. 4) Component architecture. 5) State management + caching. 6) Performance and rendering strategy. 7) Error/edge/empty states. 8) Testing, observability, rollout.", "Spend the first 5 minutes on requirements — candidates who jump to components fail here.", "State assumptions out loud and let the interviewer redirect.", "End with trade-offs and what you'd do differently at 10x scale."] ,
    trap: "The trap is starting to draw. Interviewers often score requirements-gathering separately, so the candidate who asks 'who uses this and at what scale?' first is already ahead." },
  { id: "SD-02", cat: "SD", lv: "mid", q: "Design an infinite-scrolling news feed.",
    a: ["Cursor-based pagination (not offset — items shift), API returns items + nextCursor.", "IntersectionObserver sentinel, prefetch the next page before the user hits bottom.", "Virtualise if rows are heavy; cache pages so back-navigation restores scroll position.", "Handle: new items at top (show a 'new posts' pill), duplicates, failed page loads with retry, empty and end-of-feed states.", "Media: lazy load, aspect-ratio boxes, autoplay only on viewport + muted."] ,
    trap: "They ask what happens when a new item is inserted at the top while the user is on page 3. Offset pagination duplicates or skips rows — this is why cursors exist." },
  { id: "SD-03", cat: "SD", lv: "hard", q: "Design an autocomplete / typeahead component.",
    a: ["Debounce ~200ms, cancel in-flight with AbortController, cache results per query prefix.", "Keyboard: arrow navigation, Enter select, Escape close; ARIA combobox roles and aria-activedescendant.", "Handle out-of-order responses by discarding stale ones (compare a request id).", "Server: prefix index / trie / Elasticsearch; client: minimum query length, result limit, highlight matches.", "Edge cases: no results, network error, very slow network, IME composition for non-Latin input."] ,
    trap: "They ask what happens when the response for 'ca' arrives after the response for 'car'. Without a request-id guard the user sees results for a query they've moved past." },
  { id: "SD-04", cat: "SD", lv: "hard", q: "Design a real-time collaborative dashboard (e.g. loan ops live status).",
    a: ["Transport: WebSocket or SSE for pushes; REST for the initial snapshot; reconcile with a version/seq number.", "Reconnect with exponential backoff and re-sync missed events (server buffers by last-seen id).", "Local store keyed by entity id, patch on event; avoid full refetch storms.", "Throttle UI updates (batch per animation frame) so a burst of 500 events doesn't melt the tab.", "Permissions per widget, and what a user sees when a record is updated by someone else mid-edit."] ,
    trap: "They ask what happens when 500 updates arrive in one second. Rendering each one drops frames — batching per animation frame is the expected answer." },
  { id: "SD-05", cat: "SD", lv: "hard", q: "Design a component/design system for multiple product teams.",
    a: ["Token layer → primitives → composed components → patterns; version with semver and a changelog.", "Distribution: a published package with ESM + types, tree-shakeable, no global CSS side effects.", "Governance: contribution guide, RFCs for new components, deprecation policy.", "Quality: Storybook, a11y tests, visual regression (Chromatic), bundle size budget per component.", "Adoption metric: percentage of product UI using system components."] ,
    trap: "They ask how you stop teams from forking components. Governance, not tooling: contribution path, fast review, and finding out why the component didn't fit." },
  { id: "SD-06", cat: "SD", lv: "mid", q: "Design an image gallery / media-heavy page.",
    a: ["Responsive srcset with a CDN that transforms on the fly (w/h/format/quality params).", "Blur-up placeholders (LQIP), aspect-ratio containers to prevent CLS.", "Lazy load off-screen, preload the first viewport, decode async.", "Grid virtualisation for thousands of items; lightbox with focus trap and keyboard nav.", "Fallbacks: broken image state, slow network, offline."] ,
    trap: "They ask why the page jumps as images load. Missing aspect-ratio or width/height — a CLS answer, not a loading answer." },
  { id: "SD-07", cat: "SD", lv: "hard", q: "Design a multi-step form / wizard with save-and-resume (e.g. loan application).",
    a: ["State machine per step with validation gates; a single form model persisted server-side after each step.", "Resume by loading the draft; show a progress indicator with completed/locked steps.", "Client + server validation with the same schema (zod shared, or generated from backend).", "Handle: partial saves failing, tab close (beforeunload), file uploads, conditional fields driven by a config/DSL.", "Accessibility: announce step changes, focus the heading, keep errors linked to fields."] ,
    trap: "They ask what happens if the user closes the tab at step 4. No server-side draft means total loss, which in an application funnel is a measurable revenue bug." },
  { id: "SD-08", cat: "SD", lv: "mid", q: "How do you design the frontend for i18n and localisation?",
    a: ["Extract strings to message catalogues with ICU pluralisation; never concatenate sentences.", "Locale-aware dates, numbers and currency via Intl; timezone handling on the server.", "RTL support with logical properties and a dir attribute; test with a pseudo-locale.", "Lazy load locale bundles; SEO with hreflang and localised routes."] ,
    trap: "They ask you to translate 'You have {n} loans'. Naive concatenation breaks in languages with multiple plural forms and in RTL — ICU message format is the answer." },
  { id: "SD-09", cat: "SD", lv: "hard", q: "Design a client-side caching layer for API data.",
    a: ["Key by endpoint + params; store data, timestamp, status.", "Policies: stale-while-revalidate, TTL, manual invalidation on mutation, tag-based invalidation.", "Dedupe concurrent identical requests; persist to IndexedDB for offline.", "Memory bounds and eviction (LRU); handle auth changes by clearing user-scoped keys.", "This is essentially explaining how React Query works — good to say so and then discuss the parts."] ,
    trap: "They ask how you invalidate after a mutation. 'Refetch everything' works but doesn't scale — tag-based invalidation is what they're listening for." },
  { id: "SD-10", cat: "SD", lv: "mid", q: "How do you handle feature flags and safe rollout on the frontend?",
    a: ["Flags fetched server-side to avoid flicker; default off; typed flag definitions.", "Rollout: internal → percentage → full, with a kill switch and metrics per cohort.", "Avoid flag debt: an expiry date and a cleanup ticket per flag.", "A/B testing needs stable bucketing (hash of user id) and no layout shift between variants."] ,
    trap: "They ask what happens when a flag is read client-side. The user sees the control state flip after hydration — flags must resolve server-side to avoid the flash." },
  { id: "SD-11", cat: "SD", lv: "hard", q: "Design error handling, logging and monitoring for a production frontend.",
    a: ["Error boundaries per route + a global handler; user-facing messages that say what to do next.", "Sentry with source maps, release tagging, user context (id only, no PII), breadcrumbs.", "RUM for web vitals; custom events for funnel steps; alerting on error rate and INP regressions.", "Correlate with backend via a request id header propagated from the client.", "Distinguish expected domain errors (422 validation) from unexpected ones."] ,
    trap: "They ask how you'd find the backend log for a specific user's failed request. Without a correlation id propagated from the client, you can't — and that's the point." },
  { id: "SD-12", cat: "SD", lv: "mid", q: "Micro-frontends: when are they worth it?",
    a: ["Worth it when independent teams need independent deploys on one shell, and the org boundary is real.", "Costs: duplicated dependencies, version skew, shared auth/state complexity, harder E2E testing, inconsistent UX.", "Approaches: Module Federation, iframe isolation, build-time composition, edge-side includes.", "Honest senior answer: at 2–3 teams, use a monorepo with clear boundaries instead."] ,
    trap: "They ask what you'd do at a company with three frontend teams. Recommending micro-frontends without naming the duplication and version-skew costs reads as trend-following." },
  { id: "SD-13", cat: "SD", lv: "hard", q: "Design an analytics/event tracking SDK for your own product.",
    a: ["Batch events in memory, flush on interval / size / visibilitychange with sendBeacon.", "Persist a queue to localStorage for retry after crashes; dedupe with an event id.", "Anonymous visitor id + session id; respect Do Not Track and consent.", "Keep payloads small, sample high-volume events, and never send PII.", "Ship as a tiny, side-effect-free package with an init(config) API and typed event names."] ,
    trap: "They ask what happens to queued events if the user closes the tab. Without sendBeacon on visibilitychange, the last session's data is simply lost." },
  { id: "SD-14", cat: "SD", lv: "mid", q: "How do you make a table with sorting, filtering, pagination and export scale?",
    a: ["Push sorting/filtering/pagination to the server once rows exceed a few thousand; keep the URL as the source of truth for state (shareable views).", "Column virtualisation for wide tables; sticky header and first column.", "Export: generate server-side for large sets and email/download a signed URL; client-side CSV only for small data.", "Preserve state across navigation, debounce filter inputs, and show row counts and applied-filter chips."] ,
    trap: "They ask what happens when a user exports 200,000 rows. Client-side CSV generation freezes or crashes the tab — server-side generation with a download link is the answer." },

  /* ---------------- BACKEND BASICS ---------------- */
  { id: "BE-01", cat: "BE", lv: "basic", q: "What makes an API RESTful? Design the endpoints for a loans resource.",
    a: ["Resources as nouns, HTTP verbs for actions, statelessness, correct status codes, HATEOAS in theory.", "GET /loans?status=active&cursor=..., POST /loans, GET /loans/{id}, PATCH /loans/{id}, POST /loans/{id}/disburse for a non-CRUD action.", "Status codes: 200/201/204, 400 vs 422, 401 vs 403, 409 conflict, 429 rate limit.", "Versioning (/v1 or header), pagination, filtering and consistent error envelopes."] },
  { id: "BE-02", cat: "BE", lv: "mid", q: "Explain idempotency and where you'd need an idempotency key.",
    a: ["Same request repeated has the same effect — GET/PUT/DELETE are idempotent, POST usually isn't.", "Payments/disbursements need a client-supplied Idempotency-Key stored with the result so retries don't double-charge.", "Applies to webhooks too: consumers must dedupe by event id.", "Combine with a unique DB constraint as the real guarantee, not just an application check."] },
  { id: "BE-03", cat: "BE", lv: "mid", q: "SQL vs NoSQL — and how do you pick for a given feature?",
    a: ["Relational for transactions, joins, strong consistency, evolving reporting needs — most fintech data.", "Document stores for flexible schemas and denormalised read models; key-value for caches/sessions; time-series for metrics.", "Postgres covers a lot of NoSQL needs with JSONB + GIN indexes.", "Pick by access pattern and consistency need, not by hype."] },
  { id: "BE-04", cat: "BE", lv: "mid", q: "What is an index? When does it hurt?",
    a: ["A B-tree structure that makes lookups O(log n) instead of a table scan.", "Costs write throughput and storage; too many indexes slow inserts.", "Composite index column order matters (leftmost prefix); partial and covering indexes.", "Use EXPLAIN ANALYZE to prove the index is used — that's the answer interviewers want."] },
  { id: "BE-05", cat: "BE", lv: "mid", q: "What is the N+1 query problem and how do you fix it in Django?",
    a: ["One query for the list, then one per row for a relation.", "Django: select_related for FK/one-to-one (JOIN), prefetch_related for M2M/reverse FK (second query + Python join).", "Detect with django-debug-toolbar, query count assertions in tests, or APM.", "Also relevant in GraphQL — DataLoader batching."] },
  { id: "BE-06", cat: "BE", lv: "hard", q: "Explain database transactions and isolation levels.",
    a: ["ACID; a transaction is all-or-nothing.", "Levels: read uncommitted → read committed (Postgres default) → repeatable read → serializable.", "Anomalies: dirty read, non-repeatable read, phantom read, write skew.", "Locking: SELECT ... FOR UPDATE to serialise concurrent updates on a row; deadlock risk from inconsistent lock ordering.", "Tie to a real case: two ops users approving the same facility at once."] },
  { id: "BE-07", cat: "BE", lv: "mid", q: "How does caching work server-side? Cache invalidation strategies.",
    a: ["Layers: CDN, reverse proxy, application cache (Redis), DB query cache, client cache.", "Patterns: cache-aside (most common), read-through, write-through, write-behind.", "Invalidation: TTL, event-based on write, versioned keys.", "Problems to name: stampede (use a lock or jittered TTL), stale reads, and cold start."] },
  { id: "BE-08", cat: "BE", lv: "mid", q: "When do you use a message queue?",
    a: ["Decouple slow or unreliable work from the request path: emails, PDF generation, third-party calls, webhooks.", "Gives retries with backoff, buffering under load, and independent scaling of consumers.", "Guarantees: at-least-once delivery means consumers must be idempotent; ordering needs partition keys.", "Tooling: Celery + Redis/RabbitMQ in Django, BullMQ in Node, SQS/Kafka at scale.", "Add a dead-letter queue and monitoring on queue depth."] },
  { id: "BE-09", cat: "BE", lv: "mid", q: "Explain authentication vs authorization and session vs token auth.",
    a: ["AuthN = who you are; AuthZ = what you may do.", "Sessions: server-side state, easy revocation, needs sticky sessions or a shared store.", "Tokens (JWT): stateless and scalable, but revocation is hard — short TTL plus a refresh token and a denylist.", "RBAC vs ABAC; where you enforce (middleware, service layer, row-level)."] },
  { id: "BE-10", cat: "BE", lv: "mid", q: "How do you design a webhook receiver?",
    a: ["Verify the signature (HMAC) and timestamp to prevent replay.", "Respond 2xx fast, process asynchronously via a queue.", "Dedupe by event id; handle out-of-order events with a version/timestamp.", "Retry policy on the sender side, DLQ on yours, and an admin replay tool.", "Log every raw payload for reconciliation — vital in lending/payments."] },
  { id: "BE-11", cat: "BE", lv: "hard", q: "How would you scale a read-heavy service?",
    a: ["Cache aggressively, add read replicas, denormalise hot read paths, CDN for public content.", "Watch replication lag — read-after-write needs to hit the primary or use a sticky read.", "Connection pooling (pgbouncer), query optimisation before adding hardware.", "Rate limit and add backpressure so one bad client can't take you down."] },
  { id: "BE-12", cat: "BE", lv: "mid", q: "What is the difference between horizontal and vertical scaling, and what breaks first?",
    a: ["Vertical: bigger machine, simple, hard ceiling. Horizontal: more machines, needs statelessness.", "Usually the database is the first bottleneck, then shared state (sessions, in-memory caches, cron jobs running on every instance).", "Solutions: externalise state, distributed locks for singleton jobs, sharding as a last resort.", "Mention observability so you know which component is actually saturated."] },
  { id: "BE-13", cat: "BE", lv: "mid", q: "Explain Django's request lifecycle and middleware.",
    a: ["WSGI/ASGI → middleware stack (request phase) → URL resolver → view → response back through middleware.", "Middleware for auth, CORS, logging, request ids, tenant resolution.", "Signals vs explicit service calls — signals are implicit and hard to trace; prefer explicit for business logic.", "Where transactions sit (ATOMIC_REQUESTS vs explicit atomic blocks)."] },
  { id: "BE-14", cat: "BE", lv: "mid", q: "How do you handle DB migrations safely in production?",
    a: ["Backwards-compatible, multi-step: add nullable column → backfill in batches → start writing → make non-null → drop old.", "Never rename/drop in the same deploy as the code change.", "Avoid long locks: create indexes concurrently, batch updates, set lock timeouts.", "Test on a production-sized copy; have a rollback plan that doesn't require restoring a backup."] },
  { id: "BE-15", cat: "BE", lv: "hard", q: "Design the data model for a loan/facility management system.",
    a: ["Core entities: Borrower, Facility, Loan, Disbursement, RepaymentSchedule, Transaction, Document, AuditLog.", "Money as integer minor units; every financial mutation as an immutable ledger entry, never an in-place balance edit.", "Status as a state machine with allowed transitions, plus a status_history table.", "Soft delete vs archival; effective-dated records for rate/limit changes.", "Explain why derived aggregates (daily stats) live in a separate denormalised table."] },
  { id: "BE-16", cat: "BE", lv: "mid", q: "Node.js: how does it handle concurrency? What is the event loop's relationship to libuv?",
    a: ["Single-threaded JS with an event loop; I/O is offloaded to libuv (thread pool for fs, dns, crypto, zlib).", "Phases: timers → pending callbacks → poll → check (setImmediate) → close; process.nextTick and microtasks drain between phases.", "CPU-bound work blocks everything — use worker_threads or a separate service.", "Cluster module / PM2 to use all cores."] },
  { id: "BE-17", cat: "BE", lv: "mid", q: "How do you rate limit an API and why?",
    a: ["Protect from abuse and accidental floods; algorithms: fixed window, sliding window, token bucket, leaky bucket.", "Implement in Redis with an atomic INCR + TTL or a Lua script.", "Return 429 with Retry-After; the client should back off with jitter.", "Different limits per plan, per endpoint, per IP vs per user."] },
  { id: "BE-18", cat: "BE", lv: "hard", q: "What is eventual consistency and where have you had to design around it?",
    a: ["Replicas/derived stores converge over time; reads may be stale.", "Frontend implications: after a write, either read from the primary, use the mutation response, or optimistically update.", "Search indexes, analytics tables and caches are almost always eventually consistent.", "Design the UX for it: show 'processing' states rather than pretending the data is final."] },
];

const Q5 = [
  /* ---------------- MACHINE CODING ---------------- */
  { id: "MC-01", cat: "MC", lv: "mid", q: "Implement debounce with leading, trailing and cancel options.",
    a: ["Close over a timer id; clear and reset on each call; invoke with the last args and correct this.", "Leading: invoke immediately if no timer is pending. Trailing: invoke on timeout.", "Return the function with .cancel() and .flush() attached.", "Interviewer follow-up: make it return a promise resolving with the eventual result."] ,
    trap: "They ask you to add a cancel method mid-implementation. If your timer id isn't in an accessible closure scope, you have to restructure live — plan for it up front." },
  { id: "MC-02", cat: "MC", lv: "mid", q: "Implement throttle.",
    a: ["Timestamp approach: store lastCall, invoke if now - lastCall >= wait.", "Timer approach: set a flag, clear it after wait; add a trailing call for the last event.", "Must forward args and this.", "Say which variant you'd use for a scroll handler and why."] ,
    trap: "'Should the last event fire?' With a pure timestamp throttle it's dropped. Asking whether they want a trailing call before coding is exactly the clarification they're grading." },
  { id: "MC-03", cat: "MC", lv: "mid", q: "Implement deepClone handling cycles, Date, Map, Set and arrays.",
    a: ["Recurse over own keys; use a WeakMap seen-cache to handle circular references.", "Branch on Array, Date, Map, Set, RegExp; copy symbols with Reflect.ownKeys.", "Preserve the prototype with Object.create(Object.getPrototypeOf(obj)).", "Mention structuredClone as the built-in and when hand-rolling is still needed."] ,
    trap: "They add a circular reference to the test object. Without a WeakMap seen-cache your function stack-overflows in front of them." },
  { id: "MC-04", cat: "MC", lv: "mid", q: "Implement a Promise polyfill (or at least Promise.all and Promise.race).",
    a: ["all: counter of resolved, results array by index, resolve when count === length, reject on first error; handle the empty array.", "race: attach then to every promise, first settle wins.", "allSettled: map each to a promise that never rejects.", "For the full polyfill: states, callback queues, then returning a new promise, and async resolution via queueMicrotask."] ,
    trap: "They pass an empty array to your Promise.all. If it doesn't resolve immediately with [], the counter never reaches zero and it hangs forever." },
  { id: "MC-05", cat: "MC", lv: "hard", q: "Implement a function that flattens a deeply nested array and one that flattens an object.",
    a: ["Array: recursion or an iterative stack; support a depth arg like Array.prototype.flat.", "Object flatten: build dotted paths recursively — {a:{b:1}} → {'a.b':1}; handle arrays with [0] notation.", "Watch for circular refs and very deep nesting (stack overflow → go iterative).", "Follow-up: write the unflatten."] ,
    trap: "They ask for flatten with a depth argument, then ask you to do it without recursion. The iterative stack version is the follow-up they're building toward." },
  { id: "MC-06", cat: "MC", lv: "mid", q: "Implement memoize with a custom cache key resolver.",
    a: ["Map keyed by JSON.stringify(args) or a resolver function; return cached value on hit.", "Use a WeakMap when the key is an object to avoid leaks.", "Add max size + LRU eviction and optional TTL.", "Discuss when memoisation is wrong: non-pure functions, huge key space."] ,
    trap: "They ask what happens with an object argument. JSON.stringify key ordering isn't guaranteed across differently-ordered literals — and it can't key on identity at all." },
  { id: "MC-07", cat: "MC", lv: "mid", q: "Implement an EventEmitter (on, off, once, emit).",
    a: ["Map of event → array/Set of listeners.", "once wraps the handler and removes itself after invoking.", "off must remove the exact reference — return an unsubscribe function from on for convenience.", "Copy the listener array before emitting so handlers that unsubscribe don't skip others."] ,
    trap: "They call off() inside a handler during emit. If you iterate the live array, you skip the next listener — copying before iterating is the fix." },
  { id: "MC-08", cat: "MC", lv: "hard", q: "Build a Star Rating component (hover, keyboard, half-stars, accessible).",
    a: ["State: value + hoverValue; render from Math.max of the two.", "Keyboard: radiogroup semantics, arrow keys change value, aria-checked on each option.", "Half stars via a clipped overlay or two half-width hit targets.", "Props: value, onChange, readOnly, max, size. Controlled and uncontrolled support."] ,
    trap: "They ask you to make it keyboard accessible after you've built it with divs and onMouseEnter. Starting from radio semantics saves the rewrite." },
  { id: "MC-09", cat: "MC", lv: "mid", q: "Build a Tabs component with keyboard support.",
    a: ["role=tablist/tab/tabpanel, aria-selected, aria-controls, tabindex roving (-1 for inactive).", "Arrow keys move focus, Home/End jump, activation manual or automatic.", "Lazy-mount panels but preserve state if needed; animate the active indicator with transform.", "Compound API: <Tabs value onChange><Tabs.List><Tabs.Tab/>…"] ,
    trap: "They ask what Arrow keys should do — move focus, or move focus and activate? Automatic activation is the ARIA default for tabs, and knowing there's a choice is the signal." },
  { id: "MC-10", cat: "MC", lv: "hard", q: "Build an accordion / nested comments tree renderer.",
    a: ["Recursive component with a depth prop for indentation; keys from stable ids.", "Collapse state in a Set of open ids, lifted to the parent for expand-all.", "Virtualise or lazy-load children beyond a depth for large threads.", "Accessibility: button with aria-expanded controlling the region."] ,
    trap: "They give you a thread 8 levels deep with 5,000 comments. Pure recursion re-renders the whole tree on any change — memoised nodes and collapsed subtrees are the expected answer." },
  { id: "MC-11", cat: "MC", lv: "mid", q: "Build a countdown timer / stopwatch that stays accurate.",
    a: ["Don't accumulate setInterval drift — compute from Date.now() deltas against a start timestamp.", "Handle tab throttling in background (timers clamp to 1s+) by recomputing on visibilitychange.", "Clean up in useEffect return; pause/resume by storing elapsed.", "Format with padStart and avoid re-rendering the whole tree — isolate the ticking node."] ,
    trap: "They background the tab for a minute and ask why the timer drifted. setInterval is throttled when hidden — computing from timestamps is the only correct approach." },
  { id: "MC-12", cat: "MC", lv: "hard", q: "Build a drag-and-drop reorderable list.",
    a: ["HTML5 DnD (dragstart/dragover/drop) or pointer events for full control on touch.", "Track dragged index and hovered index; reorder immutably on drop.", "Accessibility: keyboard alternative (grab with Space, move with arrows), announce with aria-live.", "Performance: transform-based movement, avoid re-render per mousemove."] ,
    trap: "They ask how it works on mobile. HTML5 drag-and-drop doesn't fire on touch — if you built on dragstart, your solution doesn't work on half the devices." },
  { id: "MC-13", cat: "MC", lv: "mid", q: "Implement a polyfill for Array.prototype.map / filter / reduce and Function.prototype.bind.",
    a: ["map: iterate with a for loop, skip holes with `i in this`, pass (value, index, array) and thisArg.", "reduce: handle the no-initial-value case and throw on an empty array with no seed.", "bind: return function that uses apply with the bound this and concatenated args; support new via a prototype-linked check.", "Always coerce this to Object(this) and read length as >>> 0 if they want spec fidelity."] ,
    trap: "Their test array has a hole (`[1, , 3]`). Spec-compliant map skips it; a naive loop turns it into undefined. That's the detail being checked." },
  { id: "MC-14", cat: "MC", lv: "hard", q: "Build a client-side data table: sort, multi-filter, pagination, row selection.",
    a: ["Derive the visible rows with useMemo: filter → sort → slice; keep raw data untouched.", "Sort comparator per column type; stable sort; tri-state toggle (asc/desc/none).", "Selection as a Set of ids; header checkbox with indeterminate state.", "URL sync for shareable state; empty and loading skeleton states; sticky header.", "Say when you'd move it server-side (>5–10k rows)."] ,
    trap: "They add 50,000 rows to your working table. If filter/sort run on every render without useMemo, it locks up live — and the real answer is moving it server-side." },
  { id: "MC-15", cat: "MC", lv: "mid", q: "Implement a retry-with-exponential-backoff wrapper for fetch.",
    a: ["Retry only idempotent requests and retryable statuses (429, 5xx, network errors).", "delay = base * 2^attempt + random jitter; cap max delay and attempts.", "Respect Retry-After when present; support AbortSignal to cancel mid-wait.", "Don't retry 4xx validation errors — that's the discriminating detail."] ,
    trap: "They ask whether you'd retry a failed POST that creates a loan. Only with an idempotency key — blind retries on non-idempotent writes create duplicates." },
  { id: "MC-16", cat: "MC", lv: "hard", q: "Implement a promise pool / task scheduler with concurrency limit N.",
    a: ["Queue of task factories; run N workers that pull the next task on completion.", "Return results in original order; use allSettled semantics so one failure doesn't kill the batch.", "Add cancellation and progress callbacks.", "Real use: uploading 200 documents without hammering the API."] ,
    trap: "They ask what happens if one task rejects. If your pool stops pulling from the queue on the first failure, 199 uploads silently never run." },

  /* ---------------- DSA ---------------- */
  { id: "DSA-01", cat: "DSA", lv: "basic", q: "Explain Big-O and give the complexity of common JS operations.",
    a: ["Array push/pop O(1), shift/unshift O(n), splice O(n), indexOf O(n), sort O(n log n).", "Object/Map get/set O(1) average; spread copy O(n).", "Space complexity matters too — mention it unprompted.", "Amortised analysis for dynamic array growth."] },
  { id: "DSA-02", cat: "DSA", lv: "mid", q: "Two-pointer and sliding-window problems.",
    a: ["Longest substring without repeating chars, min window substring, max sum subarray of size k, container with most water.", "Pattern: expand right, shrink left while invalid, track best.", "Use a Map/Set for the window contents.", "Practise saying the invariant out loud before coding."] },
  { id: "DSA-03", cat: "DSA", lv: "mid", q: "Hash-map problems you should be able to write instantly.",
    a: ["Two sum, group anagrams, first non-repeating character, subarray sum equals k (prefix sums), top-k frequent.", "Frequency map + sort or bucket sort for top-k.", "Watch key coercion: object keys become strings — use Map.", "State the space/time trade-off you're making."] },
  { id: "DSA-04", cat: "DSA", lv: "mid", q: "Recursion and backtracking basics.",
    a: ["Subsets, permutations, combination sum, generate parentheses, N-queens (lightly).", "Template: choose → explore → un-choose.", "Convert to iterative with an explicit stack when depth is a risk.", "Memoise overlapping subproblems to turn exponential into polynomial."] },
  { id: "DSA-05", cat: "DSA", lv: "mid", q: "Tree problems relevant to frontend (DOM is a tree).",
    a: ["BFS/DFS traversal, level-order, max depth, lowest common ancestor.", "Real analogues: finding a node in a JSON config tree, rendering nested menus, building a breadcrumb path.", "Iterative DFS with a stack avoids stack overflow on deep trees.", "Serialise/deserialise a tree — comes up with nested comment or category data."] },
  { id: "DSA-06", cat: "DSA", lv: "mid", q: "String manipulation classics.",
    a: ["Reverse words, valid palindrome with cleanup, anagram check, string compression, longest common prefix.", "Strings are immutable in JS — build with an array and join for O(n).", "Beware unicode: split('') breaks emoji; use [...str] or Intl.Segmenter.", "Regex knowledge: greedy vs lazy, capture groups, lookahead."] },
  { id: "DSA-07", cat: "DSA", lv: "hard", q: "LRU cache — implement it.",
    a: ["Map preserves insertion order: on get, delete and re-set to move to the end; on set, evict the first key when over capacity.", "Classic version: hash map + doubly linked list for O(1) both ways.", "Explain where you'd use it: image cache, API response cache, memoize eviction.", "Follow-up: add TTL."] },
  { id: "DSA-08", cat: "DSA", lv: "mid", q: "Sorting and searching essentials.",
    a: ["Binary search on a sorted array and its variants (first/last occurrence, rotated array).", "Custom comparators: sort by multiple keys, localeCompare for strings, numeric sort gotcha (default is lexicographic).", "Merge intervals, meeting rooms — interval patterns.", "Know that Array.sort is stable in modern engines."] },
  { id: "DSA-09", cat: "DSA", lv: "hard", q: "Basic dynamic programming.",
    a: ["Climbing stairs, house robber, coin change, longest increasing subsequence, edit distance (lightly).", "Identify the state and the transition; start with recursion + memo, then tabulate.", "Most frontend rounds stop at 1-D DP — don't over-prepare here at the cost of JS depth.", "Say your recurrence out loud before writing code."] },
  { id: "DSA-10", cat: "DSA", lv: "mid", q: "Practical JS problems that show up in frontend rounds.",
    a: ["Deep equality check, get/set by path ('a.b[0].c'), object diff, group-by, chunk, debounce (again), flatten.", "Convert a flat list with parentId into a nested tree — extremely common.", "Format numbers to Indian currency / lakh-crore notation.", "These beat LeetCode-hard for frontend roles; drill them until automatic."] },

  /* ---------------- TESTING & TOOLING ---------------- */
  { id: "TST-01", cat: "TST", lv: "mid", q: "What's your testing strategy for a frontend app?",
    a: ["Testing trophy: static (TS + ESLint) → unit for pure logic → integration for components with real user flows → a few E2E on critical paths.", "Don't chase coverage %; cover money paths, auth, and anything that has broken before.", "Mock at the network boundary (MSW), not at the module boundary.", "CI gates: type check, lint, tests, bundle size budget."] },
  { id: "TST-02", cat: "TST", lv: "mid", q: "How do you test async behaviour and avoid flaky tests?",
    a: ["findBy* / waitFor with assertions inside, never arbitrary sleeps.", "Deterministic time with fake timers; seed randomness; freeze dates.", "Flake sources: shared state between tests, real network, animations, race with focus.", "Quarantine and fix flakes — muted flaky tests destroy trust in CI."] },
  { id: "TST-03", cat: "TST", lv: "mid", q: "What does a bundler actually do? Webpack vs Vite.",
    a: ["Builds a dependency graph, transforms via loaders/plugins, splits chunks, emits optimised assets.", "Webpack: mature, configurable, bundles for dev too. Vite: native ESM + esbuild in dev (instant HMR), Rollup for prod.", "Concepts to name: tree shaking, code splitting, source maps, hashing for cache busting.", "Say what you've actually configured — path aliases, env handling, chunk strategy."] },
  { id: "TST-04", cat: "TST", lv: "mid", q: "Explain your CI/CD pipeline for a frontend app.",
    a: ["PR: install with a lockfile, type check, lint, unit tests, build, preview deploy.", "Main: build once, promote the same artifact through environments.", "Add: bundle size check, Lighthouse CI, visual regression, dependency audit.", "Deploy strategy: atomic deploys, instant rollback, cache-busting, and a plan for users on the old bundle (version check + refresh prompt)."] },
  { id: "TST-05", cat: "TST", lv: "hard", q: "How do you handle app updates for users with a long-lived open tab?",
    a: ["Chunk load failures after a deploy are the classic symptom — old HTML requesting deleted hashed chunks.", "Fix: keep old assets for a window, detect version drift via a build-id endpoint or meta tag, prompt a refresh.", "Catch dynamic import errors globally and reload once with a guard flag.", "For mobile/native shells, gate on a minimum supported version from the server."] },
  { id: "TST-06", cat: "TST", lv: "mid", q: "Git workflow: how do you handle branching, reviews and a bad merge?",
    a: ["Trunk-based with short-lived branches, or Git Flow if releases are versioned — state which and why.", "rebase for a clean history on your own branch; merge for shared branches.", "Recover with reflog, revert for published commits, cherry-pick for hotfixes.", "Conventional commits enabling changelogs and semver automation."] },
  { id: "TST-07", cat: "TST", lv: "mid", q: "How do you approach code review?",
    a: ["Correctness → security → performance → readability → nits; label the severity of each comment.", "Ask questions instead of issuing orders; approve with minor comments rather than blocking.", "Automate the mechanical stuff (format, lint) so review is about design.", "Give an example of feedback you gave that changed an implementation."] },
  { id: "TST-08", cat: "TST", lv: "mid", q: "What is a monorepo and when is it worth the tooling cost?",
    a: ["Shared code, atomic cross-package changes, one dependency version — good for a design system plus multiple apps.", "Tooling: pnpm/yarn workspaces, Turborepo/Nx for caching and task graphs.", "Costs: CI complexity, slower clones, needing codeowners and boundaries.", "Alternative: published packages with independent versioning."] },

  /* ---------------- BEHAVIOURAL ---------------- */
  { id: "BHV-01", cat: "BHV", lv: "basic", q: "Walk me through your current project and your specific contribution.",
    a: ["Structure: what the product does → your surface area → 2–3 concrete things you built → measurable impact.", "Say 'I' for your work and 'we' for team context — interviewers notice vagueness.", "Have numbers ready: users, records, latency before/after, bug reduction, release frequency.", "End with a trade-off you made and would revisit — that's the senior signal."] },
  { id: "BHV-02", cat: "BHV", lv: "mid", q: "Tell me about the hardest bug you've debugged.",
    a: ["STAR: symptom, why it was hard (intermittent, prod-only, cross-layer), how you narrowed it, the fix, the prevention.", "Best stories involve a wrong initial hypothesis — that shows real debugging, not a rehearsed win.", "Name the tools: logs, DevTools, network trace, git bisect, a minimal reproduction.", "Close with what you changed so it can't recur (test, alert, guardrail)."] },
  { id: "BHV-03", cat: "BHV", lv: "mid", q: "Describe a time you disagreed with a PM or a senior engineer.",
    a: ["Show you separated the decision from the ego: you brought data, stated the risk, and committed once decided.", "Avoid stories where you were simply right and everyone else was wrong.", "Mention the outcome and what you learned about how to raise concerns earlier.", "Disagree-and-commit is the phrase interviewers listen for."] },
  { id: "BHV-04", cat: "BHV", lv: "mid", q: "Tell me about something you shipped that failed or caused an incident.",
    a: ["Own it plainly, no deflection; describe detection time, blast radius, mitigation, root cause, prevention.", "Blameless framing, but personal accountability for your part.", "The prevention step is what earns the points — a test, a flag, a checklist, an alert.", "Have one real story ready; 'I can't think of one' reads as either junior or dishonest."] },
  { id: "BHV-05", cat: "BHV", lv: "mid", q: "How do you handle a vague requirement or a changing scope?",
    a: ["Clarify the user problem and the success metric before designing; write the assumptions down and confirm.", "Break into a thin vertical slice, ship, learn.", "Push back with options and costs, not just 'no': 'we can do A in two days or B in two weeks'.", "Give an example where you cut scope and still delivered the core value."] },
  { id: "BHV-06", cat: "BHV", lv: "mid", q: "Why are you leaving your current company?",
    a: ["Forward-looking and specific: scale, ownership, domain, technical depth, growth path.", "Never criticise your current employer or manager — one bitter line can end the loop.", "Tie the reason to what this company actually offers, which means researching them.", "Keep it to 30 seconds and move on."] },
  { id: "BHV-07", cat: "BHV", lv: "mid", q: "Where do you see yourself in 2–3 years / what kind of work do you want?",
    a: ["Show direction without rigidity: deeper ownership of a product area, mentoring, moving from tasks to problems.", "Match the level you're interviewing for — asking for a manager role in an IC interview misfires.", "Mention the kind of problems you want (scale, product surface, domain), not just a title.", "Honest and specific beats aspirational and generic."] },
  { id: "BHV-08", cat: "BHV", lv: "mid", q: "Tell me about a time you improved something nobody asked you to.",
    a: ["Initiative stories: build time cut, flaky test fixed, a repeated support ticket eliminated, a dashboard that saved ops hours.", "Quantify the saving and say how you got buy-in for the time.", "Shows ownership beyond the ticket queue, which is the main 2→4 YOE differentiator.", "Keep it small and real — a genuine 3-hour fix beats an invented rewrite."] },
  { id: "BHV-09", cat: "BHV", lv: "mid", q: "How do you keep learning and stay current?",
    a: ["Be concrete: what you read/watch, what you built recently, what you changed at work because of it.", "One deep example beats a list of newsletters.", "Mention a side project or an internal tool you shipped.", "Avoid 'I read documentation' as the whole answer."] },
  { id: "BHV-10", cat: "BHV", lv: "mid", q: "How do you estimate work, and what do you do when you're going to miss a deadline?",
    a: ["Break down to sub-day tasks, add explicit buffer for unknowns, flag dependencies early.", "Communicate the slip as soon as you know it — with a revised date and options (cut scope, add help, ship behind a flag).", "Never surprise a stakeholder on the deadline day.", "Give a real example including the conversation you had."] },
  { id: "BHV-11", cat: "BHV", lv: "mid", q: "What questions do you have for us?",
    a: ["Always have 3–4. Team shape, how work is prioritised, what the next 6 months look like, how success is measured at 6 months.", "Engineering culture: code review, testing, on-call, tech debt time, release cadence.", "One sharp question about their product or a recent launch shows you prepared.", "Avoid asking only about perks in the first round."] },
  { id: "BHV-12", cat: "BHV", lv: "hard", q: "Salary and offer discussion — how do you handle it?",
    a: ["Defer numbers until you have signal: 'I'd like to understand the role better first; I'm sure we can align.'", "When pressed, give a researched range for your market and level, anchored to total comp.", "Know your walk-away number and your non-negotiables before the call.", "Negotiate on data and enthusiasm, never on threats; get everything in writing."] },
];


/* ===== ADDED IN PASS 2 — gaps found auditing against the generator spec ===== */

const Q6 = [
  /* ---- JAVASCRIPT: gaps ---- */
  { id: "JS-31", cat: "JS", lv: "mid", q: "How do you handle dates and timezones correctly in a JS app?",
    a: ["Store UTC (ISO 8601) on the server; convert only at the display layer using the user's timezone.", "Date is broken by design — no timezone support, mutable, month is 0-indexed. Use date-fns/Luxon, or Temporal where available.", "Intl.DateTimeFormat with a timeZone option is the built-in correct way to render.", "Date-only values (birthdate, EMI due date) must NOT be timestamps — a UTC midnight shifts a day backwards in IST."],
    trap: "They ask: a user in IST sees an EMI due one day early. Why? Most candidates blame the backend; the real cause is a date-only value stored as a UTC timestamp and rendered with local conversion." },
  { id: "JS-32", cat: "JS", lv: "basic", q: "How do you format currency and large numbers for an Indian audience?",
    a: ["Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }) gives the lakh/crore grouping (1,23,456) automatically.", "maximumFractionDigits and notation:'compact' for dashboards.", "Never build grouping with regex or toLocaleString without a locale — it varies by machine.", "Money arrives from the API as integer paise; divide only at render."],
    trap: "Follow-up: format 12345678 as ₹1.23 Cr. If you reach for a manual string split, you've missed Intl entirely." },
  { id: "JS-33", cat: "JS", lv: "mid", q: "Explain getters, setters and Object.defineProperty.",
    a: ["get/set define accessor properties that run a function on read/write.", "defineProperty controls the descriptor: writable, enumerable, configurable — defaults are all false.", "Used for computed properties, validation on assignment, and legacy reactivity (Vue 2, MobX 4).", "Object.freeze is shallow; deep freeze needs recursion. Object.seal blocks add/delete but allows edits."],
    trap: "They ask why Vue 3 moved to Proxy: defineProperty can't detect property addition/deletion or array index writes." },
  { id: "JS-34", cat: "JS", lv: "mid", q: "What are Symbols and where are they actually used?",
    a: ["Unique, non-enumerable-by-default keys that never collide — used for metadata on objects you don't own.", "Well-known symbols hook into language behaviour: Symbol.iterator, Symbol.asyncIterator, Symbol.toPrimitive, Symbol.toStringTag.", "Symbol.for creates/reads from a global registry across realms.", "They're not private — Object.getOwnPropertySymbols and Reflect.ownKeys expose them."],
    trap: "Common wrong answer: 'Symbols make properties private.' They only make them non-colliding and skipped by JSON.stringify and for..in." },
  { id: "JS-35", cat: "JS", lv: "mid", q: "Regex: what do you actually need to know?",
    a: ["Anchors, character classes, quantifiers, greedy vs lazy (.*? ), capture vs non-capture groups (?:), named groups.", "Lookahead (?=) / lookbehind (?<=) for password rules and formatting without consuming characters.", "Flags: g (stateful lastIndex on test — a real bug source), i, m, s, u.", "Use matchAll over exec loops; replace with a function for complex substitutions."],
    trap: "The classic trap: a /g regex reused across calls with .test() alternates true/false because lastIndex persists. Also: don't validate emails with a monster regex — check for an @ and let the server verify." },
  { id: "JS-36", cat: "JS", lv: "mid", q: "How do you keep data immutable, and why does it matter?",
    a: ["Immutability makes change detection cheap (reference compare) — the basis of React re-renders and Redux.", "Patterns: spread, structuredClone, Immer's produce for deep updates without the spread pyramid.", "Object.freeze enforces it at runtime (shallow); readonly / as const enforces at compile time.", "Cost: allocation churn on hot paths — that's when you drop to mutable local buffers."],
    trap: "They give you nested state and ask you to update state.user.address.city immutably. Getting the spread chain right — and knowing when to reach for Immer instead — is the whole test." },
  { id: "JS-37", cat: "JS", lv: "hard", q: "How do you keep the UI responsive during a long-running computation?",
    a: ["Break work into chunks and yield: setTimeout(0), scheduler.yield(), or await a macrotask between batches.", "requestIdleCallback for genuinely low-priority work (analytics flush, prefetch parsing).", "Web Worker for anything CPU-bound over ~50ms — the only true fix.", "In React, startTransition marks the render as interruptible but does NOT make your JS non-blocking."],
    trap: "Wrong answer most candidates give: 'wrap it in an async function' — await doesn't create a thread; a sync loop inside an async function still blocks paint." },
  { id: "JS-38", cat: "JS", lv: "basic", q: "typeof vs instanceof vs Array.isArray vs Object.prototype.toString.",
    a: ["typeof handles primitives but returns 'object' for null and arrays, 'function' for functions.", "instanceof walks the prototype chain — breaks across iframes/realms and for primitives.", "Array.isArray is the correct array check; Number.isInteger / Number.isFinite for numbers.", "Object.prototype.toString.call(x) gives [object Date] / [object Map] — the reliable tag."],
    trap: "Follow-up: how do you check for a plain object? typeof x === 'object' && x !== null && !Array.isArray(x) — and even then, Object.create(null) and class instances pass." },
  { id: "JS-39", cat: "JS", lv: "mid", q: "What does strict mode change, and what are sparse arrays?",
    a: ["Strict mode: no implicit globals, this is undefined in plain calls, duplicate params and octal literals throw, silent assignment failures become errors.", "ES modules and class bodies are always strict.", "Sparse arrays (holes) come from delete, new Array(3), or setting a high index; forEach/map skip holes but for..of and spread yield undefined.", "Array.from({length:n}) is the safe way to build a dense array."],
    trap: "Classic: new Array(3).map((_,i)=>i) returns three holes, not [0,1,2]. Candidates who don't know this write it in a live round and can't explain the empty output." },
  { id: "JS-40", cat: "JS", lv: "hard", q: "Explain the difference between deep equality, reference equality and structural sharing.",
    a: ["Reference equality is O(1) and is what React, Redux and memo actually use.", "Deep equality is O(n) — correct but defeats the point when used as a render guard on large objects.", "Structural sharing: an immutable update reuses untouched subtrees, so reference compare stays valid and cheap.", "Object.is differs from === only for NaN and ±0 — that's what React uses internally."],
    trap: "They show a component re-rendering despite React.memo. The cause is almost always a new object/array/function literal in props each render, not a broken memo." },

  /* ---- TYPESCRIPT: gaps ---- */
  { id: "TS-13", cat: "TS", lv: "mid", q: "enum vs union of string literals vs `as const` object — which do you ship?",
    a: ["Numeric enums are unsafe (any number assignable pre-5.0) and emit runtime code that isn't tree-shakeable.", "const assertions on a plain object give you the values at runtime AND the union at compile time: typeof OBJ[keyof typeof OBJ].", "String literal unions are the lightest option when you don't need a runtime value.", "const enum is inlined but breaks isolatedModules and Babel builds."],
    trap: "Follow-up: how do you iterate all values of a string enum? Object.values works, but on a numeric enum it returns the reverse mappings too — a bug people ship." },
  { id: "TS-14", cat: "TS", lv: "mid", q: "What does the `satisfies` operator solve that a type annotation doesn't?",
    a: ["`const c = {...} satisfies Config` validates the shape while KEEPING the literal's narrow inferred types.", "With `: Config` you lose the specific keys and literal values — autocomplete on c.theme becomes string.", "Best for config objects, route maps, token palettes, and Record-shaped constants.", "Combine with as const for readonly narrowing."],
    trap: "They ask why keyof typeof myConfig gives `string` instead of the actual keys. The answer is the annotation widened it; satisfies is the fix." },
  { id: "TS-15", cat: "TS", lv: "mid", q: "Explain keyof, typeof, indexed access and generic constraints together.",
    a: ["typeof lifts a value into the type space; keyof lists its keys as a union.", "Indexed access T[K] pulls a property type; T[keyof T] gives the union of all value types.", "The classic signature: function get<T, K extends keyof T>(obj: T, key: K): T[K].", "Combine with template literal types for typed event names or API paths."],
    trap: "Follow-up: type a get-by-path helper for 'a.b.c'. Recursive conditional types are the answer, and knowing when to stop and just accept `unknown` is the senior signal." },
  { id: "TS-16", cat: "TS", lv: "hard", q: "How do you type a generic React component and a polymorphic `as` prop?",
    a: ["Generic component: function Select<T>({items, getLabel}: Props<T>) — arrow functions need <T,> in .tsx to disambiguate from JSX.", "Polymorphic: ElementType + ComponentPropsWithoutRef<E> and Omit the clashing keys.", "forwardRef erases generics — cast the result or use the ref-as-prop form in React 19.", "Keep the escape hatch: most design systems limit `as` to a fixed union rather than any element."],
    trap: "They ask you to type a <Button as='a' href='...'> so href only exists when as='a'. If you reach for `any` here, the round is effectively over." },
  { id: "TS-17", cat: "TS", lv: "mid", q: "How is your tsconfig set up, and what do path aliases and module resolution do?",
    a: ["target/lib control emitted syntax and available globals; module + moduleResolution ('bundler' for Vite/Next) control import resolution.", "paths + baseUrl give @/components aliases — the bundler needs a matching alias or it resolves at type level only.", "isolatedModules is required for Babel/esbuild/SWC transpilers — forces `export type` for type-only re-exports.", "skipLibCheck true is standard; noUncheckedIndexedAccess is the underrated flag that catches arr[i] being undefined."],
    trap: "Follow-up: 'types work in the editor but the build fails on an alias.' That means tsconfig paths were set without the bundler alias — a very common real bug." },
  { id: "TS-18", cat: "TS", lv: "mid", q: "What are decorators and where does Angular use them?",
    a: ["Functions that annotate classes/members with metadata, read at runtime via reflect-metadata.", "Angular: @Component, @Injectable, @Input, @Output — the DI container reads constructor param types from emitted metadata.", "TS 5 shipped the standard (stage 3) decorators; Angular still uses the legacy experimentalDecorators flag.", "Trade-off: metadata-driven magic is concise but hard to trace and hostile to tree-shaking."],
    trap: "If your resume says Angular, expect 'how does Angular know what to inject?' — the answer is emitDecoratorMetadata storing design:paramtypes, or explicit @Inject tokens." },

  /* ---- REACT: gaps ---- */
  { id: "RCT-31", cat: "RCT", lv: "hard", q: "What's new in React 19 — use(), Actions, useActionState, useOptimistic, ref as prop?",
    a: ["use(promise) unwraps a promise during render inside a Suspense boundary; use(context) can be called conditionally.", "Actions: async functions passed to <form action>; useActionState gives [state, formAction, isPending]; useFormStatus reads pending state from a child.", "useOptimistic applies a temporary value while the action is in flight.", "ref is now a normal prop on function components — forwardRef is no longer needed.", "React Compiler auto-memoises, removing most useMemo/useCallback."],
    trap: "They ask if use() replaces useEffect for fetching. It does for server-driven flows, but on the client you still need a cache (React Query) or the promise re-fires on every render." },
  { id: "RCT-32", cat: "RCT", lv: "mid", q: "How do you build and validate a complex form in React?",
    a: ["React Hook Form (uncontrolled + subscription) so typing one field doesn't re-render 40 others.", "One zod schema as the single source of truth for types and validation, wired via zodResolver.", "Validate on blur, revalidate on change after the first error; show a summary and focus the first invalid field on submit.", "Server errors mapped back onto fields via setError; disable submit while pending and guard double submits."],
    trap: "Follow-up: how do conditional/dependent fields work? watch() the driver field and unregister hidden fields — otherwise stale values get submitted, which in a loan application is a real data-integrity bug." },
  { id: "RCT-33", cat: "RCT", lv: "mid", q: "Where do you put Suspense and lazy boundaries, and what breaks if you get it wrong?",
    a: ["Split at route level first, then at heavy widgets (charts, editors, PDF viewers) that aren't visible on load.", "The boundary must be ABOVE the lazy component, not inside it, and its fallback should match the final layout to avoid CLS.", "A boundary too high blanks the whole page; too low causes a waterfall of spinners.", "Preload on hover/intent: call the lazy import function early."],
    trap: "They ask what happens when a chunk 404s after a deploy. Without an error boundary catching the dynamic import rejection plus a one-shot reload, the user sees a permanently blank panel." },
  { id: "RCT-34", cat: "RCT", lv: "mid", q: "Explain composition: children, slots, cloneElement and when each is right.",
    a: ["Passing JSX as children or named slot props is the cheapest fix for prop drilling and re-render fan-out.", "React.Children.map / toArray for iterating, but it's fragile with fragments and conditionals.", "cloneElement injects props into unknown children — powerful, implicit, and hard to type; prefer context in compound components.", "Rule: configuration via props, structure via children."],
    trap: "Follow-up: why does <Layout sidebar={<Nav/>} /> avoid a re-render that <Layout><Nav/></Layout> inside a state-changing parent does not? Because element identity is created by the parent that owns the state." },
  { id: "RCT-35", cat: "RCT", lv: "hard", q: "When should you NOT use useEffect? Give the four common misuses.",
    a: ["Derived state — compute during render instead of storing and syncing.", "Resetting state when a prop changes — pass a key to remount instead.", "Responding to a user event — put the logic in the handler, not an effect watching state.", "Syncing two pieces of state — lift to one source of truth.", "Legitimate uses left: external system sync, subscriptions, imperative DOM, analytics on mount."],
    trap: "This is the single highest-signal React question at 2–4 YOE. If you answer 'I use useEffect for fetching', follow up immediately with why you'd actually use React Query or the framework loader." },
  { id: "RCT-36", cat: "RCT", lv: "mid", q: "useId, useSyncExternalStore, useDeferredValue and useTransition — what is each actually for?",
    a: ["useId: SSR-stable ids for label/aria wiring — never use Math.random or an incrementing counter.", "useSyncExternalStore: subscribe to a non-React store without tearing under concurrent rendering; what zustand/redux use internally.", "useDeferredValue: let an expensive child lag behind a fast-updating value.", "useTransition: mark an update as low priority and read isPending for a subtle loading state."],
    trap: "They ask the difference between useDeferredValue and debounce: debounce delays the input, deferred value keeps the input instant and lets the expensive render fall behind. Wrong answer is 'they're the same'." },
  { id: "RCT-37", cat: "RCT", lv: "mid", q: "How do you handle animations and transitions in React?",
    a: ["CSS transitions for simple state changes; a library (Framer Motion / react-spring) for enter/exit and layout animation.", "Exit animations need the element kept mounted — AnimatePresence, or a manual isExiting state.", "Animate transform/opacity only; use layout animations sparingly, they force measurement.", "Always honour prefers-reduced-motion and keep the interaction usable without motion."],
    trap: "Follow-up: how do you animate an element being removed from a list? If you say 'set display:none', you've missed that React unmounts it before any CSS transition can run." },
  { id: "RCT-38", cat: "RCT", lv: "hard", q: "Explain Redux Toolkit: slices, immer, thunks, selectors and when RTK Query fits.",
    a: ["createSlice generates actions + reducer; Immer lets you write mutating syntax that produces immutable updates.", "createAsyncThunk gives pending/fulfilled/rejected actions; middleware is where side effects belong.", "Memoised selectors (reselect / createSelector) prevent recomputation and re-render on unrelated state changes.", "RTK Query replaces hand-written thunks for server data — caching, invalidation tags, polling."],
    trap: "They ask what goes in Redux today. The correct modern answer: client/UI state and cross-cutting session state — server data belongs in a query cache. Saying 'everything' signals 2019 habits." },
  { id: "RCT-39", cat: "RCT", lv: "mid", q: "How does React decide to preserve or reset component state?",
    a: ["State is tied to position in the tree plus element type — same type at the same position keeps state.", "Changing the element type, or the key, destroys and recreates state.", "Rendering a component inline inside another component's body creates a new type every render → state resets on every keystroke.", "Conditional rendering of two different components at the same slot swaps state unless keys distinguish them."],
    trap: "The classic bug: defining a child component inside the parent function. The input loses focus and its state on every render, and candidates blame React instead of the definition site." },
  { id: "RCT-40", cat: "RCT", lv: "hard", q: "Walk me through debugging 'my React app is re-rendering too much'.",
    a: ["Profiler → record an interaction → find components with unexpected commits and check 'why did this render'.", "Causes ranked by frequency: unstable prop identity, context value recreated, state lifted too high, parent re-render cascading.", "Fix in order: move state down / lift content up as children, memoise the context value, then memo the component.", "Confirm with a measured number — commits per keystroke before and after."],
    trap: "They'll ask whether re-renders are actually a problem. Correct answer: a re-render is cheap; a re-render that runs expensive work or touches the DOM is not. Blanket memoisation is a smell." },
];

const Q7 = [
  /* ---- NEXT / ANGULAR: gaps ---- */
  { id: "FWK-13", cat: "FWK", lv: "mid", q: "Next.js middleware and route handlers — what runs where?",
    a: ["Middleware runs on the Edge runtime before the request is matched: rewrites, redirects, cookie checks, geo/AB bucketing. No Node APIs, no DB drivers.", "Route handlers (app/api/*/route.ts) are your Node backend: full runtime, request/response, streaming.", "Keep middleware cheap — it runs on every matched request and adds latency to all of them.", "matcher config to exclude static assets, or you pay the cost on every image."],
    trap: "They ask if middleware can protect a route. It can redirect, but authorization must still be re-checked in the handler — middleware alone is bypassable via direct API calls." },
  { id: "FWK-14", cat: "FWK", lv: "mid", q: "How do you do SEO in Next.js App Router?",
    a: ["generateMetadata for dynamic title/description/OG per route; a static metadata export for fixed pages.", "Canonical URLs, robots.txt and sitemap.ts; structured data (JSON-LD) for rich results.", "Server-render anything that must be indexed — content behind a client-side fetch may not be crawled reliably.", "Open Graph images via the built-in image response API for shareable links."],
    trap: "Follow-up: does Google run JavaScript? Yes, but on a deferred second pass with a crawl budget. 'Google executes JS so CSR is fine for SEO' is the answer that gets marked down." },
  { id: "FWK-15", cat: "FWK", lv: "mid", q: "Angular: reactive forms vs template-driven — and how do you build a dynamic form?",
    a: ["Reactive: FormGroup/FormControl defined in TS, synchronous, testable, scales to dynamic and nested forms.", "Template-driven: ngModel in the template, async setup, fine only for tiny forms.", "Dynamic forms: build controls from a config/JSON schema at runtime with FormArray and addControl/removeControl.", "Custom validators (sync and async), cross-field validation at the group level, and updateOn:'blur' to cut validation churn."],
    trap: "If your resume mentions a JSON-driven form engine, expect: how do you handle a field whose visibility depends on another field? Answer with valueChanges subscriptions plus disabling — and note that disabled controls are excluded from form.value." },
  { id: "FWK-16", cat: "FWK", lv: "hard", q: "Angular signals and standalone components — what changed and why?",
    a: ["Signals are fine-grained reactive primitives: signal(), computed(), effect() — updates target exact bindings instead of checking the tree.", "This enables zoneless change detection, removing Zone.js monkey-patching and its debugging pain.", "Standalone components drop NgModules; imports live on the component, improving lazy loading and tree-shaking.", "New control flow (@if/@for) is compiled and faster than *ngIf/*ngFor, and @for requires a track expression."],
    trap: "They ask how signals compare to RxJS. Signals model state (always has a current value, synchronous); RxJS models events/streams over time. Saying 'signals replace RxJS' is wrong — you still need RxJS for HTTP and event orchestration." },
  { id: "FWK-17", cat: "FWK", lv: "mid", q: "Explain Angular's component lifecycle and OnPush pitfalls.",
    a: ["ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit/Checked → ngAfterViewInit/Checked → ngOnDestroy.", "ngOnChanges only fires for @Input reference changes — mutating an object input silently skips it under OnPush.", "With OnPush, mark dirty manually via ChangeDetectorRef.markForCheck() after an async update outside Angular's knowledge.", "ExpressionChangedAfterItHasBeenCheckedError comes from mutating bound state in AfterViewInit — move it to ngOnInit or defer a tick."],
    trap: "The OnPush + mutated array bug: pushing to an array input doesn't update the view. Candidates 'fix' it with detectChanges() instead of returning a new array reference." },
  { id: "FWK-18", cat: "FWK", lv: "mid", q: "How do you decide between Next.js server components and a plain SPA for a new internal tool?",
    a: ["Authed internal dashboards: an SPA is often simpler — no SEO need, and the data is user-specific so caching gains are small.", "Next wins when you need SEO, fast first paint on poor networks, or want to keep secrets and heavy queries server-side.", "Cost of RSC: a server to run, a mental model split across the boundary, and harder debugging.", "Answer with the deciding factor, not a preference: who are the users, what network, does it need to be indexed."],
    trap: "They're testing whether you pick tech by hype. Saying 'always Next' without naming the operational cost of running a Node server is the failure mode." },

  /* ---- CSS: gaps ---- */
  { id: "CSS-19", cat: "CSS", lv: "basic", q: "Every way to centre an element, and which you'd actually use.",
    a: ["Flex: display:flex; align-items:center; justify-content:center — the default answer.", "Grid: display:grid; place-items:center — shortest for a single child.", "Absolute + transform: translate(-50%,-50%) when the parent can't be a flex container.", "Text: line-height for single-line vertical centring; margin-inline:auto for a fixed-width block."],
    trap: "Follow-up: centre a modal that may be taller than the viewport. Flex centring clips the top and makes it unscrollable — you need align-items:flex-start with auto margins, or padding on the scroll container." },
  { id: "CSS-20", cat: "CSS", lv: "mid", q: "How do you position a dropdown, tooltip or popover reliably?",
    a: ["The hard parts: collision detection at viewport edges, flipping, scroll containers, and overflow:hidden ancestors.", "Modern answers: the Popover API + CSS anchor positioning, or Floating UI (offset/flip/shift/arrow middleware).", "Portal to body to escape clipping, then keep it positioned with an observer on scroll/resize.", "Accessibility: aria-expanded, Escape to close, focus return, and click-outside that also handles touch."],
    trap: "They ask why a tooltip inside a scrollable table jumps or disappears. The answer is either an overflow:hidden ancestor clipping it or a transform ancestor changing the containing block — which is why portals exist." },
  { id: "CSS-21", cat: "CSS", lv: "mid", q: "Explain overflow, scroll containers and how to build a scrollable area properly.",
    a: ["A scroll container needs a constrained height — in flex/grid children that usually means min-height:0 or overflow:hidden on the parent.", "overflow:auto vs scroll vs clip; overscroll-behavior:contain stops scroll chaining to the page behind a modal.", "scroll-snap for carousels; scroll-margin-top so anchor links clear a sticky header.", "position:sticky fails inside any ancestor with overflow:hidden — a top-three CSS gotcha."],
    trap: "The classic: a flex child with long content pushes the layout instead of scrolling. If you can't say 'min-width:0 / min-height:0 because flex items default to min-content', this question exposes it." },
  { id: "CSS-22", cat: "CSS", lv: "mid", q: "Container queries — what problem do they solve that media queries can't?",
    a: ["Media queries respond to the viewport; container queries respond to the component's own available width.", "container-type: inline-size on the parent, then @container (min-width: 400px).", "Makes a card component reusable in a sidebar and a full-width grid without variant props.", "Container query units: cqw, cqi, cqb for type and spacing that scales with the component."],
    trap: "Follow-up: why can't you query the container's own size from inside it? Because that creates a layout loop — the container must declare containment, and you style descendants, never the container itself." },
  { id: "CSS-23", cat: "CSS", lv: "mid", q: "How do you style images and media — object-fit, aspect-ratio, responsive behaviour?",
    a: ["aspect-ratio reserves space before load and kills CLS; pair with width:100% and height:auto.", "object-fit: cover/contain plus object-position controls cropping inside a fixed box.", "For background art, prefer an <img> with object-fit over background-image — it can be lazy-loaded and given alt text.", "Avatars: aspect-ratio:1, border-radius:50%, object-fit:cover."],
    trap: "They ask how to stop the layout jumping while images load. If you answer 'a fixed height', you lose responsiveness — aspect-ratio (or width/height attributes, which the browser turns into a ratio) is the right answer." },
  { id: "CSS-24", cat: "CSS", lv: "mid", q: "How do you style form controls consistently across browsers?",
    a: ["appearance:none as the reset, then rebuild the visual; keep the native element for behaviour and accessibility.", "Checkbox/radio: style a sibling or ::before, drive it with :checked and :focus-visible — never hide the input from the a11y tree.", "accent-color is the one-line answer when full custom styling isn't needed.", "Selects are still partially unstylable; a custom listbox means rebuilding keyboard nav, typeahead and screen-reader semantics."],
    trap: "Follow-up: why not just build a div-based dropdown? Because you inherit the entire ARIA combobox spec — arrow keys, Home/End, typeahead, aria-activedescendant, mobile behaviour. Interviewers want you to respect that cost." },
  { id: "CSS-25", cat: "CSS", lv: "mid", q: "What goes into a CSS reset, and what does the cascade look like in a real project?",
    a: ["Modern reset: box-sizing:border-box everywhere, margin zeroing, img display:block/max-width:100%, line-height and text-size-adjust, form font inheritance.", "Layer order with @layer reset, base, components, utilities so specificity fights disappear.", "Design tokens on :root; component styles never reach outside themselves.", "Utilities last so they always win — the model Tailwind formalises."],
    trap: "They ask how you'd override a third-party library's styles without !important. Answer: a later @layer, a wrapper with a data attribute, or CSS variables the library reads — not specificity escalation." },
  { id: "CSS-26", cat: "CSS", lv: "hard", q: "Build a data table with a sticky header, sticky first column and horizontal scroll.",
    a: ["Wrapper with overflow:auto and a constrained height; the table itself keeps its natural width.", "thead th { position:sticky; top:0 } and td:first-child { position:sticky; left:0 } — the corner cell needs both plus a higher z-index.", "border-collapse:separate (borders vanish on sticky cells with collapse) — use box-shadow for the rules.", "Give sticky cells an opaque background or rows show through as they scroll under."],
    trap: "This is a favourite live-coding task because four things break at once: z-index stacking between the sticky row and column, borders disappearing, transparent backgrounds, and the parent overflow killing stickiness." },

  /* ---- BROWSER / PERF: gaps ---- */
  { id: "WEB-19", cat: "WEB", lv: "mid", q: "What are the technical SEO fundamentals a frontend engineer owns?",
    a: ["Server-rendered content for anything indexable; unique title and meta description per route.", "Canonical tags to kill duplicates, hreflang for locales, robots.txt and an accurate sitemap.", "Semantic headings, descriptive alt text, crawlable <a href> links (not onClick divs).", "Core Web Vitals are a ranking input; structured data (JSON-LD) drives rich results."],
    trap: "Follow-up: your SPA route change doesn't update the title or fire a pageview. If you can't say 'update document.title and push an analytics event on navigation', that's a common production miss." },
  { id: "WEB-20", cat: "WEB", lv: "mid", q: "What makes an app a PWA, and would you ship one?",
    a: ["Manifest (name, icons, start_url, display), a service worker, and HTTPS — that gets you installable.", "Adds: offline shell, push notifications, background sync, add-to-home-screen.", "Good fit for field agents on flaky networks — collections staff filling forms offline is the textbook case.", "Limits on iOS: no real background sync, storage eviction, and push only from an installed PWA."],
    trap: "They ask when a PWA beats a native/Capacitor build. Be honest: if you need reliable background work, deep OS integration, or app-store distribution, a wrapper or native app wins." },
  { id: "WEB-21", cat: "WEB", lv: "hard", q: "What is the back/forward cache (bfcache) and what breaks it?",
    a: ["The browser freezes the whole page in memory so back navigation is instant — no re-execution, no refetch.", "Breakers: an unload listener, open WebSocket/IndexedDB transactions, Cache-Control:no-store on the document.", "Use pagehide/pageshow instead of unload, and check event.persisted to refresh stale data on restore.", "Page Visibility API (visibilitychange) is the correct hook for flushing analytics — sendBeacon on hidden."],
    trap: "Almost nobody knows this at 2 YOE, so it's a strong differentiator. The trap version: 'why does my page show stale data when the user hits back?' — because bfcache restored it and no listener refreshed it." },
  { id: "WEB-22", cat: "WEB", lv: "mid", q: "How do you communicate between tabs, iframes and windows?",
    a: ["postMessage between windows/iframes — ALWAYS validate event.origin and never trust the payload.", "BroadcastChannel for same-origin tab-to-tab sync (logout everywhere, cache invalidation).", "The storage event fires in other tabs when localStorage changes — the low-tech version.", "SharedWorker for one shared connection across tabs (a single WebSocket instead of five)."],
    trap: "The security follow-up: if you postMessage with targetOrigin '*' and skip the origin check on receipt, you've built an XSS bridge. That check is the thing they're listening for." },
  { id: "WEB-23", cat: "WEB", lv: "mid", q: "How much can you store on the client, and what evicts it?",
    a: ["localStorage ~5–10MB and synchronous; IndexedDB is quota-based (often a share of free disk), async.", "navigator.storage.estimate() reports usage/quota; persist() requests exemption from eviction.", "Browsers evict under storage pressure, and Safari clears script-writable storage after ~7 days of no interaction.", "Never treat client storage as durable — it's a cache, the server is the record."],
    trap: "Follow-up: your offline queue lost a user's submissions. If your design assumed localStorage is permanent, that's the bug — which is why anything financial must sync to the server before you clear it locally." },
  { id: "WEB-24", cat: "WEB", lv: "mid", q: "Walk me through how you use Chrome DevTools to diagnose a problem.",
    a: ["Network: waterfall for TTFB vs download vs blocked, disable cache, throttle, check the OPTIONS preflight.", "Performance: record, look for long tasks, forced reflow warnings, scripting vs rendering split.", "Elements: computed styles to find the winning rule, layers panel for compositing, rendering tab for paint flashing and CLS regions.", "Application: storage, service worker state, cookie flags. Coverage tab for unused JS/CSS."],
    trap: "Open-ended by design — they're checking you actually debug rather than console.log. Naming the Coverage tab, the rendering panel's layout-shift regions, or `queryObjects()` in the console reads as real experience." },
  { id: "WEB-25", cat: "WEB", lv: "mid", q: "What does a CDN do, and what should be cached at the edge?",
    a: ["Serves assets from a PoP near the user: lower RTT, TLS termination, offloads origin, absorbs traffic spikes.", "Cache static hashed assets forever (immutable); cache HTML briefly or with stale-while-revalidate; never cache authed responses without a Vary/key on the user.", "Purge strategy on deploy, and surrogate keys for tag-based invalidation.", "Edge functions for redirects, AB bucketing, geo routing and auth checks close to the user."],
    trap: "The dangerous mistake they probe for: a personalised page cached at the edge, serving one user's data to another. Vary headers and cache keys are the answer." },
  { id: "WEB-26", cat: "WEB", lv: "hard", q: "A page takes 8 seconds to load in production but is fast locally. How do you find out why?",
    a: ["Split the number: TTFB (server/DB/CDN) vs resource loading vs script execution vs hydration. Don't guess which.", "Check field data (RUM/CrUX) segmented by device, network and geography — locally you have a fast laptop and a nearby server.", "Common real causes: unbatched API waterfalls, a huge un-split vendor bundle, blocking third-party scripts, missing compression, N+1 on the backend.", "Fix the biggest term first and re-measure; state the target metric before you start."],
    trap: "Interviewers watch for a systematic method over a list of tips. Saying 'I'd add lazy loading' before measuring is the failure; asking 'what does the waterfall show?' is the pass." },
];

const Q8 = [
  /* ---- SECURITY: gaps ---- */
  { id: "SEC-11", cat: "SEC", lv: "hard", q: "What is prototype pollution and how does it reach a frontend app?",
    a: ["Writing to __proto__ or constructor.prototype through a recursive merge/set-by-path with attacker-controlled keys.", "Effect: every object in the runtime inherits the injected property — bypassing auth flags, breaking template engines, enabling XSS or RCE in Node.", "Vectors: deep-merge utilities, query-string parsers, JSON from an untrusted source.", "Defences: reject __proto__/constructor/prototype keys, use Object.create(null) or Map for dictionaries, Object.freeze(Object.prototype) in strict environments."],
    trap: "The follow-up: 'write a safe set(obj, path, value)'. If your implementation happily accepts the path '__proto__.isAdmin', you've just demonstrated the vulnerability live." },
  { id: "SEC-12", cat: "SEC", lv: "mid", q: "What is an open redirect and why does it matter for login flows?",
    a: ["?returnUrl=https://evil.com sends the user off-site after login, carrying trust from your domain — used for phishing and token theft.", "Validate against an allowlist, or accept only same-origin relative paths (and reject protocol-relative //evil.com).", "Same rule for OAuth redirect_uri — the auth server must match it exactly, not by prefix.", "Never reflect a user-supplied URL into window.location or an <a href> without scheme validation (javascript: is XSS)."],
    trap: "Candidates check `url.startsWith('/')` and miss `//evil.com`, which browsers treat as protocol-relative and absolute. That single case is usually the whole question." },
  { id: "SEC-13", cat: "SEC", lv: "mid", q: "How do you manage supply-chain risk in a JS project?",
    a: ["Commit the lockfile, use npm ci in CI, pin exact versions for critical deps.", "Automated scanning: npm audit, Dependabot/Renovate, and a policy for how fast you patch a critical CVE.", "Vet new dependencies: maintenance, install size, transitive count, whether a 20-line util is worth a package.", "Postinstall scripts are arbitrary code execution — --ignore-scripts where feasible, and be wary of typosquats."],
    trap: "They ask what you'd do the morning a popular package is found compromised. The expected answer names a concrete sequence: identify exposure from the lockfile, pin/roll back, rotate any secrets the build could have touched, then patch." },
  { id: "SEC-14", cat: "SEC", lv: "mid", q: "How do you handle PII and compliance in a fintech frontend?",
    a: ["Data minimisation: don't fetch fields the screen doesn't render; mask PAN/Aadhaar/account numbers by default with an explicit reveal that's audit-logged.", "Never send PII to analytics, error trackers or third-party scripts — scrub Sentry payloads and breadcrumbs.", "Consent and purpose limitation under India's DPDP Act; RBI rules on data localisation and storing card data (tokenisation).", "Session hygiene: short idle timeouts, logout everywhere, no sensitive data in localStorage or URLs (URLs leak via Referer and logs)."],
    trap: "The probing question is 'where does a customer's phone number end up in your app?' — the honest answer usually includes a log line or an analytics event nobody audited. Say how you'd find and fix that." },
  { id: "SEC-15", cat: "SEC", lv: "mid", q: "How do you serve file downloads and previews securely?",
    a: ["Short-lived presigned URLs scoped to one object; authorise on generation, not just on the UI.", "Content-Disposition: attachment and X-Content-Type-Options: nosniff so an uploaded .html can't execute on your origin.", "Serve user uploads from a separate origin/bucket so a stored payload can't touch your cookies or DOM.", "Validate type by content, not extension; scan before making files reachable."],
    trap: "Follow-up: a user uploads an SVG avatar. SVG is XML with embedded script — rendered inline it's stored XSS. Serving it as an <img> from another origin, or sanitising it, is the answer." },
  { id: "SEC-16", cat: "SEC", lv: "mid", q: "How do you implement logout, session expiry and 'log out everywhere'?",
    a: ["Clear the httpOnly cookie server-side; client-side clearing alone doesn't revoke anything.", "Refresh-token rotation with a server-side session/version column — bump it to invalidate every device.", "Broadcast the logout to other tabs (BroadcastChannel/storage event) so no tab keeps a live UI.", "Idle timeout with a warning modal, plus absolute session lifetime — required in regulated products."],
    trap: "They ask how you revoke a stateless JWT before it expires. If your answer is 'you can't', add the practical part: short access-token TTL plus a server-side denylist or session version check on refresh." },

  /* ---- SYSTEM DESIGN: gaps ---- */
  { id: "SD-15", cat: "SD", lv: "hard", q: "Design a chat / messaging interface.",
    a: ["Transport: WebSocket with reconnect + backoff; REST for history pagination (cursor on message id, load older upward).", "Message states: sending → sent → delivered → read, with a client-generated id for dedupe and optimistic append.", "Offline queue persisted to IndexedDB, flushed on reconnect in order; handle failure with a retry affordance.", "UI: reverse-infinite scroll keeping scroll anchor on prepend, typing indicators throttled, unread divider, virtualised list.", "Ordering: server timestamps are authoritative; never sort by client clock."],
    trap: "The key follow-up: what happens when the socket drops for 30 seconds? You need a resume-from-last-seen-id sync, not a full refetch — and you must dedupe messages that arrive twice." },
  { id: "SD-16", cat: "SD", lv: "mid", q: "Design an in-app notification system.",
    a: ["Feed API with cursor pagination + an unread count endpoint; real-time pushes via SSE/WebSocket, polling as fallback.", "Read state per notification and a bulk mark-all; optimistic update with rollback.", "Grouping and deduplication ('3 new applications') to stop feed spam; per-category preferences.", "Browser push needs a service worker, permission asked in context (never on page load), and a fallback when denied."],
    trap: "They ask how the badge count stays correct across tabs and after actions taken elsewhere. Answer: server is the source of truth, BroadcastChannel syncs tabs, and you reconcile on window focus." },
  { id: "SD-17", cat: "SD", lv: "hard", q: "Design a file upload experience for a document-heavy workflow.",
    a: ["Presigned direct-to-storage upload so files bypass your API; chunked multipart for large files with per-chunk retry.", "Client validation of type/size for UX, server validation for safety; show per-file progress, cancel and retry.", "Resumability: store upload id and completed parts locally so a refresh continues rather than restarts.", "Post-upload pipeline: virus scan → OCR/parse → status polling or a push when processing completes.", "Queue with concurrency limit (3–4) so 50 documents don't saturate the connection."],
    trap: "Follow-up: the user closes the tab mid-upload. If your design has no upload id persisted, they start over — and in a lending flow that's the drop-off point ops will complain about." },
  { id: "SD-18", cat: "SD", lv: "mid", q: "Design a kanban / drag-and-drop board.",
    a: ["Data: columns with ordered card ids; use fractional or lexicographic rank strings (not integer indexes) so a move is one write, not a reindex of the column.", "Optimistic move with rollback; concurrent moves by two users reconciled by server rank.", "Pointer-events based DnD for touch support, with a keyboard alternative and aria-live announcements.", "Virtualise long columns; batch position updates while dragging and persist on drop."],
    trap: "The scaling question: two users drag cards into the same slot simultaneously. Integer positions collide and require a full recompute — knowing about fractional ranking (LexoRank) is the senior answer." },
  { id: "SD-19", cat: "SD", lv: "hard", q: "Design a search results page with filters, facets and shareable state.",
    a: ["URL is the source of truth (query, filters, sort, page) so results are shareable and back/forward works.", "Debounce text input, but apply facet clicks immediately; cancel stale requests and ignore out-of-order responses.", "Server returns facet counts with results; show applied-filter chips, result count, and a clear-all.", "Empty/zero-result state must suggest a recovery (relax a filter, spelling correction), not just say 'no results'.", "Cache by the full query key so back-navigation is instant."],
    trap: "They'll ask what happens when a user rapidly toggles five filters. Without request cancellation and a request-id guard, an earlier response lands last and the UI shows results that don't match the filters." },
  { id: "SD-20", cat: "SD", lv: "hard", q: "Design an offline-first app for field agents on poor networks.",
    a: ["Local-first store (IndexedDB) as the read/write source; sync engine pushes a mutation queue when online.", "Every mutation gets a client id and timestamp for idempotent replay; server resolves conflicts (last-write-wins, or per-field merge for forms).", "Surface sync state honestly: pending, syncing, failed — never pretend saved data is submitted.", "Cache the app shell via service worker; version the local schema and handle migrations.", "Guard the money paths: never allow an offline action whose failure the user can't recover from."],
    trap: "Follow-up: two agents edit the same record offline. If you say 'last write wins' with no further thought, push back on yourself — name what data loss that causes and when you'd need per-field merges or a conflict UI." },
  { id: "SD-21", cat: "SD", lv: "mid", q: "Design an e-commerce cart and checkout flow.",
    a: ["Cart: guest cart in local storage merged into the server cart on login; server re-prices at checkout — never trust client prices.", "Stock and price validation at each step; show changes explicitly rather than silently updating.", "Payment: idempotency key on order creation, redirect/3DS handling, and a webhook as the authoritative confirmation.", "Recover from a failed payment without losing the cart; handle the double-click and the back button after payment."],
    trap: "The one that catches people: the user pays, the webhook is delayed, and they land on a 'payment failed' page. Your success state must be driven by the server's order status with polling, not by the client redirect alone." },
  { id: "SD-22", cat: "SD", lv: "hard", q: "Design a collaborative text editor (high level).",
    a: ["Concurrent editing needs OT or CRDT — CRDTs (Yjs/Automerge) merge without a central transform server and work offline.", "Transport: WebSocket with awareness (cursors, presence); persist snapshots plus an update log.", "Undo must be per-user, not global — a shared undo stack is the classic naive mistake.", "Frontend concerns: cursor mapping after remote edits, large-doc rendering, and a read-only fallback when sync fails."],
    trap: "You're not expected to implement a CRDT. The pass condition is naming the problem correctly (concurrent intention preservation) and picking a library with a reason — pretending you'd hand-roll it is the wrong flex." },
  { id: "SD-23", cat: "SD", lv: "mid", q: "Design a video/media player component.",
    a: ["HLS/DASH adaptive bitrate over a plain mp4 for anything long; hls.js where native HLS isn't supported.", "Preload metadata only; poster image for the LCP; lazy-init the player below the fold.", "Custom controls must keep keyboard support (space, arrows, F, M), captions, and a visible focus ring.", "Track buffering/stall events for QoE metrics; resume from last position; respect data-saver and autoplay policies (muted only)."],
    trap: "Follow-up: autoplay doesn't work on iOS. The answer is the platform policy — muted + playsinline, and a user gesture for sound — not a bug in your code." },
  { id: "SD-24", cat: "SD", lv: "hard", q: "Design a config-driven / JSON-schema-driven form engine.",
    a: ["Schema defines fields, types, validation, visibility conditions and layout; the renderer maps type → component via a registry.", "Conditional visibility needs a safe expression evaluator with clear operator precedence — and hidden fields must be excluded from the payload, not just from the DOM.", "Version the schema; old drafts must still render with the schema they were created under.", "Guardrails: schema validation at build/publish time, a preview mode, and unit tests over the condition evaluator."],
    trap: "This is a resume-driven question if you've built one. Expect: 'what happens when someone writes a bad condition?' — the answer is validation at publish time plus a fail-visible default, because failing closed silently hides fields from real users." },
];

const Q9 = [
  /* ---- BACKEND: gaps ---- */
  { id: "BE-19", cat: "BE", lv: "mid", q: "PostgreSQL JSONB: when do you use it and how do you query it fast?",
    a: ["JSONB for genuinely variable payloads: third-party responses, audit snapshots, config/DSL documents. Not as a substitute for columns you filter on constantly.", "Operators: -> returns json, ->> returns text, @> containment, ? key existence, jsonb_path_query for JSONPath.", "Index with GIN (jsonb_path_ops for containment) or a B-tree on an expression like ((data->>'status')) for a single hot key.", "Promote hot fields to real columns once they're queried or joined — the honest trade-off."],
    trap: "They ask why a JSONB filter is slow despite an index. Usually the query uses ->> with a pattern or cast that the GIN index can't serve — EXPLAIN ANALYZE showing a seq scan is the proof they want you to reach for." },
  { id: "BE-20", cat: "BE", lv: "mid", q: "Django REST Framework: serializers, viewsets, and where does business logic go?",
    a: ["Serializer = validation + representation; ModelSerializer for CRUD, explicit fields (never __all__ on a model with sensitive columns).", "ViewSet + router for standard CRUD; APIView when the flow isn't resource-shaped; @action for custom endpoints.", "Business logic belongs in a service/domain layer, not in serializers or views — keeps it testable and reusable from Celery tasks.", "Permissions classes for authz, throttling for rate limits, pagination classes for consistent list responses."],
    trap: "Follow-up: your serializer triggers 200 queries. The cause is a nested serializer without select_related/prefetch_related on the queryset — the N+1 shows up in DRF more than anywhere else." },
  { id: "BE-21", cat: "BE", lv: "mid", q: "How do you run background jobs with Celery, and what goes wrong?",
    a: ["Tasks must be idempotent and small; pass ids, never model instances or large payloads, through the broker.", "Retries with exponential backoff and max_retries; acks_late plus visibility timeout so a crashed worker's task is redelivered.", "Separate queues by priority/latency (emails vs disbursement callbacks) with dedicated workers; monitor queue depth and task latency.", "Race with the DB transaction: a task can start before the transaction commits — use transaction.on_commit to enqueue."],
    trap: "That on_commit detail is the whole question in a lot of interviews: 'my task runs and can't find the row it was told about.' Not knowing it marks you as never having debugged a real queue." },
  { id: "BE-22", cat: "BE", lv: "mid", q: "Database normalisation and joins — explain both and when you denormalise.",
    a: ["1NF atomic values, 2NF no partial dependency on a composite key, 3NF no transitive dependency. Aim for 3NF then denormalise deliberately.", "INNER vs LEFT vs RIGHT vs FULL; a LEFT JOIN with a WHERE on the right table silently becomes an INNER join.", "Denormalise for read-heavy aggregates and reporting — accept the sync cost and document the source of truth.", "Derived daily/rollup tables are the standard pattern for dashboards; recompute or update via signals with F() expressions."],
    trap: "They give you a query with a LEFT JOIN and a filter on the joined table and ask why rows vanished. The filter has to move into the ON clause. This trips up people who only use an ORM." },
  { id: "BE-23", cat: "BE", lv: "hard", q: "Explain the CAP theorem and where you've made that trade-off.",
    a: ["Under a network partition you choose availability or consistency — you don't 'choose CA'.", "Most transactional systems (a lending ledger) pick consistency: refuse the write rather than allow divergence.", "Feeds, search indexes, analytics and caches pick availability with eventual consistency.", "PACELC extends it: even without partitions, you trade latency against consistency."],
    trap: "The bad answer is reciting the triangle. The good answer names one decision you made — e.g. reading a balance from the primary rather than a replica because a stale limit could over-disburse." },
  { id: "BE-24", cat: "BE", lv: "mid", q: "Monolith vs microservices — what would you tell a team of 15 engineers?",
    a: ["Start with a modular monolith: clear internal boundaries, one deploy, one database, no distributed-transaction pain.", "Split when a module has a genuinely different scaling profile, release cadence, or team ownership — not because it feels modern.", "Costs of splitting: network failure between every call, distributed tracing, data consistency across services, versioned contracts, more infra.", "Patterns if you do split: API gateway, saga/outbox for cross-service consistency, service ownership of its own data."],
    trap: "Interviewers are testing judgement, not knowledge. Advocating microservices for a 15-person team without naming the operational cost reads as inexperienced." },
  { id: "BE-25", cat: "BE", lv: "mid", q: "How does your code get to production? Docker, environments, and rollback.",
    a: ["Build one immutable image, promote the same artifact through staging → prod; config via env vars, secrets from a manager.", "Multi-stage Dockerfile, non-root user, pinned base image; health checks and readiness probes so traffic isn't sent to a booting pod.", "Deploy strategy: rolling or blue-green; rollback is redeploying the previous image, which must not require a DB rollback.", "That's why migrations are decoupled and backwards-compatible — the release before the code change."],
    trap: "Follow-up: 'you rolled back the code but the migration already ran.' If your migration wasn't backwards-compatible, you're now down. That sequencing is the real question." },
  { id: "BE-26", cat: "BE", lv: "mid", q: "How do you make a system observable? Logs, metrics, traces.",
    a: ["Structured JSON logs with a correlation/request id propagated from the client through every service and task.", "Metrics: RED for services (rate, errors, duration) and USE for resources; alert on symptoms users feel, not CPU.", "Distributed tracing (OpenTelemetry) to see where a slow request actually spent its time.", "Log levels used properly: no PII, no logging in a hot loop, ERROR reserved for things a human must act on."],
    trap: "They ask how you'd debug 'the app is slow' with no reproduction. Without correlation ids linking the frontend request to the backend trace, the honest answer is 'I couldn't' — which is why you add them up front." },
  { id: "BE-27", cat: "BE", lv: "mid", q: "How do you design scheduled jobs and crons safely?",
    a: ["A cron running on every instance fires N times — use a distributed lock, a leader, or a scheduler service (Celery Beat with a single scheduler).", "Make every job idempotent and re-runnable for a given date; store a run record so you can detect misses.", "Timezone: run financial day-boundary jobs in the business timezone (IST), store timestamps in UTC.", "Alert on non-execution, not just on failure — a job that silently stopped is the worst failure mode."],
    trap: "The killer follow-up: 'how do you know a nightly job didn't run last night?' Most people only alert on exceptions. A heartbeat/dead-man's-switch is the answer." },
  { id: "BE-28", cat: "BE", lv: "mid", q: "How do you store timestamps, money and enums in a financial database?",
    a: ["Timestamps as timestamptz in UTC; date-only fields as DATE, never a timestamp.", "Money as integer minor units (paise) or NUMERIC — never FLOAT.", "Enums as small text/varchar with a check constraint or a lookup table; native PG enums are painful to alter.", "Immutable ledger rows for every value change; current balance is derived or maintained transactionally, never edited in place."],
    trap: "Follow-up: two disbursements hit the same facility limit concurrently. Without SELECT ... FOR UPDATE or a constraint, both pass the check and you over-disburse — this is the fintech version of the classic race condition question." },
  { id: "BE-29", cat: "BE", lv: "mid", q: "How do you version an API and evolve it without breaking clients?",
    a: ["Additive changes are safe; removals and type changes are not. Never repurpose an existing field.", "Version in the path (/v1) for major breaks; feature-detect or use a header for smaller variations.", "Deprecation process: announce, log usage per client, set a sunset date, then remove — you need the usage telemetry to do this at all.", "Mobile clients can't be force-upgraded instantly — support the old contract until the install base rolls over."],
    trap: "That mobile point is the one people miss. If you have an Android app in the field, 'we'll just update both at once' isn't available to you — old versions live for months." },
  { id: "BE-30", cat: "BE", lv: "hard", q: "How do you integrate a flaky third-party API (credit bureau, bank, KYC provider)?",
    a: ["Timeouts on every call (connect and read), retries with backoff only for idempotent operations, and a circuit breaker so their outage isn't yours.", "Persist the raw request/response for reconciliation and dispute — mandatory in regulated flows.", "Async by default: enqueue, poll or receive a webhook, expose a status to the UI rather than blocking a request for 30 seconds.", "Sandbox vs prod credentials, rate limits, and a documented fallback when they're down (manual queue, degrade gracefully)."],
    trap: "They ask what your UI shows while a bureau call takes 40 seconds. If your answer is a spinner on a blocking request, you've designed a timeout cascade — the expected answer is an async job plus a pending state the user can leave and return to." },

  /* ---- MACHINE CODING: gaps ---- */
  { id: "MC-17", cat: "MC", lv: "mid", q: "Build a toast/notification system with a queue and auto-dismiss.",
    a: ["Context + reducer holding an array of toasts; a hook exposing toast.success/error returning an id.", "Auto-dismiss timer per toast, paused on hover/focus; manual close; max visible with the rest queued.", "Portal to body, stacked with transforms, exit animation before removal from state.", "Accessibility: role=status (polite) for info, role=alert (assertive) for errors — not everything should interrupt."],
    trap: "Follow-up: the timer keeps running while the user hovers to read it, or two identical errors stack five times. Pause-on-hover and dedupe-by-key are what separate a real implementation from a demo." },
  { id: "MC-18", cat: "MC", lv: "mid", q: "Build an OTP input (6 boxes, paste, backspace, auto-advance).",
    a: ["Array of refs; on input move focus forward, on Backspace in an empty box move back and clear the previous.", "Handle paste of the full code on any box by splitting and distributing, then focusing the last filled.", "inputMode='numeric', autoComplete='one-time-code' for iOS/Android SMS autofill, maxLength=1.", "Submit automatically when complete; show error state without clearing what the user typed."],
    trap: "Very common live-coding task. The two failures: paste only fills the first box, and Backspace on an empty box does nothing. Both are what they're actually watching for." },
  { id: "MC-19", cat: "MC", lv: "hard", q: "Build a multi-select searchable dropdown from scratch.",
    a: ["State: open, query, highlighted index, selected Set. Filter options by query, keep selected chips visible.", "Keyboard: ArrowDown/Up move highlight (wrapping), Enter toggles, Backspace on empty query removes the last chip, Escape closes.", "ARIA combobox pattern: role=combobox + listbox, aria-expanded, aria-activedescendant, aria-multiselectable.", "Click-outside close, scroll the highlighted option into view, virtualise beyond ~200 options."],
    trap: "The detail interviewers check: does focus stay in the input while ArrowDown moves the highlight? Moving DOM focus into the list breaks typing — aria-activedescendant exists for exactly this." },
  { id: "MC-20", cat: "MC", lv: "mid", q: "Build an image carousel with autoplay, swipe and keyboard support.",
    a: ["Index state + transform: translateX(-index * 100%); or CSS scroll-snap with an observer for the simplest robust version.", "Autoplay with pause on hover/focus and on document hidden; cleanup the interval on unmount.", "Swipe via pointer events with a distance/velocity threshold; arrow keys and visible dots as an alternative.", "Infinite loop needs cloned edge slides or index modulo with a transition-disable frame on wrap."],
    trap: "Accessibility follow-up: an auto-advancing carousel is a WCAG failure without a pause control, and each slide change should be announced politely or not at all — never with role=alert." },
  { id: "MC-21", cat: "MC", lv: "mid", q: "Build a file upload component with progress, cancel and retry.",
    a: ["XHR for upload progress events (fetch has no upload progress without streams); AbortController/xhr.abort for cancel.", "Per-file state machine: queued → uploading(%) → done | failed, with retry preserving the file reference.", "Drag-and-drop zone plus a click-to-browse input; validate type/size before starting.", "Concurrency limit so 20 files don't start at once; overall progress derived from per-file bytes."],
    trap: "They ask why your progress bar jumps to 100% then hangs. Upload progress hits 100 when bytes leave the client — the server is still processing. You need a separate processing state, or users think it's frozen." },
  { id: "MC-22", cat: "MC", lv: "hard", q: "Implement undo/redo for an editable UI.",
    a: ["Two stacks (past/future) of states or of inverse commands; a new action clears the future stack.", "Command pattern (do/undo per action) scales better than full snapshots for large state; snapshots are fine for small forms.", "Coalesce rapid keystrokes into one history entry (debounced commit) or every character becomes an undo step.", "Bind Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z; cap history size to bound memory."],
    trap: "Follow-up: undo after a server-synced change. Local undo that doesn't replay to the server produces divergence — you need to undo as a new forward action, not by rewinding state silently." },
  { id: "MC-23", cat: "MC", lv: "mid", q: "Build a pagination component (with ellipsis) and a useFetch hook.",
    a: ["Pagination: always show first, last, current ± 1, and ellipsis for gaps; guard against page counts under 7 producing double ellipses.", "Emit page changes upward; disable prev/next at bounds; nav + aria-current='page'.", "useFetch: state {data, error, isLoading}, AbortController on unmount/param change, ignore stale responses, refetch on key change.", "Return a refetch function; don't put the fetch result in state without guarding against the unmounted-set warning."],
    trap: "The stale-response race is the point of the useFetch half: change the id twice quickly and the first response can resolve last. A request-id or abort is required, and most candidates forget it." },
  { id: "MC-24", cat: "MC", lv: "mid", q: "Build an infinite scroll hook and a 'load more' fallback.",
    a: ["IntersectionObserver on a sentinel below the list; unobserve when there's no next page.", "Guard against double-firing while a request is in flight; cursor pagination so inserts don't duplicate rows.", "Preserve scroll position on back-navigation by caching pages and restoring the offset.", "Always provide a manual Load more button as the accessible fallback — infinite scroll traps keyboard users away from the footer."],
    trap: "Follow-up: why cursor and not page numbers? With offsets, a new row at the top shifts everything and the user sees the same item twice. That's the answer they want." },
  { id: "MC-25", cat: "MC", lv: "mid", q: "Build a stepper/wizard component with validation gates.",
    a: ["Steps as data with validate() per step; a currentStep index; block Next until the step resolves valid.", "Allow going back freely, and clicking a completed step; lock future steps.", "Persist form data across steps in one object; save a draft on each transition.", "Announce step changes and move focus to the new step heading, not to the top of the page."],
    trap: "They ask what happens on browser refresh at step 4. Without a persisted draft (server or storage) you've lost everything — in an onboarding flow this is a real conversion bug, not a nicety." },
  { id: "MC-26", cat: "MC", lv: "mid", q: "Build a tic-tac-toe / grid game (classic live-coding warm-up).",
    a: ["Board as a flat array of 9; win check against 8 line triples; draw when the board is full with no winner.", "Track turn, winner, and a move history for time-travel (the React docs' own version).", "Reset without a full remount; disable filled cells; highlight the winning line.", "Generalise: an N×N board with a k-in-a-row check by scanning from the last move in four directions."],
    trap: "The extension they spring on you: make it N×N. If your win check is a hardcoded list of triples, you have to rewrite everything — starting with a directional scan from the last move shows you saw it coming." },
  { id: "MC-27", cat: "MC", lv: "hard", q: "Build a nested checkbox tree with indeterminate parents.",
    a: ["Recursive render; a Set of checked ids in state lifted to the root.", "Checking a parent selects all descendants; a parent is indeterminate when some but not all children are checked (set el.indeterminate via a ref — it's not an attribute).", "Bubbling upward: recompute ancestor states after every toggle, or store derived state with useMemo.", "Expand/collapse independent of check state; keyboard navigable with proper roles."],
    trap: "indeterminate cannot be set in JSX — it's a DOM property only. Candidates write indeterminate={true} on the input, see nothing happen, and can't explain why." },
  { id: "MC-28", cat: "MC", lv: "mid", q: "Implement a comment box with @mentions and a character counter.",
    a: ["Detect the trigger by scanning backwards from the caret for '@' with no whitespace; show a filtered popup.", "Insert the mention preserving caret position; store a structured value (text + mention ids), not just the display string.", "Counter with a soft limit warning; block submit past the hard limit and count graphemes, not code units (emoji).", "Keyboard: arrows/Enter select from the popup without submitting the form; Escape dismisses only the popup."],
    trap: "Enter is the trap: with a popup open Enter must pick a mention, otherwise it submits the comment. If you don't stopPropagation on that key, the demo submits half-typed comments in front of the interviewer." },
];

const Q10 = [
  /* ---- DSA: gaps ---- */
  { id: "DSA-11", cat: "DSA", lv: "mid", q: "Convert a flat list with parentId into a nested tree (and back).",
    a: ["One pass to build a Map of id → node with children:[]; second pass to attach each node to its parent, collecting roots.", "O(n) time and space; handles arbitrary ordering, unlike naive recursive filtering which is O(n²).", "Guard against orphans (missing parent) and cycles — a corrupt parentId can hang the render.", "Flatten back with DFS carrying a depth for indentation."],
    trap: "This appears in real frontend interviews more than any LeetCode medium: category trees, org charts, nested comments, menu builders. If you write the O(n²) filter version, they'll ask for 10,000 nodes." },
  { id: "DSA-12", cat: "DSA", lv: "mid", q: "Prefix sums and difference arrays — where do they show up?",
    a: ["Prefix sum answers any range-sum query in O(1) after O(n) preprocessing.", "Subarray sum equals k with a hash map of prefix counts — the canonical problem.", "Difference array for many range updates then one final read (e.g. availability calendars).", "2-D prefix sums for grid regions."],
    trap: "Follow-up on subarray sum: why a hash map of prefix counts rather than a set? Because subarrays can repeat and you need the count of each prefix, not just its existence — that detail is the whole solution." },
  { id: "DSA-13", cat: "DSA", lv: "mid", q: "Stack and queue problems worth knowing.",
    a: ["Valid parentheses, min stack (O(1) min), evaluate RPN, daily temperatures / next greater element (monotonic stack).", "Queue via two stacks; sliding-window maximum with a monotonic deque.", "Frontend analogue: undo/redo stacks, a task queue with concurrency, breadcrumb navigation.", "Monotonic stack is the pattern that separates a prepared candidate from a lucky one."],
    trap: "They give you 'next greater element' and watch whether you write the O(n²) nested loop first. Saying 'this is a monotonic stack, O(n)' immediately is a strong signal." },
  { id: "DSA-14", cat: "DSA", lv: "mid", q: "Matrix / grid traversal problems.",
    a: ["Number of islands (DFS/BFS flood fill), rotate image in place, spiral order, set matrix zeroes.", "BFS with a queue for shortest path on a grid; mark visited in place or with a separate set.", "Directions array [[0,1],[1,0],[0,-1],[-1,0]] keeps the code short and bug-free.", "Watch recursion depth on large grids — go iterative with an explicit stack."],
    trap: "Rotate-in-place is the one that trips people: transpose then reverse each row. If you allocate a new matrix after they said 'in place', that's a fail even with correct output." },

  /* ---- TESTING & TOOLING: gaps ---- */
  { id: "TST-09", cat: "TST", lv: "mid", q: "E2E testing: Playwright vs Cypress, and what do you actually automate?",
    a: ["Automate only critical paths: login, the primary create flow, payment/submit, and the top regression that has bitten you.", "Playwright: multi-browser, parallel, auto-waiting, better CI story; Cypress: nicer local debugging, historically single-tab and Chromium-first.", "Use test ids or roles, never CSS class selectors; seed data via API, not UI clicks.", "Run against a deployed preview per PR; keep the suite under ~10 minutes or people start skipping it."],
    trap: "They ask how you keep E2E from becoming flaky. The expected answers: no fixed sleeps, deterministic seeded data, isolated test accounts, retry-with-trace on CI, and deleting tests that don't earn their keep." },
  { id: "TST-10", cat: "TST", lv: "mid", q: "Explain lint, format, hooks and how you enforce standards in a team.",
    a: ["ESLint for correctness (rules-of-hooks, exhaustive-deps, no-floating-promises), Prettier for formatting — keep them separate concerns.", "Husky + lint-staged to run on changed files pre-commit; the real gate is CI, since hooks are skippable.", "Ban patterns with rules rather than review comments: no default exports, import boundaries, no console in prod code.", "Autofix on save so the standard costs nobody any time."],
    trap: "Follow-up: your team disabled exhaustive-deps everywhere. That's a smell, not a solution — the honest answer explains when the rule is genuinely wrong (a stable callback ref) versus when it's hiding a stale closure." },
  { id: "TST-11", cat: "TST", lv: "mid", q: "npm vs yarn vs pnpm, lockfiles, semver and peer dependencies.",
    a: ["Semver ^ allows minor+patch, ~ patch only, exact for critical deps; lockfile pins the actual resolved tree.", "pnpm uses a content-addressed store with symlinks — faster, disk-efficient, and strict about undeclared dependencies.", "Peer deps declare 'I need the host to provide React' — mismatches cause two React copies and the invalid-hook-call error.", "npm ci in CI for reproducible installs; never commit node_modules."],
    trap: "The 'invalid hook call' question: two copies of React in the tree, usually from a linked local package or a peer-dep mismatch. Knowing that off the top is a strong practical signal." },
  { id: "TST-12", cat: "TST", lv: "mid", q: "What is Storybook for, and would you use it?",
    a: ["Isolated component development, a living catalogue for designers/PMs, and a base for visual regression and a11y checks.", "Best value on a shared design system; questionable overhead for a small app with few reused components.", "Play functions turn stories into interaction tests, so stories double as test fixtures.", "Cost is real: it's a second build to maintain and it rots if nobody enforces new components adding stories."],
    trap: "They're testing whether you adopt tools reflexively. Saying 'yes, always' without naming the maintenance cost is weaker than 'yes for a design system, no for a 10-screen internal tool'." },
  { id: "TST-13", cat: "TST", lv: "mid", q: "Describe your debugging methodology on an unfamiliar codebase.",
    a: ["Reproduce reliably first; if it's intermittent, find the variable that makes it deterministic before touching code.", "Narrow by bisection: git bisect across commits, or binary-search the code path by disabling halves.", "Read the stack trace properly and check assumptions with breakpoints, not console.log guesses — conditional breakpoints and 'break on DOM change' are underused.", "Write the failing test before the fix so it can't regress; then explain the root cause, not just the patch."],
    trap: "The give-away answer is 'I add console.logs until it works'. Naming git bisect, conditional breakpoints, and reproducing before fixing is what marks 2 years of real debugging versus 2 years of guessing." },
  { id: "TST-14", cat: "TST", lv: "mid", q: "How do you write a unit test for something that isn't pure — timers, network, randomness, dates?",
    a: ["Inject the dependency (clock, random, fetch) or mock at the boundary; never assert on real wall-clock time.", "vi.useFakeTimers / jest fake timers with advanceTimersByTime for debounce and polling tests.", "MSW to intercept HTTP so the component under test uses its real fetch code path.", "Freeze the date with a fixed ISO string; seed randomness; assert behaviour, not implementation calls."],
    trap: "Follow-up: how do you test a debounced search input? Fake timers plus userEvent's advanceTimers option — if you use a real 300ms sleep, your suite is both slow and flaky." },

  /* ---- MOBILE / CAPACITOR (resume-driven) ---- */
  { id: "APP-01", cat: "APP", lv: "mid", q: "How does Capacitor work, and how is it different from React Native?",
    a: ["Capacitor runs your web app in a native WebView and bridges to native APIs via plugins — one web codebase, near-native shell.", "React Native renders actual native views via a JS bridge/JSI — better native feel, but a separate UI codebase.", "Capacitor wins when you already have a web app and need device APIs, distribution and push; it loses on heavy animation and deep OS integration.", "The native project (android/, ios/) is checked in and editable — that's the main difference from Cordova's generated projects."],
    trap: "They ask about performance. Be honest: a WebView app is fine for forms and lists, and noticeably worse for gesture-heavy or animation-heavy UI. Claiming parity is the wrong answer." },
  { id: "APP-02", cat: "APP", lv: "hard", q: "How do you ship updates to a Capacitor app — OTA vs a native rebuild?",
    a: ["Two flows: web-asset changes ship over the air (Capgo/Appflow); anything touching android/, ios/, plugins or native config requires a store or APK rebuild.", "OTA needs a version manifest, integrity verification, an atomic swap with rollback to the last good bundle, and a kill switch.", "Silent OTA failures are the common production bug — instrument download, verify, apply and activate as separate reportable steps.", "Guard with a minimum-supported-version check from the server so an old shell can be forced to update."],
    trap: "The killer detail: a hardcoded or unincremented versionCode makes the update logic compare wrong and no device updates — while the dashboard shows success. Auto-generate versionCode from CI (commit count/build number), never by hand." },
  { id: "APP-03", cat: "APP", lv: "mid", q: "Why does it work in debug but break in the release build?",
    a: ["R8/ProGuard minification strips or renames classes reached only by reflection — Firebase, Capacitor plugins, Gson models. Fix with keep rules.", "Cleartext HTTP is blocked in release unless declared in a network security config; debug builds are permissive.", "Manifest merging can drop or override attributes between flavours; signing config and applicationId differences break OAuth/deep-link callbacks.", "Debug: install the release APK, capture logcat, and check the mapping file to decode obfuscated stack traces."],
    trap: "This is a real-experience filter. If you've never shipped a release build, you won't know that a working debug APK proves almost nothing about the release one." },
  { id: "APP-04", cat: "APP", lv: "mid", q: "How do push notifications work end to end on Android?",
    a: ["FCM token registered per install and stored server-side per user/device; token refresh must be handled or the device goes silent.", "Data-only vs notification payloads behave differently in background/killed states — data messages let you control display but need a foreground service for reliability.", "Android 13+ requires runtime POST_NOTIFICATIONS permission; channels (importance, sound) are mandatory since Android 8.", "OEM battery optimisation (MIUI, Oppo, Vivo) kills background delivery — a known India-specific problem to call out."],
    trap: "They ask why some users never get notifications. The mature answer names OEM battery managers and permission state, plus a delivery-receipt metric — not 'FCM is unreliable'." },
  { id: "APP-05", cat: "APP", lv: "mid", q: "How do you write a custom Capacitor plugin?",
    a: ["A TS interface + a registered plugin implementation; @CapacitorPlugin annotated Java/Kotlin class with @PluginMethod, returning results via a JSObject.", "Bridge calls are async and JSON-serialisable only — no functions or large binary payloads.", "Permissions and lifecycle handled natively (activity results, foreground checks); errors returned as rejects with codes the web layer can branch on.", "Test on real devices — emulator behaviour diverges for permissions, notifications and background execution."],
    trap: "Follow-up: what can't you do from the web layer? Anything needing OS-level context — exact alarms, full-screen intents on a locked screen, foreground services. Knowing where the WebView ends is the point." },
  { id: "APP-06", cat: "APP", lv: "mid", q: "How do you handle deep links and app-to-app navigation?",
    a: ["Android App Links / iOS Universal Links: HTTPS links verified by a hosted assetlinks.json / apple-app-site-association.", "Custom schemes are a fallback and are hijackable by other apps — prefer verified links.", "Handle cold start vs warm resume: read the intent on launch and subscribe to appUrlOpen while running.", "Deferred deep links (link before install) need an attribution SDK; also plan the logged-out case — save the target and resume after login."],
    trap: "The commonly missed case is the cold start: the link arrives before your router mounts, so the app opens on the home screen. You need to buffer the URL and replay it after initialisation." },
  { id: "APP-07", cat: "APP", lv: "mid", q: "How do you distribute an internal app to a few hundred known users without the Play Store?",
    a: ["Options: Firebase App Distribution (tester groups, in-app update prompts), Play Store internal/closed testing track, or a self-hosted signed APK behind auth.", "Self-hosted needs: a version manifest, checksum verification, the install-unknown-apps permission flow, and an update prompt in-app.", "Keep the signing key in CI secrets, never on a laptop; a lost key means users must reinstall.", "Track adoption per version so you know when you can drop support for an old API contract."],
    trap: "The question behind the question is upgrade compliance: how do you get 500 field users off a broken version? Forced-update gating from the server is the only reliable answer." },
  { id: "APP-08", cat: "APP", lv: "mid", q: "What are the WebView-specific pitfalls you've hit?",
    a: ["Viewport and safe areas: env(safe-area-inset-*) plus viewport-fit=cover, or content hides under the notch/gesture bar.", "Keyboard resizing modes push or overlay content — inputs at the bottom of a form get covered.", "100vh is wrong in a WebView; use dvh or a JS-set custom property.", "Storage can be cleared by the OS; cookies behave differently across WebView versions — don't rely on them for session persistence in-app.", "Back button must be wired to router history or it exits the app mid-flow."],
    trap: "The hardware back button is the one nobody prepares for: on Android, if you don't intercept it, users leave a half-filled form and lose everything. Interviewers with app experience always ask." },

  /* ---- BEHAVIOURAL: gaps ---- */
  { id: "BHV-13", cat: "BHV", lv: "mid", q: "Explain a technical concept to a non-technical stakeholder.",
    a: ["Pick something you actually built; lead with the business consequence, not the mechanism.", "Use one analogy, no jargon, and check understanding rather than lecturing.", "Good practice run: explain why a migration needs a week, or why a 'small' UI change touches the backend.", "Show you can say 'here are two options and what each costs' — that's what makes engineers trusted by PMs."],
    trap: "They may play dumb deliberately. Getting defensive or retreating into jargon fails the round; asking 'what decision are you trying to make?' passes it." },
  { id: "BHV-14", cat: "BHV", lv: "mid", q: "How do you prioritise when everything is marked urgent?",
    a: ["Separate impact from urgency; ask what breaks if it slips a week — most 'urgent' items survive the question.", "Escalate the trade-off with options and dates rather than silently choosing.", "Protect a slice for reliability/tech debt or it never happens; tie debt to a business cost to get it funded.", "Give a concrete example including what you deliberately didn't do."],
    trap: "The follow-up is 'who decided?' — showing you made the trade-off visible to your manager/PM rather than quietly dropping something is the behaviour they're screening for." },
  { id: "BHV-15", cat: "BHV", lv: "mid", q: "Tell me about a time you mentored someone or improved how your team works.",
    a: ["Concrete: onboarding docs, an interview process you ran, a PR-review standard, pairing a junior through their first feature.", "Describe what changed measurably — time to first PR, fewer review cycles, fewer repeat bugs.", "You've interviewed candidates; that counts. Say how you structured it and what signal you looked for.", "At 2+ YOE this is the strongest differentiator for the next level."],
    trap: "Avoid claiming to have 'led the team' if you didn't. Interviewers probe details, and a modest true story about unblocking one person beats an inflated one." },
  { id: "BHV-16", cat: "BHV", lv: "mid", q: "What's your biggest weakness?",
    a: ["Pick a real one with an active mitigation, not a humblebrag ('I care too much').", "Structure: the tendency, the concrete cost it caused once, the specific habit you built to control it, the current state.", "Good candidates: over-scoping, going too deep before shipping, hesitating to ask for help early, writing too little documentation.", "Never name something core to the job you're applying for."],
    trap: "'I'm a perfectionist' is the answer everyone gives and it reads as evasion. A specific, resolved-in-progress weakness builds far more trust than a polished non-answer." },
  { id: "BHV-17", cat: "BHV", lv: "mid", q: "Tell me about feedback you received that was hard to hear.",
    a: ["Show you took it seriously without collapsing: what was said, your first reaction, what you actually changed, the result.", "Pick real feedback — communication, over-engineering, missing deadlines — not a fake one.", "Bonus: how you now solicit feedback proactively rather than waiting for a review cycle.", "Keep the person anonymous and neutral; never make them the villain."],
    trap: "Saying 'I've never received hard feedback' reads as either untrue or as never having been trusted with something significant. Both are worse than the story." },
  { id: "BHV-18", cat: "BHV", lv: "mid", q: "Why do you want to work here specifically?",
    a: ["Three parts: something concrete about their product/domain, how it maps to what you've built, and what you'd want to learn there.", "Research: their engineering blog, recent launches, the actual product (sign up and use it), their scale and funding stage.", "Reference something specific enough that the answer couldn't be reused for another company.", "It's fine to say the domain overlaps with your lending/fintech experience — relevance is a real reason."],
    trap: "Generic praise ('great culture, strong team') signals you applied everywhere. Naming one feature you tried and one question it raised for you is the fastest way to stand out in a screening round." },
  { id: "BHV-19", cat: "BHV", lv: "mid", q: "Describe a technical decision you made that turned out to be wrong.",
    a: ["Pick a genuine one: a library choice, an abstraction built too early, a schema you'd model differently, a rewrite you'd have staged.", "Explain the reasoning at the time (so it wasn't careless), what you learned, and what you changed afterwards.", "Say what signal you'd now look for earlier — that's the transferable part.", "Different from the outage question: this is about judgement, not incident response."],
    trap: "Choosing a trivially small example dodges the question. Picking something you genuinely championed and later reversed shows you can update, which is the trait they're buying." },
  { id: "BHV-20", cat: "BHV", lv: "mid", q: "How do you work with QA, design and product day to day?",
    a: ["Involve QA in edge cases before coding, not after; involve design in state coverage (loading, error, empty, long text, RTL).", "Write the acceptance criteria back in your own words to catch misunderstandings early.", "Raise feasibility concerns during design review, not at the end of the sprint.", "Give an example where doing this early saved rework."],
    trap: "They're screening for someone who treats tickets as a contract versus someone who owns the outcome. 'It matched the ticket' as a defence for a bad user experience is the wrong answer." },
  { id: "BHV-21", cat: "BHV", lv: "hard", q: "Walk me through your resume — anything on it is fair game.",
    a: ["Every line must have a 5-minute story: what, why, your specific part, the hard bit, the outcome.", "Audit your own resume for anything you can't defend in depth and either deepen it or remove it.", "Numbers you should know cold: users, records processed, latency, error rate, team size, release cadence.", "Prepare the 'why' behind each technology choice — 'that's what the team used' is acceptable once, not four times."],
    trap: "The single most common failure at 2–4 YOE is a resume claim the candidate can't go one layer deeper on. If your resume says you built an OTA update system, expect the versionCode and rollback questions in this bank." },
  { id: "BHV-22", cat: "BHV", lv: "mid", q: "What would you do in your first 90 days here?",
    a: ["30: read code, ship something small end to end, map the systems and who owns what, ask a lot of questions.", "60: own a feature, start noticing recurring pain and fix one thing nobody asked you to.", "90: propose an improvement with data, be a reliable reviewer, know the on-call/release process.", "Frame it as learning first — arriving with a rewrite plan reads as arrogance."],
    trap: "This question is really 'do you understand how to join a team?' Promising big architectural changes in month one is the answer that worries hiring managers." },
];


/* ===== PASS 3 — accessibility, round strategy, HTML, Angular/Next depth ===== */

const Q11 = [
  /* ---- ACCESSIBILITY ---- */
  { id: "A11Y-01", cat: "A11Y", lv: "mid", q: "How do you manage focus in a single-page app?",
    a: ["On route change, move focus to the new page's h1 (tabIndex={-1}) or a skip target — otherwise focus stays on a link that no longer exists and screen readers announce nothing.", "Announce the new page with a visually hidden aria-live region for users who don't track focus.", "Modals/drawers: trap focus inside, restore to the trigger on close, Escape to dismiss.", "After deleting a row, move focus to the next row or the container — never let it fall to body."],
    trap: "The question behind it: 'you clicked a link, the page changed, where is focus?' Most SPAs leave it on the old link. Interviewers at product companies test this because it's the most common real a11y bug." },
  { id: "A11Y-02", cat: "A11Y", lv: "mid", q: "What are ARIA live regions and which politeness level do you use?",
    a: ["aria-live='polite' waits for a pause — use for search result counts, save confirmations, toast info.", "aria-live='assertive' (or role='alert') interrupts immediately — errors and time-critical warnings only.", "The region must exist in the DOM before the text changes, or nothing is announced.", "aria-busy while loading, and don't announce every keystroke of a live-filtering list — debounce the announcement."],
    trap: "Follow-up: your toast never gets read out. Almost always because the element is created and inserted at the same time as its text — the region has to be mounted empty first." },
  { id: "A11Y-03", cat: "A11Y", lv: "mid", q: "What is an accessible name, and how do labelling attributes resolve?",
    a: ["Precedence: aria-labelledby → aria-label → native label/alt/title content → placeholder (last resort, and it disappears on typing).", "An icon-only button with no name is announced as just 'button' — the single most common audit failure.", "aria-describedby adds supplementary text (hint, error) without replacing the name.", "Don't use aria-label on non-interactive elements like a div — it's often ignored."],
    trap: "They point at a search input with only a placeholder and ask what a screen reader says. If you think placeholder counts as a label, you'll ship that pattern everywhere." },
  { id: "A11Y-04", cat: "A11Y", lv: "mid", q: "How do you actually test accessibility?",
    a: ["Unplug the mouse: can you reach and operate everything, and can you always see where focus is?", "Automated: axe DevTools / eslint-jsx-a11y / Lighthouse — these catch roughly a third of issues, so never claim compliance from a green score.", "Screen reader pass: NVDA+Firefox on Windows, VoiceOver+Safari on Mac, TalkBack on Android.", "Zoom to 200% and set a 320px viewport — content must reflow without horizontal scrolling."],
    trap: "Saying 'we run Lighthouse and it's 100' is the wrong answer, and interviewers know the statistic. Naming the manual keyboard pass first is what signals real experience." },
  { id: "A11Y-05", cat: "A11Y", lv: "mid", q: "Explain tabindex, focus order and keyboard traps.",
    a: ["tabindex='0' puts a custom element in the natural order; '-1' makes it programmatically focusable only; positive values are an anti-pattern that breaks order globally.", "Tab order follows DOM order, not visual order — CSS reordering (flex order, grid placement) creates a mismatch.", "A keyboard trap is any widget you can enter but not leave; the only intentional trap is a modal, which must be escapable.", "Skip-to-content link as the first focusable element for keyboard users."],
    trap: "Follow-up: you used CSS to move the sidebar visually after the main content but left it first in the DOM. Keyboard users now tab through 30 nav links before reaching the page — a WCAG failure that looks fine on screen." },
  { id: "A11Y-06", cat: "A11Y", lv: "mid", q: "What do WCAG levels mean and what's the practical compliance bar?",
    a: ["A / AA / AAA — AA is the standard target and what procurement, government and enterprise contracts require.", "Four principles: perceivable, operable, understandable, robust.", "Concrete AA rules: 4.5:1 text contrast (3:1 for large text and UI components), resize to 200%, no keyboard trap, visible focus, meaningful sequence.", "In India, the RPwD Act and GIGW apply to public-facing and government-adjacent services."],
    trap: "They ask whether you'd block a release for an a11y issue. The credible answer distinguishes severity — a missing button name blocks, a suboptimal heading order gets a ticket." },
  { id: "A11Y-07", cat: "A11Y", lv: "hard", q: "How do you make a complex widget (combobox, tabs, tree) accessible?",
    a: ["Follow the ARIA Authoring Practices pattern for that widget rather than inventing roles — each has a defined keyboard contract.", "Roving tabindex or aria-activedescendant so the composite widget is one tab stop, not fifty.", "State must be exposed: aria-expanded, aria-selected, aria-checked, aria-disabled — visual state alone isn't state.", "Prefer a native element or a headless library (Radix, React Aria) — hand-rolling the full spec is rarely worth it."],
    trap: "The honest senior answer includes 'I'd use Radix/React Aria and explain why', not 'I'd build it'. Claiming you'd implement the full combobox spec from memory invites a follow-up you'll lose." },
  { id: "A11Y-08", cat: "A11Y", lv: "mid", q: "What accessibility issues are specific to mobile and touch?",
    a: ["Touch targets minimum 44×44 CSS px with adequate spacing; don't rely on hover for anything essential.", "Pinch-zoom must not be disabled (user-scalable=no is a WCAG failure) — a very common copy-paste mistake in viewport meta tags.", "Support both orientations; respect the OS text-size setting by using rem, not px, for type.", "Screen-reader gestures differ: TalkBack/VoiceOver swipe order follows the DOM, and custom swipe handlers can conflict."],
    trap: "Nearly every codebase has maximum-scale=1, user-scalable=no in the viewport tag copied from a 2014 tutorial. Spotting it is a quick way to show you audit rather than assume." },

  /* ---- INTERVIEW ROUND STRATEGY ---- */
  { id: "RND-01", cat: "RND", lv: "mid", q: "How do you run a 45-minute machine coding round without running out of time?",
    a: ["First 5 min: clarify scope out loud and agree what's out of scope. Write the component API/props before any logic.", "Next 5: skeleton with hardcoded data so something renders early — a working ugly thing beats a beautiful half-thing.", "Then build the happy path, then states (loading/error/empty), then keyboard/a11y, then polish. Announce this order up front.", "Last 5: stop coding, walk through what you'd do next and what you knowingly skipped."],
    trap: "The failure mode is spending 20 minutes on CSS or setting up perfect abstractions. Interviewers are grading working functionality, state modelling and communication — in that order." },
  { id: "RND-02", cat: "RND", lv: "mid", q: "What do you do when you genuinely don't know the answer?",
    a: ["Say so in one sentence, then reason from adjacent knowledge out loud: 'I haven't used X, but it sounds like Y, which works by…'", "Ask a clarifying question to get a foothold rather than freezing.", "Never bluff a mechanism — interviewers probe, and a confident wrong explanation is worse than an honest gap.", "Follow up: 'I'll read about it tonight' — and if there's a next round, mention what you learned."],
    trap: "The bluff is detected by one follow-up question. Candidates lose more offers to invented confidence than to admitted gaps, because bluffing reads as a code-review risk." },
  { id: "RND-03", cat: "RND", lv: "mid", q: "How do you think aloud in a DSA or debugging round?",
    a: ["State the brute force and its complexity first, then say why you're improving it — this banks partial credit immediately.", "Narrate the invariant, not every line: 'I'm keeping a window that's always valid'.", "Dry-run one small input on paper before running the code, and say your edge cases out loud (empty, single, duplicates, overflow).", "If stuck for 90 seconds, say what you're stuck on — interviewers can only hint if they know where you are."],
    trap: "Silence is the killer. A candidate who solves it silently in 20 minutes often scores below one who talks through a partial solution, because the round measures collaboration too." },
  { id: "RND-04", cat: "RND", lv: "mid", q: "They ask about a technology you've never used. Now what?",
    a: ["Map it to what you do know: 'I've used Django ORM, not Prisma — I'd expect the same N+1 concerns, is that right?'", "Show transferable depth instead of surface familiarity; interviewers hire the model of thinking.", "Be precise about your level: 'I've read about it' vs 'I've shipped it' — inflating this is the fastest way to fail a reference or a deep-dive.", "Turn it into a question about how their team uses it — that's a genuine signal of interest."],
    trap: "Resume keyword inflation gets caught here. If your CV lists Angular and you can't explain change detection, the interviewer now discounts every other line on the page." },
  { id: "RND-05", cat: "RND", lv: "mid", q: "How do you budget time in a 60-minute system design round?",
    a: ["10 min requirements and scope (functional, non-functional, scale, who the users are). Confirm before designing.", "10 min high-level: API contract and data shapes, then the component/module boundaries.", "25 min depth on the two hardest parts — pick them deliberately and say why.", "10 min trade-offs, failure modes, and what you'd change at 10x. Leave 5 for their questions."],
    trap: "The most common failure is jumping to components in minute two. Interviewers frequently score requirement-gathering as its own criterion, so silence there costs you before you've drawn anything." },
  { id: "RND-06", cat: "RND", lv: "mid", q: "How do you approach a take-home assignment?",
    a: ["Timebox it and say what you timeboxed in the README — reviewers respect stated trade-offs more than unstated polish.", "README first: how to run it, decisions made, what you'd do with more time, known limitations.", "Prioritise: working core > tests on the important logic > error/empty states > styling. Commit history should read like real work.", "Don't over-engineer — a folder structure for a 200-line app signals poor judgement, not seniority."],
    trap: "Reviewers look for the parts you skipped and whether you knew you skipped them. A polished UI with no error handling and no README reads as someone who optimises for appearance." },
  { id: "RND-07", cat: "RND", lv: "mid", q: "A round went badly. What do you do next?",
    a: ["Finish the loop properly — candidates get offers after one weak round more often than they expect.", "In the next round, don't apologise or reference it; treat it as independent.", "Write down what you missed the same day and add it to your revision list while it's sharp.", "If it was a knowledge gap, a short follow-up note with the correct answer occasionally recovers a borderline decision."],
    trap: "Spiralling after a bad round is what actually costs the offer — the interviewer in round three has no idea round two went badly unless your demeanour tells them." },
  { id: "RND-08", cat: "RND", lv: "mid", q: "How do you close an interview and manage the process?",
    a: ["Ask about the team's biggest current problem and how success is measured at six months — both give you real signal.", "Confirm next steps and timeline explicitly before you hang up.", "Send a short thank-you within 24 hours that references one specific thing discussed; add a corrected answer if you fumbled one.", "Run processes in parallel so you have leverage and a real comparison, not just one option."],
    trap: "Having no questions reads as low interest, and asking only about WFH/perks in round one reads as low investment. Have two technical and one team-shaped question ready every time." },
];

const Q12 = [
  /* ---- HTML gaps ---- */
  { id: "CSS-27", cat: "CSS", lv: "mid", q: "The native <dialog> element and the Popover API — do they replace your modal library?",
    a: ["dialog.showModal() gives you the top layer, a ::backdrop, focus trapping, Escape-to-close and inertness of the rest of the page for free.", "Popover API (popover attribute + popovertarget) handles light-dismiss and top-layer stacking for menus and tooltips with zero JS.", "Top layer means no z-index wars and no portal needed — the biggest practical win.", "Still yours to handle: animation on close, scroll locking nuances, and returning focus in complex flows."],
    trap: "The gotcha: <dialog open> (the attribute) is NOT the same as showModal() — it renders non-modally, outside the top layer, with no backdrop or focus trap. People ship that and wonder why the page behind is still interactive." },
  { id: "CSS-28", cat: "CSS", lv: "mid", q: "What do you get from native HTML form validation, and when do you turn it off?",
    a: ["required, type=email/url, min/max, minlength/maxlength, pattern, step — plus :valid/:invalid and :user-invalid for styling.", "The Constraint Validation API (checkValidity, setCustomValidity, validity flags) lets you keep native semantics with custom messages.", "novalidate on the form when you own the UX, but keep the attributes — they still drive mobile keyboards and assistive tech.", "Server validation is always mandatory regardless; client validation is a UX affordance, not a control."],
    trap: "Follow-up: why is :invalid styling red before the user has typed anything? Because :invalid matches on load — :user-invalid (or a touched flag) is what you actually want." },
  { id: "CSS-29", cat: "CSS", lv: "basic", q: "Which input types and autocomplete tokens matter on mobile?",
    a: ["type=email/tel/number/date changes the on-screen keyboard; inputMode='numeric' with pattern for OTP and PIN fields.", "type=number is bad for IDs and phone numbers — it strips leading zeros, allows e/+/-, and has spinners. Use text + inputMode.", "autocomplete tokens (one-time-code, tel, postal-code, cc-number, name) drive OS autofill and materially raise form completion.", "enterkeyhint='next'/'done' and a proper tab order between fields."],
    trap: "The Aadhaar/account-number case: type=number silently drops a leading zero and the user submits a wrong account number. That's a data bug, not a styling nit, and it's a great answer to give unprompted." },
  { id: "CSS-30", cat: "CSS", lv: "mid", q: "How do you build a responsive table that stays accessible?",
    a: ["Keep real table semantics — th with scope, caption, thead/tbody — so screen readers announce row/column context.", "Horizontal scroll in a wrapper with role='region', tabIndex=0 and an aria-label so keyboard users can scroll it.", "The stacked-card pattern on mobile breaks the table semantics; if you use it, expose the label per cell via a data attribute and ::before.", "Prioritise columns instead: hide low-value ones behind an expand row rather than reflowing everything."],
    trap: "Interviewers ask what happens when you set display:block on a table for mobile. It destroys the implicit table roles, so a screen reader reads a flat list of numbers with no headers — a genuine regression disguised as responsiveness." },

  /* ---- NEXT / ANGULAR depth ---- */
  { id: "FWK-19", cat: "FWK", lv: "hard", q: "Explain Next.js App Router's four caching layers and how you bust each.",
    a: ["Request memoisation: identical fetches deduped within one render pass. Automatic, per-request.", "Data Cache: persists fetch results across requests/deploys — control with fetch cache/revalidate options; bust via revalidateTag or revalidatePath.", "Full Route Cache: the rendered RSC payload/HTML for static routes at build; opted out by dynamic APIs (cookies, headers, searchParams).", "Router Cache: client-side, in-memory, per-session cache of visited segments — router.refresh() clears it."],
    trap: "The classic bug report: 'I updated the data but the page still shows old content.' Being able to say which of the four layers is holding it — and the specific bust for that layer — is the whole question." },
  { id: "FWK-20", cat: "FWK", lv: "mid", q: "What are route groups, parallel routes and intercepting routes for?",
    a: ["Route groups (folder) organise files and let you apply different layouts without affecting the URL.", "Parallel routes (@slot) render multiple independent subtrees in one layout with their own loading/error states — dashboards with independent panels.", "Intercepting routes ((.)folder) render a route in a modal over the current page while keeping the shareable URL that works on direct load.", "Together they solve the 'photo opens in a modal but the URL is real' pattern."],
    trap: "They ask how you'd make a modal deep-linkable. Local modal state gives you no shareable URL; a full route loses the background context. Intercepting routes exist precisely for that trade-off." },
  { id: "FWK-21", cat: "FWK", lv: "mid", q: "Angular: content projection, ViewChild/ContentChild and pipes.",
    a: ["ng-content projects children; multi-slot via select attributes — the Angular equivalent of React's children/slots.", "ViewChild queries your own template, ContentChild queries projected content; both are only available after the corresponding AfterViewInit/AfterContentInit hook.", "Pure pipes recompute only on reference change and are cached — impure pipes (like the default of a custom filter) run on every change detection cycle and are a common perf killer.", "AsyncPipe subscribes and unsubscribes for you — the cleanest way to avoid leaks."],
    trap: "The perf question: 'why is your list janky?' An impure pipe in an *ngFor runs on every CD cycle for every row. Precompute in the component instead — that's the answer they want." },
  { id: "FWK-22", cat: "FWK", lv: "mid", q: "Angular: HTTP interceptors, route guards and resolvers.",
    a: ["Interceptors sit in the HttpClient pipeline: attach auth headers, refresh tokens on 401, retry, centralised error toasts, correlation ids.", "Guards (CanActivate/CanMatch) protect navigation; CanDeactivate blocks leaving a dirty form.", "Resolvers pre-fetch data before activation — cleaner than a loading state, but they delay navigation, so use them sparingly.", "Functional interceptors/guards replaced the class-based DI versions in modern Angular."],
    trap: "The token-refresh trap: a naive 401 interceptor fires N parallel refresh calls when several requests fail at once. You need a shared in-flight refresh observable — that's the detail that shows you've built it." },
  { id: "FWK-23", cat: "FWK", lv: "mid", q: "How do you manage state in an Angular app — services, NgRx, or signals?",
    a: ["A service with a BehaviorSubject (or a signal) covers most feature state — don't reach for NgRx by default.", "NgRx: actions/reducers/effects/selectors — worth it for complex cross-feature flows, time-travel debugging and strict traceability. Heavy boilerplate otherwise.", "Component store / signal store for feature-scoped state without global ceremony.", "Server data belongs in an HTTP layer with caching, not duplicated into the store — same principle as React Query vs Redux."],
    trap: "They ask when NOT to use NgRx. If your answer is 'always use it for consistency', that reads as cargo-culting; naming the boilerplate cost against team size is the mature take." },
  { id: "FWK-24", cat: "FWK", lv: "mid", q: "How do you make a slow Angular app fast?",
    a: ["OnPush everywhere it's safe, plus trackBy on every *ngFor / track on every @for — without it, Angular destroys and recreates DOM on each list update.", "Move heavy work out of the template: no method calls or impure pipes in bindings, since they run every CD cycle.", "Lazy-load routes, use standalone components for better tree-shaking, defer non-critical blocks (@defer).", "Run non-UI work outside Angular (NgZone.runOutsideAngular) for scroll/mousemove/animation handlers."],
    trap: "The single biggest real-world win is trackBy plus getting function calls out of templates. If you jump straight to 'lazy loading', you've missed that change detection, not bundle size, is usually the cause of jank." },

  /* ---- JS / BACKEND / SD final gaps ---- */
  { id: "JS-41", cat: "JS", lv: "hard", q: "How do you consume a streaming response — async iterators and ReadableStream?",
    a: ["response.body is a ReadableStream; read chunks with a reader or for await…of, decode with TextDecoder (stream:true so multi-byte chars aren't split).", "Server-sent events and LLM token streaming both use this — parse incrementally rather than awaiting response.json().", "Async iterators: Symbol.asyncIterator, consumed by for await…of; generators can be async too.", "Backpressure and cancellation come from the reader — abort the fetch and the stream stops."],
    trap: "Follow-up: your streamed text occasionally shows a garbled character. That's decoding each chunk independently — TextDecoder needs {stream:true} because a UTF-8 character can straddle a chunk boundary." },
  { id: "JS-42", cat: "JS", lv: "mid", q: "AbortController — everywhere you should be using it.",
    a: ["Cancel in-flight fetches on unmount, on new keystroke, and on route change so stale responses can't overwrite fresh state.", "One signal can abort many operations; AbortSignal.timeout(ms) gives you a request timeout, AbortSignal.any combines signals.", "addEventListener accepts { signal } — one abort removes all listeners, which is a much cleaner cleanup than tracking each removeEventListener.", "An aborted fetch rejects with an AbortError — filter it out so you don't render a spurious error state."],
    trap: "The bug everyone ships: catching the AbortError and showing 'Something went wrong' every time the user types. Checking err.name === 'AbortError' and returning silently is the fix." },
  { id: "BE-31", cat: "BE", lv: "mid", q: "What do you use Redis for beyond caching?",
    a: ["Sessions, rate limiting (INCR + EXPIRE or a token-bucket Lua script), distributed locks (SET NX PX with a unique value and a safe release).", "Data structures: sorted sets for leaderboards and delayed queues, lists for simple queues, hashes for objects, sets for dedupe, streams for event logs.", "Pub/Sub to broadcast across app instances — how you scale WebSockets horizontally.", "It's in-memory: configure an eviction policy, know your persistence mode (RDB/AOF), and never treat it as the source of truth."],
    trap: "The distributed-lock follow-up: a naive SETNX lock with no expiry deadlocks when the holder crashes, and one with an expiry can be released by a slow predecessor. You need a unique token checked on release — that nuance is the whole question." },
  { id: "BE-32", cat: "BE", lv: "hard", q: "Replication, read replicas and sharding — what breaks at each step?",
    a: ["Replication gives read scale and failover, but replicas lag — a read right after a write can return stale data.", "Fix read-after-write by routing that user's reads to the primary for a window, or by returning the written entity from the mutation.", "Sharding splits data by key: you lose cross-shard joins and transactions, and rebalancing is painful. It's a last resort.", "Partitioning within one database (by date/tenant) solves many 'we need sharding' cases at a fraction of the cost."],
    trap: "The frontend-visible symptom: a user saves a record, the list refetches from a replica, and their change is missing — so they save again and create a duplicate. Knowing that this is replication lag, not a UI bug, is the point." },
  { id: "BE-33", cat: "BE", lv: "hard", q: "If you expose GraphQL, what do you have to defend against?",
    a: ["N+1 by default — batch with DataLoader per request.", "Malicious queries: depth limiting, complexity/cost analysis, and persisted (allowlisted) queries in production.", "Caching is harder than REST: no URL to cache on, so you need normalised client caches and server-side response caching by query hash.", "Authorization must be per-field/per-resolver, not per-endpoint — the flexibility that makes GraphQL nice also multiplies the auth surface."],
    trap: "They ask why a GraphQL endpoint can be DoS'd more easily than REST. A single deeply nested query can fan out to millions of resolver calls — if you can't name depth/complexity limits, that's a security gap." },
  { id: "SD-25", cat: "SD", lv: "hard", q: "Design a multi-tenant, white-labelled frontend.",
    a: ["Tenant resolution from subdomain, path or the authed session — decided before first paint to avoid a flash of the wrong brand.", "Theming via CSS variables from a tenant config so no rebuild is needed per client; assets (logo, favicon, emails) served per tenant.", "Feature flags and module visibility per tenant; the API must enforce tenant scoping — never rely on the UI filtering.", "Testing burden: one tenant's config change must not break others, so snapshot the config schema and validate on save."],
    trap: "The security question hiding inside: what stops tenant A reading tenant B's data if a tenant id is passed from the client? The answer must be server-side scoping from the session, not a request parameter." },
  { id: "SD-26", cat: "SD", lv: "mid", q: "Design an analytics dashboard with charts and filters.",
    a: ["Aggregate server-side and return pre-shaped series — never ship 200k raw rows to compute a chart in the browser.", "Global filter bar (date range, segment) in the URL; each widget fetches independently so one slow query doesn't block the page.", "Charts: canvas-based for large series, SVG for small interactive ones; accessible fallback table behind each chart.", "Handle timezone consistently (display in the business timezone), show the 'data as of' timestamp, and cache aggregates."],
    trap: "Follow-up: two widgets show different totals. Usually one aggregates in UTC and the other in IST, or one includes a pending status. Naming the timezone/definition mismatch before they say it is a strong signal." },
  { id: "SD-27", cat: "SD", lv: "mid", q: "Design the frontend for a roles and permissions (RBAC) admin panel.",
    a: ["Server returns the effective permission set; UI renders from it via a <Can permission> wrapper and route guards — deny by default.", "The permission matrix UI needs bulk edit, inheritance from roles, and a clear diff before save.", "Show why an action is unavailable rather than silently hiding everything — hidden UI creates support tickets.", "Every privileged change is audit-logged with who/when/before/after; consider maker-checker for sensitive roles."],
    trap: "The check they always make: 'if I hide the delete button, is that security?' No — the API must reject it. Any answer that treats the UI as the enforcement layer fails a fintech interview immediately." },
];

const QUESTIONS = [...Q, ...Q2, ...Q3, ...Q4, ...Q5, ...Q6, ...Q7, ...Q8, ...Q9, ...Q10, ...Q11, ...Q12];

/* ============================================================
   THE REUSABLE PROMPT
   ============================================================ */
const GEN_PROMPT = `You are a hiring panel that has interviewed hundreds of frontend and
full-stack engineers. Build me an interview question bank.

CANDIDATE PROFILE
- Experience: 2.5 years, production. Target: SDE-2 / mid-level.
- Stack: React, Next.js, Angular, TypeScript on the frontend; Django (Python)
  and Node.js on the backend; PostgreSQL; Capacitor/Android shell app.
- Domain: B2B fintech lending (loan management, facilities, collections).
- Targeting: product-focused full-stack roles at Indian product startups and
  mid-size fintechs, one level above current.

WHAT TO PRODUCE
For the topic I name below, produce N questions with this exact shape:

  id      short code, e.g. RCT-07
  topic   one of: JavaScript core, TypeScript, React, Next.js/Angular,
          HTML/CSS/layout, browser+network+performance, security,
          frontend system design, backend basics, machine coding, DSA,
          testing/tooling, behavioural
  level   basic | mid | hard  (mid = the 2-4 YOE bar, hard = stretch)
  q       the question exactly as an interviewer would say it out loud
  a       3-6 bullets: the ANSWER KEY, not an essay. Include the specific
          term, number, or code detail that separates a real answer from a
          memorised one.
  trap    the follow-up question the interviewer asks to see if you actually
          know it, plus the wrong answer most candidates give.

RULES
1. Be honest about difficulty. Do not pad with trivia nobody asks. If a
   question is only asked at FAANG, mark it hard and say so.
2. Weight toward what is ACTUALLY asked at 2-4 YOE in India: JS fundamentals,
   React internals, machine coding, debugging, and one system design round.
3. Every answer bullet must be checkable — a name, a number, a mechanism.
   No "it depends" without saying what it depends on.
4. Include the uncomfortable questions: "why are you leaving", "tell me about
   an outage you caused", "explain your worst technical decision".
5. Where my stack is relevant, ground the question in it (Django ORM, RSC,
   Capacitor, Postgres JSONB) instead of a generic example.
6. No duplicates. No question answerable in under five words.
7. Output valid JSON only — an array of objects with the keys above. No prose,
   no markdown fences.

TOPIC: <fill in>
COUNT: <fill in, e.g. 25>

Then, in a second message, quiz me: ask one question at a time, wait for my
answer, grade it out of 5 against your own answer key, tell me exactly what I
missed, and move on. Do not soften the grade.`;

/* ============================================================
   APP
   ============================================================ */
const STORE_KEY = "fe-prep-bank-v1";

function Chip({ active, children, onClick, dim, count }) {
  return (
    <button
      onClick={onClick}
      className="chip"
      style={{
        background: active ? T.navy : "transparent",
        color: active ? "#fff" : dim || T.inkSoft,
        borderColor: active ? T.navy : T.rule,
      }}
    >
      {children}
      {count != null && (
        <span style={{ opacity: 0.65, marginLeft: 6, fontFamily: "var(--mono)" }}>{count}</span>
      )}
    </button>
  );
}

export default function InterviewPrepBank() {
  const [state, setState] = useState({ status: {}, notes: {} });
  const [loaded, setLoaded] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [tab, setTab] = useState("bank");
  const [cat, setCat] = useState("ALL");
  const [lv, setLv] = useState("ALL");
  const [st, setSt] = useState("ALL");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState({});
  const [copied, setCopied] = useState(false);
  const refs = useRef({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get(STORE_KEY);
        if (alive && r?.value) setState(JSON.parse(r.value));
      } catch {
        /* first run — nothing saved yet */
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const persist = async (next) => {
    setState(next);
    try {
      await window.storage.set(STORE_KEY, JSON.stringify(next));
      setSaveErr("");
    } catch {
      setSaveErr("Progress didn't save. Your last change is still on screen — try again.");
    }
  };

  const setStatus = (id, s) => persist({ ...state, status: { ...state.status, [id]: s } });
  const setNote = (id, v) => persist({ ...state, notes: { ...state.notes, [id]: v } });
  const statusOf = (id) => state.status[id] || "new";

  const counts = useMemo(() => {
    const c = { new: 0, learning: 0, revise: 0, done: 0 };
    QUESTIONS.forEach((q) => c[statusOf(q.id)]++);
    return c;
  }, [state.status]);

  const pct = Math.round((counts.done / QUESTIONS.length) * 100);

  const catCounts = useMemo(() => {
    const m = {};
    CATS.forEach((c) => {
      const inCat = QUESTIONS.filter((q) => q.cat === c.code);
      m[c.code] = { total: inCat.length, done: inCat.filter((q) => statusOf(q.id) === "done").length };
    });
    return m;
  }, [state.status]);

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return QUESTIONS.filter((q) => {
      if (tab === "revise" && statusOf(q.id) !== "revise") return false;
      if (cat !== "ALL" && q.cat !== cat) return false;
      if (lv !== "ALL" && q.lv !== lv) return false;
      if (st !== "ALL" && statusOf(q.id) !== st) return false;
      if (term && !(q.q.toLowerCase().includes(term) || q.id.toLowerCase().includes(term) ||
        q.a.join(" ").toLowerCase().includes(term))) return false;
      return true;
    });
  }, [tab, cat, lv, st, search, state.status]);

  const jumpTo = (id) => {
    setTab("bank"); setCat("ALL"); setLv("ALL"); setSt("ALL"); setSearch("");
    setOpen((o) => ({ ...o, [id]: true }));
    setTimeout(() => refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(GEN_PROMPT);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const resetAll = () => {
    if (window.confirm("Clear every status and note? This can't be undone.")) {
      persist({ status: {}, notes: {} });
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink, fontFamily: "var(--body)" }}>
      <style>{`
        :root{
          --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
          --body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        *{box-sizing:border-box}
        .wrap{max-width:940px;margin:0 auto;padding:28px 20px 80px}
        .chip{font:500 12px/1 var(--body);letter-spacing:.01em;padding:7px 11px;border-radius:2px;
              border:1px solid;cursor:pointer;transition:background .12s,color .12s;white-space:nowrap}
        .chip:hover{border-color:${T.navySoft}}
        button:focus-visible,input:focus-visible,textarea:focus-visible,.cell:focus-visible{
          outline:2px solid ${T.navy};outline-offset:2px}
        .card{background:${T.surface};border:1px solid ${T.rule};border-radius:3px;margin-bottom:8px}
        .qbtn{width:100%;text-align:left;background:none;border:0;padding:14px 16px;cursor:pointer;
              display:flex;gap:12px;align-items:flex-start;font:inherit;color:inherit}
        .qbtn:hover .qtext{color:${T.navy}}
        .cell{width:11px;height:11px;border:0;padding:0;cursor:pointer;border-radius:1px}
        .cell:hover{transform:scale(1.5);position:relative;z-index:2}
        .sbtn{font:600 11px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;
              padding:7px 10px;border:1px solid ${T.rule};background:#fff;color:${T.inkSoft};
              cursor:pointer;border-radius:2px}
        .sbtn:hover{border-color:${T.navySoft};color:${T.navy}}
        .eyebrow{font:600 10px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:${T.inkSoft}}
        .note{width:100%;border:1px solid ${T.rule};border-radius:2px;padding:9px 10px;
              font:13px/1.5 var(--body);resize:vertical;min-height:60px;background:#FCFCFD;color:${T.ink}}
        @media (max-width:560px){ .wrap{padding:18px 12px 70px} .hideSm{display:none} }
        @media (prefers-reduced-motion:reduce){ *{transition:none!important;scroll-behavior:auto!important} }
      `}</style>

      <div className="wrap">
        {/* ---------- HEADER ---------- */}
        <header style={{ marginBottom: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Interview readiness · 2+ YOE full-stack</div>
          <h1 style={{
            font: "700 clamp(28px,6vw,42px)/1.02 var(--body)", letterSpacing: "-0.035em",
            margin: "0 0 14px", color: T.ink,
          }}>
            The question bank
          </h1>

          <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ font: "700 34px/1 var(--mono)", letterSpacing: "-0.03em", color: T.navy }}>
              {counts.done}<span style={{ color: T.slate, fontSize: 20 }}>/{QUESTIONS.length}</span>
            </div>
            <div className="eyebrow">mastered · {pct}%</div>
            <div style={{ display: "flex", gap: 12, marginLeft: "auto", flexWrap: "wrap" }}>
              {STATUS_ORDER.filter((s) => s !== "done").map((s) => (
                <span key={s} className="eyebrow" style={{ color: STATUS[s].color }}>
                  {counts[s]} {STATUS[s].label.toLowerCase()}
                </span>
              ))}
            </div>
          </div>

          {/* coverage grid — one cell per question */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 3, padding: 12,
            background: T.surface, border: `1px solid ${T.rule}`, borderRadius: 3,
          }}>
            {QUESTIONS.map((q) => (
              <button
                key={q.id}
                className="cell"
                aria-label={`${q.id}: ${STATUS[statusOf(q.id)].label}`}
                title={`${q.id} · ${STATUS[statusOf(q.id)].label}`}
                onClick={() => jumpTo(q.id)}
                style={{ background: statusOf(q.id) === "new" ? T.grid : STATUS[statusOf(q.id)].color }}
              />
            ))}
          </div>
          {saveErr && (
            <p style={{ font: "13px/1.4 var(--body)", color: T.brick, marginTop: 10 }}>{saveErr}</p>
          )}
        </header>

        {/* ---------- TABS ---------- */}
        <nav style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.rule}`, marginBottom: 16 }}>
          {[["bank", "All questions"], ["revise", `Revision list (${counts.revise})`], ["prompt", "Generator prompt"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              background: "none", border: 0, borderBottom: `2px solid ${tab === k ? T.navy : "transparent"}`,
              padding: "9px 12px", cursor: "pointer", color: tab === k ? T.navy : T.inkSoft,
              font: `${tab === k ? 600 : 500} 13px/1 var(--body)`, marginBottom: -1,
            }}>{label}</button>
          ))}
        </nav>

        {tab === "prompt" ? (
          <section className="card" style={{ padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Reusable prompt</div>
            <p style={{ font: "14px/1.6 var(--body)", color: T.inkSoft, margin: "0 0 14px", maxWidth: "62ch" }}>
              Paste this into a fresh chat, fill in the topic and count, and it will generate more
              questions in the same shape as this bank — with answer keys and the follow-up traps.
              The last paragraph turns it into a live quizmaster that grades you.
            </p>
            <button className="sbtn" onClick={copyPrompt} style={{ marginBottom: 14 }}>
              {copied ? "Copied" : "Copy prompt"}
            </button>
            <pre style={{
              font: "12px/1.65 var(--mono)", background: "#F7F8FA", border: `1px solid ${T.rule}`,
              borderRadius: 2, padding: 14, overflowX: "auto", whiteSpace: "pre-wrap", margin: 0,
            }}>{GEN_PROMPT}</pre>
          </section>
        ) : (
          <>
            {/* ---------- FILTERS ---------- */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions, answers or IDs"
                style={{
                  width: "100%", padding: "10px 12px", border: `1px solid ${T.rule}`,
                  borderRadius: 2, font: "14px/1 var(--body)", background: T.surface, color: T.ink,
                }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Chip active={cat === "ALL"} onClick={() => setCat("ALL")} count={QUESTIONS.length}>All topics</Chip>
                {CATS.map((c) => (
                  <Chip key={c.code} active={cat === c.code} onClick={() => setCat(c.code)}
                        count={`${catCounts[c.code].done}/${catCounts[c.code].total}`}>
                    {c.name}
                  </Chip>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Chip active={lv === "ALL"} onClick={() => setLv("ALL")}>Any level</Chip>
                {Object.entries(LEVELS).map(([k, v]) => (
                  <Chip key={k} active={lv === k} onClick={() => setLv(k)}>{v.label}</Chip>
                ))}
                <span style={{ width: 14 }} />
                <Chip active={st === "ALL"} onClick={() => setSt("ALL")}>Any status</Chip>
                {STATUS_ORDER.map((k) => (
                  <Chip key={k} active={st === k} onClick={() => setSt(k)} dim={STATUS[k].color}>
                    {STATUS[k].label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="eyebrow" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <span>{list.length} shown{!loaded && " · loading progress"}</span>
              <button onClick={resetAll} style={{
                background: "none", border: 0, cursor: "pointer", color: T.inkSoft,
                font: "inherit", textDecoration: "underline", padding: 0,
              }}>Reset progress</button>
            </div>

            {/* ---------- LIST ---------- */}
            {list.length === 0 ? (
              <div className="card" style={{ padding: 28, textAlign: "center" }}>
                <p style={{ font: "15px/1.5 var(--body)", color: T.inkSoft, margin: 0 }}>
                  {tab === "revise"
                    ? "Nothing marked for revision yet. Mark a question \"Needs revision\" when an answer feels shaky."
                    : "No questions match these filters. Clear the search or pick another topic."}
                </p>
              </div>
            ) : list.map((q) => {
              const s = statusOf(q.id);
              const isOpen = !!open[q.id];
              return (
                <article key={q.id} className="card" ref={(el) => (refs.current[q.id] = el)}
                  style={{ borderLeft: `3px solid ${s === "new" ? T.rule : STATUS[s].color}` }}>
                  <button className="qbtn" onClick={() => setOpen((o) => ({ ...o, [q.id]: !isOpen }))}
                          aria-expanded={isOpen}>
                    <span style={{
                      font: "600 11px/1.5 var(--mono)", color: T.slate, letterSpacing: ".04em",
                      minWidth: 54, paddingTop: 2,
                    }}>{q.id}</span>
                    <span style={{ flex: 1 }}>
                      <span className="qtext" style={{ font: "500 15px/1.45 var(--body)", display: "block" }}>
                        {q.q}
                      </span>
                      <span style={{ display: "flex", gap: 10, marginTop: 7, alignItems: "center", flexWrap: "wrap" }}>
                        <span className="eyebrow" style={{
                          color: q.lv === "hard" ? T.brick : q.lv === "mid" ? T.amber : T.slate,
                        }}>{LEVELS[q.lv].label}</span>
                        <span className="eyebrow hideSm" style={{ color: T.slate }}>
                          {CATS.find((c) => c.code === q.cat)?.name}
                        </span>
                        {s !== "new" && (
                          <span className="eyebrow" style={{
                            color: STATUS[s].color, background: STATUS[s].bg, padding: "3px 6px", borderRadius: 2,
                          }}>{STATUS[s].label}</span>
                        )}
                      </span>
                    </span>
                    <span style={{ color: T.slate, font: "12px/1 var(--mono)", paddingTop: 4 }}>
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.grid}`, marginTop: 2 }}>
                      <div className="eyebrow" style={{ margin: "14px 0 8px" }}>Answer key — hit these points</div>
                      <ul style={{ margin: "0 0 16px", paddingLeft: 18 }}>
                        {q.a.map((point, i) => (
                          <li key={i} style={{ font: "14px/1.6 var(--body)", color: T.ink, marginBottom: 6 }}>
                            {point}
                          </li>
                        ))}
                      </ul>

                      {q.trap && (
                        <div style={{
                          background: "#FBF4E9", borderLeft: `3px solid ${T.amber}`,
                          padding: "11px 13px", marginBottom: 16, borderRadius: 2,
                        }}>
                          <div className="eyebrow" style={{ color: T.amber, marginBottom: 5 }}>
                            The follow-up they ask
                          </div>
                          <p style={{ font: "13.5px/1.6 var(--body)", margin: 0, color: T.ink }}>{q.trap}</p>
                        </div>
                      )}

                      <div className="eyebrow" style={{ marginBottom: 6 }}>Your notes</div>
                      <textarea
                        className="note"
                        value={state.notes[q.id] || ""}
                        onChange={(e) => setNote(q.id, e.target.value)}
                        placeholder="Your own phrasing, the example from your work you'd use, or what you got wrong."
                      />

                      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                        {STATUS_ORDER.map((k) => (
                          <button key={k} className="sbtn" onClick={() => setStatus(q.id, k)}
                            style={s === k ? {
                              background: STATUS[k].bg, color: STATUS[k].color, borderColor: STATUS[k].color,
                            } : undefined}>
                            {STATUS[k].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}