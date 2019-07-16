import nodeFetch, {
  RequestInit as FetchOptions,
  Response,
  Request,
  Headers,
} from 'node-fetch';

async function unwrapFetchResult(response: Response) {
  const data = await response.text();

  try {
    return JSON.stringify(data);
  } catch (e) {
    return data;
  }
}

export default async function fetch(
  url: string | Request,
  options?: FetchOptions,
): Promise<{status: number, data: any, headers: Headers}> {
  const result = await nodeFetch(url, options);
  const data = await unwrapFetchResult(result);

  return {
    status: result.status,
    headers: result.headers,
    data,
  };
}
