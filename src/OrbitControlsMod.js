import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {Vector2, Raycaster, Vector3, Color} from 'three';
import { LineSidebar, IconSidebar } from './sidebar';

class OrbitControlsMod extends OrbitControls {

  constructor( object, domElement, scene, sidebar, socket ) {

    super( object, domElement );
    this.camera = object;
    this.socket = socket;
    this.scene = scene;
    this.sidebar = sidebar;
    this.sidebar.sidenav.addEventListener( 'openSidebar', this.openSidebar );
    this.sidebar.sidenav.addEventListener( 'closeSidebar', this.closeSidebar );
  }

  openSidebar = () => {

    this.enabled = false;
    this.domElement.addEventListener('mousedown', this.onMouseDown );
  }

  closeSidebar = () => {

    this.enabled = true;
    this.domElement.removeEventListener('mousedown', this.onMouseDown );
  }

  onMouseDown = ( event ) => {

    if ( this.sidebar.state == 'icon' ) { 

      const icon = new IconSidebar( this.getIntersection( event ), this.scene, this.sidebar );
      icon.createObject();
      icon.createElement();
      this.socket.emit( 'icon', { 
        'coords': this.getIntersection( event ), 
        'type': this.sidebar.icon, 
        _id: this.sidebar.iconId 
      } );

    } else if ( this.sidebar.state == 'paint' ) { 

      this.points = [];
      this.positions = [];
      this.colors = [];

      this.lineSidebar = new LineSidebar( this.scene, this.sidebar );

      this.lineSidebar.createObject();
      this.scene.add( this.lineSidebar.line );
      this.domElement.addEventListener('mousemove', this.onMouseMove );
      this.domElement.addEventListener('mouseup', this.onMouseUp );
    }
  }

  onMouseMove = ( event ) => {

    const point = this.getIntersection( event );
    this.points.push( point.x, point.y + 1.6, point.z );
    this.positions.push( new Vector3( point.x, point.y, point.z ) );
    this.lineSidebar.line.geometry.setPoints( this.points );
    this.colors.push( 0.0, 1.0, 1.0 );
  }

  onMouseUp = ( ) => {


    this.lineSidebar.createElement();
    this.domElement.removeEventListener('mousemove', this.onMouseMove );
    this.domElement.removeEventListener('mouseup', this.onMouseUp );

    this.socket.emit( 'linea', {
      positions: this.positions,
      red: this.lineSidebar.line.material.color.r,
      green: this.lineSidebar.line.material.color.g,
      blue: this.lineSidebar.line.material.color.b,
      id: this.sidebar.lineId
    });

  }

  getIntersection = ( event ) => {

    const mouseDownPoint = new Vector2();

    mouseDownPoint.x = ( ( event.clientX + this.domElement.offsetLeft ) / window.innerWidth ) * 2 - 1;
    mouseDownPoint.y = -( ( event.clientY + this.domElement.offsetTop ) / window.innerHeight ) * 2 + 1;

    const ray = new Raycaster();

    ray.setFromCamera( mouseDownPoint, this.camera );

    const intersects = ray.intersectObject( this.scene.children[0] );

    return intersects[0].point;

  }
}

export { OrbitControlsMod }
