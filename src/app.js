import {
	PlaneGeometry,
	Mesh,
	MeshBasicMaterial,
  TextureLoader,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
  VideoTexture,
  ShaderMaterial,
  WebGL1Renderer,
  RGBAFormat,
  Color
} from 'three';

//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { io } from 'socket.io-client';

import TerrainLoader from './terrain.js';
import TerrainMaterial from './terrainMaterial';
import { OrbitControlsMod } from './OrbitControlsMod';
import { Sidebar } from './sidebar.js';

import Mdt from './images/mdt.bin';
require.context('./images', true, /\.png$/)
import './css/sidebar.css';
import './icons/style.css';


class App {

	init() {

    this.escenario = window.location.pathname.split('/')[2];
    this.socket = io();
    const video = document.createElement('video');
    video.style['display'] = 'none';
    video.src = 'images/faja_transparente4.webm';
    const body = document.body;
    body.appendChild( video );
    this.sidebar = new Sidebar();
    this.sidebar.init();


		this.camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
		this.camera.position.set( 0, 8000, 0 );

		this.scene = new Scene();
    this.scene.background = 'black';

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

		const controls = new OrbitControlsMod( this.camera, this.renderer.domElement, this.scene, this.sidebar );

    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    var terrainLoader = new TerrainLoader();
    terrainLoader.load(Mdt, ( data ) => {
      const geometry = new PlaneGeometry( 4700, 2600, 399, 224 );
      this.texture = new TextureLoader().load(`/visor/static/pnoa_${ this.escenario }.png`);
      const textureVideo = new VideoTexture( video );
      textureVideo.format = RGBAFormat;
      this.texture.transparent = true;

      this.texture2 = new TextureLoader().load(`/visor/static/topo_${ this.escenario }.png`);

      var uniforms = {
        texture: { type: 't', value: this.texture },
        texture2: { type: 't', value: textureVideo }
      }
      this.material = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertex_shader' ).textContent,
        fragmentShader: document.getElementById( 'fragment_shader' ).textContent
      });

      this.textureButton = document.querySelector('.textureButton')

      this.textureButton.addEventListener('click', this.changeTexture.bind( this ) );

      for (let i = 0; i < data.length; i++) {
        geometry.attributes.position.array[(i*3) + 2] = data[i] ;
      }

      const plane = new Mesh(geometry, this.material);
      plane.rotation.set( Math.PI / 2, Math.PI, Math.PI );
      this.scene.add(plane);
    });

		this.animate();

	}

  onWindowResize() {

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.labelRenderer.setSize( window.innerWidth, window.innerHeight );

  }

  animate() {

    requestAnimationFrame( this.animate.bind( this ) );
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
  }

}

export { App };
