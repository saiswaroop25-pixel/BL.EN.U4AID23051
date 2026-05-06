import { loadLocalEnv } from "./load-env.js";
import { createAuthToken } from "../src/index.js";

loadLocalEnv();

const token = await createAuthToken();
console.log(JSON.stringify(token, null, 2));
