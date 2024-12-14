precision mediump float;

varying float vDepth;
varying vec3 vWorldPosition;
uniform mat4 uLightVPMatrix;
uniform mat4 uProjectionMatrix;

void main(void) {
    gl_FragColor = vec4(vDepth, vDepth, vDepth, 1.0);

}

