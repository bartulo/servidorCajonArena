import { ShaderMaterial } from 'three';

class TerrainMaterial extends ShaderMaterial {
  constructor () {

    super( {

      vertexShader: require('./terrainShader.vs'),
      fragmentShader: require('./terrainShader.fs')

    });

  }

}

export { TerrainMaterial }

