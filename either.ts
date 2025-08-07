import base64 from "base-64";
import * as E from "fp-ts/Either";
import * as J from "fp-ts/Json";
import { flow, pipe } from "fp-ts/lib/function";
import { makeMatch } from "ts-adt/MakeADT";

type Item = { name: string; price: number };
type Cart = Readonly<{ items: Item[]; total: number }>;
type Account = Readonly<{ balance: number; frozen: boolean }>;
type AccountFrozen = Readonly<{ type: "AccountFrozen"; message: string }>;
type NotEnoughBalance = Readonly<{ type: "NotEnoughBalance"; message: string }>;

const pay =
	(amount: number) =>
	(account: Account): E.Either<AccountFrozen | NotEnoughBalance, Account> =>
		account.frozen
			? E.left({ type: "AccountFrozen", message: "Cannot pay with a frozen account!" })
			: account.balance < amount
				? E.left({
						type: "NotEnoughBalance",
						message: `Cannot pay ${amount} with a balance of ${account.balance}!`,
					})
				: E.right({
						...account,
						balance: account.balance - amount,
					});

const account1: Account = {
	balance: 70,
	frozen: false,
};
const account2: Account = {
	balance: 30,
	frozen: false,
};
const account3: Account = {
	balance: 100,
	frozen: true,
};

console.log("🚀 ~ pipe(account1, pay(50)):", pipe(account1, pay(50))); // E.right({balance: 20, frozen: false})
console.log("🚀 ~ pipe(account2, pay(50)):", pipe(account2, pay(50))); // E.left({type: "NotEnoughBalance", message: "Cannot pay 50 with a balance of 30!"})
console.log("🚀 ~ pipe(account3, pay(50)):", pipe(account3, pay(50))); // E.left({type: "AccountFrozen", message: "Cannot pay with a frozen account!"})

const matchError = makeMatch("type");

const checkout = (cart: Cart) => (account: Account) =>
	pipe(
		account,
		pay(cart.total),
		E.match(
			// run cb for left and right
			matchError({
				// run cb for matched error by pattern
				AccountFrozen: (e) => `${e.message}`,
				NotEnoughBalance: (e) => `${e.message}`,
			}),
			(a) => `Success. Remaining balance ${a.balance}`,
		),
	);

const checkoutFifty = checkout({ items: [], total: 50 });

console.log("🚀 ~ checkoutFifty(account1):", checkoutFifty(account1)); // Success. Remaining balance
20;
console.log("🚀 ~ checkoutFifty(account2):", checkoutFifty(account2)); // Cannot pay 50 with a balance of 30!
console.log("🚀 ~ checkoutFifty(account3):", checkoutFifty(account3)); // Cannot pay with a frozen account!

// imperative
// const jsonParse = (str: string): E.Either<Error, unknown> => {
// 	try {
// 		const r = JSON.parse(str);
// 		return E.right(r);
// 	} catch(e) {
// 		const err = e instanceof Error ? e : new Error(String(e));
// 		return E.left(err);
// 	}
// }

// via E.tryCatch
// const jsonParse = (str: string): E.Either<Error, unknown> => E.tryCatch(() => JSON.parse(str), (e) => e instanceof Error ? e : new Error(String(e)))
// or E.toError instead (e) => e instanceof Error ? e : new Error(String(e))

// via E.tryCatchK
// const jsonParse = E.tryCatchK(JSON.parse, E.toError);

// typed
type JsonParseError = Readonly<{
	type: "JsonParseError";
	error: Error;
}>;

const jsonParse: (str: string) => E.Either<JsonParseError, unknown> = E.tryCatchK(
	JSON.parse,
	(e) => ({
		type: "JsonParseError",
		error: E.toError(e),
	}),
);

console.log(`🚀 ~ jsonParse('{"foo": "bar"}'):`, jsonParse('{"foo": "bar"}')); // E.right({foo: "bar"})
console.log(`🚀 ~ jsonParse("{invalid}"):`, jsonParse("{invalid}")); // E.left({type: "JsonParseError", error: ...})

type Response = Readonly<{ body: string; contentLength: number }>;
type JsonStringifyError = Readonly<{
	type: "JsonStringifyError";
	error: Error;
}>;

const jsonStringify = flow(
	J.stringify,
	E.mapLeft((e): JsonStringifyError => ({ type: "JsonStringifyError", error: E.toError(e) })),
);

const createResponse = (payload: unknown): E.Either<JsonStringifyError, Response> =>
	pipe(
		payload,
		// J.stringify, // Either<unknown, string>
		jsonStringify,
		// E.map((s) => ({ body: s, contentLength: s.length })),
		// E.mapLeft((e) => ({ type: "JsonStringifyError", error: E.toError(e) })),
		// E.bimap( // map both - left & right
		// 	(e) => ({ type: "JsonStringifyError", error: E.toError(e) }),
		// 	(s) => ({ body: s, contentLength: s.length }),
		// ),
		E.map((s) => ({ body: s, contentLength: s.length })), // avoided matching both by moving the error matching to a custom fn jsonStringify
	);

console.log(
	"🚀 ~ createResponse({ balance: 100, success: true }):",
	createResponse({ balance: 100, success: true }),
); // E.right({body: "{\"balance\":100,\"success\":true}", contentLength: 30,})

const circular: any = {};
circular.self = circular;

console.log("🚀 ~ createResponse(circular):", createResponse(circular)); // // E.left({type: 'JsonStringifyError, error: TypeError})

// CHAIN OF OPERATIONS WITH EITHER

type User = Readonly<{
	id: number;
	name: string;
}>;

type Base64DecodeError = Readonly<{
	type: "Base64DecodeError";
	error: Error;
}>;

type InvalidUser = Readonly<{
	type: "InvalidUser";
	obj: unknown;
}>;

const user1: User = {
	id: 1,
	name: "Dude",
};

const base64Decode = E.tryCatchK(
	base64.decode,
	(e): Base64DecodeError => ({ type: "Base64DecodeError", error: E.toError(e) }),
);

const strUser1: string = JSON.stringify(user1);

const encodedUser1: string = btoa(strUser1);
const encodedNotUser: string = btoa(JSON.stringify({ a: 1, b: 2 }));

const decodeUserObjectFromUnknown = (input: unknown): E.Either<InvalidUser, User> =>
	typeof input === "object" && input && "id" in input
		? E.right(user1)
		: E.left({ type: "InvalidUser", obj: input }); // fake fn, need to use io-ts to get real decode fn

const decodeUser = (encodedUser: string) =>
	pipe(
		encodedUser,
		base64Decode, // Either<Base64DecodeError, string>
		// E.map(jsonParse), // Either<Base64DecodeError, Either<JsonParseError, unknown>>
		// E.flattenW, // W - is widening: need to wide error types because JsonParseError and Base64DecodeError don't match. // Either<Base64DecodeError | JsonParseError, unknown>
		E.flatMap(jsonParse), // instead E.map and E.flattenW
		// E.map(decodeUserObjectFromUnknown), // Either<Base64DecodeError | JsonParseError, Either<InvalidUser, User>> // again its nested
		E.flatMap(decodeUserObjectFromUnknown), // Either<Base64DecodeError | JsonParserError | InvalidUser, User>>
	);

console.log("🚀 ~ decodeUser(encodedUser1):", decodeUser(encodedUser1)); // E.right({id: 1, name: "Dude"})
console.log(`🚀 ~ decodeUser("invalidBase64!!!"):`, decodeUser("invalidBase64!!!")); // E.left({type: "Base64DecodeError", error: Error})
console.log("🚀 ~ decodeUser(encodedNotUser):", decodeUser(encodedNotUser)); // E.left({ type: "InvalidUser", obj: {a: 1, b: 2})

// ERROR RECOVERY

type Email = Readonly<{
	type: "Email";
	value: string;
}>;

type PhoneNumber = Readonly<{
	type: "PhoneNumber";
	value: string;
}>;

const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;

const phoneNumberRegex = /^[0-9\-+]{9,15}$/;

const validateEmail = flow(
	E.fromPredicate(
		(maybeEmail: string) => emailRegex.test(maybeEmail),
		(invalidEmail) => (invalidEmail.includes("@") ? "MalformedEmail" : "NotAnEmail"),
	),
	E.map((email): Email => ({ type: "Email", value: email })),
);

const validatePhoneNumber = flow(
	E.fromPredicate(
		(maybePhoneNumber: string) => phoneNumberRegex.test(maybePhoneNumber),
		() => "InvalidPhoneNumber" as const,
	),
	E.map((phoneNumber): PhoneNumber => ({ type: "PhoneNumber", value: phoneNumber })),
);

const validateLoginName = (loginName: string) =>
	pipe(
		loginName,
		validateEmail, // E.Either<'MalformedEmail' | 'NotAnEmail', Email>
		E.orElseW((e) => (e === "NotAnEmail" ? validatePhoneNumber(loginName) : E.left(e))), // Either<"MalformedEmail", "InvalidPhoneNumber", Email | PhoneNumber (widened because Email & PhoneNumber don't match)
	);

console.log(`🚀 ~ validateLoginName("a@b.cd"):`, validateLoginName("a@b.cd")); // E.right({type: "Email", value: "a@b.cd"})
console.log(`🚀 ~ validateLoginName("1-123-123"):`, validateLoginName("1-123-123")); // E.right({type: "PhoneNumber", value: "1-123-123"})
console.log(`🚀 ~ validateLoginName("ftw?"):`, validateLoginName("ftw?")); // E.left("InvalidPhoneNumber")
console.log(`🚀 ~ validateLoginName("a@b"):`, validateLoginName("a@b")); // E.left("MalformedEmail")
