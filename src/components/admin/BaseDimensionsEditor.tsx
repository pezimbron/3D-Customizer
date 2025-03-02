import React, { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Grid,
  Slider,
  Box,
  InputAdornment,
} from '@mui/material';
import { AdminConfig } from '../../types/admin';

interface BaseDimensionsEditorProps {
  config: AdminConfig;
  onConfigChange: (newConfig: AdminConfig) => void;
}

// Add these properties to the AdminConfig if they don't exist
interface ModelDimensions {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export default function BaseDimensionsEditor({ config, onConfigChange }: BaseDimensionsEditorProps) {
  // Get the model dimensions from config or use defaults
  const defaultDimensions: ModelDimensions = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };
  
  // State for dimensions
  const [dimensions, setDimensions] = useState<ModelDimensions>(
    (config.modelDimensions as ModelDimensions) || defaultDimensions
  );

  // Update local state when the config changes
  useEffect(() => {
    if (config.modelDimensions) {
      setDimensions(config.modelDimensions as ModelDimensions);
    }
  }, [config]);

  // Handle input changes
  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newDimensions = {
      ...dimensions,
      position: {
        ...dimensions.position,
        [axis]: value
      }
    };
    setDimensions(newDimensions);
    
    // Apply changes immediately
    const updatedConfig: AdminConfig = {
      ...config,
      modelDimensions: newDimensions,
    };
    onConfigChange(updatedConfig);
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newDimensions = {
      ...dimensions,
      rotation: {
        ...dimensions.rotation,
        [axis]: value
      }
    };
    setDimensions(newDimensions);
    
    // Apply changes immediately
    const updatedConfig: AdminConfig = {
      ...config,
      modelDimensions: newDimensions,
    };
    onConfigChange(updatedConfig);
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newDimensions = {
      ...dimensions,
      scale: {
        ...dimensions.scale,
        [axis]: value
      }
    };
    setDimensions(newDimensions);
    
    // Apply changes immediately
    const updatedConfig: AdminConfig = {
      ...config,
      modelDimensions: newDimensions,
    };
    onConfigChange(updatedConfig);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" gutterBottom>
        Model Dimensions
      </Typography>

      {/* Position Controls */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Position
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <TextField
            label="X"
            type="number"
            size="small"
            fullWidth
            value={dimensions.position.x}
            onChange={(e) => handlePositionChange('x', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">units</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Y"
            type="number"
            size="small"
            fullWidth
            value={dimensions.position.y}
            onChange={(e) => handlePositionChange('y', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">units</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Z"
            type="number"
            size="small"
            fullWidth
            value={dimensions.position.z}
            onChange={(e) => handlePositionChange('z', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">units</InputAdornment>,
            }}
          />
        </Grid>
      </Grid>

      {/* Rotation Controls */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Rotation
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <TextField
            label="X"
            type="number"
            size="small"
            fullWidth
            value={dimensions.rotation.x}
            onChange={(e) => handleRotationChange('x', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">°</InputAdornment>,
            }}
          />
          <Slider
            size="small"
            min={0}
            max={360}
            value={dimensions.rotation.x}
            onChange={(_, value) => handleRotationChange('x', value as number)}
            aria-labelledby="x-rotation-slider"
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Y"
            type="number"
            size="small"
            fullWidth
            value={dimensions.rotation.y}
            onChange={(e) => handleRotationChange('y', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">°</InputAdornment>,
            }}
          />
          <Slider
            size="small"
            min={0}
            max={360}
            value={dimensions.rotation.y}
            onChange={(_, value) => handleRotationChange('y', value as number)}
            aria-labelledby="y-rotation-slider"
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Z"
            type="number"
            size="small"
            fullWidth
            value={dimensions.rotation.z}
            onChange={(e) => handleRotationChange('z', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">°</InputAdornment>,
            }}
          />
          <Slider
            size="small"
            min={0}
            max={360}
            value={dimensions.rotation.z}
            onChange={(_, value) => handleRotationChange('z', value as number)}
            aria-labelledby="z-rotation-slider"
          />
        </Grid>
      </Grid>

      {/* Scale Controls */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Scale
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <TextField
            label="X"
            type="number"
            size="small"
            fullWidth
            value={dimensions.scale.x}
            onChange={(e) => handleScaleChange('x', Number(e.target.value))}
            inputProps={{ step: 0.1, min: 0.1 }}
          />
          <Slider
            size="small"
            min={0.1}
            max={5}
            step={0.1}
            value={dimensions.scale.x}
            onChange={(_, value) => handleScaleChange('x', value as number)}
            aria-labelledby="x-scale-slider"
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Y"
            type="number"
            size="small"
            fullWidth
            value={dimensions.scale.y}
            onChange={(e) => handleScaleChange('y', Number(e.target.value))}
            inputProps={{ step: 0.1, min: 0.1 }}
          />
          <Slider
            size="small"
            min={0.1}
            max={5}
            step={0.1}
            value={dimensions.scale.y}
            onChange={(_, value) => handleScaleChange('y', value as number)}
            aria-labelledby="y-scale-slider"
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Z"
            type="number"
            size="small"
            fullWidth
            value={dimensions.scale.z}
            onChange={(e) => handleScaleChange('z', Number(e.target.value))}
            inputProps={{ step: 0.1, min: 0.1 }}
          />
          <Slider
            size="small"
            min={0.1}
            max={5}
            step={0.1}
            value={dimensions.scale.z}
            onChange={(_, value) => handleScaleChange('z', value as number)}
            aria-labelledby="z-scale-slider"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
