import {
	Mesh,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
  VideoTexture,
  ShaderMaterial,
  WebGL1Renderer,
  RGBAFormat,
  Color,
  OrthographicCamera
} from 'three';

import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { io } from 'socket.io-client';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OrbitControlsMod } from './OrbitControlsMod';
import { Sidebar, IconSidebar } from './sidebar.js';

require.context('./images', true, /\.(png|bin|webm)$/)
import Config from './config/config.json';
import './css/sidebar.css';
import './icons/style.css';


class App {

	init() {

    this.escenario = window.location.pathname.split('/')[3];
    this.viewType = window.location.pathname.split('/')[2];
    this.config = Config.filter( obj => obj.name === this.escenario )[0];
    this.socket = io();
    const video = document.createElement('video');
    video.style['display'] = 'none';
    video.src = `/visor/static/video_${ this.escenario }.webm`;
    const body = document.body;
    body.appendChild( video );
    this.sidebar = new Sidebar( this.socket );

    if ( this.viewType == 'visor' ) {

      this.sidebar.init();
      this.camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );

    } else if ( this.viewType == 'proyector' ) {

      this.camera = new OrthographicCamera( -1920 / 5.6, 1920 / 5.6, 1080 / 5.6, -1080 / 5.6, 1, 1000);
    }
    this.camera.position.set( 0, 700, 0 );

		this.scene = new Scene();

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

		window.addEventListener( 'resize', this.onWindowResize.bind( this ), false );

    if ( this.viewType == 'visor' ) {
      const controls = new OrbitControlsMod( this.camera, this.renderer.domElement, this.scene, this.sidebar, this.socket );

      controls.screenSpacePanning = false;
      controls.maxPolarAngle = Math.PI / 2;
      controls.addEventListener('change', this.render.bind( this ) );
    } else if ( this.viewType == 'proyector' ) {
      const controls = new OrbitControls( this.camera, this.renderer.domElement );
      controls.enabled = false;
    }

    const textureVideo = new VideoTexture( video );
    textureVideo.format = RGBAFormat;
    this.texture.transparent = true;

    var uniforms = {
      texture: { type: 't', value: this.texture },
      texture2: { type: 't', value: textureVideo }
    }
    this.material = new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: document.getElementById( 'vertex_shader' ).textContent,
      fragmentShader: document.getElementById( 'fragment_shader' ).textContent
    });

    if ( this.viewType == 'visor' ) {
      this.textureButton = document.querySelector('.textureButton')

      this.textureButton.addEventListener('click', this.changeTexture.bind( this ) );
    }

    const plane = new Mesh(this.geometry, this.material);
    plane.rotation.set( Math.PI / 2, Math.PI, Math.PI );
    this.scene.add(plane);
    this.render();

    this.socket.on( 'icon', ( data ) => {
      const icon = new IconSidebar( data.coords, this.scene, this.sidebar, data );
      icon.createObject();
      this.render();
    });
// TODO poner nombre de socket para borrar el icono adecuado
    this.socket.on( 'remove', ( id ) => {
      const icon = this.scene.getObjectByName( `${ id.type }_${ id.id }` );
      icon.children[1].element.remove();
      this.scene.remove( icon );
      console.log( this.scene.children );
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
	}

  onWindowResize() {

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.labelRenderer.setSize( window.innerWidth, window.innerHeight );

    this.render();

  }

  render() {

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
