'use strict'

var gl;

var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput); // used to create the view matrix for our normal "eye"
var lightCamera = new Camera();         // used to create the view matrix for our light's point of view

var sphereGeometry = null;
var skyboxGeometry = null;
var skyboxShaderProgram = null;
var skyboxTexture = null;

// the projection from our normal eye's view space to its clip space
var projectionMatrix = new Matrix4();

// the projection from the light's view space to its clip space
var shadowProjectionMatrix = new Matrix4();

// although our light will be a directional light, we need to render depth from its point of view starting somewhere relatively close
var lightPos = new Vector4(5, 3, 0, 1);
var directionToLight = new Vector4(lightPos.x, lightPos.y, lightPos.z, 0).normalize();

// the shader used to render depth values from the light's point of view
var depthWriteProgram;

// the shader program used to apply phong shading (will include shadow test)
var phongShaderProgram;

// variables holding references to things we need to render to an offscreen texture
var fbo;
var renderTexture;
var renderBuffer;

window.onload = window['initializeAndStartRendering'];

var loadedAssets = {
    phongTextVS: null, phongTextFS: null,
    depthWriteVS: null, depthWriteFS: null,
    teapotJSON: null,
    marbleImage: null,
    woodImage: null
};

// -------------------------------------------------------------------------
function initializeAndStartRendering() {
    initGL();
    loadAssets(function() {
        // Set the canvas background to the stars.jpg image
        const canvas = document.getElementById("webgl-canvas");
        canvas.style.background = "url('./data/stars.jpg')"; // Path to stars.jpg
        canvas.style.backgroundSize = "cover"; // Ensure it covers the canvas fully
        canvas.style.backgroundPosition = "center"; // Center the image

        createShaders(loadedAssets);
        createScene();
        createFrameBufferResources();

        updateAndRender();
    });
}

// -------------------------------------------------------------------------
function initGL(canvas) {
    var canvas = document.getElementById("webgl-canvas");

    try {
        gl = canvas.getContext("webgl");
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;

        gl.enable(gl.DEPTH_TEST);
    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------
function loadAssets(onLoadedCB) {
    var filePromises = [
        fetch('./shaders/phong.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/phong.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }), // Load sphere JSON
        fetch('./shaders/depth-write.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/depth-write.fs.glsl').then((response) => { return response.text(); }),
        loadImage('./data/th.jpg'),
        loadImage('./data/stars.jpg')
    ];

    Promise.all(filePromises).then(function(values) {
        loadedAssets.phongTextVS = values[0];
        loadedAssets.phongTextFS = values[1];
        loadedAssets.sphereJSON = values[2]; // Save sphere JSON
        loadedAssets.depthWriteVS = values[3];
        loadedAssets.depthWriteFS = values[4];
        loadedAssets.marbleImage = values[5];
    }).catch(function(error) {
        console.error(error.message);
    }).finally(function() {
        onLoadedCB();
    });
}

function createSkybox() {
    // Create a cube map
    const skyboxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);

    const targets = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];

    loadedAssets.skyboxImages.forEach((image, i) => {
        gl.texImage2D(targets[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    });

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return skyboxTexture;
}

function renderSkybox() {
    gl.useProgram(skyboxShaderProgram);

    const uniforms = skyboxShaderProgram.uniforms;
    gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix.elements);

    // Remove translation from the view matrix for the skybox
    const viewMatrixNoTranslation = camera.getViewMatrix().clone();
    viewMatrixNoTranslation.elements[12] = 0;
    viewMatrixNoTranslation.elements[13] = 0;
    viewMatrixNoTranslation.elements[14] = 0;

    gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrixNoTranslation.elements);

    // Bind the cube map texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);

    // Render the cube geometry
    skyboxGeometry.render();
}

// -------------------------------------------------------------------------
function createShaders(loadedAssets) {
    depthWriteProgram = createCompiledAndLinkedShaderProgram(loadedAssets.depthWriteVS, loadedAssets.depthWriteFS);

    depthWriteProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(depthWriteProgram, "aVertexPosition"),
    };

    depthWriteProgram.uniforms = {
        worldMatrixUniform:      gl.getUniformLocation(depthWriteProgram, "uWorldMatrix"),
        viewMatrixUniform:       gl.getUniformLocation(depthWriteProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(depthWriteProgram, "uProjectionMatrix"),
    };

    phongShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.phongTextVS, loadedAssets.phongTextFS);

    phongShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(phongShaderProgram, "aVertexPosition"),
        vertexTexCoordsAttribute: gl.getAttribLocation(phongShaderProgram, "aTexCoords"),
        vertexNormalsAttribute: gl.getAttribLocation(phongShaderProgram, "aNormal"),
    };

    phongShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uProjectionMatrix"),
        directionToLightUniform: gl.getUniformLocation(phongShaderProgram, "uDirectionToLight"),
        lightVPMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uLightVPMatrix"),
        cameraPositionUniform: gl.getUniformLocation(phongShaderProgram, "uCameraPosition"),
        albedoTextureUniform: gl.getUniformLocation(phongShaderProgram, "uAlbedoTexture"),
        shadowTextureUniform: gl.getUniformLocation(phongShaderProgram, "uShadowTexture")
    };
}

// -------------------------------------------------------------------------
function createScene() {
    // Replace teapot with a sphere
    sphereGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);

    // Use sphere.json or equivalent
    sphereGeometry.create(loadedAssets.sphereJSON, loadedAssets.marbleImage);

    var scale = new Matrix4().makeScale(0.5, 0.5, 0.5); // Scale the sphere appropriately
    sphereGeometry.worldMatrix.makeIdentity();
    sphereGeometry.worldMatrix.multiply(scale);
}

// -------------------------------------------------------------------------
function createFrameBufferResources() {
    var dimension = 2048;
    var width = dimension, height = dimension;

    // This lets WebGL know we want to use these extensions (not default in WebGL1)
    gl.getExtension("OES_texture_float");
    gl.getExtension("OES_texture_float_linear");

    // create and set up the texture that will be rendered into
    renderTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, renderTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // create an alternate frame buffer that we will render depth into (works in conjunction with the texture we just created)
    fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);
    fbo.width = fbo.height = dimension;

    renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    checkFrameBufferStatus();
}

// -------------------------------------------------------------------------
//function updateAndRender() {
//    requestAnimationFrame(updateAndRender);
//
//    // Get the latest values for deltaTime and elapsedTime
//    time.update();
//
//    var aspectRatio = gl.canvasWidth / gl.canvasHeight;
//
//    var yaw = 0, pitch = 0;
//    if (appInput.a) yaw -= 1;
//    if (appInput.d) yaw += 1;
//    if (appInput.w) pitch -= 1;
//    if (appInput.s) pitch += 1;
//
//    var yawMatrix = new Matrix4().makeRotationY(45.0 * time.deltaTime * yaw);
//    var pitchMatrix = new Matrix4().makeRotationX(45.0 * time.deltaTime * pitch);
//
//    // Rotate the light direction and position
//    var rotationMatrix = pitchMatrix.clone().multiply(yawMatrix);
//    directionToLight = rotationMatrix.multiplyVector(directionToLight);
//    lightPos = rotationMatrix.multiplyVector(lightPos);
//
//    let eyePos = new Vector3(lightPos.x, lightPos.y, lightPos.z);
//    let targetPos = new Vector3(0, 0, 0);
//    let worldUp = new Vector3(0, 1, 0);
//    lightCamera.cameraWorldMatrix.makeLookAt(eyePos, targetPos, worldUp);
//
//    camera.update(time.deltaTime);
//
//    // Render scene depth to texture
//    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
//    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
//
//    gl.clearColor(0, 1, 0, 1.0);
//    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//
//    // Specify what portion of the canvas to draw to (full width and height)
//    gl.viewport(0, 0, fbo.width, fbo.height);
//
//    shadowProjectionMatrix.makeOrthographic(-10, 10, 10, -10, 1, 20);
//
//    sphereGeometry.render(lightCamera, shadowProjectionMatrix, depthWriteProgram);
//
//    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
//
//    // Render scene normally and apply shadows
//    console.log("Camera Position:", camera.getPosition());
//    console.log("Camera View Matrix:", camera.getViewMatrix().elements);
//    console.log("Sphere World Matrix:", sphereGeometry.worldMatrix.elements);
//
//    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);
//
//
//    var lightVPMatrix = shadowProjectionMatrix.clone().multiply(lightCamera.getViewMatrix());
//
//    gl.useProgram(phongShaderProgram);
//    var uniforms = phongShaderProgram.uniforms;
//    var cameraPosition = camera.getPosition();
//    gl.uniform3f(uniforms.directionToLightUniform, directionToLight.x, directionToLight.y, directionToLight.z);
//    gl.uniform3f(uniforms.cameraPositionUniform, cameraPosition.x, cameraPosition.y, cameraPosition.z);
//    gl.uniformMatrix4fv(uniforms.lightVPMatrixUniform, false, lightVPMatrix.transpose().elements);
//
//    projectionMatrix.makePerspective(45, aspectRatio, 0.1, 1000);
//    sphereGeometry.render(camera, projectionMatrix, phongShaderProgram, renderTexture);
//}
// -------------------------------------------------------------------------
function updateAndRender() {
    requestAnimationFrame(updateAndRender);

    // Get the latest values for deltaTime and elapsedTime
    time.update();

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    var yaw = 0, pitch = 0;
    if (appInput.a) yaw -= 1;
    if (appInput.d) yaw += 1;
    if (appInput.w) pitch -= 1;
    if (appInput.s) pitch += 1;

    var yawMatrix = new Matrix4().makeRotationY(45.0 * time.deltaTime * yaw);
    var pitchMatrix = new Matrix4().makeRotationX(45.0 * time.deltaTime * pitch);

    // Rotate the light direction and position
    var rotationMatrix = pitchMatrix.clone().multiply(yawMatrix);
    directionToLight = rotationMatrix.multiplyVector(directionToLight);
    lightPos = rotationMatrix.multiplyVector(lightPos);

    let eyePos = new Vector3(lightPos.x, lightPos.y, lightPos.z);
    let targetPos = new Vector3(0, 0, 0);
    let worldUp = new Vector3(0, 1, 0);
    lightCamera.cameraWorldMatrix.makeLookAt(eyePos, targetPos, worldUp);

    camera.update(time.deltaTime);

    // Rotate the sphere
    var rotationSpeed = 20; // Degrees per second
    var sphereRotation = new Matrix4().makeRotationY(rotationSpeed * time.deltaTime);
    sphereGeometry.worldMatrix.multiply(sphereRotation);

    // Render scene depth to texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

    gl.clearColor(0, 1, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Specify what portion of the canvas to draw to (full width and height)
    gl.viewport(0, 0, fbo.width, fbo.height);

    shadowProjectionMatrix.makeOrthographic(-10, 10, 10, -10, 1, 20);

    sphereGeometry.render(lightCamera, shadowProjectionMatrix, depthWriteProgram);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    // Render scene normally and apply shadows
    console.log("Camera Position:", camera.getPosition());
    console.log("Camera View Matrix:", camera.getViewMatrix().elements);
    console.log("Sphere World Matrix:", sphereGeometry.worldMatrix.elements);

    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    var lightVPMatrix = shadowProjectionMatrix.clone().multiply(lightCamera.getViewMatrix());

    gl.useProgram(phongShaderProgram);
    var uniforms = phongShaderProgram.uniforms;
    var cameraPosition = camera.getPosition();
    gl.uniform3f(uniforms.directionToLightUniform, directionToLight.x, directionToLight.y, directionToLight.z);
    gl.uniform3f(uniforms.cameraPositionUniform, cameraPosition.x, cameraPosition.y, cameraPosition.z);
    gl.uniformMatrix4fv(uniforms.lightVPMatrixUniform, false, lightVPMatrix.transpose().elements);

    projectionMatrix.makePerspective(45, aspectRatio, 0.1, 1000);
    sphereGeometry.render(camera, projectionMatrix, phongShaderProgram, renderTexture);
}

