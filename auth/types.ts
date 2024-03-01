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
