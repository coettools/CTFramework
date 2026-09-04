import assert from "node:assert/strict";
import test from "node:test";

import { HttpClient } from "../../src/Index.js";

test("HttpClient merges headers and serializes JSON bodies", async (testContext) => {
  const originalFetch = globalThis.fetch;
  let requestSnapshot = null;

  globalThis.fetch = async (requestUrl, requestOptions) => {
    requestSnapshot = {
      requestUrl,
      requestOptions
    };

    return {
      ok: true,
      status: 200
    };
  };

  testContext.after(() => {
    globalThis.fetch = originalFetch;
  });

  const client = new HttpClient({
    baseUrl: "/api",
    headers: {
      Accept: "application/json"
    }
  });

  await client.Post(
    "/notes",
    { name: "CTFramework" },
    {
      headers: {
        Authorization: "Bearer token"
      }
    }
  );

  assert.equal(requestSnapshot.requestUrl, "/api/notes");
  assert.equal(requestSnapshot.requestOptions.method, "POST");
  assert.equal(requestSnapshot.requestOptions.headers.get("Accept"), "application/json");
  assert.equal(requestSnapshot.requestOptions.headers.get("Authorization"), "Bearer token");
  assert.equal(requestSnapshot.requestOptions.headers.get("Content-Type"), "application/json");
  assert.equal(requestSnapshot.requestOptions.body, JSON.stringify({ name: "CTFramework" }));
});

test("HttpClient leaves FormData bodies untouched", async (testContext) => {
  const originalFetch = globalThis.fetch;
  let requestSnapshot = null;

  globalThis.fetch = async (requestUrl, requestOptions) => {
    requestSnapshot = {
      requestUrl,
      requestOptions
    };

    return {
      ok: true,
      status: 200
    };
  };

  testContext.after(() => {
    globalThis.fetch = originalFetch;
  });

  const formData = new FormData();
  formData.append("name", "CTFramework");

  const client = new HttpClient({
    baseUrl: "/api"
  });

  await client.Post("/upload", formData);

  assert.equal(requestSnapshot.requestUrl, "/api/upload");
  assert.equal(requestSnapshot.requestOptions.body, formData);
  assert.equal(requestSnapshot.requestOptions.headers, undefined);
});
