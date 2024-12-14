precision mediump float;

varying vec3 vTexCoord;

uniform samplerCube uSkybox;

void main(void) {
    gl_FragColor = textureCube(uSkybox, vTexCoord);
}