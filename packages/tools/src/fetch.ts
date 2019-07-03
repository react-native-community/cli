import nodeFetch, {
  RequestInit as FetchOptions,
  Response,
  Request,
} from 'node-fetch';

export default function fetch(
  url: string | Request,
  options?: FetchOptions,
): Promise<Response> {
  return nodeFetch(url, options);
}
