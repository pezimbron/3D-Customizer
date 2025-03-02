import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Input,
  CircularProgress,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { SceneObject, ObjectTransform, Position, Rotation, Scale } from '../../types/admin';

interface SceneObjectEditorProps {
  isCreating: boolean;
  object: SceneObject | null;
  availableParts: string[];
  onSave: (object: SceneObject) => void;
  onCancel: () => void;
}

const defaultTransform: ObjectTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
};

export default function SceneObjectEditor({
  isCreating,
  object,
  availableParts,
  onSave,
  onCancel
}: SceneObjectEditorProps) {
  const [name, setName] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState<Rotation>({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState<Scale>({ x: 1, y: 1, z: 1 });
  const [visible, setVisible] = useState(true);
  const [isBase, setIsBase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (object) {
      setName(object.name);
      setModelPath(object.modelPath || '');
      setDataUrl(object.modelPath?.startsWith('data:') ? object.modelPath : null);
      setPosition(object.transform.position);
      setRotation(object.transform.rotation);
      setScale(object.transform.scale);
      setVisible(object.visible);
      setIsBase(object.isBase || false);
    } else {
      // Default values for new object
      setName('');
      setModelPath('');
      setModelFile(null);
      setDataUrl(null);
      setPosition(defaultTransform.position);
      setRotation(defaultTransform.rotation);
      setScale(defaultTransform.scale);
      setVisible(true);
      setIsBase(false);
    }
  }, [object]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setModelFile(file);
      setIsLoading(true);
      
      // Create a data URL from the file
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setDataUrl(result);
        setModelPath(result); // Use the data URL as the model path
        console.log(`Created data URL for file: ${file.name}`);
        setIsLoading(false);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
    try {
      // Create the object with the data URL as the model path
      const newObject: SceneObject = {
        id: isCreating ? uuidv4() : object!.id,
        name,
        modelPath: dataUrl || modelPath, // Use the data URL if available
        partNames: [], // We're not selecting parts anymore
        transform: {
          position,
          rotation,
          scale
        },
        visible,
        isBase
      };
      
      console.log('Saving scene object with data URL model');
      onSave(newObject);
    } catch (error) {
      console.error("Error saving object:", error);
      alert("Error saving object. Please try again.");
    }
  };

  const handlePositionChange = (axis: keyof Position, value: number) => {
    setPosition({ ...position, [axis]: value });
  };

  const handleRotationChange = (axis: keyof Rotation, value: number) => {
    setRotation({ ...rotation, [axis]: value });
  };

  const handleScaleChange = (axis: keyof Scale, value: number) => {
    setScale({ ...scale, [axis]: value });
  };

  return (
    <>
      <DialogTitle>{isCreating ? 'Add New Object' : 'Edit Object'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              3D Model
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Input
                  type="file"
                  inputRef={fileInputRef}
                  onChange={handleFileChange}
                  fullWidth
                  accept=".glb,.gltf"
                />
              </Grid>
              <Grid item xs={12}>
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={24} style={{ marginRight: 8 }} />
                    <Typography variant="body1">Loading model...</Typography>
                  </div>
                ) : modelFile ? (
                  <Typography variant="body1" gutterBottom>
                    Selected file: {modelFile.name} {dataUrl ? '(converted to data URL)' : ''}
                  </Typography>
                ) : (
                  <Typography variant="body1" gutterBottom>
                    No file selected
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isBase}
                  onChange={(e) => setIsBase(e.target.checked)}
                />
              }
              label="Is Base Object"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                />
              }
              label="Visible"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Position
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  label="X"
                  type="number"
                  value={position.x}
                  onChange={(e) => handlePositionChange('x', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Y"
                  type="number"
                  value={position.y}
                  onChange={(e) => handlePositionChange('y', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Z"
                  type="number"
                  value={position.z}
                  onChange={(e) => handlePositionChange('z', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Rotation (degrees)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  label="X"
                  type="number"
                  value={rotation.x}
                  onChange={(e) => handleRotationChange('x', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Y"
                  type="number"
                  value={rotation.y}
                  onChange={(e) => handleRotationChange('y', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Z"
                  type="number"
                  value={rotation.z}
                  onChange={(e) => handleRotationChange('z', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Scale
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  label="X"
                  type="number"
                  value={scale.x}
                  onChange={(e) => handleScaleChange('x', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Y"
                  type="number"
                  value={scale.y}
                  onChange={(e) => handleScaleChange('y', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Z"
                  type="number"
                  value={scale.z}
                  onChange={(e) => handleScaleChange('z', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!name.trim() || !modelPath.trim()}
        >
          Save
        </Button>
      </DialogActions>
    </>
  );
}
