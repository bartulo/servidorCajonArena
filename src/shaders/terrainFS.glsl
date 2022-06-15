uniform sampler2D texture;
uniform sampler2D texture2;
uniform sampler2D texture_at;
uniform float u_time;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {

  vec4 tColor = texture2D( texture, vUv );
  vec4 tColor2 = texture2D( texture2, vUv );
  vec4 fuego = texture2D( texture_at, vUv );
  float sombreado = step( -0.005, u_time - fuego.r ) * fuego.a;

//  gl_FragColor = vec4( mix( tColor.rgb, tColor2.rgb, tColor2.a ), 1.0 );
  gl_FragColor = vec4( mix( tColor.rgb, vec3( 0., 0., 0. ), sombreado * 0.7 ), 1.0 );

}
