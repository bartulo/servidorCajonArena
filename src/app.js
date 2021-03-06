import {
	Mesh,
	PerspectiveCamera,
	Scene,
  VideoTexture,
  ShaderMaterial,
  WebGL1Renderer,
  RGBAFormat,
  Color,
  OrthographicCamera,
  Group,
  Object3D,
} from 'three';

import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { io } from 'socket.io-client';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OrbitControlsMod } from './OrbitControlsMod';
import { Sidebar, IconSidebar, LineSidebar } from './sidebar.js';

require.context('./images', true, /\.(png|bin|webm)$/)
import './css/sidebar.css';
import './css/main.css';

class App {

	init() {

    this.viewType = window.location.pathname.split('/')[2];
    this.escenario = window.location.pathname.split('/')[3];
    this.room = window.location.pathname.split('/')[4];
    this.socket = io( );
    this.socket.emit( 'data', { tipo: this.viewType, escenario: this.escenario, room: this.room } ); 
    this.video = document.createElement('video');
    this.video.style['display'] = 'none';
    this.video.src = `/images/video_${ this.escenario }.webm`;
    this.video.muted = true;
    const body = document.body;
    body.appendChild( this.video );
    this.sidebar = new Sidebar( this.socket );
    this.sidebar.app = this;
    this.terrainVS = require('./shaders/terrainVS.glsl');
    this.terrainFS = require('./shaders/terrainFS.glsl');

    if ( this.viewType == 'visor' ) {

      this.sidebar.init();
      this.camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );

    } else if ( this.viewType == 'proyector' ) {

      this.camera = new OrthographicCamera( -1920 / 5.6, 1920 / 5.6, 1080 / 5.6, -1080 / 5.6, 1, 1000);
    }
    this.camera.position.set( 0, 700, 0 );

		this.scene = new Scene();

    this.groupMaster = new Group();
    this.groupMaster.name = 'master';
    this.scene.add( this.groupMaster );
    this.groupRoom1 = new Group();
    this.groupRoom1.name = 'room1';
    this.scene.add( this.groupMaster );
    this.groupRoom2 = new Group();
    this.groupRoom2.name = 'room2';
    this.scene.add( this.groupMaster );
    this.scene.add( this.groupRoom1 );
    this.scene.add( this.groupRoom2 );

    this.groupRoom1.visible = false;
    this.groupRoom2.visible = false;

    if ( this.room !== 'master' && this.room !== undefined) {

      this.scene.getObjectByName( this.room ).visible = true;

    }

		this.renderer = new WebGL1Renderer( { antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( new Color('#32383f') )
		document.body.appendChild( this.renderer.domElement );

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize( window.innerWidth, window.innerHeight );
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
		document.body.appendChild( this.labelRenderer.domElement );
    this.video.addEventListener('seeked', () => {
      setTimeout(() => {
        this.render();
      }, 100);
    });

		window.addEventListener( 'resize', this.onWindowResize.bind( this ), false );
    document.querySelector('.modal-content').addEventListener('click', ( e ) => {
      document.querySelector('.ico-content.active').classList.remove('active');
      e.target.closest('.ico-content').classList.add('active');
    })

    if ( this.viewType == 'visor' ) {
      const controls = new OrbitControlsMod( this.camera, this.renderer.domElement, this.scene, this.sidebar, this.socket );

      controls.screenSpacePanning = false;
      controls.maxPolarAngle = Math.PI / 2;
      // TODO
      //controls.addEventListener('change', this.render.bind( this ) );
    } else if ( this.viewType == 'proyector' ) {
      const controls = new OrbitControls( this.camera, this.renderer.domElement );
      controls.enabled = false;
    }

    const textureVideo = new VideoTexture( this.video );
    textureVideo.format = RGBAFormat;
    this.texture.transparent = true;

    var uniforms = {
      texture: { type: 't', value: this.texture },
      texture2: { type: 't', value: textureVideo },
      texture_at: { type: 't', value: this.texture_at },
      //// TODO
      u_time: { type: 'f', value: 0 }
    }
    this.material = new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.terrainVS,
      fragmentShader: this.terrainFS,
    });

    if ( this.viewType == 'visor' & this.room == 'master' ) {
      this.textureButton = document.querySelector('.textureButton')

      this.textureButton.addEventListener('click', this.changeTexture.bind( this ) );

    }

    if ( this.room == 'master' || this.room == undefined ) {
      this.socket.on( 'mostrarRoom', ( room ) => {
        this.scene.getObjectByName(room).visible = true;
        this.render();
      });
    }

    const plane = new Mesh(this.geometry, this.material);
    plane.rotation.set( Math.PI / 2, Math.PI, Math.PI );
    plane.name = 'terrain';
    this.scene.add(plane);
    this.render();

    this.socket.on( 'icon', ( data ) => {
      const icon = new IconSidebar( data.coords, this.scene, this.sidebar, data );
      icon.activeIndex = data.index;
      icon.createObject();
      this.render();
    });

    this.socket.on( 'linea', ( data ) => {
      const line = new LineSidebar ( this.scene, this.sidebar, data );
      line.createObject();
      line.line.geometry.setPoints( data.points );
      this.scene.getObjectByName( data.room ).add( line.line );
      this.render();
    });

    this.socket.on( 'remove', ( id ) => {
      const elem = this.scene.getObjectByName( `${ id.type }_${ id.socketId }_${ id.id }` );
      if ( id.type == 'icon' ) {
        elem.children[1].element.remove();
      }
      this.scene.getObjectByName( id.room ).remove( elem );
      this.render();
    });

    this.socket.on('tecla', ( data ) => {
      if ( data == 'topo' ) {
        this.material.uniforms.texture.value = this.texture2;
      } else if ( data == 'pnoa' ) {
        this.material.uniforms.texture.value = this.texture;
      }
      this.render();
    });

    this.socket.on( 'playVideo', () => {
      this.video.play();
      this.render();
    });

    this.socket.on( 'pauseVideo', () => {
      this.video.pause();
      this.render();
    });

    this.socket.on( 'skipTo', ( skipTo ) => {
      this.video.currentTime = skipTo;
      this.render();
    });

    this.video.addEventListener('ended', () => {
    })

	}

  onWindowResize() {

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.labelRenderer.setSize( window.innerWidth, window.innerHeight );

    this.render();

  }

  render() {

    if ( this.video.paused == false ) {
      requestAnimationFrame( this.render.bind( this ) );
      //TODO
      this.material.uniforms.u_time.value += 0.0005;
    }
    this.renderer.render( this.scene, this.camera );
    this.labelRenderer.render( this.scene, this.camera );

  }

  changeTexture() {

    if ( this.material.uniforms.texture.value == this.texture ) {

      this.material.uniforms.texture.value = this.texture2;
      this.socket.emit( 'tecla', 'topo' );
      this.textureButton.innerHTML = 'Ortofoto';

    } else {

      this.material.uniforms.texture.value = this.texture;
      this.socket.emit( 'tecla', 'pnoa' );
      this.textureButton.innerHTML = 'Topo';

    }
    this.render();
  }

}

export { App };
