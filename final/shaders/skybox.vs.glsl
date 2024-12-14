attribute vec3 aVertexPosition;
varying vec3 vPosition;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
    // Pass through the vertex position for the fragment shader
    vPosition = aVertexPosition;

    // Transform vertex position with view and projection matrices
    gl_Position = uProjectionMatrix * uViewMatrix * vec4(aVertexPosition, 1.0);

    // Set depth value to ensure the skybox is drawn last
    gl_Position.z = gl_Position.w;
}