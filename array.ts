import { pipe} from "fp-ts/function";
import * as A from "fp-ts/Array";

// imperative
// function countSumMaxCommon(a1: number[], a2: number[]) {
// 	const minLength = Math.min(a1.length, a2.length);
// 	let total = 0;

// 	for (let i = 0; i < minLength; i++) total += Math.max(a1[i], a2[i]);

// 	return total;
// }


// functional
// const countSumMaxCommon = (a1: number[], a2: number[]) => {
// 	const zipped = A.zip(a1, a2);
// 	const mapped = A.map((pair: [number, number]) => Math.max(...pair))(zipped);
// 	const total = A.reduce(0, (a,v: number) => a + v)(mapped);
// 	return total;
// } 

const countSumMaxCommon = (a1: number[], a2: number[]): number => pipe(
	a1,
	A.zip(a2),
	A.map((pair) => Math.max(...pair)),  // types are already matched
	A.reduce(0, (a, v) => a + v) // and also in here
)

console.log("🚀 ~ countSumMaxCommon([1,2,3], [4,0,7,1]):", countSumMaxCommon([1,2,3], [4,0,7,1])) // 13
