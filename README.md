# `unrested`

A minimal wrapper around the fetch API using JS proxies that simplifies making
HTTP requests for deno.

This module was extracted from
[`netzo/client-api`](https://github.com/netzo/netzo/blob/main/lib/integrations/create-api)
without `oauth2` authorization, to make it more modular.

It exports 3 useful utility functions from
`https://deno.land/x/unrested/mod.ts`:

1. `createApi`: used to create an api client for the service you're using. A
   `baseUrl` parameter option is required.
1. `auth`: used to set authorization credentials of the api service you're
   using.
1. `paginate`: used for paginating between query results.

```ts
import { createApi } from "https://deno.land/x/unrested@0.0.2/mod.ts";

const api = await createApi({
  baseURL: "https://jsonplaceholder.typicode.com",
});

// GET {baseURL}/users (types optional)
const users = await api.users.get<User[]>();

// PATCH {baseURL}/users/12 (types optional)
const user = await api.users[12].patch<User>({ name: "John" });
```

## HTTP request methods

Call the appropriate method call to make a request:

- `.get()`
- `.post()`
- `.put()`
- `.delete()`
- `.patch()`

## Query parameters

For HTTP request methods supporting query parameters, add them to the method
call.

```ts
// GET {baseURL}/users?search=john
const result = await api.users.get({ search: "john" });
```

::: tip URL encoding Query parameters are automatically URL encoded using
`encodeURI`. You can pass the query parameters directly as an object. :::

## Path parameters

To include dynamic API path segments, for example `GET` request to `/users/12`,
you have two options:

```ts
// GET {baseURL}/users/12 (chain syntax):
const user = await api.users(12).get<UserResult>();
// GET {baseURL}/users/12 (bracket syntax):
const user = await api.users[12].get<UserResult>();
```

## Payload requests

For HTTP request methods supporting a payload, add it to the method call.

```ts
// POST request to {baseURL}/users
const result = await api.users.post({ name: "foo" });
```

## Request Options

You can add/overwrite client options on a method-level:

```ts
const result = await api.users.get({
  headers: { "content-type": "application/json" },
  onRequest: (request, options) => {
    request.url = request.url.replace("/v1", "/v2");
  },
  onError: (request, options, error) => {
    console.error(error);
  },
});
```

## Authorization

The following table gives an overview of the currently supported auth types for
the [supported specs](#supported-specs):

| **Auth Type**                | **Support** |
| ---------------------------- | :---------: |
| [No auth](#no-auth)          |     ✅      |
| [Basic auth](#basic-auth)    |     ✅      |
| [Bearer token](#bearer-auth) |     ✅      |
| [API key](#api-key)          |     ✅      |
| [OAuth2](#oauth2)            |     ⌛      |

### No auth

Requests will be sent without authorization by default. If your resource does
not require any authorization details you may go ahead and start using your
resource right away.

### Basic auth

**Basic auth** schema is a simple authentication method built into the HTTP
protocol. The client must provide a user name and password when sending HTTP
requests. For this, the request contains a header field in the form of
`Authorization: Basic <CREDENTIAL>`, where credential is the Base64 encoding of
username and password joined together by a single colon.

To use this auth type select `HTTP` and `basic` options, and fill-out the
following required fields:

- `username`
- `password`

### Bearer auth

**Bearer auth** (also referred to as **token authentication**) schema is a
simple HTTP authentication schema that uses security tokens (referred to as
**bearer tokens**). Bearer tokens are text strings that are included in the
request header in the form of `Authorization: Bearer <TOKEN>` and act as access
keys.

To use this auth type select `HTTP` and `bearer` options, and fill-out the
following required fields:

- `token`

### API key

**API keys** is a security schema that uses simple encrypted strings to identify
an application or project that is calling the API. API keys include a key-value
pair in the request headers or query parameters when sending requests to an API.
After selecting this security schema from the dropdown field, you must provide
the key-value pair before confirming to save your changes.

To use this auth type select `API Key`, select how to send the API key
(`header`, `query`, or `cookie`), and fill-out the following required fields:

- `name`
- `value`

::: warning Multiple API Keys Some APIs use security key pairs (API key and App
ID) for authentication. For the time being we do not support multiple API Keys
out of the box. :::

## Hooks

**Hooks are async interceptors to hook into lifecycle events of the HTTP Request
and Response.** Hooks can be configured both for the base and for Requests.
**Base hooks** run before the corresponding **Request hook** rather than
overwriting them. This allows adding additional functionality at the Request
level, while retaining base functionality common to all Requests.

There are four types of hooks:

- **`onRequest`:** runs **before** the `fetch` request is dispatched. Allows
  modifying `request` and `options`
- **`onRequestError`:** runs **if** the `fetch` request fails. Allows modifying
  `request`, `options` and `error`
- **`onResponse`:** runs **after** the `fetch` response returns (after
  `response.body` is parsed and set to `response._data`). Allows modifying
  `request`, `options` and `response`
- **`onResponseError`:** runs **if** the `fetch` response fails (when
  `response.ok` is not true). Allows modifying `request`, `options` and
  `response`
