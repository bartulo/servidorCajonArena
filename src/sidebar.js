import JsTabs from 'js-tabs';
import 'js-tabs/src/_js-tabs-base.scss';
import { BufferGeometry, LineBasicMaterial, Line, Group, BufferAttribute, Mesh } from 'three';
import {CSS2DObject} from 'three/examples/jsm/renderers/CSS2DRenderer';
import {io} from 'socket.io-client';
import { MeshLine } from './meshline/meshline';
import { MeshLineMaterial } from './meshline/material';


class Sidebar {
  constructor ( socket ) {
    this.socket = socket;

  }

  init () {
    this.menu = document.querySelector('#menuIcon');
    this.sidenav = document.querySelector('#sidenav');
    this.closeButton = document.querySelector('.closebtn');
    this.state = null;
    this.color = '#ffd700';
    this.icon = 'binoculars';
    this.iconClass = 'icon-binoculars';
    this.video = document.querySelector('video');
    this.play = document.getElementById('play');
    this.pause = document.getElementById('pause');
    this.seek = document.getElementById('seek');

    this.menu.addEventListener('click', this.openSidebar.bind(this));

    this.closeButton.addEventListener('click', this.closeSidebar.bind(this))
    const myTabs = new JsTabs({
      elm: '#jsTabs',
      onClickHandlerComplete: this.changeState.bind(this)
    });
    document.querySelectorAll('.colors li').forEach( item => {
      item.addEventListener('click', this.colorClicked );
    });

    document.querySelectorAll('.icon div').forEach( item => {
      item.addEventListener('click', this.iconClicked);
    });
    myTabs.init();

    this.seek.setAttribute('max', 25 );
    this.seek.value = 0;

    this.play.addEventListener('click', () => {
      this.video.play();
      this.socket.emit('playVideo');
    });

    this.pause.addEventListener('click', () => {
      this.video.pause();
      this.socket.emit('pauseVideo');
    });

    this.video.addEventListener('timeupdate', () => {
      this.seek.value = Math.floor(this.video.currentTime);
    });

    this.seek.addEventListener('mousemove', ( event ) => {
      const skipTo = Math.round( ( event.offsetX / event.target.clientWidth ) * 26 );
      this.seek.setAttribute('data-seek', skipTo);
    });

    this.seek.addEventListener('input', ( event ) => {
      const skipTo = event.target.dataset.seek ? event.target.dataset.seek : event.target.value;
      this.video.currentTime = skipTo;
      this.seek.value = skipTo;
      this.socket.emit('skipTo', skipTo);
    });

  }

  openSidebar () {
    const openEvent = new Event('openSidebar');
    this.sidenav.dispatchEvent(openEvent);
    this.state = document.querySelector('.js-tabs__tab.active').title;
    if ( window.innerWidth > 1024 ) {
      this.sidenav.style.width = '350px';
    } else {
      this.sidenav.style.width = '232px';
    }
  }

  closeSidebar () {
    const closeEvent = new Event('closeSidebar');
    this.sidenav.dispatchEvent(closeEvent);
    this.state = null;
    this.sidenav.style.width = 0;
  }

  changeState () {
    let state = document.querySelector('.js-tabs__tab.active');
    this.state = state.title;
  }

  colorClicked = ( event ) => {
    let oldColor = document.querySelector('.active-color');
    oldColor.classList.remove('active-color');
    event.target.classList.add('active-color');
    this.color = document.querySelector('.active-color').dataset.color;
  }

  iconClicked = ( event ) => {
    let oldIcon = document.querySelector('.active-icon');
    oldIcon.classList.remove('active-icon');
    event.target.classList.add('active-icon');
    this.icon = document.querySelector('.active-icon').dataset.image;
    this.iconClass = document.querySelector('.active-icon').classList[0];
  }

}

class LineSidebar {
  constructor ( scene, sidebar ) {
    this._id = LineSidebar.incrementId();
    this.scene = scene;
    this.sidebar = sidebar;
    this.sidebar.lineId = this._id;
  }

  static incrementId() {

    if (!this.latestId) this.latestId = 1;
    else this.latestId++;
    return this.latestId;

  }

  createObject = () => {

    const geometry = new MeshLine();

    let matLine = new MeshLineMaterial( {
      color: this.sidebar.color,
      lineWidth: 2,
    } );

    this.line = new Mesh( geometry, matLine );
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
    this.interval = setInterval( () => {

      if (this.line.material.visible ) {

        this.line.material.visible = false;

      } else {

        this.line.material.visible = true;

      }
    }, 160);
  }

  unHover = () => {
    clearInterval( this.interval );
    this.line.material.visible = true;
  }

  erase = () => {
    this.elem.removeEventListener('mouseover', this.hover);
    this.elem.removeEventListener('mouseout', this.unHover);
    this.elem.removeEventListener('click', this.erase);

    this.elem.remove();
    this.scene.remove( this.line );
    this.sidebar.socket.emit( 'remove', {'id': this._id, 'type': 'line' } );
    this.sidebar.controls.dispatchEvent({ type: 'change' });
  }

}

class IconSidebar {

  constructor ( position, scene, sidebar, data ) {
    this.position = position;
    this._id = IconSidebar.incrementId();
    this.scene = scene;
    this.sidebar = sidebar;
    this.sidebar.iconId = this._id;
    this.viewType = window.location.pathname.split('/')[2];
    if ( data ) {
      this.iconType = `icon-${ data.type }`;
      this.nameId = `icon_${ data._id }`;
    } else {
      this.iconType = this.sidebar.iconClass;
      this.nameId = `icon_${ this._id }`;
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
      linewidth: 4
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

    const icon = document.createElement( 'div' );
    icon.classList.add( this.iconType );
    icon.style.color = 'white';
    icon.style.fontSize = '30px';
    icon.style['-webkit-text-stroke'] = '1px black';

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
    this.sidebar.socket.emit( 'remove', {'id': this._id, 'type': 'icon' } );
    this.sidebar.controls.dispatchEvent({ type: 'change' });

  }

}

export { Sidebar, LineSidebar, IconSidebar };
