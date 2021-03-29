# DISCLAIMER: This code will almost certainly not run on its own- it only works in the context of my specific blender project (which I have not made available).

import bpy
import json
import os
import math
import subprocess
from bpy.app.handlers import persistent


class AnimatedVoxelRenderer:
    
    cubeData = [[-1,-1,-1],[-1,-1,1],[-1,1,-1],[-1,1,1],[1,-1,-1],[1,-1,1],[1,1,-1],[1,1,1]]
    
    
    def __init__(self, objectName, animationData):
        self.objectName = objectName
        self.animationData = animationData
        self.previousVertexCount = len(bpy.data.objects[self.objectName].data.vertices)
        self.previousWholeFrameIndex = -1
        
    
        
    def setFrame(self, frameIndex):
        vertexCounter = 0
        
        frameFract, wholeFrameIndex = math.modf(frameIndex)
        
        hasWholeFrameChanged = int(wholeFrameIndex) != self.previousWholeFrameIndex
        
        frameFract = math.pow(frameFract, 3)
        
        mesh = bpy.data.objects[self.objectName].data
        
        print(wholeFrameIndex)
        
        frame = self.animationData["frames"][int(wholeFrameIndex)]
    
        currentVertexCount = len(frame) * 8
    
        maxVertices = len(mesh.vertices)
    
        # print("Has whole frame changed?: " + str(hasWholeFrameChanged))
    
        for cell in frame:
            cellx = cell[0]
            celly = cell[1]
            cellz = cell[2]
            isLastAlive = cell[3]
            isNextAlive = cell[4]
            areBothAlive = isLastAlive and isNextAlive
            
            if ((not areBothAlive) or hasWholeFrameChanged):
                sf = 0.5
                
                if (areBothAlive):
                    sf = 1.0
                    
                elif (isNextAlive):
                    sf = frameFract
                
                else:
                    sf = 1 - frameFract
                    
                for i in range(0, 8):
                    posx = cellx * 2 + AnimatedVoxelRenderer.cubeData[i][0] * sf
                    posy = celly * 2 + AnimatedVoxelRenderer.cubeData[i][1] * sf
                    posz = cellz * 2 + AnimatedVoxelRenderer.cubeData[i][2] * sf
                    mesh.vertices[vertexCounter + i].co = (posx, posy, posz)
                    
                vertexCounter += 8
                
                if vertexCounter >= maxVertices:
                    break
                
            elif not hasWholeFrameChanged:
                vertexCounter += 8
                
                if vertexCounter >= maxVertices:
                    break
                
                            
        
        if self.previousVertexCount > vertexCounter:
            for i in range(vertexCounter, self.previousVertexCount):
                mesh.vertices[i].co = (9999, 9999, 9999)
        
        self.previousVertexCount = vertexCounter
        self.previousWholeFrameIndex = int(wholeFrameIndex)
            
            
                

        
                        
            
                
                
            
        
    

os.chdir(bpy.path.abspath("//"))

jsonFileContents = {}

patternTypes = json.loads(subprocess.check_output(["node", "generate-cgol.js", "listAllPatterns"]))

processes = [subprocess.Popen(["node", "--max-old-space-size=8192", "generate-cgol.js", patternType], stdout=subprocess.PIPE) for patternType in patternTypes]

for process in processes:
    jsonData = json.load(process.stdout)
    jsonFileContents[jsonData["patternName"]] = jsonData["pattern"]

# for patternType in patternTypes:
#    print("requesting item: " + patternType)
#     subprocess.run(["node", "--max-old-space-size=8192", "generate-cgol.js", patternType]))

#jsonFileContents = json.loads(jsOutput)

voxelRenderers = []

def initVoxelFrames():
    for o in bpy.data.objects:
        if o.data != None and "voxelFrame" in o.data:
            voxelSetName = o.data["voxelSetName"]
            voxelRenderer = AnimatedVoxelRenderer(o.name, jsonFileContents[voxelSetName])
            voxelRenderers.append(voxelRenderer)
            voxelRenderer.setFrame(0)
            print(o.name)
            
@persistent
def frameChangeHandler(scene):
    for voxelRenderer in voxelRenderers:
        if not bpy.data.objects[voxelRenderer.objectName].hide_render:
            print("Updating: " + voxelRenderer.objectName)
            voxelFrame = bpy.data.objects[voxelRenderer.objectName].data["voxelFrame"]
            voxelRenderer.setFrame(voxelFrame)
    
def addHandlers():
    bpy.app.handlers.frame_change_pre.clear()
    bpy.app.handlers.render_pre.clear()
    bpy.app.handlers.frame_change_post.clear()
    bpy.app.handlers.frame_change_pre.append(frameChangeHandler)
            


addHandlers()

initVoxelFrames()

def renderAllFrames():
    bpy.app.handlers.frame_change_pre.clear()
    scene = bpy.context.scene
    
    lastFrame = bpy.context.scene.frame_end
    
    initfilepath = scene.render.filepath
    fp = "" # Supposed to be the file path. This was redacted for privacy reasons.
    scene.render.filepath = fp
    for x in range(7441, 9120):
        scene.frame_set(x)
        frameChangeHandler(None)
        scene.render.filepath = fp + str(x)
        bpy.ops.render.render(write_still=True)

    scene.render.filepath = initfilepath
    addHandlers()

# REMEMBER TO CHANGE THIS TO DISABLE RENDERING
renderAllFrames()