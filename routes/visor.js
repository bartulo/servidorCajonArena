var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/:viewType/:id', function(req, res, next) {
  let renderSidebar = '';
  if ( req.params.viewType == 'visor' ) {
    renderSidebar = true;
  } else {
    renderSidebar = false;
  }
  res.render('visor/visor.hbs', {
    localizacion: req.params.id,
    viewType: req.params.viewType,
    renderSidebar: renderSidebar
  });
  console.log(req.params.id);
});

module.exports = router;
