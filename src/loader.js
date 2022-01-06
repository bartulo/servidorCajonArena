import {
  TextureLoader, 
  FileLoader,
  PlaneGeometry
} from 'three';

import TerrainLoader from './terrain.js';
import { App } from './app.js';
import Config from './config/config.json';
require.context('./images', true, /\.(png|bin)$/);

class AssetsLoader {

  constructor () {
    this.app = new App();
    this.loc = window.location.pathname.split('/')[3];
    this.config = Config.filter( obj => obj.name === this.loc )[0];
  }

  init () {
    const loader = new TextureLoader();
    let promises = []

    promises.push( new Promise( resolve => {
      loader.load( `/visor/static/pnoa_${ this.loc }.png`, ( t ) => {
        this.app.texture = t;

        resolve( );
      });
    }));

    promises.push( new Promise( resolve => {
      loader.load( `/visor/static/topo_${ this.loc }.png`, ( t ) => {
        this.app.texture2 = t;

        resolve( );
      });
    }));

    const terrainLoader = new TerrainLoader();

    promises.push( new Promise( resolve => {
      terrainLoader.load( `/visor/static/mdt_${ this.loc }.bin`, ( data )=> {
        console.log( data );
        console.log( this.config.meshWidth );
        this.app.geometry = new PlaneGeometry( 680, 384, this.config.meshWidth - 1, this.config.meshHeight - 1);

        for ( let i = 0; i < this.config.meshWidth * this.config.meshHeight; i++ ) {
          this.app.geometry.attributes.position.array[ i * 3 + 2 ] = data[ i ] * 1.2 / ( this.config.widthKm * 1000 / 680 );
        }

        console.log( this.app.geometry.attributes.position );
        resolve( );
      });
    }));

    Promise.all( promises ).then( () => {
      this.app.init();
    });

  }

  loadASC ( data ) {
    const d = data.split( /\r\n|\n/ );
    d.splice( 0, 6 );
    const e = d.map( elem => {
      return elem.substring( 1 );
    });
    const f = e.join( ' ' ).split( ' ' );
    f.pop();
    return new Float32Array( f );
  }


}



export { AssetsLoader }