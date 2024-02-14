export var methodType = { get: 'GET', post: 'POST', put: 'PUT', delete: 'DELETE' };

export default class BaseAPI {
  static JSONRequest(api, method, headers, options, content) {
    const host = "http://localhost:3000";

    let requestOptions = {
      method: method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      ...options
    }

    if (method === methodType.post || method === methodType.put) {
      requestOptions.body = JSON.stringify(content)
    }

    return fetch(host + api, requestOptions)
      .then(response => {
        if (!response.ok) {
          console.error(response)
          throw new "NOT OK";
        }

        return response.json()
          .then(res => res.data)
      })
  }
}
