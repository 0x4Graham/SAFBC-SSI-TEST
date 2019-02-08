
# uPort SSI _SAFBC Test:

### Installation
1. Install Node modules.
```
yarn
```
2. Install a reverse proxy. [ngrok](https://ngrok.com/) OR [serveo](https://serveo.net/).

3. run ngrok http 5000

### Run
1. Start the reverse proxy and update `CONFIG.HOST` in `app.js` with the proxy's address.
2. Start the server.
```
yarn start
```


