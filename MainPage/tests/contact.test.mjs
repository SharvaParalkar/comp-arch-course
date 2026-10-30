import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { test } from "node:test";

const source = await readFile(new URL("../functions/api/contact.js", import.meta.url), "utf8");
const { onRequestPost } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const env = { TURNSTILE_SECRET_KEY: "secret", MAILJET_API_KEY: "key", MAILJET_API_SECRET: "secret" };
const request = (token = "token") => {
  const body = new FormData();
  for (const [key, value] of Object.entries({ name: "Visitor", email: "visitor@example.com", subject: "Hello", message: "Question", "cf-turnstile-response": token })) body.set(key, value);
  return new Request("https://calab.net/api/contact", { method: "POST", headers: { origin: "https://calab.net" }, body });
};

test("contact CAPTCHA gate", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let mailCalls = 0;
  let validation = { success: true, hostname: "calab.net", action: "contact" };
  globalThis.fetch = async (url) => {
    if (url.includes("siteverify")) {
      if (validation instanceof Error) throw validation;
      return Response.json(validation);
    }
    mailCalls++;
    return Response.json({ Messages: [{ Status: "success" }, { Status: "success" }] });
  };
  assert.equal((await onRequestPost({ request: request(), env: {} })).status, 503);
  assert.equal((await onRequestPost({ request: request(""), env })).status, 400);
  for (const result of [
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: true, hostname: "evil.example", action: "contact" },
    { success: true, hostname: "calab.net", action: "other" },
    new Error("Service unavailable"),
  ]) {
    validation = result;
    assert.ok((await onRequestPost({ request: request(), env })).status >= 400);
  }
  assert.equal(mailCalls, 0, "Unverified requests must never send emails");
  validation = { success: true, hostname: "calab.net", action: "contact" };
  assert.equal((await onRequestPost({ request: request(), env })).status, 200);
  assert.equal(mailCalls, 1);
});
