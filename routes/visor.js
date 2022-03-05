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

router.post('/visor/:id', function(req, res, next) {
  res.render('visor/visor.hbs', {
    title: 'Visor3D',
    localizacion: req.params.id,
    viewType: 'visor',
    renderSidebar: true
  });
});

module.exports = router;
