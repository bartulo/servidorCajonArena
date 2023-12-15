uniform sampler2D texture;
uniform sampler2D texture2;
uniform float minZ;
uniform float maxZ;
uniform float widthS;
uniform float curvas;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vPosition;

void main() {

  vec4 tColor = texture2D( texture, vUv );
  vec4 tColor2 = texture2D( texture2, vUv );

  float minAlt = minZ * 1.2 * 680./ (widthS * 1000.);
  float maxAlt = maxZ * 1.2 * 680./ (widthS * 1000.);
  float difAlt = maxAlt - minAlt;

  float alt = ((vPosition.z - minAlt) / difAlt) * curvas;
  float color = ceil(alt) / curvas;

  gl_FragColor = vec4( 0.0, color, 0.0, 1.0 );

}
