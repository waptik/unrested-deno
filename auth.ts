import {
  getToken,
  type GoogleAuth,
} from "https://deno.land/x/googlejwtsa@v0.1.8/mod.ts";
import type { FetchContext } from "https://esm.sh/v135/ofetch@1.1.1";

export type AuthorizationNone = {
  type: "none";
};

export type AuthorizationBasic = {
  type: "basic";
  username?: string;
  password?: string;
  value?: string; // base64 encoded username:password
};

export type AuthorizationBearer = {
  type: "bearer";
  token: string;
};

export type AuthorizationApiKey = {
  type: "apiKey";
  in: "query" | "header"; // | "cookie";
  name: string;
  value: string;
};

// Requires first creating a service account key file in the Google Cloud Console
// https://console.cloud.google.com/apis/credentials/serviceaccountkey
export type AuthorizationGoogleJwtSa = {
  type: "googlejwtsa";
  // NOTE: expects a stringified JSON key file
  // like the result of JSON.stringify(keyFile)
  // or await Deno.readTextFile('./keyFile.json')
  googleServiceAccountCredentials: string;
  googleAuthOptions: {
    scope: string[];
    sub?: string;
  };
};

export type Authorization =
  | AuthorizationNone
  | AuthorizationBasic
  | AuthorizationBearer
  | AuthorizationApiKey
  | AuthorizationGoogleJwtSa;

/**
 * Auth hook to mutate context based on authorization.type
 *
 * @see https://gomakethings.com/using-oauth-with-fetch-in-vanilla-js/
 *
 * @param authorization {Authorization} - the authorization object containing the type its corresponding options
 * @param context {FetchContext} - the context object to mutate ({ request, options })
 */
export const auth = async (
  authorization: Authorization = { type: "none" },
  { request: _, options }: FetchContext,
) => {
  const query = {} as Record<string, string>;
  const headers = {} as Record<string, string>;

  if (authorization.type === "basic") {
    const { username, password, value } = authorization;
    const token = value ?? btoa(`${username}:${password}`);
    headers.Authorization = `Basic ${token}`;
  } else if (authorization.type === "bearer") {
    const { token } = authorization;
    headers.Authorization = `Bearer ${token}`;
  } else if (authorization.type === "apiKey") {
    const { in: In, name, value } = authorization;
    if (In === "query") query[name] = value;
    if (In === "header") headers[name] = value;
  } else if (authorization.type === "googlejwtsa") {
    const { googleServiceAccountCredentials, googleAuthOptions } =
      authorization;
    const { access_token }: GoogleAuth = await getToken(
      googleServiceAccountCredentials,
      googleAuthOptions,
    );
    headers.Authorization = `Bearer ${access_token}`;
  }

  options.query = { ...options.query, ...query };
  options.headers = { ...options.headers, ...headers };
};
