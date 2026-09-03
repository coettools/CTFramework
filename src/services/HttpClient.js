export class HttpClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "";
    this.headers = options.headers || {};
  }

  Request(path, options = {}) {
    const requestOptions = { ...options };
    const mergedHeaders = {
      ...this.headers,
      ...(options.headers || {})
    };

    if (
      requestOptions.body !== undefined &&
      requestOptions.body !== null &&
      !mergedHeaders["Content-Type"] &&
      !mergedHeaders["content-type"] &&
      CTFrameworkCanSerializeJson(requestOptions.body)
    ) {
      mergedHeaders["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(requestOptions.body);
    }

    if (Object.keys(mergedHeaders).length > 0) {
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
    typeof value === "object" &&
    !(value instanceof FormData) &&
    !(value instanceof URLSearchParams) &&
    !(value instanceof Blob) &&
    !(value instanceof ArrayBuffer)
  );
};
