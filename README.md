# SkinBot

#### installation

Create config.js in root directory and paste there this code.

```js
	const config = {
		API_KEY: "API_KEY",
		SECRET_HASH: "API_KEY"
	}


	module.exports = config;
```


```js
const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3000)
```