import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Model from './Model';
import LoadingSpinner from './LoadingSpinner';
import PartGroupMenu from './PartGroupMenu';
import PersistentOrbitControls from './PersistentOrbitControls';
import { AdminConfig } from '../types/admin';

const ViewerContainer = styled(Box)({
  width: '100%',
  height: '100%',
  position: 'relative'
});

interface ModelViewerProps {
  modelData: ArrayBuffer;
  config: AdminConfig;
  onConfigChange?: (config: AdminConfig) => void;
}

export default function ModelViewer({ modelData, config, onConfigChange }: ModelViewerProps) {
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentConfig, setCurrentConfig] = useState<AdminConfig>(config);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);

  // Load selected objects from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const objectsParam = params.get('objects');
    
    if (objectsParam) {
      try {
        const decodedObjects = JSON.parse(decodeURIComponent(objectsParam));
        if (Array.isArray(decodedObjects)) {
          // Validate that all objects exist in the config
          const validObjects = decodedObjects.filter(id => 
            currentConfig.sceneObjects?.some(obj => obj.id === id)
          );
          setSelectedObjects(validObjects);
        }
      } catch (e) {
        console.error('Error parsing objects from URL:', e);
      }
    } else if (currentConfig.selectionGroups && window.location.pathname.includes('/admin')) {
      // Only apply default selections in admin mode
      const defaultSelectedIds = currentConfig.selectionGroups.flatMap(group => group.defaultSelectedIds || []);
      setSelectedObjects(defaultSelectedIds);
    } else {
      // Start with no objects selected in viewer mode
      setSelectedObjects([]);
    }
  }, []);  // Run only once on mount

  // Update URL when selected objects change
  useEffect(() => {
    if (selectedObjects.length > 0) {
      const url = new URL(window.location.href);
      url.searchParams.set('objects', encodeURIComponent(JSON.stringify(selectedObjects)));
      window.history.replaceState({}, '', url.toString());
    } else {
      // Remove the parameter if no objects are selected
      const url = new URL(window.location.href);
      url.searchParams.delete('objects');
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedObjects]);

  // Load part group configurations from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    
    if (configParam && currentConfig.partGroups) {
      try {
        const decodedConfig = JSON.parse(decodeURIComponent(configParam));
        
        // Apply the decoded configurations to the current config
        const updatedConfig = { ...currentConfig };
        
        // Update part group colors
        if (decodedConfig.partGroups) {
          decodedConfig.partGroups.forEach((groupConfig: any) => {
            const groupIndex = updatedConfig.partGroups.findIndex(g => g.id === groupConfig.id);
            if (groupIndex !== -1) {
              if (groupConfig.colors) {
                updatedConfig.partGroups[groupIndex].colors = groupConfig.colors;
              }
              if (groupConfig.metalness) {
                updatedConfig.partGroups[groupIndex].metalness = groupConfig.metalness;
              }
              if (groupConfig.roughness) {
                updatedConfig.partGroups[groupIndex].roughness = groupConfig.roughness;
              }
            }
          });
          
          setCurrentConfig(updatedConfig);
          
          if (onConfigChange) {
            onConfigChange(updatedConfig);
          }
        }
      } catch (e) {
        console.error('Error parsing config from URL:', e);
      }
    }
  }, []);  // Run only once on mount

  const handleLoadProgress = (progress: number) => {
    setLoadingProgress(progress);
    if (progress === 100) {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handlePartGroupUpdate = (groupId: string, partIndex: number, color: string) => {
    const updatedConfig = { ...currentConfig };
    const groupIndex = updatedConfig.partGroups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      updatedConfig.partGroups[groupIndex].colors[partIndex] = color;
      setCurrentConfig(updatedConfig);
      
      if (onConfigChange) {
        onConfigChange(updatedConfig);
      }
      
      // Update URL with new configuration
      updateConfigInUrl(updatedConfig);
    }
  };

  const handleMetalnessChange = (groupId: string, partIndex: number, value: number) => {
    const updatedConfig = { ...currentConfig };
    const groupIndex = updatedConfig.partGroups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      // Initialize metalness array if it doesn't exist
      if (!updatedConfig.partGroups[groupIndex].metalness) {
        updatedConfig.partGroups[groupIndex].metalness = updatedConfig.partGroups[groupIndex].parts.map(() => 0.5);
      }
      
      // Update the metalness value for the specific part
      updatedConfig.partGroups[groupIndex].metalness![partIndex] = value;
      setCurrentConfig(updatedConfig);
      
      if (onConfigChange) {
        onConfigChange(updatedConfig);
      }
      
      // Update URL with new configuration
      updateConfigInUrl(updatedConfig);
    }
  };

  const handleRoughnessChange = (groupId: string, partIndex: number, value: number) => {
    const updatedConfig = { ...currentConfig };
    const groupIndex = updatedConfig.partGroups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      // Initialize roughness array if it doesn't exist
      if (!updatedConfig.partGroups[groupIndex].roughness) {
        updatedConfig.partGroups[groupIndex].roughness = updatedConfig.partGroups[groupIndex].parts.map(() => 0.5);
      }
      
      // Update the roughness value for the specific part
      updatedConfig.partGroups[groupIndex].roughness![partIndex] = value;
      setCurrentConfig(updatedConfig);
      
      if (onConfigChange) {
        onConfigChange(updatedConfig);
      }
      
      // Update URL with new configuration
      updateConfigInUrl(updatedConfig);
    }
  };

  // Helper function to update configuration in URL
  const updateConfigInUrl = (config: AdminConfig) => {
    // Create a simplified version of the config with only what we need
    const simplifiedConfig = {
      partGroups: config.partGroups.map(group => ({
        id: group.id,
        colors: group.colors,
        metalness: group.metalness,
        roughness: group.roughness
      }))
    };
    
    const url = new URL(window.location.href);
    url.searchParams.set('config', encodeURIComponent(JSON.stringify(simplifiedConfig)));
    window.history.replaceState({}, '', url.toString());
  };

  const handleObjectSelect = (objectId: string, selected: boolean) => {
    setSelectedObjects(prev => {
      let newSelectedObjects: string[];
      
      if (selected && !prev.includes(objectId)) {
        newSelectedObjects = [...prev, objectId];
      } else if (!selected && prev.includes(objectId)) {
        newSelectedObjects = prev.filter(id => id !== objectId);
      } else {
        return prev; // No change needed
      }
      
      // Apply dependency rules
      if (currentConfig.dependencyRules) {
        // Handle 'requires' dependencies
        const requiresRules = currentConfig.dependencyRules.filter(
          rule => newSelectedObjects.includes(rule.sourceObjectId) && rule.type === 'requires'
        );
        
        requiresRules.forEach(rule => {
          if (!newSelectedObjects.includes(rule.targetObjectId)) {
            newSelectedObjects.push(rule.targetObjectId);
          }
        });
        
        // Handle 'excludes' dependencies
        const excludesRules = currentConfig.dependencyRules.filter(
          rule => newSelectedObjects.includes(rule.sourceObjectId) && rule.type === 'excludes'
        );
        
        excludesRules.forEach(rule => {
          newSelectedObjects = newSelectedObjects.filter(id => id !== rule.targetObjectId);
        });
      }
      
      return newSelectedObjects;
    });
  };

  return (
    <ViewerContainer>
      <PartGroupMenu 
        config={currentConfig}
        onPartGroupUpdate={handlePartGroupUpdate}
        onMetalnessChange={handleMetalnessChange}
        onRoughnessChange={handleRoughnessChange}
        selectedObjects={selectedObjects}
        onObjectSelect={handleObjectSelect}
      />
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: '#f5f5f5' }}
      >
        <ambientLight intensity={currentConfig.lightSettings.ambientIntensity} />
        <spotLight 
          position={currentConfig.lightSettings.spotlightPosition} 
          intensity={currentConfig.lightSettings.spotlightIntensity}
        />
        <pointLight 
          position={currentConfig.lightSettings.pointLightPosition}
          intensity={currentConfig.lightSettings.pointLightIntensity} 
        />
        <Grid 
          position={[0, -1, 0]} 
          args={[20, 20]} 
          cellSize={1} 
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={30}
          infiniteGrid
        />
        <Suspense fallback={null}>
          <Model 
            modelData={modelData}
            onLoadProgress={handleLoadProgress}
            config={currentConfig}
            selectedPart={selectedPart}
            onPartClick={setSelectedPart}
            selectedObjects={selectedObjects}
            onObjectSelect={handleObjectSelect}
          />
        </Suspense>
        <PersistentOrbitControls />
      </Canvas>

      {isLoading && (
        <LoadingSpinner progress={loadingProgress} />
      )}
    </ViewerContainer>
  );
}