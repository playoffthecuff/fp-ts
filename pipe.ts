import { pipe } from 'fp-ts/function';

// Passes the value of the first parameter to the function pipeline in the remaining parameters and returns the result. The return and received data types of the associated functions must match each other.

// convenient to use for validation

const size = (s: string) => s.length;
console.log("🚀 ~ pipe('hello', size):", pipe('hello', size)); // 5

const atLeast3 = (n: number) => n >= 3;
console.log("🚀 ~ pipe('hello', size, atLeast3):", pipe('hello', size, atLeast3)); // true

const trim = (s: string) => s.trim();
pipe(' hi ', trim, size, atLeast3);
console.log("🚀 ~ pipe(' hi ', trim, size, atLeast3):", pipe(' hi ', trim, size, atLeast3)); // false

// is equal to
atLeast3(size(trim(' hi ')));
