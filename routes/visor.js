var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/proyector/:id', function(req, res, next) {
  res.render('visor/visor.hbs', {
    title: 'Proyector',
    localizacion: req.params.id,
    viewType: 'proyector',
    renderSidebar: false
  });
});

router.get('/visor', function(req, res, next) {
  res.render('visor/formulario.hbs');
});

router.post('/visor/:id/:type', function(req, res, next) {
  let room = true;
  if ( req.params.type == 'master' ) {
    room = true;
  } else {
    room = false;
  }
  res.render('visor/visor.hbs', {
    title: 'Visor3D',
    localizacion: req.params.id,
    viewType: 'visor',
    renderSidebar: true,
    room: room
  });
});

module.exports = router;
