//#region src/_consts.d.ts

/**
 * Days of the week for weekly aggregation
 */
declare const WEEK_DAYS: readonly ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
/**
 * Week day names type
 */
type WeekDay = (typeof WEEK_DAYS)[number];
//#endregion
//#region src/_session-blocks.d.ts
/**
 * Represents a single usage data entry loaded from JSONL files
 */
type LoadedUsageEntry = {
  timestamp: Date;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  costUSD: number | null;
  model: string;
  version?: string;
  usageLimitResetTime?: Date;
};
/**
 * Aggregated token counts for different token types
 */
type TokenCounts = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
};
/**
 * Represents a session block (typically 5-hour billing period) with usage data
 */
type SessionBlock = {
  id: string;
  startTime: Date;
  endTime: Date;
  actualEndTime?: Date;
  isActive: boolean;
  isGap?: boolean;
  entries: LoadedUsageEntry[];
  tokenCounts: TokenCounts;
  costUSD: number;
  models: string[];
  usageLimitResetTime?: Date;
};
//#endregion
//#region ../../node_modules/.pnpm/type-fest@4.41.0/node_modules/type-fest/source/observable-like.d.ts
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- It has to be an `interface` so that it can be merged.
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

/**
@remarks
The TC39 observable proposal defines a `closed` property, but some implementations (such as xstream) do not as of 10/08/2021.
As well, some guidance on making an `Observable` to not include `closed` property.
@see https://github.com/tc39/proposal-observable/blob/master/src/Observable.js#L129-L130
@see https://github.com/staltz/xstream/blob/6c22580c1d84d69773ee4b0905df44ad464955b3/src/index.ts#L79-L85
@see https://github.com/benlesh/symbol-observable#making-an-object-observable

@category Observable
*/

//#endregion
//#region ../../node_modules/.pnpm/type-fest@4.41.0/node_modules/type-fest/source/tuple-to-union.d.ts
/**
Convert a tuple/array into a union type of its elements.

This can be useful when you have a fixed set of allowed values and want a type defining only the allowed values, but do not want to repeat yourself.

@example
```
import type {TupleToUnion} from 'type-fest';

const destinations = ['a', 'b', 'c'] as const;

type Destination = TupleToUnion<typeof destinations>;
//=> 'a' | 'b' | 'c'

function verifyDestination(destination: unknown): destination is Destination {
	return destinations.includes(destination as any);
}

type RequestBody = {
	deliverTo: Destination;
};

function verifyRequestBody(body: unknown): body is RequestBody {
	const deliverTo = (body as any).deliverTo;
	return typeof body === 'object' && body !== null && verifyDestination(deliverTo);
}
```

Alternatively, you may use `typeof destinations[number]`. If `destinations` is a tuple, there is no difference. However if `destinations` is a string, the resulting type will the union of the characters in the string. Other types of `destinations` may result in a compile error. In comparison, TupleToUnion will return `never` if a tuple is not provided.

@example
```
const destinations = ['a', 'b', 'c'] as const;

type Destination = typeof destinations[number];
//=> 'a' | 'b' | 'c'

const erroringType = new Set(['a', 'b', 'c']);

type ErroringType = typeof erroringType[number];
//=> Type 'Set<string>' has no matching index signature for type 'number'. ts(2537)

const numberBool: { [n: number]: boolean } = { 1: true };

type NumberBool = typeof numberBool[number];
//=> boolean
```

@category Array
*/
type TupleToUnion<ArrayType> = ArrayType extends readonly unknown[] ? ArrayType[number] : never;
//#endregion
//#region ../../node_modules/.pnpm/valibot@1.1.0_typescript@5.9.2/node_modules/valibot/dist/index.d.ts
/**
 * Fallback type.
 */
type Fallback<TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>> = MaybeReadonly<InferOutput<TSchema>> | ((dataset?: OutputDataset<InferOutput<TSchema>, InferIssue<TSchema>>, config?: Config<InferIssue<TSchema>>) => MaybeReadonly<InferOutput<TSchema>>);
/**
 * Schema with fallback type.
 */
type SchemaWithFallback<TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, TFallback$1 extends Fallback<TSchema>> = TSchema & {
  /**
   * The fallback value.
   */
  readonly fallback: TFallback$1;
};
/**
 * Returns a fallback value as output if the input does not match the schema.
 *
 * @param schema The schema to catch.
 * @param fallback The fallback value.
 *
 * @returns The passed schema.
 */

/**
 * Fallback async type.
 */
type FallbackAsync<TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>> = MaybeReadonly<InferOutput<TSchema>> | ((dataset?: OutputDataset<InferOutput<TSchema>, InferIssue<TSchema>>, config?: Config<InferIssue<TSchema>>) => MaybePromise<MaybeReadonly<InferOutput<TSchema>>>);
/**
 * Schema with fallback async type.
 */
type SchemaWithFallbackAsync<TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, TFallback$1 extends FallbackAsync<TSchema>> = Omit<TSchema, 'async' | '~standard' | '~run'> & {
  /**
   * The fallback value.
   */
  readonly fallback: TFallback$1;
  /**
   * Whether it's async.
   */
  readonly async: true;
  /**
   * The Standard Schema properties.
   *
   * @internal
   */
  readonly '~standard': StandardProps<InferInput<TSchema>, InferOutput<TSchema>>;
  /**
   * Parses unknown input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (dataset: UnknownDataset, config: Config<BaseIssue<unknown>>) => Promise<OutputDataset<InferOutput<TSchema>, InferIssue<TSchema>>>;
};
/**
 * Returns a fallback value as output if the input does not match the schema.
 *
 * @param schema The schema to catch.
 * @param fallback The fallback value.
 *
 * @returns The passed schema.
 */

/**
 * Schema with pipe type.
 */
type SchemaWithPipe<TPipe$1 extends readonly [BaseSchema<unknown, unknown, BaseIssue<unknown>>, ...PipeItem<any, unknown, BaseIssue<unknown>>[]]> = Omit<FirstTupleItem<TPipe$1>, 'pipe' | '~standard' | '~run' | '~types'> & {
  /**
   * The pipe items.
   */
  readonly pipe: TPipe$1;
  /**
   * The Standard Schema properties.
   *
   * @internal
   */
  readonly '~standard': StandardProps<InferInput<FirstTupleItem<TPipe$1>>, InferOutput<LastTupleItem<TPipe$1>>>;
  /**
   * Parses unknown input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (dataset: UnknownDataset, config: Config<BaseIssue<unknown>>) => OutputDataset<InferOutput<LastTupleItem<TPipe$1>>, InferIssue<TPipe$1[number]>>;
  /**
   * The input, output and issue type.
   *
   * @internal
   */
  readonly '~types'?: {
    readonly input: InferInput<FirstTupleItem<TPipe$1>>;
    readonly output: InferOutput<LastTupleItem<TPipe$1>>;
    readonly issue: InferIssue<TPipe$1[number]>;
  } | undefined;
};
/**
 * Adds a pipeline to a schema, that can validate and transform its input.
 *
 * @param schema The root schema.
 * @param item1 The first pipe item.
 *
 * @returns A schema with a pipeline.
 */

/**
 * Schema with pipe async type.
 */
type SchemaWithPipeAsync<TPipe$1 extends readonly [(BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>), ...(PipeItem<any, unknown, BaseIssue<unknown>> | PipeItemAsync<any, unknown, BaseIssue<unknown>>)[]]> = Omit<FirstTupleItem<TPipe$1>, 'async' | 'pipe' | '~standard' | '~run' | '~types'> & {
  /**
   * The pipe items.
   */
  readonly pipe: TPipe$1;
  /**
   * Whether it's async.
   */
  readonly async: true;
  /**
   * The Standard Schema properties.
   *
   * @internal
   */
  readonly '~standard': StandardProps<InferInput<FirstTupleItem<TPipe$1>>, InferOutput<LastTupleItem<TPipe$1>>>;
  /**
   * Parses unknown input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (dataset: UnknownDataset, config: Config<BaseIssue<unknown>>) => Promise<OutputDataset<InferOutput<LastTupleItem<TPipe$1>>, InferIssue<TPipe$1[number]>>>;
  /**
   * The input, output and issue type.
   *
   * @internal
   */
  readonly '~types'?: {
    readonly input: InferInput<FirstTupleItem<TPipe$1>>;
    readonly output: InferOutput<LastTupleItem<TPipe$1>>;
    readonly issue: InferIssue<TPipe$1[number]>;
  } | undefined;
};
/**
 * Adds a pipeline to a schema, that can validate and transform its input.
 *
 * @param schema The root schema.
 * @param item1 The first pipe item.
 *
 * @returns A schema with a pipeline.
 */

/**
 * Base metadata interface.
 */
interface BaseMetadata<TInput$1> {
  /**
   * The object kind.
   */
  readonly kind: 'metadata';
  /**
   * The metadata type.
   */
  readonly type: string;
  /**
   * The metadata reference.
   */
  readonly reference: (...args: any[]) => BaseMetadata<any>;
  /**
   * The input, output and issue type.
   *
   * @internal
   */
  readonly '~types'?: {
    readonly input: TInput$1;
    readonly output: TInput$1;
    readonly issue: never;
  } | undefined;
}
/**
 * Generic metadata type.
 */

/**
 * Unknown dataset interface.
 */
interface UnknownDataset {
  /**
   * Whether is's typed.
   */
  typed?: false;
  /**
   * The dataset value.
   */
  value: unknown;
  /**
   * The dataset issues.
   */
  issues?: undefined;
}
/**
 * Success dataset interface.
 */
interface SuccessDataset<TValue$1> {
  /**
   * Whether is's typed.
   */
  typed: true;
  /**
   * The dataset value.
   */
  value: TValue$1;
  /**
   * The dataset issues.
   */
  issues?: undefined;
}
/**
 * Partial dataset interface.
 */
interface PartialDataset<TValue$1, TIssue extends BaseIssue<unknown>> {
  /**
   * Whether is's typed.
   */
  typed: true;
  /**
   * The dataset value.
   */
  value: TValue$1;
  /**
   * The dataset issues.
   */
  issues: [TIssue, ...TIssue[]];
}
/**
 * Failure dataset interface.
 */
interface FailureDataset<TIssue extends BaseIssue<unknown>> {
  /**
   * Whether is's typed.
   */
  typed: false;
  /**
   * The dataset value.
   */
  value: unknown;
  /**
   * The dataset issues.
   */
  issues: [TIssue, ...TIssue[]];
}
/**
 * Output dataset type.
 */
type OutputDataset<TValue$1, TIssue extends BaseIssue<unknown>> = SuccessDataset<TValue$1> | PartialDataset<TValue$1, TIssue> | FailureDataset<TIssue>;

/**
 * The Standard Schema properties interface.
 */
interface StandardProps<TInput$1, TOutput$1> {
  /**
   * The version number of the standard.
   */
  readonly version: 1;
  /**
   * The vendor name of the schema library.
   */
  readonly vendor: 'valibot';
  /**
   * Validates unknown input values.
   */
  readonly validate: (value: unknown) => StandardResult<TOutput$1> | Promise<StandardResult<TOutput$1>>;
  /**
   * Inferred types associated with the schema.
   */
  readonly types?: StandardTypes<TInput$1, TOutput$1> | undefined;
}
/**
 * The result interface of the validate function.
 */
type StandardResult<TOutput$1> = StandardSuccessResult<TOutput$1> | StandardFailureResult;
/**
 * The result interface if validation succeeds.
 */
interface StandardSuccessResult<TOutput$1> {
  /**
   * The typed output value.
   */
  readonly value: TOutput$1;
  /**
   * The non-existent issues.
   */
  readonly issues?: undefined;
}
/**
 * The result interface if validation fails.
 */
interface StandardFailureResult {
  /**
   * The issues of failed validation.
   */
  readonly issues: readonly StandardIssue[];
}
/**
 * The issue interface of the failure output.
 */
interface StandardIssue {
  /**
   * The error message of the issue.
   */
  readonly message: string;
  /**
   * The path of the issue, if any.
   */
  readonly path?: readonly (PropertyKey | StandardPathItem)[] | undefined;
}
/**
 * The path item interface of the issue.
 */
interface StandardPathItem {
  /**
   * The key of the path item.
   */
  readonly key: PropertyKey;
}
/**
 * The Standard Schema types interface.
 */
interface StandardTypes<TInput$1, TOutput$1> {
  /**
   * The input type of the schema.
   */
  readonly input: TInput$1;
  /**
   * The output type of the schema.
   */
  readonly output: TOutput$1;
}

/**
 * Base schema interface.
 */
interface BaseSchema<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> {
  /**
   * The object kind.
   */
  readonly kind: 'schema';
  /**
   * The schema type.
   */
  readonly type: string;
  /**
   * The schema reference.
   */
  readonly reference: (...args: any[]) => BaseSchema<unknown, unknown, BaseIssue<unknown>>;
  /**
   * The expected property.
   */
  readonly expects: string;
  /**
   * Whether it's async.
   */
  readonly async: false;
  /**
   * The Standard Schema properties.
   *
   * @internal
   */
  readonly '~standard': StandardProps<TInput$1, TOutput$1>;
  /**
   * Parses unknown input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (dataset: UnknownDataset, config: Config<BaseIssue<unknown>>) => OutputDataset<TOutput$1, TIssue>;
  /**
   * The input, output and issue type.
   *
   * @internal
   */
  readonly '~types'?: {
    readonly input: TInput$1;
    readonly output: TOutput$1;
    readonly issue: TIssue;
  } | undefined;
}
/**
 * Base schema async interface.
 */
interface BaseSchemaAsync<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> extends Omit<BaseSchema<TInput$1, TOutput$1, TIssue>, 'reference' | 'async' | '~run'> {
  /**
   * The schema reference.
   */
  readonly reference: (...args: any[]) => BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>;
  /**
   * Whether it's async.
   */
  readonly async: true;
  /**
   * Parses unknown input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (dataset: UnknownDataset, config: Config<BaseIssue<unknown>>) => Promise<OutputDataset<TOutput$1, TIssue>>;
}
/**
 * Generic schema type.
 */

/**
 * Base transformation interface.
 */
interface BaseTransformation<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> {
  /**
   * The object kind.
   */
  readonly kind: 'transformation';
  /**
   * The transformation type.
   */
  readonly type: string;
  /**
   * The transformation reference.
   */
  readonly reference: (...args: any[]) => BaseTransformation<any, any, BaseIssue<unknown>>;
  /**
   * Whether it's async.
   */
  readonly async: false;
  /**
   * Transforms known input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (dataset: SuccessDataset<TInput$1>, config: Config<BaseIssue<unknown>>) => OutputDataset<TOutput$1, BaseIssue<unknown> | TIssue>;
  /**
   * The input, output and issue type.
   *
   * @internal
   */
  readonly '~types'?: {
    readonly input: TInput$1;
    readonly output: TOutput$1;
    readonly issue: TIssue;
  } | undefined;
}
/**
 * Base transformation async interface.
 */
interface BaseTransformationAsync<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> extends Omit<BaseTransformation<TInput$1, TOutput$1, TIssue>, 'reference' | 'async' | '~run'> {
  /**
   * The transformation reference.
   */
  readonly reference: (...args: any[]) => BaseTransformation<any, any, BaseIssue<unknown>> | BaseTransformationAsync<any, any, BaseIssue<unknown>>;
  /**
   * Whether it's async.
   */
  readonly async: true;
  /**
   * Transforms known input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (dataset: SuccessDataset<TInput$1>, config: Config<BaseIssue<unknown>>) => Promise<OutputDataset<TOutput$1, BaseIssue<unknown> | TIssue>>;
}
/**
 * Generic transformation type.
 */

/**
 * Base validation interface.
 */
interface BaseValidation<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> {
  /**
   * The object kind.
   */
  readonly kind: 'validation';
  /**
   * The validation type.
   */
  readonly type: string;
  /**
   * The validation reference.
   */
  readonly reference: (...args: any[]) => BaseValidation<any, any, BaseIssue<unknown>>;
  /**
   * The expected property.
   */
  readonly expects: string | null;
  /**
   * Whether it's async.
   */
  readonly async: false;
  /**
   * Validates known input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (dataset: OutputDataset<TInput$1, BaseIssue<unknown>>, config: Config<BaseIssue<unknown>>) => OutputDataset<TOutput$1, BaseIssue<unknown> | TIssue>;
  /**
   * The input, output and issue type.
   *
   * @internal
   */
  readonly '~types'?: {
    readonly input: TInput$1;
    readonly output: TOutput$1;
    readonly issue: TIssue;
  } | undefined;
}
/**
 * Base validation async interface.
 */
interface BaseValidationAsync<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> extends Omit<BaseValidation<TInput$1, TOutput$1, TIssue>, 'reference' | 'async' | '~run'> {
  /**
   * The validation reference.
   */
  readonly reference: (...args: any[]) => BaseValidation<any, any, BaseIssue<unknown>> | BaseValidationAsync<any, any, BaseIssue<unknown>>;
  /**
   * Whether it's async.
   */
  readonly async: true;
  /**
   * Validates known input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (dataset: OutputDataset<TInput$1, BaseIssue<unknown>>, config: Config<BaseIssue<unknown>>) => Promise<OutputDataset<TOutput$1, BaseIssue<unknown> | TIssue>>;
}
/**
 * Generic validation type.
 */

/**
 * Infer input type.
 */
type InferInput<TItem$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>> | BaseValidation<any, unknown, BaseIssue<unknown>> | BaseValidationAsync<any, unknown, BaseIssue<unknown>> | BaseTransformation<any, unknown, BaseIssue<unknown>> | BaseTransformationAsync<any, unknown, BaseIssue<unknown>> | BaseMetadata<any>> = NonNullable<TItem$1['~types']>['input'];
/**
 * Infer output type.
 */
type InferOutput<TItem$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>> | BaseValidation<any, unknown, BaseIssue<unknown>> | BaseValidationAsync<any, unknown, BaseIssue<unknown>> | BaseTransformation<any, unknown, BaseIssue<unknown>> | BaseTransformationAsync<any, unknown, BaseIssue<unknown>> | BaseMetadata<any>> = NonNullable<TItem$1['~types']>['output'];
/**
 * Infer issue type.
 */
type InferIssue<TItem$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>> | BaseValidation<any, unknown, BaseIssue<unknown>> | BaseValidationAsync<any, unknown, BaseIssue<unknown>> | BaseTransformation<any, unknown, BaseIssue<unknown>> | BaseTransformationAsync<any, unknown, BaseIssue<unknown>> | BaseMetadata<any>> = NonNullable<TItem$1['~types']>['issue'];

/**
 * Checks if a type is `any`.
 */

/**
 * Constructs a type that is maybe readonly.
 */
type MaybeReadonly<TValue$1> = TValue$1 | Readonly<TValue$1>;
/**
 * Constructs a type that is maybe a promise.
 */
type MaybePromise<TValue$1> = TValue$1 | Promise<TValue$1>;
/**
 * Prettifies a type for better readability.
 *
 * Hint: This type has no effect and is only used so that TypeScript displays
 * the final type in the preview instead of the utility types used.
 */
type Prettify<TObject> = { [TKey in keyof TObject]: TObject[TKey] } & {};
/**
 * Marks specific keys as optional.
 */
type MarkOptional<TObject, TKeys extends keyof TObject> = { [TKey in keyof TObject]?: unknown } & Omit<TObject, TKeys> & Partial<Pick<TObject, TKeys>>;
/**
 * Merges two objects. Overlapping entries from the second object overwrite
 * properties from the first object.
 */

/**
 * Extracts first tuple item.
 */
type FirstTupleItem<TTuple extends readonly [unknown, ...unknown[]]> = TTuple[0];
/**
 * Extracts last tuple item.
 */
type LastTupleItem<TTuple extends readonly [unknown, ...unknown[]]> = TTuple[TTuple extends readonly [unknown, ...infer TRest] ? TRest['length'] : never];
/**
 * Converts union to intersection type.
 */

/**
 * Error message type.
 */
type ErrorMessage<TIssue extends BaseIssue<unknown>> = ((issue: TIssue) => string) | string;
/**
 * Default type.
 */
type Default<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, TInput$1 extends null | undefined> = MaybeReadonly<InferInput<TWrapped$1> | TInput$1> | ((dataset?: UnknownDataset, config?: Config<InferIssue<TWrapped$1>>) => MaybeReadonly<InferInput<TWrapped$1> | TInput$1>) | undefined;
/**
 * Default async type.
 */
type DefaultAsync<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, TInput$1 extends null | undefined> = MaybeReadonly<InferInput<TWrapped$1> | TInput$1> | ((dataset?: UnknownDataset, config?: Config<InferIssue<TWrapped$1>>) => MaybePromise<MaybeReadonly<InferInput<TWrapped$1> | TInput$1>>) | undefined;
/**
 * Default value type.
 */
type DefaultValue<TDefault extends Default<BaseSchema<unknown, unknown, BaseIssue<unknown>>, null | undefined> | DefaultAsync<BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, null | undefined>> = TDefault extends DefaultAsync<infer TWrapped extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, infer TInput> ? TDefault extends ((dataset?: UnknownDataset, config?: Config<InferIssue<TWrapped>>) => MaybePromise<InferInput<TWrapped> | TInput>) ? Awaited<ReturnType<TDefault>> : TDefault : never;

/**
 * Optional entry schema type.
 */
type OptionalEntrySchema = ExactOptionalSchema<BaseSchema<unknown, unknown, BaseIssue<unknown>>, unknown> | NullishSchema<BaseSchema<unknown, unknown, BaseIssue<unknown>>, unknown> | OptionalSchema<BaseSchema<unknown, unknown, BaseIssue<unknown>>, unknown>;
/**
 * Optional entry schema async type.
 */
type OptionalEntrySchemaAsync = ExactOptionalSchemaAsync<BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, unknown> | NullishSchemaAsync<BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, unknown> | OptionalSchemaAsync<BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, unknown>;
/**
 * Object entries interface.
 */
interface ObjectEntries {
  [key: string]: BaseSchema<unknown, unknown, BaseIssue<unknown>> | SchemaWithFallback<BaseSchema<unknown, unknown, BaseIssue<unknown>>, unknown> | OptionalEntrySchema;
}
/**
 * Object entries async interface.
 */
interface ObjectEntriesAsync {
  [key: string]: BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>> | SchemaWithFallback<BaseSchema<unknown, unknown, BaseIssue<unknown>>, unknown> | SchemaWithFallbackAsync<BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, unknown> | OptionalEntrySchema | OptionalEntrySchemaAsync;
}
/**
 * Object keys type.
 */

/**
 * Infer entries input type.
 */
type InferEntriesInput<TEntries$1 extends ObjectEntries | ObjectEntriesAsync> = { -readonly [TKey in keyof TEntries$1]: InferInput<TEntries$1[TKey]> };
/**
 * Infer entries output type.
 */
type InferEntriesOutput<TEntries$1 extends ObjectEntries | ObjectEntriesAsync> = { -readonly [TKey in keyof TEntries$1]: InferOutput<TEntries$1[TKey]> };
/**
 * Optional input keys type.
 */
type OptionalInputKeys<TEntries$1 extends ObjectEntries | ObjectEntriesAsync> = { [TKey in keyof TEntries$1]: TEntries$1[TKey] extends OptionalEntrySchema | OptionalEntrySchemaAsync ? TKey : never }[keyof TEntries$1];
/**
 * Optional output keys type.
 */
type OptionalOutputKeys<TEntries$1 extends ObjectEntries | ObjectEntriesAsync> = { [TKey in keyof TEntries$1]: TEntries$1[TKey] extends OptionalEntrySchema | OptionalEntrySchemaAsync ? undefined extends TEntries$1[TKey]['default'] ? TKey : never : never }[keyof TEntries$1];
/**
 * Input with question marks type.
 */
type InputWithQuestionMarks<TEntries$1 extends ObjectEntries | ObjectEntriesAsync, TObject extends InferEntriesInput<TEntries$1>> = MarkOptional<TObject, OptionalInputKeys<TEntries$1>>;
/**
 * Output with question marks type.
 */
type OutputWithQuestionMarks<TEntries$1 extends ObjectEntries | ObjectEntriesAsync, TObject extends InferEntriesOutput<TEntries$1>> = MarkOptional<TObject, OptionalOutputKeys<TEntries$1>>;
/**
 * Readonly output keys type.
 */
type ReadonlyOutputKeys<TEntries$1 extends ObjectEntries | ObjectEntriesAsync> = { [TKey in keyof TEntries$1]: TEntries$1[TKey] extends SchemaWithPipe<infer TPipe> | SchemaWithPipeAsync<infer TPipe> ? ReadonlyAction<any> extends TPipe[number] ? TKey : never : never }[keyof TEntries$1];
/**
 * Output with readonly type.
 */
type OutputWithReadonly<TEntries$1 extends ObjectEntries | ObjectEntriesAsync, TObject extends OutputWithQuestionMarks<TEntries$1, InferEntriesOutput<TEntries$1>>> = Readonly<TObject> & Pick<TObject, Exclude<keyof TObject, ReadonlyOutputKeys<TEntries$1>>>;
/**
 * Infer object input type.
 */
type InferObjectInput<TEntries$1 extends ObjectEntries | ObjectEntriesAsync> = Prettify<InputWithQuestionMarks<TEntries$1, InferEntriesInput<TEntries$1>>>;
/**
 * Infer object output type.
 */
type InferObjectOutput<TEntries$1 extends ObjectEntries | ObjectEntriesAsync> = Prettify<OutputWithReadonly<TEntries$1, OutputWithQuestionMarks<TEntries$1, InferEntriesOutput<TEntries$1>>>>;
/**
 * Infer object issue type.
 */
type InferObjectIssue<TEntries$1 extends ObjectEntries | ObjectEntriesAsync> = InferIssue<TEntries$1[keyof TEntries$1]>;

/**
 * Tuple items type.
 */

/**
 * Array path item interface.
 */
interface ArrayPathItem {
  /**
   * The path item type.
   */
  readonly type: 'array';
  /**
   * The path item origin.
   */
  readonly origin: 'value';
  /**
   * The path item input.
   */
  readonly input: MaybeReadonly<unknown[]>;
  /**
   * The path item key.
   */
  readonly key: number;
  /**
   * The path item value.
   */
  readonly value: unknown;
}
/**
 * Map path item interface.
 */
interface MapPathItem {
  /**
   * The path item type.
   */
  readonly type: 'map';
  /**
   * The path item origin.
   */
  readonly origin: 'key' | 'value';
  /**
   * The path item input.
   */
  readonly input: Map<unknown, unknown>;
  /**
   * The path item key.
   */
  readonly key: unknown;
  /**
   * The path item value.
   */
  readonly value: unknown;
}
/**
 * Object path item interface.
 */
interface ObjectPathItem {
  /**
   * The path item type.
   */
  readonly type: 'object';
  /**
   * The path item origin.
   */
  readonly origin: 'key' | 'value';
  /**
   * The path item input.
   */
  readonly input: Record<string, unknown>;
  /**
   * The path item key.
   */
  readonly key: string;
  /**
   * The path item value.
   */
  readonly value: unknown;
}
/**
 * Set path item interface.
 */
interface SetPathItem {
  /**
   * The path item type.
   */
  readonly type: 'set';
  /**
   * The path item origin.
   */
  readonly origin: 'value';
  /**
   * The path item input.
   */
  readonly input: Set<unknown>;
  /**
   * The path item key.
   */
  readonly key: null;
  /**
   * The path item key.
   */
  readonly value: unknown;
}
/**
 * Unknown path item interface.
 */
interface UnknownPathItem {
  /**
   * The path item type.
   */
  readonly type: 'unknown';
  /**
   * The path item origin.
   */
  readonly origin: 'key' | 'value';
  /**
   * The path item input.
   */
  readonly input: unknown;
  /**
   * The path item key.
   */
  readonly key: unknown;
  /**
   * The path item value.
   */
  readonly value: unknown;
}
/**
 * Issue path item type.
 */
type IssuePathItem = ArrayPathItem | MapPathItem | ObjectPathItem | SetPathItem | UnknownPathItem;
/**
 * Base issue interface.
 */
interface BaseIssue<TInput$1> extends Config<BaseIssue<TInput$1>> {
  /**
   * The issue kind.
   */
  readonly kind: 'schema' | 'validation' | 'transformation';
  /**
   * The issue type.
   */
  readonly type: string;
  /**
   * The raw input data.
   */
  readonly input: TInput$1;
  /**
   * The expected property.
   */
  readonly expected: string | null;
  /**
   * The received property.
   */
  readonly received: string;
  /**
   * The error message.
   */
  readonly message: string;
  /**
   * The input requirement.
   */
  readonly requirement?: unknown | undefined;
  /**
   * The issue path.
   */
  readonly path?: [IssuePathItem, ...IssuePathItem[]] | undefined;
  /**
   * The sub issues.
   */
  readonly issues?: [BaseIssue<TInput$1>, ...BaseIssue<TInput$1>[]] | undefined;
}
/**
 * Generic issue type.
 */

/**
 * Config interface.
 */
interface Config<TIssue extends BaseIssue<unknown>> {
  /**
   * The selected language.
   */
  readonly lang?: string | undefined;
  /**
   * The error message.
   */
  readonly message?: ErrorMessage<TIssue> | undefined;
  /**
   * Whether it should be aborted early.
   */
  readonly abortEarly?: boolean | undefined;
  /**
   * Whether a pipe should be aborted early.
   */
  readonly abortPipeEarly?: boolean | undefined;
}

/**
 * Pipe action type.
 */
type PipeAction<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> = BaseValidation<TInput$1, TOutput$1, TIssue> | BaseTransformation<TInput$1, TOutput$1, TIssue> | BaseMetadata<TInput$1>;
/**
 * Pipe action async type.
 */
type PipeActionAsync<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> = BaseValidationAsync<TInput$1, TOutput$1, TIssue> | BaseTransformationAsync<TInput$1, TOutput$1, TIssue>;
/**
 * Pipe item type.
 */
type PipeItem<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> = BaseSchema<TInput$1, TOutput$1, TIssue> | PipeAction<TInput$1, TOutput$1, TIssue>;
/**
 * Pipe item async type.
 */
type PipeItemAsync<TInput$1, TOutput$1, TIssue extends BaseIssue<unknown>> = BaseSchemaAsync<TInput$1, TOutput$1, TIssue> | PipeActionAsync<TInput$1, TOutput$1, TIssue>;
/**
 * Schema without pipe type.
 */

/**
 * Array issue interface.
 */
interface ArrayIssue extends BaseIssue<unknown> {
  /**
   * The issue kind.
   */
  readonly kind: 'schema';
  /**
   * The issue type.
   */
  readonly type: 'array';
  /**
   * The expected property.
   */
  readonly expected: 'Array';
}

/**
 * Array schema interface.
 */
interface ArraySchema<TItem$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, TMessage extends ErrorMessage<ArrayIssue> | undefined> extends BaseSchema<InferInput<TItem$1>[], InferOutput<TItem$1>[], ArrayIssue | InferIssue<TItem$1>> {
  /**
   * The schema type.
   */
  readonly type: 'array';
  /**
   * The schema reference.
   */
  readonly reference: typeof array;
  /**
   * The expected property.
   */
  readonly expects: 'Array';
  /**
   * The array item schema.
   */
  readonly item: TItem$1;
  /**
   * The error message.
   */
  readonly message: TMessage;
}
/**
 * Creates an array schema.
 *
 * @param item The item schema.
 *
 * @returns An array schema.
 */
declare function array<const TItem$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(item: TItem$1): ArraySchema<TItem$1, undefined>;
/**
 * Creates an array schema.
 *
 * @param item The item schema.
 * @param message The error message.
 *
 * @returns An array schema.
 */
declare function array<const TItem$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, const TMessage extends ErrorMessage<ArrayIssue> | undefined>(item: TItem$1, message: TMessage): ArraySchema<TItem$1, TMessage>;

/**
 * Array schema interface.
 */

/**
 * Boolean issue interface.
 */
interface BooleanIssue extends BaseIssue<unknown> {
  /**
   * The issue kind.
   */
  readonly kind: 'schema';
  /**
   * The issue type.
   */
  readonly type: 'boolean';
  /**
   * The expected property.
   */
  readonly expected: 'boolean';
}
/**
 * Boolean schema interface.
 */
interface BooleanSchema<TMessage extends ErrorMessage<BooleanIssue> | undefined> extends BaseSchema<boolean, boolean, BooleanIssue> {
  /**
   * The schema type.
   */
  readonly type: 'boolean';
  /**
   * The schema reference.
   */
  readonly reference: typeof boolean;
  /**
   * The expected property.
   */
  readonly expects: 'boolean';
  /**
   * The error message.
   */
  readonly message: TMessage;
}
/**
 * Creates a boolean schema.
 *
 * @returns A boolean schema.
 */
declare function boolean(): BooleanSchema<undefined>;
/**
 * Creates a boolean schema.
 *
 * @param message The error message.
 *
 * @returns A boolean schema.
 */
declare function boolean<const TMessage extends ErrorMessage<BooleanIssue> | undefined>(message: TMessage): BooleanSchema<TMessage>;

/**
 * Custom issue interface.
 */

/**
 * Exact optional schema interface.
 */
interface ExactOptionalSchema<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, TDefault extends Default<TWrapped$1, never>> extends BaseSchema<InferInput<TWrapped$1>, InferOutput<TWrapped$1>, InferIssue<TWrapped$1>> {
  /**
   * The schema type.
   */
  readonly type: 'exact_optional';
  /**
   * The schema reference.
   */
  readonly reference: typeof exactOptional;
  /**
   * The expected property.
   */
  readonly expects: TWrapped$1['expects'];
  /**
   * The wrapped schema.
   */
  readonly wrapped: TWrapped$1;
  /**
   * The default value.
   */
  readonly default: TDefault;
}
/**
 * Creates an exact optional schema.
 *
 * @param wrapped The wrapped schema.
 *
 * @returns An exact optional schema.
 */
declare function exactOptional<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(wrapped: TWrapped$1): ExactOptionalSchema<TWrapped$1, undefined>;
/**
 * Creates an exact optional schema.
 *
 * @param wrapped The wrapped schema.
 * @param default_ The default value.
 *
 * @returns An exact optional schema.
 */
declare function exactOptional<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, const TDefault extends Default<TWrapped$1, never>>(wrapped: TWrapped$1, default_: TDefault): ExactOptionalSchema<TWrapped$1, TDefault>;

/**
 * Exact optional schema async interface.
 */
interface ExactOptionalSchemaAsync<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, TDefault extends DefaultAsync<TWrapped$1, never>> extends BaseSchemaAsync<InferInput<TWrapped$1>, InferOutput<TWrapped$1>, InferIssue<TWrapped$1>> {
  /**
   * The schema type.
   */
  readonly type: 'exact_optional';
  /**
   * The schema reference.
   */
  readonly reference: typeof exactOptional | typeof exactOptionalAsync;
  /**
   * The expected property.
   */
  readonly expects: TWrapped$1['expects'];
  /**
   * The wrapped schema.
   */
  readonly wrapped: TWrapped$1;
  /**
   * The default value.
   */
  readonly default: TDefault;
}
/**
 * Creates an exact optional schema.
 *
 * @param wrapped The wrapped schema.
 *
 * @returns An exact optional schema.
 */
declare function exactOptionalAsync<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>>(wrapped: TWrapped$1): ExactOptionalSchemaAsync<TWrapped$1, undefined>;
/**
 * Creates an exact optional schema.
 *
 * @param wrapped The wrapped schema.
 * @param default_ The default value.
 *
 * @returns An exact optional schema.
 */
declare function exactOptionalAsync<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, const TDefault extends DefaultAsync<TWrapped$1, never>>(wrapped: TWrapped$1, default_: TDefault): ExactOptionalSchemaAsync<TWrapped$1, TDefault>;

/**
 * File issue interface.
 */

/**
 * Union issue interface.
 */
interface UnionIssue<TSubIssue extends BaseIssue<unknown>> extends BaseIssue<unknown> {
  /**
   * The issue kind.
   */
  readonly kind: 'schema';
  /**
   * The issue type.
   */
  readonly type: 'union';
  /**
   * The expected property.
   */
  readonly expected: string;
  /**
   * The sub issues.
   */
  readonly issues?: [TSubIssue, ...TSubIssue[]];
}

/**
 * Union options type.
 */
type UnionOptions = MaybeReadonly<BaseSchema<unknown, unknown, BaseIssue<unknown>>[]>;
/**
 * Union schema interface.
 */
interface UnionSchema<TOptions$1 extends UnionOptions, TMessage extends ErrorMessage<UnionIssue<InferIssue<TOptions$1[number]>>> | undefined> extends BaseSchema<InferInput<TOptions$1[number]>, InferOutput<TOptions$1[number]>, UnionIssue<InferIssue<TOptions$1[number]>> | InferIssue<TOptions$1[number]>> {
  /**
   * The schema type.
   */
  readonly type: 'union';
  /**
   * The schema reference.
   */
  readonly reference: typeof union;
  /**
   * The union options.
   */
  readonly options: TOptions$1;
  /**
   * The error message.
   */
  readonly message: TMessage;
}
/**
 * Creates an union schema.
 *
 * @param options The union options.
 *
 * @returns An union schema.
 */
declare function union<const TOptions$1 extends UnionOptions>(options: TOptions$1): UnionSchema<TOptions$1, undefined>;
/**
 * Creates an union schema.
 *
 * @param options The union options.
 * @param message The error message.
 *
 * @returns An union schema.
 */
declare function union<const TOptions$1 extends UnionOptions, const TMessage extends ErrorMessage<UnionIssue<InferIssue<TOptions$1[number]>>> | undefined>(options: TOptions$1, message: TMessage): UnionSchema<TOptions$1, TMessage>;

/**
 * Union options async type.
 */

/**
 * Infer nullish output type.
 */
type InferNullishOutput<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, TDefault extends DefaultAsync<TWrapped$1, null | undefined>> = undefined extends TDefault ? InferOutput<TWrapped$1> | null | undefined : InferOutput<TWrapped$1> | Extract<DefaultValue<TDefault>, null | undefined>;

/**
 * Nullish schema interface.
 */
interface NullishSchema<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, TDefault extends Default<TWrapped$1, null | undefined>> extends BaseSchema<InferInput<TWrapped$1> | null | undefined, InferNullishOutput<TWrapped$1, TDefault>, InferIssue<TWrapped$1>> {
  /**
   * The schema type.
   */
  readonly type: 'nullish';
  /**
   * The schema reference.
   */
  readonly reference: typeof nullish;
  /**
   * The expected property.
   */
  readonly expects: `(${TWrapped$1['expects']} | null | undefined)`;
  /**
   * The wrapped schema.
   */
  readonly wrapped: TWrapped$1;
  /**
   * The default value.
   */
  readonly default: TDefault;
}
/**
 * Creates a nullish schema.
 *
 * @param wrapped The wrapped schema.
 *
 * @returns A nullish schema.
 */
declare function nullish<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(wrapped: TWrapped$1): NullishSchema<TWrapped$1, undefined>;
/**
 * Creates a nullish schema.
 *
 * @param wrapped The wrapped schema.
 * @param default_ The default value.
 *
 * @returns A nullish schema.
 */
declare function nullish<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, const TDefault extends Default<TWrapped$1, null | undefined>>(wrapped: TWrapped$1, default_: TDefault): NullishSchema<TWrapped$1, TDefault>;

/**
 * Nullish schema async interface.
 */
interface NullishSchemaAsync<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, TDefault extends DefaultAsync<TWrapped$1, null | undefined>> extends BaseSchemaAsync<InferInput<TWrapped$1> | null | undefined, InferNullishOutput<TWrapped$1, TDefault>, InferIssue<TWrapped$1>> {
  /**
   * The schema type.
   */
  readonly type: 'nullish';
  /**
   * The schema reference.
   */
  readonly reference: typeof nullish | typeof nullishAsync;
  /**
   * The expected property.
   */
  readonly expects: `(${TWrapped$1['expects']} | null | undefined)`;
  /**
   * The wrapped schema.
   */
  readonly wrapped: TWrapped$1;
  /**
   * The default value.
   */
  readonly default: TDefault;
}
/**
 * Creates a nullish schema.
 *
 * @param wrapped The wrapped schema.
 *
 * @returns A nullish schema.
 */
declare function nullishAsync<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>>(wrapped: TWrapped$1): NullishSchemaAsync<TWrapped$1, undefined>;
/**
 * Creates a nullish schema.
 *
 * @param wrapped The wrapped schema.
 * @param default_ The default value.
 *
 * @returns A nullish schema.
 */
declare function nullishAsync<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, const TDefault extends DefaultAsync<TWrapped$1, null | undefined>>(wrapped: TWrapped$1, default_: TDefault): NullishSchemaAsync<TWrapped$1, TDefault>;

/**
 * Number issue interface.
 */
interface NumberIssue extends BaseIssue<unknown> {
  /**
   * The issue kind.
   */
  readonly kind: 'schema';
  /**
   * The issue type.
   */
  readonly type: 'number';
  /**
   * The expected property.
   */
  readonly expected: 'number';
}
/**
 * Number schema interface.
 */
interface NumberSchema<TMessage extends ErrorMessage<NumberIssue> | undefined> extends BaseSchema<number, number, NumberIssue> {
  /**
   * The schema type.
   */
  readonly type: 'number';
  /**
   * The schema reference.
   */
  readonly reference: typeof number;
  /**
   * The expected property.
   */
  readonly expects: 'number';
  /**
   * The error message.
   */
  readonly message: TMessage;
}
/**
 * Creates a number schema.
 *
 * @returns A number schema.
 */
declare function number(): NumberSchema<undefined>;
/**
 * Creates a number schema.
 *
 * @param message The error message.
 *
 * @returns A number schema.
 */
declare function number<const TMessage extends ErrorMessage<NumberIssue> | undefined>(message: TMessage): NumberSchema<TMessage>;

/**
 * Object issue interface.
 */
interface ObjectIssue extends BaseIssue<unknown> {
  /**
   * The issue kind.
   */
  readonly kind: 'schema';
  /**
   * The issue type.
   */
  readonly type: 'object';
  /**
   * The expected property.
   */
  readonly expected: 'Object' | `"${string}"`;
}

/**
 * Object schema interface.
 */
interface ObjectSchema<TEntries$1 extends ObjectEntries, TMessage extends ErrorMessage<ObjectIssue> | undefined> extends BaseSchema<InferObjectInput<TEntries$1>, InferObjectOutput<TEntries$1>, ObjectIssue | InferObjectIssue<TEntries$1>> {
  /**
   * The schema type.
   */
  readonly type: 'object';
  /**
   * The schema reference.
   */
  readonly reference: typeof object;
  /**
   * The expected property.
   */
  readonly expects: 'Object';
  /**
   * The entries schema.
   */
  readonly entries: TEntries$1;
  /**
   * The error message.
   */
  readonly message: TMessage;
}
/**
 * Creates an object schema.
 *
 * Hint: This schema removes unknown entries. The output will only include the
 * entries you specify. To include unknown entries, use `looseObject`. To
 * return an issue for unknown entries, use `strictObject`. To include and
 * validate unknown entries, use `objectWithRest`.
 *
 * @param entries The entries schema.
 *
 * @returns An object schema.
 */
declare function object<const TEntries$1 extends ObjectEntries>(entries: TEntries$1): ObjectSchema<TEntries$1, undefined>;
/**
 * Creates an object schema.
 *
 * Hint: This schema removes unknown entries. The output will only include the
 * entries you specify. To include unknown entries, use `looseObject`. To
 * return an issue for unknown entries, use `strictObject`. To include and
 * validate unknown entries, use `objectWithRest`.
 *
 * @param entries The entries schema.
 * @param message The error message.
 *
 * @returns An object schema.
 */
declare function object<const TEntries$1 extends ObjectEntries, const TMessage extends ErrorMessage<ObjectIssue> | undefined>(entries: TEntries$1, message: TMessage): ObjectSchema<TEntries$1, TMessage>;

/**
 * Object schema async interface.
 */

/**
 * Infer optional output type.
 */
type InferOptionalOutput<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, TDefault extends DefaultAsync<TWrapped$1, undefined>> = undefined extends TDefault ? InferOutput<TWrapped$1> | undefined : InferOutput<TWrapped$1> | Extract<DefaultValue<TDefault>, undefined>;

/**
 * Optional schema interface.
 */
interface OptionalSchema<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, TDefault extends Default<TWrapped$1, undefined>> extends BaseSchema<InferInput<TWrapped$1> | undefined, InferOptionalOutput<TWrapped$1, TDefault>, InferIssue<TWrapped$1>> {
  /**
   * The schema type.
   */
  readonly type: 'optional';
  /**
   * The schema reference.
   */
  readonly reference: typeof optional;
  /**
   * The expected property.
   */
  readonly expects: `(${TWrapped$1['expects']} | undefined)`;
  /**
   * The wrapped schema.
   */
  readonly wrapped: TWrapped$1;
  /**
   * The default value.
   */
  readonly default: TDefault;
}
/**
 * Creates an optional schema.
 *
 * @param wrapped The wrapped schema.
 *
 * @returns An optional schema.
 */
declare function optional<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(wrapped: TWrapped$1): OptionalSchema<TWrapped$1, undefined>;
/**
 * Creates an optional schema.
 *
 * @param wrapped The wrapped schema.
 * @param default_ The default value.
 *
 * @returns An optional schema.
 */
declare function optional<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, const TDefault extends Default<TWrapped$1, undefined>>(wrapped: TWrapped$1, default_: TDefault): OptionalSchema<TWrapped$1, TDefault>;

/**
 * Optional schema async interface.
 */
interface OptionalSchemaAsync<TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, TDefault extends DefaultAsync<TWrapped$1, undefined>> extends BaseSchemaAsync<InferInput<TWrapped$1> | undefined, InferOptionalOutput<TWrapped$1, TDefault>, InferIssue<TWrapped$1>> {
  /**
   * The schema type.
   */
  readonly type: 'optional';
  /**
   * The schema reference.
   */
  readonly reference: typeof optional | typeof optionalAsync;
  /**
   * The expected property.
   */
  readonly expects: `(${TWrapped$1['expects']} | undefined)`;
  /**
   * The wrapped schema.
   */
  readonly wrapped: TWrapped$1;
  /**
   * The default value.
   */
  readonly default: TDefault;
}
/**
 * Creates an optional schema.
 *
 * @param wrapped The wrapped schema.
 *
 * @returns An optional schema.
 */
declare function optionalAsync<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>>(wrapped: TWrapped$1): OptionalSchemaAsync<TWrapped$1, undefined>;
/**
 * Creates an optional schema.
 *
 * @param wrapped The wrapped schema.
 * @param default_ The default value.
 *
 * @returns An optional schema.
 */
declare function optionalAsync<const TWrapped$1 extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>, const TDefault extends DefaultAsync<TWrapped$1, undefined>>(wrapped: TWrapped$1, default_: TDefault): OptionalSchemaAsync<TWrapped$1, TDefault>;

/**
 * Picklist options type.
 */

/**
 * String issue interface.
 */
interface StringIssue extends BaseIssue<unknown> {
  /**
   * The issue kind.
   */
  readonly kind: 'schema';
  /**
   * The issue type.
   */
  readonly type: 'string';
  /**
   * The expected property.
   */
  readonly expected: 'string';
}
/**
 * String schema interface.
 */
interface StringSchema<TMessage extends ErrorMessage<StringIssue> | undefined> extends BaseSchema<string, string, StringIssue> {
  /**
   * The schema type.
   */
  readonly type: 'string';
  /**
   * The schema reference.
   */
  readonly reference: typeof string;
  /**
   * The expected property.
   */
  readonly expects: 'string';
  /**
   * The error message.
   */
  readonly message: TMessage;
}
/**
 * Creates a string schema.
 *
 * @returns A string schema.
 */
declare function string(): StringSchema<undefined>;
/**
 * Creates a string schema.
 *
 * @param message The error message.
 *
 * @returns A string schema.
 */
declare function string<const TMessage extends ErrorMessage<StringIssue> | undefined>(message: TMessage): StringSchema<TMessage>;

/**
 * Symbol issue interface.
 */

/**
 * Brand symbol.
 */
declare const BrandSymbol: unique symbol;
/**
 * Brand name type.
 */
type BrandName = string | number | symbol;
/**
 * Brand interface.
 */
interface Brand<TName extends BrandName> {
  [BrandSymbol]: { [TValue in TName]: TValue };
}
/**
 * Brand action interface.
 */
interface BrandAction<TInput$1, TName extends BrandName> extends BaseTransformation<TInput$1, TInput$1 & Brand<TName>, never> {
  /**
   * The action type.
   */
  readonly type: 'brand';
  /**
   * The action reference.
   */
  readonly reference: typeof brand;
  /**
   * The brand name.
   */
  readonly name: TName;
}
/**
 * Creates a brand transformation action.
 *
 * @param name The brand name.
 *
 * @returns A brand action.
 */
declare function brand<TInput$1, TName extends BrandName>(name: TName): BrandAction<TInput$1, TName>;

/**
 * Bytes issue interface.
 */

/**
 * Length input type.
 */
type LengthInput = string | ArrayLike<unknown>;
/**
 * Size input type.
 */

/**
 * Min length issue interface.
 */
interface MinLengthIssue<TInput$1 extends LengthInput, TRequirement extends number> extends BaseIssue<TInput$1> {
  /**
   * The issue kind.
   */
  readonly kind: 'validation';
  /**
   * The issue type.
   */
  readonly type: 'min_length';
  /**
   * The expected property.
   */
  readonly expected: `>=${TRequirement}`;
  /**
   * The received property.
   */
  readonly received: `${number}`;
  /**
   * The minimum length.
   */
  readonly requirement: TRequirement;
}
/**
 * Min length action interface.
 */
interface MinLengthAction<TInput$1 extends LengthInput, TRequirement extends number, TMessage extends ErrorMessage<MinLengthIssue<TInput$1, TRequirement>> | undefined> extends BaseValidation<TInput$1, TInput$1, MinLengthIssue<TInput$1, TRequirement>> {
  /**
   * The action type.
   */
  readonly type: 'min_length';
  /**
   * The action reference.
   */
  readonly reference: typeof minLength;
  /**
   * The expected property.
   */
  readonly expects: `>=${TRequirement}`;
  /**
   * The minimum length.
   */
  readonly requirement: TRequirement;
  /**
   * The error message.
   */
  readonly message: TMessage;
}
/**
 * Creates a min length validation action.
 *
 * @param requirement The minimum length.
 *
 * @returns A min length action.
 */
declare function minLength<TInput$1 extends LengthInput, const TRequirement extends number>(requirement: TRequirement): MinLengthAction<TInput$1, TRequirement, undefined>;
/**
 * Creates a min length validation action.
 *
 * @param requirement The minimum length.
 * @param message The error message.
 *
 * @returns A min length action.
 */
declare function minLength<TInput$1 extends LengthInput, const TRequirement extends number, const TMessage extends ErrorMessage<MinLengthIssue<TInput$1, TRequirement>> | undefined>(requirement: TRequirement, message: TMessage): MinLengthAction<TInput$1, TRequirement, TMessage>;

/**
 * Min size issue interface.
 */

/**
 * Readonly output type.
 */
type ReadonlyOutput<TInput$1> = TInput$1 extends Map<infer TKey, infer TValue> ? ReadonlyMap<TKey, TValue> : TInput$1 extends Set<infer TValue> ? ReadonlySet<TValue> : Readonly<TInput$1>;
/**
 * Readonly action interface.
 */
interface ReadonlyAction<TInput$1> extends BaseTransformation<TInput$1, ReadonlyOutput<TInput$1>, never> {
  /**
   * The action type.
   */
  readonly type: 'readonly';
  /**
   * The action reference.
   */
  readonly reference: typeof readonly;
}
/**
 * Creates a readonly transformation action.
 *
 * @returns A readonly action.
 */
declare function readonly<TInput$1>(): ReadonlyAction<TInput$1>;

/**
 * Array action type.
 */

/**
 * Regex issue interface.
 */
interface RegexIssue<TInput$1 extends string> extends BaseIssue<TInput$1> {
  /**
   * The issue kind.
   */
  readonly kind: 'validation';
  /**
   * The issue type.
   */
  readonly type: 'regex';
  /**
   * The expected input.
   */
  readonly expected: string;
  /**
   * The received input.
   */
  readonly received: `"${string}"`;
  /**
   * The regex pattern.
   */
  readonly requirement: RegExp;
}
/**
 * Regex action interface.
 */
interface RegexAction<TInput$1 extends string, TMessage extends ErrorMessage<RegexIssue<TInput$1>> | undefined> extends BaseValidation<TInput$1, TInput$1, RegexIssue<TInput$1>> {
  /**
   * The action type.
   */
  readonly type: 'regex';
  /**
   * The action reference.
   */
  readonly reference: typeof regex;
  /**
   * The expected property.
   */
  readonly expects: string;
  /**
   * The regex pattern.
   */
  readonly requirement: RegExp;
  /**
   * The error message.
   */
  readonly message: TMessage;
}
/**
 * Creates a [regex](https://en.wikipedia.org/wiki/Regular_expression) validation action.
 *
 * Hint: Be careful with the global flag `g` in your regex pattern, as it can lead to unexpected results. See [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test#using_test_on_a_regex_with_the_global_flag) for more information.
 *
 * @param requirement The regex pattern.
 *
 * @returns A regex action.
 */
declare function regex<TInput$1 extends string>(requirement: RegExp): RegexAction<TInput$1, undefined>;
/**
 * Creates a [regex](https://en.wikipedia.org/wiki/Regular_expression) validation action.
 *
 * Hint: Be careful with the global flag `g` in your regex pattern, as it can lead to unexpected results. See [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test#using_test_on_a_regex_with_the_global_flag) for more information.
 *
 * @param requirement The regex pattern.
 * @param message The error message.
 *
 * @returns A regex action.
 */
declare function regex<TInput$1 extends string, const TMessage extends ErrorMessage<RegexIssue<TInput$1>> | undefined>(requirement: RegExp, message: TMessage): RegexAction<TInput$1, TMessage>;

/**
 * Returns action type.
 */
//#endregion
//#region src/_types.d.ts
declare const monthlyDateSchema: SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Date must be in YYYY-MM format">, BrandAction<string, "MonthlyDate">]>;
declare const weeklyDateSchema: SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Date must be in YYYY-MM-DD format">, BrandAction<string, "WeeklyDate">]>;
type MonthlyDate = InferOutput<typeof monthlyDateSchema>;
type WeeklyDate = InferOutput<typeof weeklyDateSchema>;
type Bucket = MonthlyDate | WeeklyDate;
/**
 * Available cost calculation modes
 * - auto: Use pre-calculated costs when available, otherwise calculate from tokens
 * - calculate: Always calculate costs from token counts using model pricing
 * - display: Always use pre-calculated costs, show 0 for missing costs
 */
declare const CostModes: readonly ["auto", "calculate", "display"];
/**
 * Union type for cost calculation modes
 */
type CostMode = TupleToUnion<typeof CostModes>;
/**
 * Available sort orders for data presentation
 */
declare const SortOrders: readonly ["desc", "asc"];
/**
 * Union type for sort order options
 */
type SortOrder = TupleToUnion<typeof SortOrders>;
//#endregion
//#region src/_pricing-fetcher.d.ts
declare class PricingFetcher extends LiteLLMPricingFetcher {
  constructor(offline?: boolean);
}
//#endregion
//#region src/data-loader.d.ts
/**
 * Get Claude data directories to search for usage data
 * When CLAUDE_CONFIG_DIR is set: uses only those paths
 * When not set: uses default paths (~/.config/claude and ~/.claude)
 * @returns Array of valid Claude data directory paths
 */
declare function getClaudePaths(): string[];
/**
 * Extract project name from Claude JSONL file path
 * @param jsonlPath - Absolute path to JSONL file
 * @returns Project name extracted from path, or "unknown" if malformed
 */
declare function extractProjectFromPath(jsonlPath: string): string;
/**
 * Valibot schema for validating Claude usage data from JSONL files
 */
declare const usageDataSchema: ObjectSchema<{
  readonly cwd: OptionalSchema<StringSchema<undefined>, undefined>;
  readonly sessionId: OptionalSchema<SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Session ID cannot be empty">, BrandAction<string, "SessionId">]>, undefined>;
  readonly timestamp: SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Invalid ISO timestamp">, BrandAction<string, "ISOTimestamp">]>;
  readonly version: OptionalSchema<SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Invalid version format">, BrandAction<string, "Version">]>, undefined>;
  readonly message: ObjectSchema<{
    readonly usage: ObjectSchema<{
      readonly input_tokens: NumberSchema<undefined>;
      readonly output_tokens: NumberSchema<undefined>;
      readonly cache_creation_input_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
      readonly cache_read_input_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
    }, undefined>;
    readonly model: OptionalSchema<SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>, undefined>;
    readonly id: OptionalSchema<SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Message ID cannot be empty">, BrandAction<string, "MessageId">]>, undefined>;
    readonly content: OptionalSchema<ArraySchema<ObjectSchema<{
      readonly text: OptionalSchema<StringSchema<undefined>, undefined>;
    }, undefined>, undefined>, undefined>;
  }, undefined>;
  readonly costUSD: OptionalSchema<NumberSchema<undefined>, undefined>;
  readonly requestId: OptionalSchema<SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Request ID cannot be empty">, BrandAction<string, "RequestId">]>, undefined>;
  readonly isApiErrorMessage: OptionalSchema<BooleanSchema<undefined>, undefined>;
}, undefined>;
/**
 * Valibot schema for transcript usage data from Claude messages
 */
declare const transcriptUsageSchema: ObjectSchema<{
  readonly input_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
  readonly cache_creation_input_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
  readonly cache_read_input_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
  readonly output_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
}, undefined>;
/**
 * Valibot schema for transcript message data
 */
declare const transcriptMessageSchema: ObjectSchema<{
  readonly type: OptionalSchema<StringSchema<undefined>, undefined>;
  readonly message: OptionalSchema<ObjectSchema<{
    readonly usage: OptionalSchema<ObjectSchema<{
      readonly input_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
      readonly cache_creation_input_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
      readonly cache_read_input_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
      readonly output_tokens: OptionalSchema<NumberSchema<undefined>, undefined>;
    }, undefined>, undefined>;
  }, undefined>, undefined>;
}, undefined>;
/**
 * Type definition for Claude usage data entries from JSONL files
 */
type UsageData = InferOutput<typeof usageDataSchema>;
/**
 * Valibot schema for model-specific usage breakdown data
 */
declare const modelBreakdownSchema: ObjectSchema<{
  readonly modelName: SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>;
  readonly inputTokens: NumberSchema<undefined>;
  readonly outputTokens: NumberSchema<undefined>;
  readonly cacheCreationTokens: NumberSchema<undefined>;
  readonly cacheReadTokens: NumberSchema<undefined>;
  readonly cost: NumberSchema<undefined>;
}, undefined>;
/**
 * Type definition for model-specific usage breakdown
 */
type ModelBreakdown = InferOutput<typeof modelBreakdownSchema>;
/**
 * Valibot schema for daily usage aggregation data
 */
declare const dailyUsageSchema: ObjectSchema<{
  readonly date: SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Date must be in YYYY-MM-DD format">, BrandAction<string, "DailyDate">]>;
  readonly inputTokens: NumberSchema<undefined>;
  readonly outputTokens: NumberSchema<undefined>;
  readonly cacheCreationTokens: NumberSchema<undefined>;
  readonly cacheReadTokens: NumberSchema<undefined>;
  readonly totalCost: NumberSchema<undefined>;
  readonly modelsUsed: ArraySchema<SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>, undefined>;
  readonly modelBreakdowns: ArraySchema<ObjectSchema<{
    readonly modelName: SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>;
    readonly inputTokens: NumberSchema<undefined>;
    readonly outputTokens: NumberSchema<undefined>;
    readonly cacheCreationTokens: NumberSchema<undefined>;
    readonly cacheReadTokens: NumberSchema<undefined>;
    readonly cost: NumberSchema<undefined>;
  }, undefined>, undefined>;
  readonly project: OptionalSchema<StringSchema<undefined>, undefined>;
}, undefined>;
/**
 * Type definition for daily usage aggregation
 */
type DailyUsage = InferOutput<typeof dailyUsageSchema>;
/**
 * Valibot schema for session-based usage aggregation data
 */
declare const sessionUsageSchema: ObjectSchema<{
  readonly sessionId: SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Session ID cannot be empty">, BrandAction<string, "SessionId">]>;
  readonly projectPath: SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Project path cannot be empty">, BrandAction<string, "ProjectPath">]>;
  readonly inputTokens: NumberSchema<undefined>;
  readonly outputTokens: NumberSchema<undefined>;
  readonly cacheCreationTokens: NumberSchema<undefined>;
  readonly cacheReadTokens: NumberSchema<undefined>;
  readonly totalCost: NumberSchema<undefined>;
  readonly lastActivity: SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Date must be in YYYY-MM-DD format">, BrandAction<string, "ActivityDate">]>;
  readonly versions: ArraySchema<SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Invalid version format">, BrandAction<string, "Version">]>, undefined>;
  readonly modelsUsed: ArraySchema<SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>, undefined>;
  readonly modelBreakdowns: ArraySchema<ObjectSchema<{
    readonly modelName: SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>;
    readonly inputTokens: NumberSchema<undefined>;
    readonly outputTokens: NumberSchema<undefined>;
    readonly cacheCreationTokens: NumberSchema<undefined>;
    readonly cacheReadTokens: NumberSchema<undefined>;
    readonly cost: NumberSchema<undefined>;
  }, undefined>, undefined>;
}, undefined>;
/**
 * Type definition for session-based usage aggregation
 */
type SessionUsage = InferOutput<typeof sessionUsageSchema>;
/**
 * Valibot schema for monthly usage aggregation data
 */
declare const monthlyUsageSchema: ObjectSchema<{
  readonly month: SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Date must be in YYYY-MM format">, BrandAction<string, "MonthlyDate">]>;
  readonly inputTokens: NumberSchema<undefined>;
  readonly outputTokens: NumberSchema<undefined>;
  readonly cacheCreationTokens: NumberSchema<undefined>;
  readonly cacheReadTokens: NumberSchema<undefined>;
  readonly totalCost: NumberSchema<undefined>;
  readonly modelsUsed: ArraySchema<SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>, undefined>;
  readonly modelBreakdowns: ArraySchema<ObjectSchema<{
    readonly modelName: SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>;
    readonly inputTokens: NumberSchema<undefined>;
    readonly outputTokens: NumberSchema<undefined>;
    readonly cacheCreationTokens: NumberSchema<undefined>;
    readonly cacheReadTokens: NumberSchema<undefined>;
    readonly cost: NumberSchema<undefined>;
  }, undefined>, undefined>;
  readonly project: OptionalSchema<StringSchema<undefined>, undefined>;
}, undefined>;
/**
 * Type definition for monthly usage aggregation
 */
type MonthlyUsage = InferOutput<typeof monthlyUsageSchema>;
/**
 * Valibot schema for weekly usage aggregation data
 */
declare const weeklyUsageSchema: ObjectSchema<{
  readonly week: SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Date must be in YYYY-MM-DD format">, BrandAction<string, "WeeklyDate">]>;
  readonly inputTokens: NumberSchema<undefined>;
  readonly outputTokens: NumberSchema<undefined>;
  readonly cacheCreationTokens: NumberSchema<undefined>;
  readonly cacheReadTokens: NumberSchema<undefined>;
  readonly totalCost: NumberSchema<undefined>;
  readonly modelsUsed: ArraySchema<SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>, undefined>;
  readonly modelBreakdowns: ArraySchema<ObjectSchema<{
    readonly modelName: SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>;
    readonly inputTokens: NumberSchema<undefined>;
    readonly outputTokens: NumberSchema<undefined>;
    readonly cacheCreationTokens: NumberSchema<undefined>;
    readonly cacheReadTokens: NumberSchema<undefined>;
    readonly cost: NumberSchema<undefined>;
  }, undefined>, undefined>;
  readonly project: OptionalSchema<StringSchema<undefined>, undefined>;
}, undefined>;
/**
 * Type definition for weekly usage aggregation
 */
type WeeklyUsage = InferOutput<typeof weeklyUsageSchema>;
/**
 * Valibot schema for bucket usage aggregation data
 */
declare const bucketUsageSchema: ObjectSchema<{
  readonly bucket: UnionSchema<[SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Date must be in YYYY-MM-DD format">, BrandAction<string, "WeeklyDate">]>, SchemaWithPipe<readonly [StringSchema<undefined>, RegexAction<string, "Date must be in YYYY-MM format">, BrandAction<string, "MonthlyDate">]>], undefined>;
  readonly inputTokens: NumberSchema<undefined>;
  readonly outputTokens: NumberSchema<undefined>;
  readonly cacheCreationTokens: NumberSchema<undefined>;
  readonly cacheReadTokens: NumberSchema<undefined>;
  readonly totalCost: NumberSchema<undefined>;
  readonly modelsUsed: ArraySchema<SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>, undefined>;
  readonly modelBreakdowns: ArraySchema<ObjectSchema<{
    readonly modelName: SchemaWithPipe<readonly [StringSchema<undefined>, MinLengthAction<string, 1, "Model name cannot be empty">, BrandAction<string, "ModelName">]>;
    readonly inputTokens: NumberSchema<undefined>;
    readonly outputTokens: NumberSchema<undefined>;
    readonly cacheCreationTokens: NumberSchema<undefined>;
    readonly cacheReadTokens: NumberSchema<undefined>;
    readonly cost: NumberSchema<undefined>;
  }, undefined>, undefined>;
  readonly project: OptionalSchema<StringSchema<undefined>, undefined>;
}, undefined>;
/**
 * Type definition for bucket usage aggregation
 */
type BucketUsage = InferOutput<typeof bucketUsageSchema>;
/**
 * Create a unique identifier for deduplication using message ID and request ID
 */
declare function createUniqueHash(data: UsageData): string | null;
/**
 * Extract the earliest timestamp from a JSONL file
 * Scans through the file until it finds a valid timestamp
 * Uses streaming to handle large files without loading entire content into memory
 */
declare function getEarliestTimestamp(filePath: string): Promise<Date | null>;
/**
 * Sort files by their earliest timestamp
 * Files without valid timestamps are placed at the end
 */
declare function sortFilesByTimestamp(files: string[]): Promise<string[]>;
/**
 * Calculates cost for a single usage data entry based on the specified cost calculation mode
 * @param data - Usage data entry
 * @param mode - Cost calculation mode (auto, calculate, or display)
 * @param fetcher - Pricing fetcher instance for calculating costs from tokens
 * @returns Calculated cost in USD
 */
declare function calculateCostForEntry(data: UsageData, mode: CostMode, fetcher: PricingFetcher): Promise<number>;
/**
 * Get Claude Code usage limit expiration date
 * @param data - Usage data entry
 * @returns Usage limit expiration date
 */
declare function getUsageLimitResetTime(data: UsageData): Date | null;
/**
 * Result of glob operation with base directory information
 */
type GlobResult = {
  file: string;
  baseDir: string;
};
/**
 * Glob files from multiple Claude paths in parallel
 * @param claudePaths - Array of Claude base paths
 * @returns Array of file paths with their base directories
 */
declare function globUsageFiles(claudePaths: string[]): Promise<GlobResult[]>;
/**
 * Date range filter for limiting usage data by date
 */
type DateFilter = {
  since?: string;
  until?: string;
};
/**
 * Configuration options for loading usage data
 */
type LoadOptions = {
  claudePath?: string;
  mode?: CostMode;
  order?: SortOrder;
  offline?: boolean;
  sessionDurationHours?: number;
  groupByProject?: boolean;
  project?: string;
  startOfWeek?: WeekDay;
  timezone?: string;
  locale?: string;
} & DateFilter;
/**
 * Loads and aggregates Claude usage data by day
 * Processes all JSONL files in the Claude projects directory and groups usage by date
 * @param options - Optional configuration for loading and filtering data
 * @returns Array of daily usage summaries sorted by date
 */
declare function loadDailyUsageData(options?: LoadOptions): Promise<DailyUsage[]>;
/**
 * Loads and aggregates Claude usage data by session
 * Groups usage data by project path and session ID based on file structure
 * @param options - Optional configuration for loading and filtering data
 * @returns Array of session usage summaries sorted by last activity
 */
declare function loadSessionData(options?: LoadOptions): Promise<SessionUsage[]>;
/**
 * Loads and aggregates Claude usage data by month
 * Uses daily usage data as the source and groups by month
 * @param options - Optional configuration for loading and filtering data
 * @returns Array of monthly usage summaries sorted by month
 */
declare function loadMonthlyUsageData(options?: LoadOptions): Promise<MonthlyUsage[]>;
declare function loadWeeklyUsageData(options?: LoadOptions): Promise<WeeklyUsage[]>;
/**
 * Load usage data for a specific session by sessionId
 * Searches for a JSONL file named {sessionId}.jsonl in all Claude project directories
 * @param sessionId - The session ID to load data for (matches the JSONL filename)
 * @param options - Options for loading data
 * @param options.mode - Cost calculation mode (auto, calculate, display)
 * @param options.offline - Whether to use offline pricing data
 * @returns Usage data for the specific session or null if not found
 */
declare function loadSessionUsageById(sessionId: string, options?: {
  mode?: CostMode;
  offline?: boolean;
}): Promise<{
  totalCost: number;
  entries: UsageData[];
} | null>;
declare function loadBucketUsageData(groupingFn: (data: DailyUsage) => Bucket, options?: LoadOptions): Promise<BucketUsage[]>;
/**
 * Calculate context tokens from transcript file using improved JSONL parsing
 * Based on the Python reference implementation for better accuracy
 * @param transcriptPath - Path to the transcript JSONL file
 * @returns Object with context tokens info or null if unavailable
 */
declare function calculateContextTokens(transcriptPath: string, modelId?: string, offline?: boolean): Promise<{
  inputTokens: number;
  percentage: number;
  contextLimit: number;
} | null>;
/**
 * Loads usage data and organizes it into session blocks (typically 5-hour billing periods)
 * Processes all usage data and groups it into time-based blocks for billing analysis
 * @param options - Optional configuration including session duration and filtering
 * @returns Array of session blocks with usage and cost information
 */
declare function loadSessionBlockData(options?: LoadOptions): Promise<SessionBlock[]>;
//#endregion
export { sessionUsageSchema as A, loadMonthlyUsageData as C, loadWeeklyUsageData as D, loadSessionUsageById as E, weeklyUsageSchema as F, transcriptMessageSchema as M, transcriptUsageSchema as N, modelBreakdownSchema as O, usageDataSchema as P, loadDailyUsageData as S, loadSessionData as T, getClaudePaths as _, LoadOptions as a, globUsageFiles as b, SessionUsage as c, bucketUsageSchema as d, calculateContextTokens as f, extractProjectFromPath as g, dailyUsageSchema as h, GlobResult as i, sortFilesByTimestamp as j, monthlyUsageSchema as k, UsageData as l, createUniqueHash as m, DailyUsage as n, ModelBreakdown as o, calculateCostForEntry as p, DateFilter as r, MonthlyUsage as s, BucketUsage as t, WeeklyUsage as u, getEarliestTimestamp as v, loadSessionBlockData as w, loadBucketUsageData as x, getUsageLimitResetTime as y };