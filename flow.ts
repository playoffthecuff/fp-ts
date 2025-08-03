import { flow } from 'fp-ts/function';

// Performs function composition. Input and output parameter types of adjacent functions must match each other.

const size = (s: string) => s.length;

const atLeast3 = (n: number) => n >= 3;

const isLongEnough = flow(size, atLeast3);

isLongEnough('hello');
console.log("🚀 ~ isLongEnough('hello'):", isLongEnough('hello')); // true

// isEqual to
(x: string) => atLeast3(size(x));

const trim = (s: string) => s.trim();

const isValid = flow(trim, size, atLeast3); // improved validator
console.log("🚀 ~ isValid(' hi '); // false:", isValid(' hi ')); // false)

const concat = (s1: string, s2: string) => s1 + s2;

const isStringsValid = flow(concat, trim, size, atLeast3);
isStringsValid(" hi ", "dude ")
console.log(`🚀 ~ isStringsValid(" hi ", "dude "):`, isStringsValid(" hi ", "dude ")) // true;
