import JsTabs from 'js-tabs';
import 'js-tabs/src/_js-tabs-base.scss';
import { BufferGeometry, LineBasicMaterial, Line, Group, BufferAttribute, Mesh } from 'three';
import {CSS2DObject} from 'three/examples/jsm/renderers/CSS2DRenderer';
import { MeshLine } from './meshline/meshline';
import { MeshLineMaterial } from './meshline/material';


class Sidebar {
  constructor ( socket ) {
    this.socket = socket;

  }

  init () {
    this.state = null;
    this.video = document.querySelector('video');
    this.seek = document.getElementById('new-seek');
    this.rightShelf = document.querySelector('.right-shelf');
    this.videoButton = document.querySelector('.video-button');

    this.video.addEventListener('loadedmetadata', () => { 
      this.seek.setAttribute( 'max', this.video.duration )

      this.seek.addEventListener('mousemove', ( event ) => {
        const skipTo = Math.round( ( event.offsetX / event.target.clientWidth ) * this.video.duration );
        this.seek.setAttribute('data-seek', skipTo);
      });
    });

    document.querySelectorAll('.new-colors li').forEach( item => {
      item.addEventListener('click', this.newColorClicked );
    });

    this.seek.value = 0;

    this.videoButton.addEventListener('click', () => {
      if ( this.videoButton.classList.contains('active') ) {
        this.video.pause();
        this.videoStatus = false;
        this.socket.emit('pauseVideo');
        this.app.render();
        this.videoButton.classList.remove('active');
      } else {
        this.video.play();
        this.videoStatus = true;
        this.socket.emit('playVideo');
        this.app.render();
        this.videoButton.classList.add('active');
      }
    });
    
    this.video.addEventListener('timeupdate', () => {
      this.seek.value = Math.floor(this.video.currentTime);
    });

    this.seek.addEventListener('input', ( event ) => {
      const skipTo = event.target.dataset.seek ? event.target.dataset.seek : event.target.value;
      this.video.currentTime = skipTo;
      this.seek.value = skipTo;
      this.socket.emit('skipTo', skipTo);
      if ( !this.videoStatus ) {
        this.app.render();
        console.log( 'vs' );
      }
    });
    document.querySelector('.pull-tab').addEventListener('click', this.toggleRightShelf.bind(this) );

  }

  toggleRightShelf () {
    if ( this.rightShelf.classList.contains('open') ) {
      const closeEvent = new Event('closeSidebar');
      document.dispatchEvent(closeEvent);
      this.rightShelf.classList.remove( 'open' );
    } else {
      const openEvent = new Event('openSidebar');
      document.dispatchEvent(openEvent);
      this.rightShelf.classList.add( 'open' );
      this.state = 'icon';
    }
  }

  newColorClicked = ( event ) => {
    event.target.classList.add('active-color');
    this.color = document.querySelector('.active-color').dataset.color;
    this.state = 'paint';
    const openEvent = new Event('openSidebar');
    document.dispatchEvent(openEvent);
  }

}

class LineSidebar {
  constructor ( scene, sidebar, data ) {
    this._id = LineSidebar.incrementId();
    this.scene = scene;
    this.sidebar = sidebar;
    this.sidebar.lineId = this._id;
    this.socketId = this.sidebar.socket.id;
    console.log( this.socketId );
    if ( data ) { /// Si es una copia a través de Broadcast
      this.color = data.color;
      this.nameId = `line_${ data.socketId }_${ data.id }`;
    } else { // Si es original
      this.color = this.sidebar.color;
      this.nameId = `line_${ this.socketId }_${ this._id }`;
      console.log( this.nameId );
    }

  }

  static incrementId() {

    if (!this.latestId) this.latestId = 1;
    else this.latestId++;
    return this.latestId;

  }

  createObject = () => {

    const geometry = new MeshLine();

    let matLine = new MeshLineMaterial( {
      color: this.color,
      lineWidth: 2,
    } );

    this.line = new Mesh( geometry, matLine );
    this.line.name = this.nameId;
    this.line.scale.set( 1, 1, 1 );
    this.line.frustumCulled = false;

  }

  createElement = () => {
    this.elem = document.createElement('DIV');
    this.elem.classList.add( 'line' );
    this.elem.style.border = 'solid 3px ' + this.sidebar.color;
    this.elem.style.boxShadow = '2px 2px 4px rgb(0, 0, 0, 0.6)';
    const container = document.querySelector('.linesToDelete');
    container.appendChild(this.elem);
    this.elem.addEventListener('mouseover', this.hover);
    this.elem.addEventListener('mouseout', this.unHover);
    this.elem.addEventListener('click', this.erase);
  }

  hover = () => {
    this.line.material.uniforms.lineWidth.value = 4;
    this.sidebar.app.render();
  }

  unHover = () => {
    this.line.material.uniforms.lineWidth.value = 2;
    this.sidebar.app.render();
  }

  erase = () => {
    this.elem.removeEventListener('mouseover', this.hover);
    this.elem.removeEventListener('mouseout', this.unHover);
    this.elem.removeEventListener('click', this.erase);

    this.elem.remove();
    this.scene.remove( this.line );
    this.sidebar.socket.emit( 'remove', {'id': this._id, 'type': 'line', 'socketId': this.socketId } );
    this.sidebar.controls.dispatchEvent({ type: 'change' });
  }

}

class IconSidebar {

  constructor ( position, scene, sidebar, data ) {
    this.position = position;
    this._id = IconSidebar.incrementId();
    this.scene = scene;
    this.sidebar = sidebar;
    this.socketId = this.sidebar.socket.id;
    this.sidebar.iconId = this._id;
    this.active = document.querySelector('.ico-content.active');
    this.iconArray = Array.prototype.slice.call( document.querySelector('.modal-content').children );
    this.activeIndex = this.iconArray.indexOf( this.active );
    this.viewType = window.location.pathname.split('/')[2];
    if ( data ) { /// Si es una copia a través de Broadcast
      this.iconType = `icon-${ data.type }`;
      this.nameId = `icon_${ data.socketId }_${ data._id }`;
    } else { // Si es original
      this.iconType = this.sidebar.iconClass;
      this.nameId = `icon_${ this.socketId }_${ this._id }`;
    }

  }

  static incrementId() {

    if (!this.latestId) this.latestId = 1;
    else this.latestId++;
    return this.latestId;

  }

  createObject () {

    const lineMaterial = new LineBasicMaterial( {
      color: '#fff',
      linewidth: 1
    } );

    const geometry = new BufferGeometry();

    const vertices = new Float32Array( [
      0.0, 0.0, 0.0,
      0.0, -10.0, 0.0 
    ] );

    geometry.setAttribute('position', new BufferAttribute( vertices, 3 ) );

    const line = new Line( geometry, lineMaterial );

    const group = new Group();
    group.name = this.nameId;
    group.add( line );
    group.position.set( this.position.x, this.position.y + 10., this.position.z );

    var icon = this.iconArray[this.activeIndex].querySelector('svg').cloneNode( true );
    icon.style = 'width: 60px; height: 60px;';
    this.prueba = icon;
    console.log( icon );
//    const icon = document.createElement( 'div' );
//    icon.classList.add( this.iconType );
//    icon.style.color = 'white';
//    icon.style.fontSize = '30px';
//    icon.style['-webkit-text-stroke'] = '1px black';

    this.label = new CSS2DObject( icon );

    group.add( this.label );
    this.group = group;
    this.scene.add( group );

  }

  createElement () {

    this.elem = document.createElement( 'div' );
    this.elem.classList.add( this.sidebar.iconClass );
    const container = document.querySelector( '.iconsToDelete' );
    container.appendChild( this.elem );

    this.elem.addEventListener('mouseover', this.hover);
    this.elem.addEventListener('mouseout', this.unHover);
    this.elem.addEventListener('click', this.erase);
      
  }

  hover = () => {

    this.group.children[1].element.style.color = 'indianred';
    this.group.children[1].element.style.fontSize = '40px';

  }

  unHover = () => {

    this.group.children[1].element.style.color = 'white';
    this.group.children[1].element.style.fontSize = '30px';

  }

  erase = () => {
    this.elem.removeEventListener('mouseover', this.hover);
    this.elem.removeEventListener('mouseout', this.unHover);
    this.elem.removeEventListener('click', this.erase);

    this.elem.remove();
    this.label.element.remove();
    this.scene.remove( this.group );
    this.sidebar.socket.emit( 'remove', {'id': this._id, 'type': 'icon', 'socketId': this.socketId } );
    this.sidebar.controls.dispatchEvent({ type: 'change' });

  }

}

export { Sidebar, LineSidebar, IconSidebar };
