// Vertex shader
const vertexShaderSource = `
    attribute vec4 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
        vNormal = aNormal;
        vPosition = vec3(uModelMatrix * aPosition);
    }
`;

// Fragment shader
const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 uLightPosition;
    uniform vec3 uLightColor;
    uniform vec3 uObjectColor;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
        vec3 lightDir = normalize(uLightPosition - vPosition);
        float diff = max(dot(normalize(vNormal), lightDir), 0.0);
        vec3 diffuse = diff * uLightColor;
        gl_FragColor = vec4((diffuse + 0.1) * uObjectColor, 1.0);
    }
`;

// Utility functions
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking program:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function createSphere(radius, latBands, longBands) {
    const vertices = [];
    const normals = [];
    const indices = [];

    for (let lat = 0; lat <= latBands; lat++) {
        const theta = (lat * Math.PI) / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let long = 0; long <= longBands; long++) {
            const phi = (long * 2 * Math.PI) / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            const u = 1 - long / longBands;
            const v = 1 - lat / latBands;

            normals.push(x, y, z);
            vertices.push(radius * x, radius * y, radius * z);
        }
    }

    for (let lat = 0; lat < latBands; lat++) {
        for (let long = 0; long < longBands; long++) {
            const first = lat * (longBands + 1) + long;
            const second = first + longBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return { vertices, normals, indices };
}

function main() {
    const canvas = document.getElementById("webglCanvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("WebGL not supported");
        return;
    }

    // Compile shaders and link program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    gl.useProgram(program);

    // Create spheres
    const sun = createSphere(1.0, 30, 30);
    const earth = createSphere(0.5, 30, 30);
    const moon = createSphere(0.2, 30, 30);

    // Buffer data
    function createBuffer(data, type, usage) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, new Float32Array(data), usage);
        return buffer;
    }

    const sunVertexBuffer = createBuffer(sun.vertices, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    const sunNormalBuffer = createBuffer(sun.normals, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    const sunIndexBuffer = createBuffer(sun.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);

    // Bind attributes and uniforms
    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aNormal = gl.getAttribLocation(program, "aNormal");
    const uModelMatrix = gl.getUniformLocation(program, "uModelMatrix");
    const uViewMatrix = gl.getUniformLocation(program, "uViewMatrix");
    const uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");

    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
    mat4.lookAt(viewMatrix, [0, 0, 10], [0, 0, 0], [0, 1, 0]);

    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix);

    function drawSphere(buffer, normalBuffer, indexBuffer, modelMatrix) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);

        gl.drawElements(gl.TRIANGLES, sun.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    function animate() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const sunModelMatrix = mat4.create();
        mat4.rotateY(sunModelMatrix, sunModelMatrix, performance.now() / 1000);

        const earthModelMatrix = mat4.create();
        mat4.rotateY(earthModelMatrix, earthModelMatrix, performance.now() / 2000);
        mat4.translate(earthModelMatrix, earthModelMatrix, [3, 0, 0]);

        const moonModelMatrix = mat4.create();
        mat4.rotateY(moonModelMatrix, moonModelMatrix, performance.now() / 500);
        mat4.translate(moonModelMatrix, moonModelMatrix, [1, 0, 0]);

        drawSphere(sunVertexBuffer, sunNormalBuffer, sunIndexBuffer, sunModelMatrix);
        drawSphere(sunVertexBuffer, sunNormalBuffer, sunIndexBuffer, earthModelMatrix);
        drawSphere(sunVertexBuffer, sunNormalBuffer, sunIndexBuffer, moonModelMatrix);

        requestAnimationFrame(animate);
    }

    animate();
}

main();