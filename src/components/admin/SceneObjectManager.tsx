import React, { useState } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
  Dialog,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { AdminConfig, SceneObject } from '../../types/admin';
import SceneObjectEditor from './SceneObjectEditor';

interface SceneObjectManagerProps {
  config: AdminConfig;
  onConfigChange: (config: AdminConfig) => void;
  availableParts: string[];
}

export default function SceneObjectManager({ 
  config, 
  onConfigChange, 
  availableParts 
}: SceneObjectManagerProps) {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddObject = () => {
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleEditObject = (objectId: string) => {
    setSelectedObjectId(objectId);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleDeleteObject = (objectId: string) => {
    const updatedConfig = { ...config };
    
    // Initialize sceneObjects if it doesn't exist
    if (!updatedConfig.sceneObjects) {
      updatedConfig.sceneObjects = [];
    }
    
    updatedConfig.sceneObjects = updatedConfig.sceneObjects.filter(obj => obj.id !== objectId);
    
    // Also clean up any dependency rules or selection groups that reference this object
    if (updatedConfig.dependencyRules) {
      updatedConfig.dependencyRules = updatedConfig.dependencyRules.filter(
        rule => rule.sourceObjectId !== objectId && rule.targetObjectId !== objectId
      );
    }
    
    if (updatedConfig.selectionGroups) {
      updatedConfig.selectionGroups = updatedConfig.selectionGroups.map(group => ({
        ...group,
        objectIds: group.objectIds.filter(id => id !== objectId),
        defaultSelectedIds: group.defaultSelectedIds.filter(id => id !== objectId)
      }));
    }
    
    onConfigChange(updatedConfig);
  };

  const handleToggleVisibility = (objectId: string) => {
    const updatedConfig = { ...config };
    
    // Initialize sceneObjects if it doesn't exist
    if (!updatedConfig.sceneObjects) {
      updatedConfig.sceneObjects = [];
    }
    
    updatedConfig.sceneObjects = updatedConfig.sceneObjects.map(obj => 
      obj.id === objectId ? { ...obj, visible: !obj.visible } : obj
    );
    
    onConfigChange(updatedConfig);
  };

  const handleSaveObject = (object: SceneObject) => {
    const updatedConfig = { ...config };
    
    // Initialize sceneObjects if it doesn't exist
    if (!updatedConfig.sceneObjects) {
      updatedConfig.sceneObjects = [];
    }
    
    if (isCreating) {
      updatedConfig.sceneObjects = [...updatedConfig.sceneObjects, object];
    } else {
      updatedConfig.sceneObjects = updatedConfig.sceneObjects.map(obj => 
        obj.id === object.id ? object : obj
      );
    }
    
    onConfigChange(updatedConfig);
    setIsEditorOpen(false);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Scene Objects</Typography>
        <Button 
          startIcon={<AddIcon />} 
          variant="contained" 
          color="primary"
          onClick={handleAddObject}
        >
          Add Object
        </Button>
      </Box>
      
      <List>
        {config.sceneObjects?.map((object) => (
          <ListItem 
            key={object.id}
            secondaryAction={
              <>
                <IconButton edge="end" onClick={() => handleEditObject(object.id)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleToggleVisibility(object.id)}>
                  {object.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteObject(object.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText 
              primary={object.name} 
              secondary={
                <>
                  {object.modelPath ? `Model: ${object.modelPath}` : 'No model path set'}
                  {` • ${object.visible ? 'Visible' : 'Hidden'}`}
                </>
              }
            />
          </ListItem>
        ))}
        {(!config.sceneObjects || config.sceneObjects.length === 0) && (
          <ListItem>
            <ListItemText primary="No objects defined yet. Click 'Add Object' to create one." />
          </ListItem>
        )}
      </List>
      
      {isEditorOpen && (
        <Dialog 
          open={isEditorOpen} 
          onClose={handleCloseEditor} 
          maxWidth="md" 
          fullWidth
          container={document.body}
          disablePortal={false}
          disableEnforceFocus
        >
          <SceneObjectEditor
            isCreating={isCreating}
            object={isCreating ? null : config.sceneObjects?.find(obj => obj.id === selectedObjectId)!}
            availableParts={availableParts}
            onSave={handleSaveObject}
            onCancel={handleCloseEditor}
          />
        </Dialog>
      )}
    </div>
  );
}
