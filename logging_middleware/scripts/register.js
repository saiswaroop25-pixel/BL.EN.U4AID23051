import { loadLocalEnv } from "./load-env.js";
import { registerClient } from "../src/index.js";

loadLocalEnv();

const result = await registerClient();
console.log(JSON.stringify(result, null, 2));
