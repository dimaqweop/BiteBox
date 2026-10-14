import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const deployment = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .match(/^CONVEX_DEPLOYMENT=(dev:[\w-]+)/m)?.[1];
if (!deployment || process.env.CONVEX_DEPLOY_KEY || (process.env.CONVEX_DEPLOYMENT && process.env.CONVEX_DEPLOYMENT !== deployment)) {
  throw new Error("Auth setup requires the unambiguous dev deployment configured in .env.local.");
}
console.log(`Auth setup target: ${deployment}`);

function cli(args, input) {
  const result = spawnSync(process.execPath, ["node_modules/convex/bin/main.js", "env", ...args, "--env-file", ".env.local"], {
    encoding: "utf8", input, timeout: 60000, env: { ...process.env, CONVEX_DEPLOYMENT: deployment },
  });
  if (result.status !== 0) throw new Error(`Convex env ${args[0]} failed; check deployment access. Secret output suppressed.`);
  return result.stdout.trim();
}

const names = new Set(cli(["list", "--names-only"]).split(/\r?\n/));
if (names.has("JWT_PRIVATE_KEY") && names.has("JWKS")) {
  console.log("Auth keys already configured; preserved.");
} else if (names.has("JWT_PRIVATE_KEY") || names.has("JWKS")) {
  throw new Error("Only one auth key is configured. Resolve the incomplete key pair before proceeding.");
} else {
  const keys = await generateKeyPair("RS256", { extractable: true });
  const privatePem = await exportPKCS8(keys.privateKey);
  const publicJwk = await exportJWK(keys.publicKey);
  cli(["set"], `JWT_PRIVATE_KEY=${privatePem.trimEnd().replace(/\n/g, " ")}\nJWKS=${JSON.stringify({ keys: [{ use: "sig", ...publicJwk }] })}\n`);
  console.log("Auth keys configured. No secrets written to disk.");
}
