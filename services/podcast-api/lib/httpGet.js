import http from 'http';

export function httpGet(params) {
  return new Promise((resolve, reject) => {
    http
      .get(params, (resp) => {
        console.log(
          `Fetching ${params.host}${params.path}, status code : ${resp.statusCode}`
        );
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          resolve(JSON.parse(data));
        });
      })
      .on('error', (err) => {
        console.log(
          `Couldn't fetch ${params.hostname}${params.path} : ${err.message}`
        );
        reject(err, null);
      });
  });
}
