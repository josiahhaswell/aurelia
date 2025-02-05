// tslint:disable: no-any

export interface IPerformance {
  now(): number;
  mark(name: string): void;
  measure(name: string, start?: string, end?: string): void;
  getEntriesByName(name: string): IPerformanceEntry[];
  getEntriesByType(type: string): IPerformanceEntry[];
  clearMarks(name?: string): void;
  clearMeasures(name?: string): void;
}

export interface IPerformanceEntry {
  readonly duration: number;
  readonly entryType: string;
  readonly name: string;
  readonly startTime: number;
}

export type ITimerHandler = string | ((...args: unknown[]) => void);

declare namespace NodeJS {
  interface Process {
    // tslint:disable-next-line:no-any
    env?: any;
    uptime(): number;
    hrtime(): [number, number];
  }
}

export interface IStorage {
  readonly length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
  // tslint:disable-next-line:no-any
  [name: string]: any;
}

export interface IWindowOrWorkerGlobalScope {
  process?: NodeJS.Process;
  readonly performance: IPerformance;
  readonly localStorage?: IStorage;

  clearInterval(handle?: number): void;
  clearTimeout(handle?: number): void;
  // tslint:disable-next-line:no-any
  setInterval(handler: ITimerHandler, timeout?: number, ...args: any[]): number;
  // tslint:disable-next-line:no-any
  setTimeout(handler: ITimerHandler, timeout?: number, ...args: any[]): number;
  requestAnimationFrame(callback: IFrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
}

export interface IFrameRequestCallback {
  // tslint:disable-next-line:callable-types
  (time: number): void;
}

export interface ICallable {
  call(...args: unknown[]): unknown;
}

export interface IDisposable {
  dispose(): void;
}

export type Constructable<T = {}> = {
  // tslint:disable-next-line:callable-types
  new(...args: any[]): T;
};

export type Class<T, C = IIndexable> = C & {
  readonly prototype: T;
  new(...args: any[]): T;
};

// For resources, we want the 'constructor' property to remain on the instance type but we need to do that
// with a separate type from Class, since that one is used for other things where this constructor property
// would break the typings.
// So, in lack of a better name.. we probably need to clean this up, but this is how it works for now.
export type ConstructableClass<T, C = IIndexable> = C & {
  readonly prototype: T & { constructor: C };
  new(...args: any[]): T & { constructor: C };
};

export type InterfaceSymbol<T = any> = (target: Injectable<T>, property: string, index: number) => Injectable<T>;

export type InjectArray = ReadonlyArray<InterfaceSymbol | Constructable | string>;

export type Injectable<T = {}> = Constructable<T> & { inject?: (InterfaceSymbol<any> | Constructable)[] };

export type IIndexable<T extends object = object> = T & { [key: string]: unknown };

export type Writable<T> = {
  -readonly [K in keyof T]: T[K]
};

export type Diff<T extends string, U extends string> = ({[P in T]: P } & {[P in U]: never } & { [x: string]: never })[T];

export type Omit<T, K extends keyof T> = T extends {} ? Pick<T, Exclude<keyof T, K>> : never;

export type Overwrite<T1, T2> = Pick<T1, Exclude<keyof T1, keyof T2>> & T2;

export type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K
} extends {[_ in keyof T]: infer U} ? U : never;

export type RequiredKnownKeys<T> = {
  [K in keyof T]: {} extends Pick<T, K> ? never : K
} extends { [_ in keyof T]: infer U } ? ({} extends U ? never : U) : never;

export type OptionalKnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : {} extends Pick<T, K> ? K : never
} extends { [_ in keyof T]: infer U } ? ({} extends U ? never : U) : never;

export type ValuesOf<T> = T extends { [_ in keyof T]: infer U } ? U : never;

export type RequiredValuesOf<T> = T extends { [_ in keyof T]: infer U } ? U : never;

export type OptionalValuesOf<T> = T extends { [_ in keyof T]: infer U } ? U : never;

// https://github.com/Microsoft/TypeScript/issues/14829#issuecomment-322267089
export type NoInfer<T> = T & { [K in keyof T]: T[K] };

export type Purify<T extends string> = { [P in T]: T }[T];

export type Public<T> = { [P in keyof T]: T[P] };

// tslint:disable-next-line:no-any
export type Param0<Func> = Func extends (a: infer T, ...args: any[]) => any ? T : never;

// tslint:disable-next-line:no-any
export type Param1<Func> = Func extends (a: any, b: infer T, ...args: any[]) => any ? T : never;

// tslint:disable-next-line:no-any
export type Param2<Func> = Func extends (a: any, b: any, c: infer T, ...args: any[]) => any
  ? T
  : never;

// tslint:disable-next-line:no-any
export type Param3<Func> = Func extends (a: any, b: any, c: any, d: infer T, ...args: any[]) => any
  ? T
  : never;

// https://gist.github.com/staltz/368866ea6b8a167fbdac58cddf79c1bf
export type Pick2<T, K1 extends keyof T, K2 extends keyof T[K1]> = {
  [P1 in K1]: { [P2 in K2]: (T[K1])[P2] }
};

// https://gist.github.com/staltz/368866ea6b8a167fbdac58cddf79c1bf=
export type Pick3<T, K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2]> = {
  [P1 in K1]: { [P2 in K2]: { [P3 in K3]: ((T[K1])[K2])[P3] } }
};

export type Primitive = undefined | null | number | boolean | string | symbol | bigint;

// https://github.com/palantir/tslint/issues/4235
// tslint:disable:no-shadowed-variable
export type Unwrap<T> =
    T extends (infer U)[] ? U :
    T extends (...args: unknown[]) => infer U ? U :
    T extends Promise<infer U> ? U :
    T;
// tslint:enable:no-shadowed-variable

export type StrictPrimitive = string | number | boolean | null | undefined;

export type IfEquals<X, Y, A=X, B=never> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? A : B;

export type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T];

export type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T];
