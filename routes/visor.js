var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/:id', function(req, res, next) {
  res.render('visor/visor.hbs', {localizacion: req.params.id});
  console.log(req.params.id);
});

module.exports = router;
