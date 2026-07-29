import { Effect, flow, Layer, Schema } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";
import { HabiticaConfig } from "../config/HabiticaConfig.js";
import {
  HabiticaApiError,
  HabiticaAuthError,
  HabiticaDecodeError,
  type HabiticaError,
  HabiticaNotFoundError,
  HabiticaRateLimitError,
  isHabiticaError,
} from "./HabiticaErrors.js";
import { HabiticaGateway } from "./HabiticaGateway.js";
import { HabiticaRoutes, taskListUrlParams } from "./HabiticaRoutes.js";
import {
  HabiticaApiUserProfile,
  HabiticaApiInventory,
  HabiticaApiNotifications,
  HabiticaApiMarket,
  HabiticaApiContent,
  CreateTaskInput,
  HabiticaMutationResult,
  HabiticaTag,
  HabiticaTask,
  habiticaProfileFromApiUser,
  type Direction,
  type HabiticaInventory,
  type HabiticaNotification,
  type HabiticaProfile,
  type HabiticaShopItem,
  type HabiticaSkill,
  type TaskType,
  type UpdateChecklistItemInput,
  type UpdateTaskInput,
} from "./HabiticaSchemas.js";
import { type HabiticaTransportRequest, HabiticaTransport } from "./HabiticaTransport.js";

type BoundarySchema = Schema.Decoder<unknown>;

const responseData = <S extends BoundarySchema>(schema: S) =>
  Schema.Struct({
    data: schema,
    success: Schema.Boolean,
  });

const decodeUnknown = <S extends BoundarySchema>(
  schema: S,
  value: unknown,
): Effect.Effect<S["Type"], HabiticaDecodeError> =>
  Effect.try({
    try: () => Schema.decodeUnknownSync(schema)(value),
    catch: () =>
      new HabiticaDecodeError({
        message: "Habitica response did not match the expected schema.",
      }),
  });

const decodeData =
  <S extends BoundarySchema>(schema: S) =>
  (value: unknown): Effect.Effect<S["Type"], HabiticaDecodeError> =>
    decodeUnknown(responseData(schema), value).pipe(
      Effect.map((body) => (body as { readonly data: S["Type"] }).data),
    );

const requestForMethodName = {
  DELETE: HttpClientRequest.delete,
  GET: HttpClientRequest.get,
  POST: HttpClientRequest.post,
  PUT: HttpClientRequest.put,
};

const methodRequest = (request: HabiticaTransportRequest) => {
  const requestForMethod = requestForMethodName[request.method](request.path);

  const withParams =
    request.urlParams === undefined
      ? requestForMethod
      : requestForMethod.pipe(HttpClientRequest.setUrlParams(request.urlParams));

  return request.body === undefined
    ? withParams
    : withParams.pipe(HttpClientRequest.bodyJsonUnsafe(request.body));
};

const errorForStatusCode: Readonly<Record<number, () => HabiticaError>> = {
  401: () => new HabiticaAuthError({ message: "Habitica rejected the configured credentials." }),
  403: () => new HabiticaAuthError({ message: "Habitica rejected the configured credentials." }),
  404: () => new HabiticaNotFoundError({ message: "Habitica resource was not found." }),
  429: () => new HabiticaRateLimitError({ message: "Habitica rate limit exceeded." }),
};

const errorForStatus = (status: number): HabiticaError =>
  errorForStatusCode[status]?.() ??
  new HabiticaApiError({ message: "Habitica API request failed.", status });

/**
 * The 2xx range check is delegated to the platform so the success window has a
 * single definition, and only the mapping to Habitica errors lives here.
 */
const ensureOk = (response: HttpClientResponse.HttpClientResponse) =>
  HttpClientResponse.filterStatusOk(response).pipe(
    Effect.mapError(() => errorForStatus(response.status)),
  );

const rewardInput = (input: CreateTaskInput): CreateTaskInput =>
  input.notes === undefined
    ? new CreateTaskInput({ text: input.text, type: "reward" })
    : new CreateTaskInput({ notes: input.notes, text: input.text, type: "reward" });

const decodeUserProfile = (value: unknown): Effect.Effect<HabiticaProfile, HabiticaDecodeError> =>
  decodeData(HabiticaApiUserProfile)(value).pipe(Effect.map(habiticaProfileFromApiUser));

const decodeInventory = (value: unknown): Effect.Effect<HabiticaInventory, HabiticaDecodeError> =>
  decodeData(HabiticaApiInventory)(value).pipe(Effect.map((body) => body.items));

const decodeNotifications = (
  value: unknown,
): Effect.Effect<ReadonlyArray<HabiticaNotification>, HabiticaDecodeError> =>
  decodeData(HabiticaApiNotifications)(value).pipe(Effect.map((body) => body.notifications));

const decodeShopItems = (
  value: unknown,
): Effect.Effect<ReadonlyArray<HabiticaShopItem>, HabiticaDecodeError> =>
  decodeData(HabiticaApiMarket)(value).pipe(
    Effect.map((market) => market.categories.flatMap((category) => category.items)),
  );

const decodeSkills = (
  value: unknown,
): Effect.Effect<ReadonlyArray<HabiticaSkill>, HabiticaDecodeError> =>
  decodeData(HabiticaApiContent)(value).pipe(
    Effect.map((content) =>
      Object.values(content.spells).flatMap((spells) => Object.values(spells)),
    ),
  );

const transportLayer = Layer.effect(
  HabiticaTransport,
  Effect.gen(function* () {
    const config = yield* HabiticaConfig;
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.mapRequest(
        flow(
          HttpClientRequest.prependUrl(config.apiBaseUrl),
          HttpClientRequest.acceptJson,
          HttpClientRequest.setHeaders({
            "x-api-key": config.apiToken,
            "x-api-user": config.userId,
            "x-client": config.clientId,
          }),
        ),
      ),
    );

    return HabiticaTransport.of({
      request: (request, decode) =>
        client.execute(methodRequest(request)).pipe(
          Effect.flatMap(ensureOk),
          Effect.flatMap(HttpClientResponse.schemaBodyJson(Schema.Unknown)),
          Effect.flatMap(decode),
          Effect.mapError(
            (error): HabiticaError =>
              isHabiticaError(error)
                ? error
                : new HabiticaApiError({ message: "Habitica HTTP transport failed." }),
          ),
        ),
    });
  }),
);

const gatewayLayer = Layer.effect(
  HabiticaGateway,
  Effect.gen(function* () {
    const transport = yield* HabiticaTransport;
    const get = <S extends BoundarySchema>(
      path: string,
      schema: S,
      urlParams?: Readonly<Record<string, string>>,
    ) =>
      transport.request(
        urlParams === undefined ? { method: "GET", path } : { method: "GET", path, urlParams },
        decodeData(schema),
      );
    const post = <S extends BoundarySchema>(path: string, body: unknown, schema: S) =>
      transport.request({ body, method: "POST", path }, decodeData(schema));
    const put = <S extends BoundarySchema>(path: string, body: unknown, schema: S) =>
      transport.request({ body, method: "PUT", path }, decodeData(schema));
    const del = <S extends BoundarySchema>(path: string, schema: S) =>
      transport.request({ method: "DELETE", path }, decodeData(schema));
    const getUserProfile = transport.request(
      { method: "GET", path: HabiticaRoutes.user() },
      decodeUserProfile,
    );

    return HabiticaGateway.of({
      addChecklistItem: ({ taskId, text }) =>
        post(HabiticaRoutes.checklist(taskId), { text }, HabiticaTask),
      buyReward: ({ rewardId }) =>
        post(HabiticaRoutes.taskScore(rewardId, "down"), {}, HabiticaMutationResult),
      buyShopItem: ({ key }) =>
        post(HabiticaRoutes.buySpecialSpell(key), {}, HabiticaMutationResult),
      castSkill: ({ skillKey, targetId }) =>
        post(HabiticaRoutes.castSkill(skillKey), { targetId }, HabiticaMutationResult),
      createReward: (input) => post(HabiticaRoutes.tasksUser(), rewardInput(input), HabiticaTask),
      createTag: (input) => post(HabiticaRoutes.tags(), input, HabiticaTag),
      createTask: (input) => post(HabiticaRoutes.tasksUser(), input, HabiticaTask),
      deleteChecklistItem: ({ itemId, taskId }) =>
        del(HabiticaRoutes.checklistItem(taskId, itemId), HabiticaTask),
      deleteReward: ({ rewardId }) => del(HabiticaRoutes.task(rewardId), HabiticaMutationResult),
      deleteTask: ({ taskId }) => del(HabiticaRoutes.task(taskId), HabiticaMutationResult),
      equipMount: ({ mountKey }) =>
        post(HabiticaRoutes.equipMount(mountKey), {}, HabiticaMutationResult),
      equipPet: ({ petKey }) => post(HabiticaRoutes.equipPet(petKey), {}, HabiticaMutationResult),
      feedPet: ({ foodKey, petKey }) =>
        post(HabiticaRoutes.feedPet(petKey, foodKey), {}, HabiticaMutationResult),
      getInventory: transport.request(
        { method: "GET", path: HabiticaRoutes.user(), urlParams: { userFields: "items" } },
        decodeInventory,
      ),
      getStats: getUserProfile.pipe(Effect.map((profile) => profile.stats)),
      getTask: ({ taskId }) => get(HabiticaRoutes.task(taskId), HabiticaTask),
      getUserProfile,
      hatchPet: ({ eggKey, hatchingPotionKey }) =>
        post(HabiticaRoutes.hatchPet(eggKey, hatchingPotionKey), {}, HabiticaMutationResult),
      listNotifications: transport.request(
        { method: "GET", path: HabiticaRoutes.user(), urlParams: { userFields: "notifications" } },
        decodeNotifications,
      ),
      listShopItems: transport.request(
        { method: "GET", path: HabiticaRoutes.market() },
        decodeShopItems,
      ),
      listSkills: transport.request(
        { method: "GET", path: HabiticaRoutes.content() },
        decodeSkills,
      ),
      listTags: get(HabiticaRoutes.tags(), Schema.Array(HabiticaTag)),
      listTasks: (input: { readonly type?: TaskType | undefined }) =>
        get(HabiticaRoutes.tasksUser(), Schema.Array(HabiticaTask), taskListUrlParams(input.type)),
      readNotification: ({ notificationId }) =>
        post(HabiticaRoutes.notificationRead(notificationId), {}, HabiticaMutationResult),
      scoreChecklistItem: ({ itemId, taskId }) =>
        post(HabiticaRoutes.checklistItemScore(taskId, itemId), {}, HabiticaTask),
      scoreTask: ({
        direction,
        taskId,
      }: {
        readonly direction: Direction;
        readonly taskId: string;
      }) => post(HabiticaRoutes.taskScore(taskId, direction), {}, HabiticaTask),
      updateChecklistItem: (input: UpdateChecklistItemInput) =>
        put(HabiticaRoutes.checklistItem(input.taskId, input.itemId), input, HabiticaTask),
      updateReward: (input: UpdateTaskInput) =>
        put(HabiticaRoutes.task(input.id), input, HabiticaTask),
      updateTask: (input: UpdateTaskInput) =>
        put(HabiticaRoutes.task(input.id), input, HabiticaTask),
    });
  }),
);

export const HabiticaHttpAdapter = {
  /** Gateway over an injected {@link HabiticaTransport}. */
  gatewayLayer,
  /**
   * Production wiring: gateway over the HTTP transport over `fetch`. The
   * concrete HTTP client is chosen here rather than inside `transportLayer` so
   * tests can drive the transport against a stub client.
   */
  layer: gatewayLayer.pipe(Layer.provide(transportLayer), Layer.provide(FetchHttpClient.layer)),
  /** Transport over an injected `HttpClient` and {@link HabiticaConfig}. */
  transportLayer,
} as const;
