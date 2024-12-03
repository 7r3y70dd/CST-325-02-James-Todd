
    attribute vec3 aVertexPosition;

    uniform mat4 uWorldMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying float vDepth;

    void main(void) {
        gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aVertexPosition, 1.0);

        // todo #4 convert clip space depth into NDC and remap from [-1, 1] to [0, 1]
        // The value of vDepth is temporarily set to gl_Position.z;
        vDepth = gl_Position.z;  
    }

