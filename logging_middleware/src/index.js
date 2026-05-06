const DEFAULT_BASE_URL = "http://20.207.122.201/evaluation-service";

const VALID_STACKS = new Set(["backend", "frontend"]);
const VALID_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const BACKEND_PACKAGES = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
]);
const FRONTEND_PACKAGES = new Set([
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
]);
const SHARED_PACKAGES = new Set(["auth", "config", "middleware", "utils"]);
const VALID_PACKAGES = new Set([
  ...BACKEND_PACKAGES,
  ...FRONTEND_PACKAGES,
  ...SHARED_PACKAGES,
]);

let cachedToken = null;
let tokenExpiresAt = 0;

function readEnv(key) {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

function getConfig(overrides = {}) {
  return {
    baseUrl: overrides.baseUrl || readEnv("EVALUATION_BASE_URL") || DEFAULT_BASE_URL,
    email: overrides.email || readEnv("EVALUATION_EMAIL"),
    name: overrides.name || readEnv("EVALUATION_NAME"),
    rollNo: overrides.rollNo || readEnv("EVALUATION_ROLL_NO"),
    accessCode: overrides.accessCode || readEnv("EVALUATION_ACCESS_CODE"),
    clientID: overrides.clientID || readEnv("EVALUATION_CLIENT_ID"),
    clientSecret: overrides.clientSecret || readEnv("EVALUATION_CLIENT_SECRET"),
    fetchImpl: overrides.fetchImpl || globalThis.fetch,
  };
}

function requireField(config, key) {
  if (!config[key]) {
    throw new Error(`Missing logging configuration: ${key}`);
  }
}

function validateLogInput(stack, level, packageName, message) {
  if (!VALID_STACKS.has(stack)) {
    throw new Error(`Invalid stack "${stack}". Expected backend or frontend.`);
  }
  if (!VALID_LEVELS.has(level)) {
    throw new Error(`Invalid level "${level}". Expected debug, info, warn, error, or fatal.`);
  }
  if (!VALID_PACKAGES.has(packageName)) {
    throw new Error(`Invalid package "${packageName}".`);
  }
  if (!message || typeof message !== "string") {
    throw new Error("Log message must be a non-empty string.");
  }
}

async function postJson(fetchImpl, url, body, token) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

async function getAuthToken(config) {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 30_000) {
    return cachedToken;
  }

  ["email", "name", "rollNo", "accessCode", "clientID", "clientSecret"].forEach((key) =>
    requireField(config, key)
  );

  const data = await createAuthToken(config);

  cachedToken = data.access_token || data.accessToken || data.token;
  tokenExpiresAt = now + Number(data.expires_in || data.expiresIn || 3600) * 1000;

  if (!cachedToken) {
    throw new Error("Authentication response did not include a token.");
  }

  return cachedToken;
}

export async function registerClient(overrides = {}) {
  const config = getConfig(overrides);
  ["email", "name", "rollNo", "accessCode"].forEach((key) => requireField(config, key));

  return postJson(config.fetchImpl, `${config.baseUrl}/register`, {
    email: config.email,
    name: config.name,
    mobileNo: overrides.mobileNo || readEnv("EVALUATION_MOBILE_NO"),
    githubUsername: overrides.githubUsername || readEnv("EVALUATION_GITHUB_USERNAME"),
    rollNo: config.rollNo,
    accessCode: config.accessCode,
  });
}

export async function createAuthToken(overrides = {}) {
  const config = getConfig(overrides);
  ["email", "name", "rollNo", "accessCode", "clientID", "clientSecret"].forEach((key) =>
    requireField(config, key)
  );

  return postJson(config.fetchImpl, `${config.baseUrl}/auth`, {
    email: config.email,
    name: config.name,
    rollNo: config.rollNo,
    accessCode: config.accessCode,
    clientID: config.clientID,
    clientSecret: config.clientSecret,
  });
}

export async function Log(stack, level, packageName, message, overrides = {}) {
  validateLogInput(stack, level, packageName, message);

  const config = getConfig(overrides);
  if (!config.fetchImpl) {
    throw new Error("A fetch implementation is required for logging.");
  }

  const token = await getAuthToken(config);

  return postJson(
    config.fetchImpl,
    `${config.baseUrl}/logs`,
    {
      stack,
      level,
      package: packageName,
      message,
    },
    token
  );
}

export const loggingConstraints = {
  stacks: [...VALID_STACKS],
  levels: [...VALID_LEVELS],
  backendPackages: [...BACKEND_PACKAGES],
  frontendPackages: [...FRONTEND_PACKAGES],
  sharedPackages: [...SHARED_PACKAGES],
};
