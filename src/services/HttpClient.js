export class HttpClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "";
    this.headers = options.headers || {};
  }

  Request(path, options = {}) {
    const requestOptions = { ...options };
    const mergedHeaders = new Headers(this.headers);
    new Headers(options.headers).forEach((value, name) => mergedHeaders.set(name, value));

    if (
      requestOptions.body !== undefined &&
      requestOptions.body !== null &&
      CTFrameworkCanSerializeJson(requestOptions.body)
    ) {
      if (!mergedHeaders.has("Content-Type")) mergedHeaders.set("Content-Type", "application/json");
      requestOptions.body = JSON.stringify(requestOptions.body);
    }

    if ([...mergedHeaders].length > 0) {
      requestOptions.headers = mergedHeaders;
    }

    return fetch(`${this.baseUrl}${path}`, requestOptions);
  }

  Get(path, options = {}) {
    return this.Request(path, { ...options, method: "GET" });
  }

  Post(path, body, options = {}) {
    return this.Request(path, {
      ...options,
      method: "POST",
      body
    });
  }

  Put(path, body, options = {}) {
    return this.Request(path, {
      ...options,
      method: "PUT",
      body
    });
  }

  Patch(path, body, options = {}) {
    return this.Request(path, {
      ...options,
      method: "PATCH",
      body
    });
  }

  Delete(path, options = {}) {
    return this.Request(path, { ...options, method: "DELETE" });
  }
}

const CTFrameworkCanSerializeJson = (value) => {
  return (
    Array.isArray(value) ||
    (value !== null && typeof value === "object" &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null))
  );
};
