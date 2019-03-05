// @flow
import https from 'https';

export const fetch = (url: string) =>
  new Promise<string>((resolve, reject) => {
    const request = https.get(url, response => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(
          new Error(`Failed to load page, status code: ${response.statusCode}`),
        );
      }
      const body = [];
      response.on('data', chunk => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    request.on('error', err => reject(err));
  });
