/**
 * @flow
 */
import https from 'https';

type Release = {
  tag_name: string,
  html_url: string,
  draft: boolean,
  prerelease: boolean,
  created_at: string,
  published_at: string,
  body: string,
};

export function getLatestRelease() {
  // Replace with promisify.js
  return new Promise<Release>((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/facebook/react-native/releases/latest',
      // https://developer.github.com/v3/#user-agent-required
      headers: {'User-Agent': 'React-Native-CLI'},
    };

    https
      .get(options, result => {
        let body = '';

        result.setEncoding('utf8');
        result.on('data', data => {
          body += data;
        });

        result.on('end', () => {
          resolve(JSON.parse(body));
        });

        result.on('error', error => reject(error));
      })
      .on('error', error => reject(error));
  });
}
