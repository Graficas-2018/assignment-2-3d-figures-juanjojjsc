var projectionMatrix;

var shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute,
    shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

var duration = 5000; // ms

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
var vertexShaderSource =
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec4 vertexColor;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the vertexColor in vColor\n" +
    "        vColor = vertexColor;\n" +
    "    }\n";

// precision lowp float
// This determines how much precision the GPU uses when calculating floats. The use of highp depends on the system.
// - highp for vertex positions,
// - mediump for texture coordinates,
// - lowp for colors.
var fragmentShaderSource =
    "    precision lowp float;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "    gl_FragColor = vColor;\n" +
    "}\n";

function initWebGL(canvas)
{
    var gl = null;
    var msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try
    {
        gl = canvas.getContext("experimental-webgl");
    }
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;
 }

function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(canvas)
{
    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 100);
    mat4.translate(projectionMatrix, projectionMatrix, [0, 0, -5]);
}

const faceColors =
[
    [1.0, 1.0, 0.0, 1.0],
    [0.2, 1.0, 0.7, 1.0],
    [0.0, 0.3, 1.0, 1.0],
    [0.0, 1.0, 0.5, 1.0],
    [1.0, 0.2, 0.0, 1.0],
    [0.3, 1.0, 0.8, 1.0],
    [0.5, 0.5, 0.6, 1.0],
    [0.1, 0.0, 1.0, 1.0]
];

function createPyramid(gl, translation, rotationAxis)
{
    const top_v = [0.0, 1.0, 0.0]
    const pent_v1 = [0.0, -0.5, -0.5]
    const pent_v2 = [-0.5, -0.5, -0.2]
    const pent_v3 = [-0.3, -0.5, 0.5]
    const pent_v4 = [-0.3, -0.5, 0.5]
    const pent_v5 = [0.5, -0.5, -0.2]

    let verts =
    [

       ...pent_v1, ...pent_v2, ...pent_v3, ...pent_v4, ...pent_v5,

       ...pent_v1, ...pent_v2, ...top_v,
       ...pent_v2, ...pent_v3, ...top_v,
       ...pent_v3, ...pent_v4, ...top_v,
       ...pent_v4, ...pent_v5, ...top_v,
       ...pent_v5, ...pent_v1, ...top_v,
    ];

    const faceLengths = [5, 3, 3, 3, 3, 3];

    const pyramidIndices =
    [
        0, 1, 2,  0, 2, 3,  0, 3, 4,
        5, 6, 7,
        8, 9, 10,
        11, 12, 13,
        14, 15, 16,
        17, 18, 19
    ];

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    let vertexColors = [];
    for (let i in faceLengths)
    {
        let color = faceColors[i];
        for (let j=0; j < faceLengths[i]; j++)
        {
            vertexColors = vertexColors.concat(color);
        }
    }

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pyramidIndices), gl.STATIC_DRAW);

    figure =
    {
        buffer:vertexBuffer, colorBuffer:colorBuffer, indices:indexBuffer,
        vertSize:3, nVerts:verts.length, colorSize:4, nColors: vertexColors.length, nIndices: pyramidIndices.length,
        primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()
    };

    let pyramid = figure;

    mat4.translate(pyramid.modelViewMatrix, pyramid.modelViewMatrix, translation);

    pyramid.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;

        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };

    return pyramid;
}

function createOctahedron(gl, translation, rotationAxis)
{
    const v1 = [0, 0, 0];
    const v2 = [0, 0.0, 1.5];
    const v3 = [1.5, 0.0, 1.5];
    const v4 = [1.5, 0, 0.0];
    const v5 = [0.75, 1,  0.75];
    const v6 = [0.75, -1,  0.75];

    const verts =
    [
       ...v1, ...v2, ...v5,
       ...v1, ...v2, ...v6,
       ...v2, ...v3, ...v5,
       ...v2, ...v3, ...v6,
       ...v3, ...v4, ...v5,
       ...v3, ...v4, ...v6,
       ...v4, ...v1, ...v5,
       ...v4, ...v1, ...v6,
    ];

    var faceLengths = Array(8).fill(3);

    var octahedronIndices =
    [
        0, 1, 2,
        3, 4, 5,
        6, 7, 8,
        9, 10, 11,
        12, 13, 14,
        15, 16, 17,
        18, 19, 20,
        21, 22, 23
    ];

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    let vertexColors = [];
    for (let i in faceLengths)
    {
        let color = faceColors[i];
        for (let j=0; j < faceLengths[i]; j++)
        {
            vertexColors = vertexColors.concat(color);
        }
    }

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(octahedronIndices), gl.STATIC_DRAW);

    figure =
    {
        buffer:vertexBuffer, colorBuffer:colorBuffer, indices:indexBuffer,
        vertSize:3, nVerts:verts.length, colorSize:4, nColors: vertexColors.length, nIndices: octahedronIndices.length,
        primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()
    };

    let octahedron = figure;

    mat4.translate(octahedron.modelViewMatrix, octahedron.modelViewMatrix, translation);

    let goDown = false;
    octahedron.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;

        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);

        if(this.modelViewMatrix[13] > 2)
        {
            goDown = true;
        }
        if(this.modelViewMatrix[13] < -2.5)
        {
            goDown = false;
        }

        if(goDown)
        {
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0, -0.05, 0]);
        } else {
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0, 0.05, 0]);
        }
    };

    return octahedron;
}




function createShader(gl, str, type) {
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl) {
    // load and compile the fragment and vertex shader
    var fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    var vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);

    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, objs) {
    // clear the background (with black)
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    for(i = 0; i<objs.length; i++)
    {
        obj = objs[i];
        // connect up the shader parameters: vertex position, color and projection/model matrices
        // set up the buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        // Draw the object's primitives using indexed buffer information.
        // void gl.drawElements(mode, count, type, offset);
        // mode: A GLenum specifying the type primitive to render.
        // count: A GLsizei specifying the number of elements to be rendered.
        // type: A GLenum specifying the type of the values in the element array buffer.
        // offset: A GLintptr specifying an offset in the element array buffer.
        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

function run(gl, objs)  {
    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    requestAnimationFrame(function() { run(gl, objs); });
    draw(gl, objs);

    for(i = 0; i<objs.length; i++)
        objs[i].update();
}
