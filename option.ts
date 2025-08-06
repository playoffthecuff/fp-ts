import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';

const inverse = (x: number): O.Option<number> => (x === 0 ? O.none : O.some(1 / x)); // for an invalid value "none", for a valid value "some"
console.log('🚀 ~ inverse(0):', inverse(0)); // { _tag: "None" }
console.log('🚀 ~ inverse(2):', inverse(2)); // { _tag: "Some", value: 0.5 }

const getInverseMessage = (x: number): string =>
	pipe(
		x,
		inverse,
		O.match(
			() => `Cannot get the inverse of ${x}.`,
			(ix) => `The inverse of ${x} is ${ix}`
		)
	); // pattern matching
console.log('🚀 ~ getInverseMessage(0):', getInverseMessage(0)); // Cannot get the inverse of 0.
console.log('🚀 ~ getInverseMessage(2):', getInverseMessage(2)); // The inverse of 2 is 0.5

const safeInverse = (x: number): number =>
	pipe(
		x,
		inverse,
		O.getOrElse(() => 0)
	); // safe return for invalid param. getOrElse param fn must return same type as input
console.log('🚀 ~ safeInverse(0):', safeInverse(0)); // 0
console.log('🚀 ~ safeInverse(2):', safeInverse(2)); // 0.5

const safeInverse2 = (x: number): number | string =>
	pipe(
		x,
		inverse,
		O.getOrElseW(() => 'string')
	); // use getOrElseW for another type
console.log('🚀 ~ safeInverse2(0):', safeInverse2(0)); // string
console.log('🚀 ~ safeInverse2(2):', safeInverse2(2)); // 0.5

type NullableNumber = number | null;
const v1: NullableNumber = 3;
const v2: NullableNumber = null;

O.fromNullable(v1);
console.log('🚀 ~ O.fromNullable(v1):', O.fromNullable(v1)); // O.Some(3)
console.log('🚀 ~ O.fromNullable(v2):', O.fromNullable(v2)); // O.None

const head = <A>(as: ReadonlyArray<A>): O.Option<A> => (as.length === 0 ? O.none : O.some(as[0]));
head([]);
console.log('🚀 ~ head([]):', head([])); // O.None
console.log('🚀 ~ head([1,2,3]):', head([1, 2, 3])); // O.Some(1)

const getBestMovie = (titles: ReadonlyArray<string>): O.Option<string> =>
	pipe(
		titles,
		head,
		O.map((x) => x.toUpperCase()),
		O.map((x) => `Best - ${x}`)
	); // mapping valid (no none) values
console.log(`🚀 ~ getBestMovie(["a", "b"]):`, getBestMovie(['a', 'b'])); // O.Some("Best - A")
console.log(`🚀 ~ getBestMovie([]):`, getBestMovie([])); // O.None

// chain
console.log('🚀 ~ pipe(O.some(5), O.chain(inverse)):', pipe(O.some(5), O.chain(inverse))); // O.Some(0.2) - flatten option to value and pass to inverse
console.log('🚀 ~ pipe(O.some(0), O.chain(inverse)):', pipe(O.some(0), O.chain(inverse))); // O.None
const inverseHead = (arr: ReadonlyArray<number>) => pipe(arr, head, O.chain(inverse));
console.log('🚀 ~ inverseHead([]):', inverseHead([])); // Option.None
console.log('🚀 ~ inverseHead([0, 1]):', inverseHead([0, 1])); // Option.None
console.log('🚀 ~ inverseHead([2, 0]):', inverseHead([2, 0])); // O.Some(0.5)

// fromPredicate - if predicate return true, then return O.Some(v), otherwise O.None

const isEven = (n: number) => n % 2 === 0;
const getEven = O.fromPredicate(isEven);
console.log('🚀 ~ getEven(4):', getEven(4)); // O.Some(4)
console.log('🚀 ~ getEven(5):', getEven(5)); // O.none

type Circle = {
	type: 'circle';
	radius: number;
};
type Square = {
	type: 'square';
	side: number;
};
type Shape = Circle | Square;
const isCircle = (s: Shape) => s.type === 'circle';

const getCircleFromShape = O.fromPredicate(isCircle);
const c: Shape = { type: 'circle', radius: 1 };
const s: Shape = { type: 'square', side: 2 };
console.log(`🚀 ~ getCircleFromShape({type: "circle"}):`, getCircleFromShape(c)); // O.Some({type: "circle"}) Important! - returned type is option Circle, not Shape

console.log(`🚀 ~ getCircleFromShape({type: "square"}):`, getCircleFromShape(s)); // O.None but it still option Circle;

type Movie = {
	title: string;
	releaseYear: number;
	ratingPosition: number;
	award?: string;
};

const m1: Movie = {
	title: 'The Kingdom of Monads',
	releaseYear: 2023,
	ratingPosition: 1,
	award: 'Oscar',
};
const m2: Movie = {
	title: 'Natural Transformations',
	releaseYear: 2023,
	ratingPosition: 3,
};
const m3: Movie = {
	title: 'Fun with loops',
	releaseYear: 2023,
	ratingPosition: 74,
};

const getMovieAwardHighlight = (m: Movie): O.Option<string> =>
	pipe(
		m.award, // string
		O.fromNullable, // Option.string
		O.map((award) => `Awarded with: ${award}`)
	);

const getMovieTop10Highlight = (m: Movie): O.Option<string> =>
	pipe(
		m, // Movie
		O.fromPredicate(({ ratingPosition }) => ratingPosition <= 10), // Option<Movie>
		O.map(({ ratingPosition }) => `In TOP 10 at position: ${ratingPosition}`) // Option<string>
	);

const getMovieHighlight = (m: Movie): string =>
	pipe(
		m, // Movie
		getMovieAwardHighlight, // Option<string>
		O.alt(() => getMovieTop10Highlight(m)), // Option<string>
		O.getOrElse(() => `Released in ${m.releaseYear}`) // string
	);

console.log("🚀 ~ getMovieHighlight(m1):", 	getMovieHighlight(m1)) // awarded ...

console.log("🚀 ~ getMovieHighlight(m2):", getMovieHighlight(m2)) // top 10

console.log("🚀 ~ getMovieHighlight(m3):", getMovieHighlight(m3)) // released
