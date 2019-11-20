# SkinBot

### installation

Create config.js in root directory and paste there this code.

```js
const config = {
	API_KEY:     	"",
	SECRET_HASH: 	"",
	MY_GAMES: 	[570, 730, 252490]
}

module.exports = config;
```

Run the following command
```bash
$ npm install
```


Start server in development mode
```bash
$ npm run dev
```


Start server in production mode
```bash
$ npm run prod
```
