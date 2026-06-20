import { Bdd } from "effect-bdd";
import { Effect, Schema } from "effect";
import { greetingMessage } from "../src/Greeting.js";

const name = Bdd.capture("name", Schema.String);
const expected = Bdd.capture("expected", Schema.String);

const givenGreetingToolAvailable = Bdd.given`the Habitica MCP greeting tool is available`(() =>
  Effect.succeed({ greeting: "" }),
);

const whenAskItToGreet = Bdd.when`I ask it to greet ${name}`(
  ({ name }: { readonly name: string }) => Effect.succeed({ greeting: greetingMessage(name) }),
);

const thenGreetingIs = Bdd.then`the greeting is ${expected}`(
  ({ expected }: { readonly expected: string }, state: { readonly greeting: string }) =>
    state.greeting === expected
      ? Effect.succeed(state)
      : Effect.fail(`expected "${expected}", got "${state.greeting}"` as const),
);

const greetingCaller = Bdd.scenario("Greeting a Habitica MCP caller").pipe(
  givenGreetingToolAvailable,
  whenAskItToGreet,
  thenGreetingIs,
);

export const greeting = Bdd.feature("Greeting").pipe(greetingCaller);
