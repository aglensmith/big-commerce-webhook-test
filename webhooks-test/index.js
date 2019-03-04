const express = require('express')
const app = express()
	app.post('/webhooks', function (req, res) {
	res.send('OK')
})
app.listen(3000, function () {
	console.log('Listening for webhooks on port 3000')
})