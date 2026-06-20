import { Bdd } from "effect-bdd";
import { Effect, Schema } from "effect";
import { greetingMessage } from "../src/Greeting.js";

const nameCapture = Bdd.capture("name", Schema.String);
const expectedCapture = Bdd.capture("expected", Schema.String);

const givenGreetingToolAvailable = Bdd.given`the Habitica MCP greeting tool is available`(() =>
  Effect.succeed({ greeting: "" }),
);

const whenAskItToGreet = Bdd.when`I ask it to greet ${nameCapture}`(
  ({ name: capturedName }: { readonly name: string }) =>
    Effect.succeed({ greeting: greetingMessage(capturedName) }),
);

const thenGreetingIs = Bdd.then`the greeting is ${expectedCapture}`(
  (
    { expected: expectedGreeting }: { readonly expected: string },
    state: { readonly greeting: string },
  ) =>
    state.greeting === expectedGreeting
      ? Effect.succeed(state)
      : Effect.fail(`expected "${expectedGreeting}", got "${state.greeting}"` as const),
);

const greetingCaller = Bdd.scenario("Greeting a Habitica MCP caller").pipe(
  givenGreetingToolAvailable,
  whenAskItToGreet,
  thenGreetingIs,
);

export const greeting = Bdd.feature("Greeting").pipe(greetingCaller);
