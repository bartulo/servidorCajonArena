import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import proj4 from 'proj4';
import 'bootstrap/dist/css/bootstrap.min.css';

class Mapa {
  constructor() {

    this.UTM_30 = "+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs";
    this.aumentar = document.getElementById('aumentar');
    this.reducir = document.getElementById('reducir');
    this.angSlider = document.getElementById('angulo');
    this.angSlider.defaultValue = 0;

    this.aumentar.addEventListener('click', () => {
      this.diagonal += 100;
      console.log( this.diagonal );
      this.drawnItems.getLayers()[0].setLatLngs( this.updateRectangle() );
    })
    this.reducir.addEventListener('click', () => {
      this.diagonal -= 100;
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
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
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
}

var mapa = new Mapa();
