
class TerrainLoader { 
  constructor() {
  }

  load ( url, onLoad, onProgress, onError ) {
    var request = new XMLHttpRequest();

    if ( onLoad != undefined ) {
      request.addEventListener( 'load', function( event ) {
        onLoad( new Uint16Array( event.target.response ) );
      }, false );

    }

    if ( onProgress != undefined ) {
      request.addEventListener( 'progress', function( event ) {
        onProgress( event );
      }, false );
    }

    if ( onError != undefined ) {
      request.addEventListener( 'error', function( event ) {
        onError( event );
      }, false );
    }

    if ( this.crossOrigin !== undefined ) request.crossOrigin = this.crossOrigin;

    request.open( 'GET', url, true );
    request.responseType = 'arraybuffer';
    request.send( null );
  }

  setCrossOrigin ( value ) {
    this.crossOrigin = value;

  }
}

export default TerrainLoader;
