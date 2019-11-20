# SkinBot

### installation

Create config.js in root directory and paste there this code.

```js
const cTable  = require('console.table');
const totp 	  = require('totp-generator');

const config = {
	API_KEY:     "YOUR_API_KEY",
    SECRET_HASH: "YOUR_SECRET_HASH"
	MY_GAMES: [570, 730, 252490]
}

console.table('\x1b[33m', [
	{
		API_KEY: 		config.API_KEY,
		SECRET_HASH: 	config.SECRET_HASH,
		CODE: 			totp(config.SECRET_HASH),
		MY_GAMES: 		config.MY_GAMES
	}
], '\x1b[0m')

module.exports = config;
```

Run the following command
```bash
$ npm install
```


To start server
```bash
$ node app.js
```
