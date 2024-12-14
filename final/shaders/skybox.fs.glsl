precision mediump float;

varying vec3 vPosition; // Interpolated position from the vertex shader
uniform samplerCube uCubeMap; // Cube map sampler

void main() {
    // Sample the cube map texture using the interpolated position
    gl_FragColor = textureCube(uCubeMap, normalize(vPosition));
}