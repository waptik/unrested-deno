import {
  $fetch,
  FetchContext,
  type FetchOptions,
} from "https://esm.sh/v135/ofetch@1.1.1";
import {
  type QueryObject,
  resolveURL,
  withQuery,
} from "https://esm.sh/v135/ufo@1.2.0";

export type { FetchContext, FetchOptions };

export type ResponseMap = {
  blob: Blob;
  text: string;
  arrayBuffer: ArrayBuffer;
};

export type ResponseType = keyof ResponseMap | "json";
export type MappedType<R extends ResponseType, JsonType = unknown> = R extends
  keyof ResponseMap ? ResponseMap[R] : JsonType;

export type ApiMethodHandlerGET<Query = QueryObject> = <
  T = unknown,
  R extends ResponseType = "json",
>(
  query?: Query,
  options?: Omit<FetchOptions<R>, "baseURL" | "method">,
) => Promise<MappedType<R, T>>;

export type ApiMethodHandler<Data = never, Query = QueryObject> = <
  T = unknown,
  R extends ResponseType = "json",
>(
  data?: Data,
  query?: Query,
  options?: Omit<FetchOptions<R>, "baseURL" | "method">,
) => Promise<MappedType<R, T>>;

export type ApiClient = {
  [key: string]: ApiClient;
  (...segmentsOrIds: (string | number)[]): ApiClient;
} & {
  get: ApiMethodHandlerGET<FetchOptions["query"]>;
  post: ApiMethodHandler<FetchOptions["body"], FetchOptions["query"]>;
  put: ApiMethodHandler<FetchOptions["body"], FetchOptions["query"]>;
  patch: ApiMethodHandler<FetchOptions["body"], FetchOptions["query"]>;
  delete: ApiMethodHandler<FetchOptions["body"], FetchOptions["query"]>;
};

export function headersToObject(headers: HeadersInit = {}) {
  // SSR compatibility for `Headers` prototype
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return Object.fromEntries([...(headers as Headers).entries()]);
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

/**
 * Simple heuristic to check if a client is an API client
 * @param client {Record<string, unknown>} - the object to check
 * @returns {boolean} - true if the object is an API client
 */
export const isApiClient = (client: Record<string, unknown>) => {
  const METHODS = ["get", "post", "put", "patch", "delete"];
  return METHODS.some((method: string) => client[method]);
};

const payloadMethods: ReadonlyArray<string> = [
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

/**
 * Minimal, type-safe REST client using JS proxies
 */
export function createApi<R extends ResponseType = "json">(
  defaultOptions: Omit<FetchOptions<R>, "method"> = {},
): ApiClient {
  // Callable internal target required to use `apply` on it
  const internalTarget = (() => {}) as ApiClient;

  function p(url: string): ApiClient {
    return new Proxy(internalTarget, {
      get(_target, key: string) {
        const method = String(key).toUpperCase();

        if (key && !["GET", ...payloadMethods].includes(method)) {
          return p(resolveURL(url, String(key)));
        }

        const handlerGET: ApiMethodHandlerGET = <
          T = unknown,
          R extends ResponseType = "json",
        >(
          query?: QueryObject,
          options: FetchOptions<R> = {},
        ) => {
          if (query) url = withQuery(url, query);
          options = {
            ...defaultOptions,
            ...options,
            method,
            headers: {
              ...headersToObject(defaultOptions.headers),
              ...headersToObject(options.headers),
            },
            body: undefined, // GET disallows body so remove it
          } as FetchOptions<R>;

          return $fetch<T, R>(url, options);
        };

        const handler: ApiMethodHandler = <
          T = unknown,
          R extends ResponseType = "json",
        >(
          data?: RequestInit["body"] | Record<string, unknown>,
          query?: QueryObject,
          options: FetchOptions<R> = {},
        ) => {
          if (query) url = withQuery(url, query);
          options = {
            ...defaultOptions,
            ...options,
            method,
            headers: {
              ...headersToObject(defaultOptions.headers),
              ...headersToObject(options.headers),
            },
            body: data,
          } as FetchOptions<R>;

          return $fetch<T, R>(url, options);
        };

        return payloadMethods.includes(method) ? handler : handlerGET;
      },
      apply(_target, _thisArg, args: (string | number)[] = []) {
        return p(resolveURL(url, ...args.map((i) => `${i}`)));
      },
    });
  }

  return p(defaultOptions.baseURL || "/");
}
