const DEFAULT_BASE_URL = "http://20.207.122.201/evaluation-service";

let cachedToken = null;

function getConfig() {
  return {
    baseUrl: import.meta.env.VITE_EVALUATION_BASE_URL || DEFAULT_BASE_URL,
    email: import.meta.env.VITE_EVALUATION_EMAIL,
    name: import.meta.env.VITE_EVALUATION_NAME,
    rollNo: import.meta.env.VITE_EVALUATION_ROLL_NO,
    accessCode: import.meta.env.VITE_EVALUATION_ACCESS_CODE,
    clientID: import.meta.env.VITE_EVALUATION_CLIENT_ID,
    clientSecret: import.meta.env.VITE_EVALUATION_CLIENT_SECRET,
  };
}

function requireConfig(config, key) {
  if (!config[key]) {
    throw new Error(`Missing frontend configuration: ${key}`);
  }
}

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export async function getAuthToken() {
  if (cachedToken) {
    return cachedToken;
  }

  const config = getConfig();
  ["email", "name", "rollNo", "accessCode", "clientID", "clientSecret"].forEach((key) =>
    requireConfig(config, key)
  );

  const response = await fetch(`${config.baseUrl}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: config.email,
      name: config.name,
      rollNo: config.rollNo,
      accessCode: config.accessCode,
      clientID: config.clientID,
      clientSecret: config.clientSecret,
    }),
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(data.message || `Authentication failed with status ${response.status}`);
  }

  cachedToken = data.access_token || data.accessToken || data.token;
  if (!cachedToken) {
    throw new Error("Authentication response did not include an access token.");
  }

  return cachedToken;
}

export async function fetchNotifications({ limit = 100, type = "All" } = {}) {
  const config = getConfig();
  const token = await getAuthToken();
  const params = new URLSearchParams({ limit: String(limit) });

  if (type !== "All") {
    params.set("type", type);
  }

  const response = await fetch(`${config.baseUrl}/notifications?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(data.message || `Notifications request failed with status ${response.status}`);
  }

  return data.notifications || [];
}
