import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import proj4 from 'proj4';
import { io } from 'socket.io-client';
import { Modal } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/main.css';

class Mapa {
  constructor() {

    this.socket = io();
    this.UTM_30 = "+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs";
    this.aumentar = document.getElementById('aumentar');
    this.reducir = document.getElementById('reducir');
    this.angSlider = document.getElementById('angulo');
    this.angSlider.defaultValue = 0;
    this.descargar = document.getElementById('descargar');
    this.arriba = document.getElementById('arriba');
    this.abajo = document.getElementById('abajo');
    this.izqda = document.getElementById('izqda');
    this.dcha = document.getElementById('dcha');
    this.descargandoModal = new Modal(document.getElementById('descargando'));
    this.descargandoModal.hide();
    this.modal = document.querySelector('.modal-dialog');
    this.modalBody = document.querySelector('.modal-body');
    this.modalFooter = document.querySelector('.modal-footer');
    this.modalHeader = document.querySelector('.modal-header');
    this.form = document.querySelector('form');
    this.w = 3641;
    this.h = 2048;
    var uploader = new SocketIOFileUpload(this.socket);
    uploader.listenOnInput(document.getElementById("at"));

    this.descargar.addEventListener('click', () => {
      const vertices = this.updateRectangle_UTM();
      const longs = vertices.map( (x) => { return x[0] } );
      const lats = vertices.map( (x) => { return x[1] } );

      const minx= Math.min(...longs);
      const maxx= Math.max(...longs);
      const miny= Math.min(...lats);
      const maxy= Math.max(...lats);

      const dx = Math.abs( vertices[0][0] - vertices[2][0] );
      const dy = Math.abs( vertices[0][1] - vertices[2][1] );
      const width_km = Math.ceil( Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) ) * Math.cos( 0.512 ) / 1000 );
      console.log( width_km );

      const width = 1080 * Math.abs(Math.sin( this.ang )) + 1920 * Math.abs( Math.cos( this.ang ) );
      const height = 1080 * Math.abs(Math.cos( this.ang )) + 1920 * Math.abs( Math.sin( this.ang ) );

      let squareWidth = 2048 * Math.abs(Math.sin( this.ang )) + 3641 * Math.abs( Math.cos( this.ang ) );
      let squareHeight = 2048 * Math.abs(Math.cos( this.ang )) + 3641 * Math.abs( Math.sin( this.ang ) );
      console.log( 'antes', squareWidth );

      //const squareWidth = Math.abs( width + ( 2048 - 1080 ) * Math.sin( this.ang ) + ( 2048 - 1920 ) * Math.cos( this.ang ) );
      //const squareHeight = Math.abs( width + ( 2048 - 1920 ) * Math.sin( this.ang ) + ( 2048 - 1080 ) * Math.cos( this.ang ) );

      const offsetx = Math.abs(1080 * Math.sin( this.ang ) * Math.cos( this.ang ));
      const offsety = Math.abs(1920 * Math.sin( this.ang ) * Math.cos( this.ang ));
      
      let sOffsetx = Math.abs(2048 * Math.sin( this.ang ) * Math.cos( this.ang ));
      let sOffsety = Math.abs(3641 * Math.sin( this.ang ) * Math.cos( this.ang ));
      
      // CONDICIONAL NECESARIO EN ALGUNOS ANGULOS PARA QUE NO SE SUPERE EL L??MITE DE 4096px DEL WMS
      if ( squareWidth > 4096 || squareHeight > 4096 ) {
        squareWidth = 2007 * Math.abs(Math.sin( this.ang )) + 3568 * Math.abs( Math.cos( this.ang ) );
        squareHeight = 2007 * Math.abs(Math.cos( this.ang )) + 3568 * Math.abs( Math.sin( this.ang ) );
        sOffsetx = Math.abs(2007 * Math.sin( this.ang ) * Math.cos( this.ang ));
        sOffsety = Math.abs(3568 * Math.sin( this.ang ) * Math.cos( this.ang ));
        this.w = 3568;
        this.h = 2007;
      }

      this.socket.emit( 'mapa', {
        minx: minx,
        maxx: maxx,
        miny: miny,
        maxy: maxy,
        width: width,
        height: height,
        width_km: width_km,
        ang: this.ang,
        offsetx: offsetx,
        offsety: offsety,
        sWidth: squareWidth,
        sHeight: squareHeight,
        sOffsetx: sOffsetx,
        sOffsety: sOffsety,
        w: this.w,
        h: this.h
      });
      this.descargandoModal.show();
    })
    this.socket.on( 'descargado', ( values ) => {
      console.log( values );
      this.values = values;
      this.modalBody.innerHTML = '<img class="downloaded" src="images/topo_temp2.png"><img class="downloaded" src="images/pnoa_temp2.png">';
      this.modalFooter.innerHTML = '<p>Imagenes descargadas del IGN</p><button id="crear-escenario" class="btn btn-success">Crear Escenario</button>';
      this.modalHeader.innerHTML = '<h5>Im??genes descargadas</h5>';
      this.modal.style.maxWidth = "1200px";
      this.crearEscenario = document.getElementById('crear-escenario');
      this.crearEscenario.addEventListener('click', () => {
        console.log( this.values, values );
        this.form.action = `${document.location.origin}/app/visor/temp/master/${this.values.width}/${this.values.height}/${this.values.width_km}`;
        this.form.submit();
      });
    });

    this.socket.on( 'at', (data) => {
      const at_long = data.geoTransform[0] + ( data.geoTransform[1] / 2 ) * data.rasterSize.x;
      const at_lat = data.geoTransform[3] + ( data.geoTransform[5] / 2 ) * data.rasterSize.y;
      const center = proj4( this.UTM_30, proj4.defs( 'EPSG:4326' ), [ at_long, at_lat ] );

      const ll_long = data.geoTransform[0];
      const ll_lat = data.geoTransform[3] + data.geoTransform[5] * data.rasterSize.y;

      const ll = proj4( this.UTM_30, proj4.defs( 'EPSG:4326' ), [ ll_long, ll_lat ] );

      const ur_long = data.geoTransform[0] + data.geoTransform[1] * data.rasterSize.x;
      const ur_lat = data.geoTransform[3];

      const ur = proj4( this.UTM_30, proj4.defs( 'EPSG:4326' ), [ ur_long, ur_lat ] );

      this.map.setZoom(12);
      const corner1 = L.latLng( center[1] - 0.5, center[0] - 0.5 );
      const corner2 = L.latLng( center[1] + 0.5, center[0] + 0.5 );
      this.map.fitBounds([ [center[1] - 0.5, center[0] - 0.5], [center[1] + 0.5, center[0] + 0.5 ] ]);
      console.log( center );
      L.imageOverlay( 'uploads/temp.png', [[ll[1], ll[0]], [ur[1], ur[0]]] ).addTo(this.map);
    });

    this.aumentar.addEventListener('click', () => {
      this.diagonal += 100;
      this.drawnItems.getLayers()[0].setLatLngs( this.updateRectangle() );
    })
    this.reducir.addEventListener('click', () => {
      this.diagonal -= 100;
      this.drawnItems.getLayers()[0].setLatLngs( this.updateRectangle() );
    })
    this.dcha.addEventListener('click', () => {
      this.long_center += 100;
      this.drawnItems.getLayers()[0].setLatLngs( this.updateRectangle() );
    })
    this.izqda.addEventListener('click', () => {
      this.long_center -= 100;
      this.drawnItems.getLayers()[0].setLatLngs( this.updateRectangle() );
    })
    this.arriba.addEventListener('click', () => {
      this.lat_center += 100;
      this.drawnItems.getLayers()[0].setLatLngs( this.updateRectangle() );
    })
    this.abajo.addEventListener('click', () => {
      this.lat_center -= 100;
      this.drawnItems.getLayers()[0].setLatLngs( this.updateRectangle() );
    })
    this.angSlider.addEventListener('change', () => {
      this.ang = -parseFloat(this.angSlider.value);
      this.drawnItems.getLayers()[0].setLatLngs( this.updateRectangle() );

    })
    this.map = L.map( 'map', {
      center: [40.0, -3],
      zoom: 6
    });

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery ?? <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }).addTo(this.map);

    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer( this.drawnItems );
    this.drawControl = new L.Control.Draw({
      edit: {
        featureGroup:this.drawnItems
      }
    });
    this.map.on(L.Draw.Event.CREATED, (e) => {
      this.drawnItems.clearLayers();
      var layer = e.layer;
      var pto1 = layer._latlngs[0][0];
      var pto2 = layer._latlngs[0][2];
      var pto1_utm = proj4( this.UTM_30, [pto1.lng, pto1.lat] );
      var pto2_utm = proj4( this.UTM_30, [pto2.lng, pto2.lat] );
      this.largo = Math.abs( pto2_utm[0] - pto1_utm[0]);
      this.diagonal = ( this.largo / 2 ) / Math.cos( 0.51 );
      this.long_center = pto1_utm[0] + this.largo / 2; 
      this.lat_center = pto2_utm[1] - ( this.largo * 9  )/ 32;
      this.ang = 0;
      L.polygon( this.updateRectangle() ).addTo( this.drawnItems);
      this.angSlider.value = 0;
    });
    this.map.addControl( this.drawControl );
  }

  updateRectangle ( ) {
    var pto1 = [ this.long_center + this.diagonal * Math.cos( 0.51+ this.ang ), this.lat_center + this.diagonal * Math.sin( 0.51+ this.ang ) ];
    var pto2 = [ this.long_center + this.diagonal * Math.cos( Math.PI - 0.51+ this.ang ), this.lat_center + this.diagonal * Math.sin( Math.PI - 0.51+ this.ang ) ];
    var pto3 = [ this.long_center + this.diagonal * Math.cos( Math.PI + 0.51+ this.ang ), this.lat_center + this.diagonal * Math.sin( Math.PI + 0.51+ this.ang ) ];
    var pto4 = [ this.long_center + this.diagonal * Math.cos( -0.51+ this.ang ), this.lat_center + this.diagonal * Math.sin( this.ang - 0.51 ) ];

    var pto1_WGS84 = proj4( this.UTM_30, proj4.defs( 'EPSG:4326'), pto1);
    var pto2_WGS84 = proj4( this.UTM_30, proj4.defs( 'EPSG:4326'), pto2);
    var pto3_WGS84 = proj4( this.UTM_30, proj4.defs( 'EPSG:4326'), pto3);
    var pto4_WGS84 = proj4( this.UTM_30, proj4.defs( 'EPSG:4326'), pto4);
    return [ [ pto1_WGS84[1], pto1_WGS84[0] ], [ pto2_WGS84[1], pto2_WGS84[0] ], [ pto3_WGS84[1], pto3_WGS84[0] ], [ pto4_WGS84[1], pto4_WGS84[0] ]];
  }

  updateRectangle_UTM ( ) {
    var pto1 = [ this.long_center + this.diagonal * Math.cos( 0.51+ this.ang ), this.lat_center + this.diagonal * Math.sin( 0.51+ this.ang ) ];
    var pto2 = [ this.long_center + this.diagonal * Math.cos( Math.PI - 0.51+ this.ang ), this.lat_center + this.diagonal * Math.sin( Math.PI - 0.51+ this.ang ) ];
    var pto3 = [ this.long_center + this.diagonal * Math.cos( Math.PI + 0.51+ this.ang ), this.lat_center + this.diagonal * Math.sin( Math.PI + 0.51+ this.ang ) ];
    var pto4 = [ this.long_center + this.diagonal * Math.cos( -0.51+ this.ang ), this.lat_center + this.diagonal * Math.sin( this.ang - 0.51 ) ];
    return [pto1, pto2, pto3, pto4];
  }
}

var mapa = new Mapa();
