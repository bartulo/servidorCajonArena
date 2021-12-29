uniform sampler2D texture;
uniform sampler2D texture2;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {

	vec4 tColor = texture2D( texture, vUv );
	vec4 tColor2 = texture2D( texture2, vUv );

	// hack in a fake pointlight at camera location, plus ambient
	vec3 normal = normalize( vNormal );
	vec3 lightDir = normalize( vViewPosition );

	float dotProduct = max( dot( normal, lightDir ), 0.0 ) + 0.2;

	gl_FragColor = vec4( mix( tColor.rgb, tColor2.rgb, tColor2.a ), 1.0 ) * dotProduct;

}

