var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  fs.readFile( __dirname + '/config.json', ( err, data ) => {
    if ( err ) throw err;
    let datos = JSON.parse( data );
    res.render('index', { datos: datos });
  })
});

module.exports = router;
