const process = require("process");

function totalisticLifeRule(birth, survive) {
    this.birth = birth;
    this.survive = survive;

    this.birthDict = new Array(27).fill(false);
    this.birth.forEach(index => {
        this.birthDict[index] = true;
    });

    
    this.surviveDict = new Array(27).fill(false);
    this.survive.forEach(index => {
        this.surviveDict[index] = true;
    });
}

function isBetween(value, min, max) {
    return (value >= min) && (value < max);
}

function totalisticLifeStep(lifeGrid, rule) {

    let nextStep = [];

    let resX = lifeGrid.length;
    let resY = lifeGrid[0].length;
    let resZ = lifeGrid[0][0].length;


    for (let x = 0; resX > x; x++) {
        nextStep.push([]);
        for (let y = 0; resY > y; y++) {
            nextStep[x].push([]);
            for (let z = 0; resZ > z; z++) {
                nextStep[x][y].push(undefined);
                let neighbors = 0;
                
                for (let dx = -1; 2 > dx; dx++) {
                    for (let dy = -1; 2 > dy; dy++) {
                        for (let dz = -1; 2 > dz; dz++) {
                            
                            if (
                                isBetween(x + dx, 0, resX) &&
                                isBetween(y + dy, 0, resY) &&
                                isBetween(z + dz, 0, resZ) &&
                                !(dx == 0 && dy == 0 && dz == 0)
                                ) {
                                let cellState = lifeGrid[x + dx][y + dy][z + dz];

                                if (cellState) {
                                    neighbors++;
                                }
                            }

                        }
                    }
                }


                if (rule.birthDict[neighbors]) {
                    nextStep[x][y][z] = true;
                } else if (rule.surviveDict[neighbors]) {
                    nextStep[x][y][z] = lifeGrid[x][y][z];
                } else {
                    nextStep[x][y][z] = false;
                }
            }
        }
    }

    return nextStep;
}

function make3DGrid(resX, resY, resZ) {
    let grid = [];

    for (let x = 0; resX > x; x++) {
        grid.push([]);
        for (let y = 0; resY > y; y++) {
            grid[x].push([]);
            for (let z = 0; resZ > z; z++) {
                grid[x][y].push(false);
            }
        }
    }

    return grid;
}

function iterate3DGrid(grid, callback) {

    let resX = grid.length;
    let resY = grid[0].length;
    let resZ = grid[0][0].length;    
    for (let x = 0; resX > x; x++) {
        for (let y = 0; resY > y; y++) {
            for (let z = 0; resZ > z; z++) {
                callback(grid[x][y][z], x, y, z);
            }
        }
    }
}

function mutate3DGrid(grid, callback) {

    let resX = grid.length;
    let resY = grid[0].length;
    let resZ = grid[0][0].length;    
    for (let x = 0; resX > x; x++) {
        for (let y = 0; resY > y; y++) {
            for (let z = 0; resZ > z; z++) {
                grid[x][y][z] = callback(grid[x][y][z], x, y, z);
            }
        }
    }
    return grid;
}

function compose3DGrid(grid, subGrid, offsetX, offsetY, offsetZ) {

    iterate3DGrid(subGrid, (gridElem, x, y, z) => {
        grid[x + offsetX][y + offsetY][z + offsetZ] = gridElem;
    });

}


function life2DToGrid3D(grid2D, w, h) {
    let outGrid = [];
    for (let x = 0; w > x; x++) {
        outGrid.push([])
        for (let y = 0; h > y; y++) {
            outGrid[x].push([]);
            outGrid[x][y].push(grid2D[x + y * w] ? true : false);
        }
    }
    return outGrid;
}

function deepCopyGrid(grid) {
    let resX = grid.length;
    let resY = grid[0].length;
    let resZ = grid[0][0].length;    
    let newGrid = [];
    for (let x = 0; resX > x; x++) {
        newGrid.push([]);
        for (let y = 0; resY > y; y++) {
            newGrid[x].push([]);
            for (let z = 0; resZ > z; z++) {
                newGrid[x][y].push(grid[x][y][z]);
            }
        }
    }
    return newGrid;
}

function grid3DToBuffer(grid3D) {
    let buf = Buffer.from(grid3D.flat(3));
    return buf;
}

//nah heck this smh
function runLengthEncode(buf) {
    let arr = [];
    let runLength = 0;
    let runType = NaN;
    for (let i = 0; buf.length > i; i++) {
        if (runType != buf[i] || runLength == 255) {
            if (i != 0) {
                arr.push(runLength);
                arr.push(runType);
            }
            runType = buf[i];
            runLength = 0;
        }
        runLength++;
    }
    arr.push(runLength);
    arr.push(runType);
    return Buffer.from(arr);
}

//schema: [x, y, z, last, next, donotreplace]
function encodeFrames(frames) {
    let aliveCells = [];
    for (let i = 0; frames.length - 1 > i; i++) {
        let prevPrev;
        if (i != 0) {
            prevPrev = frames[i - 1];
        }
        let prev = frames[i];
        let next = frames[i + 1];

        aliveCells.push(encodeSingleFrame(prevPrev, prev, next));
    }
    return aliveCells;
}

function encodeSingleFrame(prevPrev, prev, next) {

    let aliveCells = [];

    iterate3DGrid(prev, (prevElem, x, y, z) => {
        let nextElem = next[x][y][z];
        let doNotReplace = false;
        if (prevPrev) {
            let prevPrevElem = prevPrev[x][y][z];
            doNotReplace = prevPrevElem && prevElem && nextElem;
        }
        if (prevElem || nextElem) {
            aliveCells.push([x, y, z, prevElem, nextElem, doNotReplace]);
        }
    });

    return aliveCells;
}







const patternType = {
    twoGliderMess() {
        let rule = new totalisticLifeRule([3], [2, 3]);

        let glider = life2DToGrid3D([
            0, 1, 0,
            0, 0, 1,
            1, 1, 1,
        ], 3, 3);

        let glider2 = life2DToGrid3D([
            0, 1, 0,
            0, 1, 1,
            1, 0, 1,
        ], 3, 3);

        let offset = 14;
        let frames = [];
        let currentFrame = make3DGrid(60, 60, 1);
        compose3DGrid(currentFrame, glider, 30 - offset, 30 - offset, 0);
        compose3DGrid(currentFrame, glider2, 33 - offset, 33 + offset, 0);
        for (let i = 0; 450 > i; i++) {
            frames.push(currentFrame);
            currentFrame = totalisticLifeStep(currentFrame, rule)
        }

        return {
            frames: frames
        };
    },

    replicator3D() {
        let rule = new totalisticLifeRule([1], []);


        let frames = [];
        let currentFrame = make3DGrid(32, 32, 32);
        currentFrame[16][16][16] = true;
        for (let i = 0; 61 > i; i++) {
            frames.push(currentFrame);
            currentFrame = totalisticLifeStep(currentFrame, rule);
        }

        return {
            frames: frames
        };
    },

    rPentominoStack() {
        let rule = new totalisticLifeRule([3], [2, 3]);

        let frames = [];

        let rPentomino = life2DToGrid3D([
            1, 1, 0,
            0, 1, 1,
            0, 1, 0,
        ], 3, 3);

        let singleStackFrame = make3DGrid(40, 40, 1);
        compose3DGrid(singleStackFrame, rPentomino, 14, 14, 0);

        let currentFrame = make3DGrid(40, 40, 64);
        for (let i = 0; 65 > i; i++) {
            compose3DGrid(currentFrame, singleStackFrame, 0, 0, i);
            singleStackFrame = totalisticLifeStep(singleStackFrame, rule);
            frames.push(currentFrame);
            currentFrame = deepCopyGrid(currentFrame);
        }
        return {
            frames: frames
        }
    },

    cubeThingy() {
        let rule = new totalisticLifeRule([4, 5, 9], [5, 9]);

        let frames = [];

        let currentFrame = make3DGrid(64, 64, 64);
        for (let x = 27; 37 > x; x++) {
            for (let y = 27; 37 > y; y++) {
                for (let z = 27; 37 > z; z++) {
                    currentFrame[x][y][z] = true;
                }
            }
        }

        for (let i = 0; 33 > i; i++) {
            frames.push(currentFrame);   
            currentFrame = totalisticLifeStep(currentFrame, rule);     
        }

        return {
            frames: frames
        }
    },

    moduloTwo() {
        let rule = new totalisticLifeRule([1, 3, 5, 7], []);

        let frames = [];

        let start = life2DToGrid3D([
            0, 0, 0,
            0, 1, 0,
            0, 0, 0,
        ], 3, 3);

        let singleStackFrame = make3DGrid(32, 32, 1);
        compose3DGrid(singleStackFrame, start, 14, 14, 0);

        let currentFrame = make3DGrid(32, 32, 32);
        for (let i = 0; 33 > i; i++) {
            compose3DGrid(currentFrame, singleStackFrame, 0, 0, i);
            singleStackFrame = totalisticLifeStep(singleStackFrame, rule);
            frames.push(currentFrame);
            currentFrame = deepCopyGrid(currentFrame);
        }
        return {
            frames: frames
        }
    },

    differentSlicePattern() {
        let rule = new totalisticLifeRule([1, 4, 6, 8], []);

        let frames = [];

        let start = life2DToGrid3D([
            0, 0, 0,
            0, 1, 0,
            0, 0, 0,
        ], 3, 3);

        let singleStackFrame = make3DGrid(64, 64, 1);
        compose3DGrid(singleStackFrame, start, 31, 31, 0);

        let currentFrame = make3DGrid(64, 64, 32);
        for (let i = 0; 33 > i; i++) {
            compose3DGrid(currentFrame, singleStackFrame, 0, 0, i);
            singleStackFrame = totalisticLifeStep(singleStackFrame, rule);
            frames.push(currentFrame);
            currentFrame = deepCopyGrid(currentFrame);
        }
        return {
            frames: frames
        }
    },

    sierpinskiPyramid() {
        let rule = new totalisticLifeRule([1], []);

        let frames = [];

        let start = life2DToGrid3D([
            0, 0, 0,
            0, 1, 0,
            0, 0, 0,
        ], 3, 3);

        let singleStackFrame = make3DGrid(128, 128, 1);
        compose3DGrid(singleStackFrame, start, 62, 62, 0);

        let currentFrame = make3DGrid(128, 128, 64);
        for (let i = 0; 65 > i; i++) {
            compose3DGrid(currentFrame, singleStackFrame, 0, 0, i);
            singleStackFrame = totalisticLifeStep(singleStackFrame, rule);
            frames.push(currentFrame);
            currentFrame = deepCopyGrid(currentFrame);
        }
        return {
            frames: frames
        }
    },

    anotherReplicator() {

        let rule = new totalisticLifeRule([1], [2, 3, 4,5, 6, 7, 8]);


        let frames = [];
        let currentFrame = make3DGrid(128, 128, 128);
        currentFrame[63][63][63] = true;
        for (let i = 0; 65 > i; i++) {
            frames.push(currentFrame);
            currentFrame = totalisticLifeStep(currentFrame, rule);
        }

        return {
            frames: frames
        };
    },

    methuselah() {
        let rule = new totalisticLifeRule([3], [2, 3]);

        let frames = [];

        let methuselah = life2DToGrid3D([
            1, 0, 0, 0, 0, 0, 1, 0,
            0, 0, 1, 0, 0, 0, 1, 0,
            0, 0, 1, 0, 0, 1, 0, 1,
            0, 1, 0, 1, 0, 0, 0, 0
        ], 8, 4);

        let singleStackFrame = make3DGrid(100, 100, 1);
        compose3DGrid(singleStackFrame, methuselah, 46, 48, 0);

        let prevFrame;
        let prevPrevFrame;

        let currentFrame = make3DGrid(100, 100, 513);
        for (let i = 0; 513 > i; i++) {
            prevPrevFrame = prevFrame;
            prevFrame = currentFrame;
            compose3DGrid(currentFrame, singleStackFrame, 0, 0, i);
            singleStackFrame = totalisticLifeStep(singleStackFrame, rule);
            frames.push(encodeSingleFrame(prevPrevFrame, prevFrame, currentFrame));
            currentFrame = deepCopyGrid(currentFrame);
        }
        return {
            preEncoded: true,
            frames: frames
        }
    }
};

function testGenerateFrames() {
    let patternToMake = process.argv[2];
    // let data = {
    //     "frames": [
    //         new Array(10).fill()
    //     ]
    // }

    // let frames = new Array(12).fill(0).map(e => { 
    //     return mutate3DGrid(make3DGrid(5, 5, 5), (elem, x, y, z) => {
    //         return (Math.random() > 0.5) ? true : false;
    //     });
    // });

    // process.stdout.write(JSON.stringify({
    //     frames: frames
    // }));




    //console.log("Requested item: " +patternToMake);
    let output;

    if (patternToMake == "rleTest") {
        console.log(runLengthEncode(Buffer.from([0x00, 0x00, 0x00, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00])));
    } else {
        if (patternToMake == "listAllPatterns") {
            output = Object.keys(patternType);
        } else {
            let pattern = patternType[patternToMake]();

            if (!pattern.preEncoded) {
                pattern.frames = encodeFrames(pattern.frames);
            }

            output = { pattern: pattern, patternName: patternToMake };
        }

        process.stdout.write(JSON.stringify(
            output
        ));
    }
}

testGenerateFrames();