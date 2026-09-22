import http from 'http';

export class MockFirebaseServer {
  constructor() {
    this.database = {
      devices: {},
      latest: {},
      readings: {},
      alerts: {},
    };
    this.server = null;
  }

  start(port = 9000) {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname.replace(/\.json$/, ''); // strip .json
        const parts = pathname.split('/').filter(Boolean); // ['latest', 'smartsense-pi-01']

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', () => {
          let parsedData = null;
          if (body) {
            try {
              parsedData = JSON.parse(body);
            } catch (e) {
              parsedData = body;
            }
          }

          // 1. GET requests
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            let target = this.database;
            for (const p of parts) {
              if (target && target[p] !== undefined) {
                target = target[p];
              } else {
                target = null;
                break;
              }
            }
            res.end(JSON.stringify(target));
            return;
          }

          // 2. PUT requests (e.g. /latest/smartsense-pi-01, /alerts/alt-123)
          if (req.method === 'PUT') {
            if (parts[0] === 'latest' && parts[1]) {
              this.database.latest[parts[1]] = parsedData;
            } else if (parts[0] === 'alerts' && parts[1]) {
              this.database.alerts[parts[1]] = parsedData;
            } else if (parts[0] === 'devices' && parts[1]) {
              this.database.devices[parts[1]] = parsedData;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(parsedData));
            return;
          }

          // 3. POST requests (e.g. /readings/smartsense-pi-01) - appends reading with push ID
          if (req.method === 'POST') {
            if (parts[0] === 'readings' && parts[1]) {
              const deviceId = parts[1];
              if (!this.database.readings[deviceId]) {
                this.database.readings[deviceId] = {};
              }
              const readingId = `-O${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              this.database.readings[deviceId][readingId] = parsedData;
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ name: readingId }));
              return;
            }
          }

          // 4. PATCH requests (e.g. /devices/smartsense-pi-01, /alerts/alt-xxx)
          if (req.method === 'PATCH') {
            const collection = parts[0];
            const id = parts[1];
            if (collection && id && this.database[collection]) {
              this.database[collection][id] = {
                ...(this.database[collection][id] || {}),
                ...parsedData,
              };
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(this.database[collection][id]));
              return;
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        });
      });

      this.server.listen(port, () => {
        resolve(this);
      });
    });
  }

  getDatabase() {
    return this.database;
  }

  clearDatabase() {
    this.database = {
      devices: {},
      latest: {},
      readings: {},
      alerts: {},
    };
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
      } else {
        resolve();
      }
    });
  }
}

export default MockFirebaseServer;
