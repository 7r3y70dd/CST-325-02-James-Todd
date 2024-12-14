attribute vec3 aVertexPosition;

varying vec3 vTexCoord;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main(void) {
    vTexCoord = aVertexPosition;
    vec4 pos = uProjectionMatrix * uViewMatrix * vec4(aVertexPosition, 1.0);
    gl_Position = pos.xyww; // Preserve depth for a seamless skybox
