import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Mesh, MeshStandardMaterial, Group, LoadingManager, Object3D } from 'three';
import * as THREE from 'three';
import { AdminConfig } from '../types/admin';

interface ModelProps {
  modelData: ArrayBuffer;
  onLoadProgress?: (progress: number) => void;
  onPartsLoaded?: (parts: string[]) => void;
  config?: AdminConfig;
  selectedPart?: string | null;
  onPartClick?: (partName: string) => void;
  isAdminMode?: boolean;
  selectedObjects?: string[];  // IDs of selected scene objects
  onObjectSelect?: (objectId: string, selected: boolean) => void;  // Callback for object selection
}

export default function Model({ 
  modelData, 
  onLoadProgress, 
  onPartsLoaded, 
  config, 
  selectedPart,
  onPartClick,
  isAdminMode,
  selectedObjects = [],
  onObjectSelect
}: ModelProps) {
  const modelRef = useRef<Group>(null);
  const { camera } = useThree();
  const materialCache = useRef<Map<string, MeshStandardMaterial>>(new Map());
  const [gltfData, setGltfData] = useState<any>(null);
  const modelDataRef = useRef<ArrayBuffer | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const sceneObjectsRef = useRef<Map<string, Object3D>>(new Map());

  // Update model transform when dimensions change
  // This needs to run after other effects that might modify the model
  useEffect(() => {
    // Use a small timeout to ensure this runs after other effects
    const timer = setTimeout(() => {
      if (gltfData?.scene && config?.modelDimensions && modelRef.current) {
        const { position, rotation, scale } = config.modelDimensions;
        
        // Apply transformations to the parent group
        // Only rotation mapping is correct, let's try different mappings for position and scale
        modelRef.current.position.set(
          position.x, // Back to original mapping for position
          position.y,
          position.z
        );
        
        // Keep rotation mapping as is since it's working correctly
        modelRef.current.rotation.set(
          rotation.z * (Math.PI / 180), // Map X rotation to Z rotation
          rotation.y * (Math.PI / 180), // Y rotation remains the same
          rotation.x * (Math.PI / 180)  // Map Z rotation to X rotation
        );
        
        modelRef.current.scale.set(
          scale.x, // Back to original mapping for scale
          scale.y,
          scale.z
        );
        
        // Reset the scene's own transformations to identity
        // This ensures the scene itself doesn't have any transformations
        gltfData.scene.position.set(0, 0, 0);
        gltfData.scene.rotation.set(0, 0, 0);
        gltfData.scene.scale.set(1, 1, 1);
      }
    }, 100); // Small delay to ensure this runs after other effects
    
    return () => clearTimeout(timer);
  }, [gltfData, config?.modelDimensions]);

  // Create a loading manager to handle progress
  const loadingManager = useMemo(() => {
    const manager = new LoadingManager();
    manager.onProgress = (_, loaded, total) => {
      if (onLoadProgress) {
        onLoadProgress((loaded / total) * 100);
      }
    };
    return manager;
  }, [onLoadProgress]);

  // Load the model directly from ArrayBuffer
  useEffect(() => {
    // Skip if modelData hasn't changed
    if (modelDataRef.current === modelData) return;
    modelDataRef.current = modelData;

    // Create a blob URL for loading textures
    const blob = new Blob([modelData], { type: 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(blob);
    blobUrlRef.current = blobUrl;

    const loader = new GLTFLoader(loadingManager);
    loader.load(blobUrl, (gltf) => {
      setGltfData(gltf);

      // Extract and notify about available parts
      const parts: string[] = [];
      gltf.scene.traverse((child) => {
        if (child instanceof Mesh && child.name) {
          parts.push(child.name);
        }
      });

      if (onPartsLoaded) {
        onPartsLoaded(parts);
      }
    });

    return () => {
      if (modelRef.current) {
        modelRef.current.traverse((child) => {
          if (child instanceof Mesh && child.geometry) {
            child.geometry.dispose();
          }
        });
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      materialCache.current.clear();
    };
  }, [modelData, loadingManager, onLoadProgress, onPartsLoaded]);

  const updatePartMaterial = useCallback((
    part: Mesh,
    material: MeshStandardMaterial,
    group: any,
    isSelected: boolean
  ) => {
    const cachedMaterial = materialCache.current.get(part.name);
    if (cachedMaterial) {
      // Update existing material while preserving textures
      if (isSelected) {
        cachedMaterial.emissive.setHex(0x666666);
      } else {
        cachedMaterial.emissive.setHex(0x000000);
      }
      
      const partIndex = group.parts.indexOf(part.name);
      if (partIndex !== -1 && group.colors?.[partIndex]) {
        cachedMaterial.color.setStyle(group.colors[partIndex]);
      }
      
      // Apply metalness and roughness if available
      if (partIndex !== -1) {
        if (group.allowMetalness && group.metalness?.[partIndex] !== undefined) {
          cachedMaterial.metalness = group.metalness[partIndex];
        }
        
        if (group.allowRoughness && group.roughness?.[partIndex] !== undefined) {
          cachedMaterial.roughness = group.roughness[partIndex];
        }
      }
    } else {
      // Create new material and cache it while preserving textures
      const newMaterial = material.clone();
      if (isSelected) {
        newMaterial.emissive.setHex(0x666666);
      }
      
      const partIndex = group.parts.indexOf(part.name);
      if (partIndex !== -1 && group.colors?.[partIndex]) {
        newMaterial.color.setStyle(group.colors[partIndex]);
      }
      
      // Apply metalness and roughness if available
      if (partIndex !== -1) {
        if (group.allowMetalness && group.metalness?.[partIndex] !== undefined) {
          newMaterial.metalness = group.metalness[partIndex];
        } else if (group.allowMetalness) {
          newMaterial.metalness = 0.5; // Default value
        }
        
        if (group.allowRoughness && group.roughness?.[partIndex] !== undefined) {
          newMaterial.roughness = group.roughness[partIndex];
        } else if (group.allowRoughness) {
          newMaterial.roughness = 0.5; // Default value
        }
      }
      
      // Preserve original textures
      if (material.map) newMaterial.map = material.map;
      if (material.normalMap) newMaterial.normalMap = material.normalMap;
      if (material.roughnessMap) newMaterial.roughnessMap = material.roughnessMap;
      if (material.metalnessMap) newMaterial.metalnessMap = material.metalnessMap;
      
      part.material = newMaterial;
      materialCache.current.set(part.name, newMaterial);
    }
  }, []);

  useEffect(() => {
    if (gltfData && config) {
      gltfData.scene.traverse((child: any) => {
        if (child instanceof Mesh) {
          const material = child.material as MeshStandardMaterial;
          // Find the part group that contains this part
          const group = config.partGroups.find(g => g.parts.includes(child.name));
          
          if (group) {
            updatePartMaterial(child, material, group, selectedPart === child.name);
          }
        }
      });
    }
  }, [gltfData, config, selectedPart, updatePartMaterial]);

  const resolveModelPath = (path: string): string => {
    if (!path) return '';
    
    // If it's a data URL, return it as is
    if (path.startsWith('data:')) {
      console.log('Using data URL for model');
      return path;
    }
    
    // If it's already an absolute URL, return as is
    if (path.startsWith('http')) {
      return path;
    }
    
    // If it starts with a slash, it's relative to the origin
    if (path.startsWith('/')) {
      return `${window.location.origin}${path}`;
    }
    
    // Otherwise, it's relative to the public directory
    // Make sure to add a leading slash if needed
    const relativePath = path.startsWith('models/') ? path : `models/${path}`;
    return `${window.location.origin}/${relativePath}`;
  };

  // Position and manage scene objects
  useEffect(() => {
    if (!gltfData || !config?.sceneObjects || !modelRef.current) return;

    console.log("Scene objects update triggered with", config.sceneObjects.length, "objects");

    // Create a separate group for scene objects if it doesn't exist
    let sceneObjectsGroup = modelRef.current.children.find(child => child.name === 'scene-objects-container') as THREE.Group;
    
    if (!sceneObjectsGroup) {
      sceneObjectsGroup = new THREE.Group();
      sceneObjectsGroup.name = 'scene-objects-container';
      modelRef.current.add(sceneObjectsGroup);
      console.log("Created new scene objects container");
    }

    // Clear ALL previous scene objects by removing all children from the container
    console.log("Clearing scene objects container with", sceneObjectsGroup.children.length, "children");
    while (sceneObjectsGroup.children.length > 0) {
      const child = sceneObjectsGroup.children[0];
      sceneObjectsGroup.remove(child);
      
      // Dispose of geometries and materials to prevent memory leaks
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    }
    
    // Also clear our reference map
    sceneObjectsRef.current.clear();
    console.log("Scene objects container cleared, now has", sceneObjectsGroup.children.length, "children");

    // Find base object if any
    const baseObject = config.sceneObjects.find(obj => obj.isBase);
    let basePosition = new THREE.Vector3(0, 0, 0);
    
    if (baseObject) {
      // Create a group for the base object
      const baseGroup = new THREE.Group();
      baseGroup.name = `scene-object-${baseObject.id}`;
      
      // Check if this object has an external model path
      if (baseObject.modelPath) {
        // Get the full path
        const fullPath = resolveModelPath(baseObject.modelPath);
        
        // Truncate long paths for logging
        const displayPath = fullPath.length > 50 ? fullPath.substring(0, 50) + '...' : fullPath;
        console.log(`Loading base model from: ${displayPath}`);
        
        // Add error handling for fetch to check if the file exists
        fetch(fullPath)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
            }
            console.log(`Model file exists at ${fullPath}`);
            
            // Now load the model with GLTFLoader
            const loader = new GLTFLoader();
            loader.load(
              fullPath,
              (gltf) => {
                console.log('Base model loaded successfully');
                baseGroup.add(gltf.scene.clone());
                
                // Apply transform after loading
                baseGroup.position.set(
                  baseObject.transform.position.x,
                  baseObject.transform.position.z, // Swap Y and Z
                  baseObject.transform.position.y  // Swap Y and Z
                );
                baseGroup.rotation.set(
                  THREE.MathUtils.degToRad(baseObject.transform.rotation.x),
                  THREE.MathUtils.degToRad(baseObject.transform.rotation.z), // Swap Y and Z
                  THREE.MathUtils.degToRad(baseObject.transform.rotation.y)  // Swap Y and Z
                );
                baseGroup.scale.set(
                  baseObject.transform.scale.x,
                  baseObject.transform.scale.z, // Swap Y and Z
                  baseObject.transform.scale.y  // Swap Y and Z
                );
                
                // Store the base position for other objects to reference
                basePosition = baseGroup.position.clone();
                
                // Add to scene if visible
                if (isAdminMode) {
                  // In admin mode, use the visibility setting from the config
                  baseGroup.visible = baseObject.visible;
                  sceneObjectsGroup.add(baseGroup);
                } else {
                  // In viewer mode, only show if explicitly selected
                  const isSelected = selectedObjects.includes(baseObject.id);
                  baseGroup.visible = isSelected;
                  
                  if (isSelected || baseObject.isBase) {
                    sceneObjectsGroup.add(baseGroup);
                  }
                }
              },
              (xhr) => {
                const progress = (xhr.loaded / xhr.total) * 100;
                console.log(`Base model loading: ${progress.toFixed(2)}%`);
              },
              (error) => {
                console.error('Error loading base model:', error);
              }
            );
          })
          .catch(error => {
            console.error('Error checking model file:', error);
          });
      } else {
        // Add all meshes that belong to this object from the main model
        gltfData.scene.traverse((child: any) => {
          if (child instanceof Mesh && baseObject.partNames.includes(child.name)) {
            // Clone the mesh to avoid modifying the original
            const clonedMesh = child.clone();
            baseGroup.add(clonedMesh);
          }
        });
        
        // Apply transform to the base object
        baseGroup.position.set(
          baseObject.transform.position.x,
          baseObject.transform.position.z, // Swap Y and Z
          baseObject.transform.position.y  // Swap Y and Z
        );
        baseGroup.rotation.set(
          THREE.MathUtils.degToRad(baseObject.transform.rotation.x),
          THREE.MathUtils.degToRad(baseObject.transform.rotation.z), // Swap Y and Z
          THREE.MathUtils.degToRad(baseObject.transform.rotation.y)  // Swap Y and Z
        );
        baseGroup.scale.set(
          baseObject.transform.scale.x,
          baseObject.transform.scale.z, // Swap Y and Z
          baseObject.transform.scale.y  // Swap Y and Z
        );
        
        // Store the base position for other objects to reference
        basePosition = baseGroup.position.clone();
        
        // Add to scene and store reference
        if (isAdminMode) {
          // In admin mode, use the visibility setting from the config
          baseGroup.visible = baseObject.visible;
          sceneObjectsGroup.add(baseGroup);
        } else {
          // In viewer mode, only show if explicitly selected
          const isSelected = selectedObjects.includes(baseObject.id);
          baseGroup.visible = isSelected;
          
          if (isSelected || baseObject.isBase) {
            sceneObjectsGroup.add(baseGroup);
          }
        }
      }
      
      // Store reference to this object
      sceneObjectsRef.current.set(baseObject.id, baseGroup);
    }
    
    // Add all other scene objects
    config.sceneObjects
      .filter(obj => !obj.isBase)
      .forEach(sceneObj => {
        // Create a group for this object
        const objGroup = new THREE.Group();
        objGroup.name = `scene-object-${sceneObj.id}`;
        
        // Check if this object has an external model path
        if (sceneObj.modelPath) {
          // Get the full path
          const fullPath = resolveModelPath(sceneObj.modelPath);
          const displayPath = fullPath.length > 50 ? fullPath.substring(0, 50) + '...' : fullPath;
          console.log(`Loading model from: ${displayPath}`);
          
          // Check if it's a data URL
          if (fullPath.startsWith('data:')) {
            // Data URLs don't need a fetch check
            console.log(`Loading model from data URL`);
            
            // Load the model with GLTFLoader
            const loader = new GLTFLoader();
            loader.load(
              fullPath,
              (gltf) => {
                console.log(`Model loaded successfully from data URL`);
                objGroup.add(gltf.scene.clone());
                
                // Position relative to base object
                objGroup.position.set(
                  basePosition.x + sceneObj.transform.position.x,
                  basePosition.z + sceneObj.transform.position.z, // Swap Y and Z
                  basePosition.y + sceneObj.transform.position.y  // Swap Y and Z
                );
                objGroup.rotation.set(
                  THREE.MathUtils.degToRad(sceneObj.transform.rotation.x),
                  THREE.MathUtils.degToRad(sceneObj.transform.rotation.z), // Swap Y and Z
                  THREE.MathUtils.degToRad(sceneObj.transform.rotation.y)  // Swap Y and Z
                );
                objGroup.scale.set(
                  sceneObj.transform.scale.x,
                  sceneObj.transform.scale.z, // Swap Y and Z
                  sceneObj.transform.scale.y  // Swap Y and Z
                );
                
                // Check if this object should be visible based on dependencies
                let isVisible = false; // Default to invisible in viewer mode
          
                if (isAdminMode) {
                  // In admin mode, use the visibility setting from the config
                  isVisible = sceneObj.visible;
                } else {
                  // In viewer mode, only show if explicitly selected
                  isVisible = selectedObjects.includes(sceneObj.id);
                  
                  // Also check dependency rules
                  if (isVisible && config.dependencyRules) {
                    // Check 'requires' rules
                    const requiresRules = config.dependencyRules.filter(
                      rule => rule.sourceObjectId === sceneObj.id && rule.type === 'requires'
                    );
                    
                    if (requiresRules.length > 0) {
                      // Object requires other objects to be selected
                      isVisible = isVisible && requiresRules.every(rule => 
                        selectedObjects.includes(rule.targetObjectId)
                      );
                    }
                    
                    // Check 'excludes' rules
                    const excludesRules = config.dependencyRules.filter(
                      rule => rule.sourceObjectId === sceneObj.id && rule.type === 'excludes'
                    );
                    
                    if (excludesRules.length > 0) {
                      // Object cannot be used with certain other objects
                      isVisible = isVisible && !excludesRules.some(rule => 
                        selectedObjects.includes(rule.targetObjectId)
                      );
                    }
                  }
                }
                
                // Add to scene if visible
                if (isVisible || isAdminMode) {
                  objGroup.visible = isVisible;
                  sceneObjectsGroup.add(objGroup);
                }
              },
              (xhr) => {
                const progress = (xhr.loaded / xhr.total) * 100;
                console.log(`Model loading (${displayPath}): ${progress.toFixed(2)}%`);
              },
              (error) => {
                console.error(`Error loading model (${displayPath}):`, error);
              }
            );
          } else {
            // Add error handling for fetch to check if the file exists
            fetch(fullPath)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
                }
                console.log(`Model file exists at ${fullPath}`);
                
                // Now load the model with GLTFLoader
                const loader = new GLTFLoader();
                loader.load(
                  fullPath,
                  (gltf) => {
                    console.log(`Model loaded successfully: ${displayPath}`);
                    objGroup.add(gltf.scene.clone());
                    
                    // Position relative to base object
                    objGroup.position.set(
                      basePosition.x + sceneObj.transform.position.x,
                      basePosition.z + sceneObj.transform.position.z, // Swap Y and Z
                      basePosition.y + sceneObj.transform.position.y  // Swap Y and Z
                    );
                    objGroup.rotation.set(
                      THREE.MathUtils.degToRad(sceneObj.transform.rotation.x),
                      THREE.MathUtils.degToRad(sceneObj.transform.rotation.z), // Swap Y and Z
                      THREE.MathUtils.degToRad(sceneObj.transform.rotation.y)  // Swap Y and Z
                    );
                    objGroup.scale.set(
                      sceneObj.transform.scale.x,
                      sceneObj.transform.scale.z, // Swap Y and Z
                      sceneObj.transform.scale.y  // Swap Y and Z
                    );
                    
                    // Check if this object should be visible based on dependencies
                    let isVisible = false; // Default to invisible in viewer mode
          
                    if (isAdminMode) {
                      // In admin mode, use the visibility setting from the config
                      isVisible = sceneObj.visible;
                    } else {
                      // In viewer mode, only show if explicitly selected
                      isVisible = selectedObjects.includes(sceneObj.id);
                      
                      // Also check dependency rules
                      if (isVisible && config.dependencyRules) {
                        // Check 'requires' rules
                        const requiresRules = config.dependencyRules.filter(
                          rule => rule.sourceObjectId === sceneObj.id && rule.type === 'requires'
                        );
                        
                        if (requiresRules.length > 0) {
                          // Object requires other objects to be selected
                          isVisible = isVisible && requiresRules.every(rule => 
                            selectedObjects.includes(rule.targetObjectId)
                          );
                        }
                        
                        // Check 'excludes' rules
                        const excludesRules = config.dependencyRules.filter(
                          rule => rule.sourceObjectId === sceneObj.id && rule.type === 'excludes'
                        );
                        
                        if (excludesRules.length > 0) {
                          // Object cannot be used with certain other objects
                          isVisible = isVisible && !excludesRules.some(rule => 
                            selectedObjects.includes(rule.targetObjectId)
                          );
                        }
                      }
                    }
                    
                    // Add to scene if visible
                    if (isVisible || isAdminMode) {
                      objGroup.visible = isVisible;
                      sceneObjectsGroup.add(objGroup);
                    }
                  },
                  (xhr) => {
                    const progress = (xhr.loaded / xhr.total) * 100;
                    console.log(`Model loading (${displayPath}): ${progress.toFixed(2)}%`);
                  },
                  (error) => {
                    console.error(`Error loading model (${displayPath}):`, error);
                  }
                );
              })
              .catch(error => {
                console.error(`Error checking model file for ${displayPath}:`, error);
              });
          }
        } else {
          // Add all meshes that belong to this object from the main model
          gltfData.scene.traverse((child: any) => {
            if (child instanceof Mesh && sceneObj.partNames.includes(child.name)) {
              // Clone the mesh to avoid modifying the original
              const clonedMesh = child.clone();
              objGroup.add(clonedMesh);
            }
          });
          
          // Position relative to base object
          objGroup.position.set(
            basePosition.x + sceneObj.transform.position.x,
            basePosition.z + sceneObj.transform.position.z, // Swap Y and Z
            basePosition.y + sceneObj.transform.position.y  // Swap Y and Z
          );
          objGroup.rotation.set(
            THREE.MathUtils.degToRad(sceneObj.transform.rotation.x),
            THREE.MathUtils.degToRad(sceneObj.transform.rotation.z), // Swap Y and Z
            THREE.MathUtils.degToRad(sceneObj.transform.rotation.y)  // Swap Y and Z
          );
          objGroup.scale.set(
            sceneObj.transform.scale.x,
            sceneObj.transform.scale.z, // Swap Y and Z
            sceneObj.transform.scale.y  // Swap Y and Z
          );
          
          // Check if this object should be visible based on dependencies
          let isVisible = false; // Default to invisible in viewer mode
          
          if (isAdminMode) {
            // In admin mode, use the visibility setting from the config
            isVisible = sceneObj.visible;
          } else {
            // In viewer mode, only show if explicitly selected
            isVisible = selectedObjects.includes(sceneObj.id);
            
            // Also check dependency rules
            if (isVisible && config.dependencyRules) {
              // Check 'requires' rules
              const requiresRules = config.dependencyRules.filter(
                rule => rule.sourceObjectId === sceneObj.id && rule.type === 'requires'
              );
              
              if (requiresRules.length > 0) {
                // Object requires other objects to be selected
                isVisible = isVisible && requiresRules.every(rule => 
                  selectedObjects.includes(rule.targetObjectId)
                );
              }
              
              // Check 'excludes' rules
              const excludesRules = config.dependencyRules.filter(
                rule => rule.sourceObjectId === sceneObj.id && rule.type === 'excludes'
              );
              
              if (excludesRules.length > 0) {
                // Object cannot be used with certain other objects
                isVisible = isVisible && !excludesRules.some(rule => 
                  selectedObjects.includes(rule.targetObjectId)
                );
              }
            }
          }
          
          // Add to scene if visible
          if (isVisible || isAdminMode) {
            objGroup.visible = isVisible;
            sceneObjectsGroup.add(objGroup);
          }
        }
        
        // Store reference to this object
        sceneObjectsRef.current.set(sceneObj.id, objGroup);
      });
      
  }, [gltfData, config?.sceneObjects, isAdminMode, selectedObjects, config?.dependencyRules, resolveModelPath]);

  useEffect(() => {
    if (!modelRef.current || !config?.sceneObjects) return;
    
    // Get the scene objects container
    const sceneObjectsGroup = modelRef.current.children.find(
      child => child.name === 'scene-objects-container'
    ) as THREE.Group;
    
    if (!sceneObjectsGroup) return;
    
    console.log("Updating scene object visibility based on selection:", selectedObjects);
    
    // In viewer mode, only show selected objects
    if (!isAdminMode) {
      sceneObjectsRef.current.forEach((obj, id) => {
        const isSelected = selectedObjects.includes(id);
        console.log(`Setting visibility for object ${id}: ${isSelected}`);
        obj.visible = isSelected;
      });
    }
  }, [selectedObjects, isAdminMode, config?.sceneObjects]);

  useEffect(() => {
    if (gltfData && modelRef.current) {
      // Center and scale model to fit view
      const box = new THREE.Box3().setFromObject(gltfData.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      
      gltfData.scene.position.sub(center);
      gltfData.scene.scale.multiplyScalar(scale);
      
      // Reset camera position
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
    }
  }, [gltfData, camera]);

  const handlePartClick = (event: ThreeEvent<MouseEvent>, partName: string) => {
    event.stopPropagation();
    if (onPartClick && isAdminMode) {
      onPartClick(partName);
    }
  };

  // Handle object selection
  const handleObjectClick = (event: ThreeEvent<MouseEvent>, objectId: string) => {
    event.stopPropagation();
    if (onObjectSelect && !isAdminMode) {
      // Check if this object can be selected based on selection groups
      if (config?.selectionGroups) {
        const selectionGroup = config.selectionGroups.find(group => 
          group.objectIds.includes(objectId)
        );
        
        if (selectionGroup) {
          const isSelected = selectedObjects.includes(objectId);
          
          if (selectionGroup.type === 'single') {
            // For single selection groups, deselect all other objects in the group
            selectionGroup.objectIds.forEach(id => {
              if (id !== objectId && selectedObjects.includes(id)) {
                onObjectSelect(id, false);
              }
            });
            // Select this object if it wasn't already selected
            if (!isSelected) {
              onObjectSelect(objectId, true);
            }
          } else {
            // For multiple selection, toggle the selection
            onObjectSelect(objectId, !isSelected);
          }
        } else {
          // If not part of a selection group, just toggle selection
          onObjectSelect(objectId, !selectedObjects.includes(objectId));
        }
      } else {
        // If no selection groups defined, just toggle selection
        onObjectSelect(objectId, !selectedObjects.includes(objectId));
      }
    }
  };

  // Don't render anything until we have loaded data
  if (!gltfData) return null;

  return (
    <group 
      ref={modelRef} 
    >
      {gltfData && (
        <primitive object={gltfData.scene} onClick={(e: ThreeEvent<MouseEvent>) => {
          // If clicked on the background, deselect part
          e.stopPropagation();
          if (onPartClick && isAdminMode) {
            onPartClick('');
          }
        }} />
      )}
      {/* Add click handlers to each part */}
      {gltfData?.scene.children.map((child: any) => {
        if (child.type === 'Mesh' && child.name) {
          return (
            <mesh
              key={child.name}
              geometry={child.geometry}
              position={child.position}
              rotation={child.rotation}
              scale={child.scale}
              onClick={(event: ThreeEvent<MouseEvent>) => handlePartClick(event, child.name)}
              onPointerOver={() => {
                if (isAdminMode) {
                  document.body.style.cursor = 'pointer';
                }
              }}
              onPointerOut={() => {
                if (isAdminMode) {
                  document.body.style.cursor = 'default';
                }
              }}
            >
              <meshStandardMaterial
                transparent={true}
                opacity={selectedPart === child.name ? 0.8 : 1}
              />
            </mesh>
          );
        }
        return null;
      })}
      
      {/* Add click handlers for scene objects */}
      {!isAdminMode && config?.sceneObjects?.map(sceneObj => {
        const obj = sceneObjectsRef.current.get(sceneObj.id);
        if (!obj) return null;
        
        return (
          <group 
            key={`clickable-${sceneObj.id}`}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
            onClick={(event: ThreeEvent<MouseEvent>) => handleObjectClick(event, sceneObj.id)}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            {/* Invisible box for better click detection */}
            <mesh visible={false}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
