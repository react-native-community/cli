import nodeFetch, {
  RequestInit as FetchOptions,
  Response,
  Request,
  Headers,
} from 'node-fetch';

async function unwrapFetchResult(response: Response) {
  try {
    return response.json();
  } catch (e) {
    return response.text();
  }
}

export default async function fetch(
  url: string | Request,
  options?: FetchOptions,
): Promise<{status: number, data: any, headers: Headers}> {
  const result = await nodeFetch(url, options);

  return {
    status: result.status,
    headers: result.headers,
    data: await unwrapFetchResult(result),
  };
}
