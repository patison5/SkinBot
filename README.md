# SkinBot

### installation

Create config.js in root directory and paste there this code.

```js
const config = {
	API_KEY:     	"19586f8b-71d0-473c-83dc-afdcfe8ae537",
	SECRET_HASH: 	"CCGIYR3FVREJ5SET",
	MY_GAMES: 	 	[570, 730, 252490]
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
