import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { io } from 'socket.io-client';
import {Vector2, Raycaster} from 'three';
import { LineSidebar, IconSidebar } from './sidebar';

class OrbitControlsMod extends OrbitControls {

  constructor( object, domElement, scene, sidebar ) {

    super( object, domElement );
    this.camera = object;
    this.socket = io();
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
      console.log( 'paint' ) 
    }
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
