const cgolFilter = new GLFilter(`

precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoords;
uniform float uAmount;
uniform vec2 uImageSize;

void main(void) {
    vec4 col = texture2D(uTexture, vTexCoords);

    int neighbors = 0;
    if (col.r != 0.0) {
        neighbors--;
    }

    float lowestBrightness = 1.0;

    for (int x = -1; x < 2; x++) {
        for (int y = -1; y < 2; y++) {

            vec2 offset = vec2(float(x) / uImageSize.x, float(y) / uImageSize.y);

            vec4 neighborCol = texture2D(uTexture, vTexCoords + offset);
            if (neighborCol.r != 0.0) {
                neighbors++;
                if (lowestBrightness > neighborCol.r) {
                    lowestBrightness = neighborCol.r;
                }
            }
        }
    }

    if (neighbors == 3) {
        gl_FragColor = vec4(vec3(lowestBrightness) - 1.0 / 128.0, 1.0);
    } else if (neighbors == 2) {
        gl_FragColor = vec4(col.rgb - 1.0 / 128.0, 1.0);
    } else {
        gl_FragColor = vec4(vec3(0.0), 1.0);
    }
}

`);

const blackWhiteFilter = new GLFilter(`


precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoords;
uniform float uAmount;
uniform vec2 uImageSize;

void main(void) {
    vec4 col = texture2D(uTexture, vTexCoords);

    if (col.r != 0.0) {
        gl_FragColor = vec4(vec3(1.0), 1.0);
    } else {
        gl_FragColor = vec4(vec3(0.0), 1.0);
    }
}


`);

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnable = false;

ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.strokeStyle = "White";
ctx.fillStyle = "White";
ctx.lineWidth = 3;
ctx.textAlign = "center";
function voxelLifeTitle() {
    ctx.font = "Bold 108px Arial";
    ctx.fillText("Voxel Life", canvas.width / 2, canvas.height / 2 + 40);
}

function credits1() {
    ctx.font = "Bold 48px Arial";
    ctx.fillText("Concept - Adrian Baker", canvas.width / 2, canvas.height / 2 -90);
    ctx.fillText("Animation - Adrian Baker", canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText("Audio - Adrian Baker", canvas.width / 2, canvas.height / 2 + 70);
    ctx.fillText("Programming - Adrian Baker", canvas.width / 2, canvas.height / 2 + 150);
}

function credits2() {
    ctx.font = "Bold 60px Arial";
    ctx.fillText("Thanks for Watching!", canvas.width / 2, canvas.height / 2 + 40);
}

//change to whichever thing to be rendered.
credits2();

let time = 0;

let zip = new JSZip();

fetch(canvas.toDataURL()).then(res => res.blob()).then(blob => zip.file(`frame0.png`, blob));

function loop() {
    cgolFilter.filter(canvas, 0, (outImage) => {
        time++;
        ctx.drawImage(outImage, 0, 0);
        if (time < 128) {
            let time2 = time;
            fetch(canvas.toDataURL()).then(res => res.blob()).then(blob => zip.file(`frame${time2}.png`, blob));
            setTimeout(loop, 0);
        } else {
            zip.generateAsync({ type: "base64" }).then((base64) => {
                const link = document.createElement("a");

                // Set link's href to point to the Blob URL
                link.href = "data:application/zip;base64," + base64;
                link.download = "title.zip";
                link.innerText = "eeeeeeeeeeeeeeeeeeeeee";

                // Append link to the body
                document.body.appendChild(link);
            });
        }
    });
}


blackWhiteFilter.filter(canvas, 0, (outImage) => {
    ctx.drawImage(outImage, 0, 0);
    loop();
});