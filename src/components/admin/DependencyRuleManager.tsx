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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';
import { AdminConfig, DependencyRule } from '../../types/admin';

interface DependencyRuleManagerProps {
  config: AdminConfig;
  onConfigChange: (config: AdminConfig) => void;
}

export default function DependencyRuleManager({
  config,
  onConfigChange
}: DependencyRuleManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sourceObjectId, setSourceObjectId] = useState('');
  const [targetObjectId, setTargetObjectId] = useState('');
  const [ruleType, setRuleType] = useState<'requires' | 'excludes'>('requires');

  const handleAddRule = () => {
    setSourceObjectId('');
    setTargetObjectId('');
    setRuleType('requires');
    setIsDialogOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedConfig = { ...config };
    
    // Initialize dependencyRules if it doesn't exist
    if (!updatedConfig.dependencyRules) {
      updatedConfig.dependencyRules = [];
      return; // Nothing to delete if array is empty
    }
    
    updatedConfig.dependencyRules = updatedConfig.dependencyRules.filter(rule => rule.id !== ruleId);
    onConfigChange(updatedConfig);
  };

  const handleSaveRule = () => {
    if (!sourceObjectId || !targetObjectId) return;
    
    const newRule: DependencyRule = {
      id: uuidv4(),
      sourceObjectId,
      targetObjectId,
      type: ruleType
    };
    
    const updatedConfig = { ...config };
    
    // Initialize dependencyRules if it doesn't exist
    if (!updatedConfig.dependencyRules) {
      updatedConfig.dependencyRules = [];
    }
    
    updatedConfig.dependencyRules = [...updatedConfig.dependencyRules, newRule];
    onConfigChange(updatedConfig);
    setIsDialogOpen(false);
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Dependency Rules</Typography>
        <Button 
          startIcon={<AddIcon />} 
          variant="contained" 
          color="primary"
          onClick={handleAddRule}
          disabled={!config.sceneObjects || config.sceneObjects.length < 2}
        >
          Add Rule
        </Button>
      </Box>
      
      <List>
        {config.dependencyRules?.map((rule) => {
          const sourceObject = config.sceneObjects?.find(obj => obj.id === rule.sourceObjectId);
          const targetObject = config.sceneObjects?.find(obj => obj.id === rule.targetObjectId);
          
          return (
            <ListItem 
              key={rule.id}
              secondaryAction={
                <IconButton edge="end" onClick={() => handleDeleteRule(rule.id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText 
                primary={`${sourceObject?.name || 'Unknown'} ${rule.type} ${targetObject?.name || 'Unknown'}`} 
                secondary={rule.type === 'requires' ? 
                  `${sourceObject?.name} cannot be used without ${targetObject?.name}` : 
                  `${sourceObject?.name} cannot be used together with ${targetObject?.name}`
                } 
              />
            </ListItem>
          );
        })}
        {(!config.dependencyRules || config.dependencyRules.length === 0) && (
          <ListItem>
            <ListItemText primary="No dependency rules defined yet. Click 'Add Rule' to create one." />
          </ListItem>
        )}
      </List>
      
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        container={document.body}
        disablePortal={false}
        disableEnforceFocus
      >
        <DialogTitle>Add Dependency Rule</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Source Object</InputLabel>
            <Select
              value={sourceObjectId}
              onChange={(e) => setSourceObjectId(e.target.value)}
              label="Source Object"
            >
              {config.sceneObjects?.map((object) => (
                <MenuItem key={object.id} value={object.id}>
                  {object.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Rule Type</InputLabel>
            <Select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as 'requires' | 'excludes')}
              label="Rule Type"
            >
              <MenuItem value="requires">Requires (must have)</MenuItem>
              <MenuItem value="excludes">Excludes (cannot have)</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Target Object</InputLabel>
            <Select
              value={targetObjectId}
              onChange={(e) => setTargetObjectId(e.target.value)}
              label="Target Object"
            >
              {config.sceneObjects
                ?.filter(obj => obj.id !== sourceObjectId)
                .map((object) => (
                  <MenuItem key={object.id} value={object.id}>
                    {object.name}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveRule} 
            variant="contained" 
            color="primary"
            disabled={!sourceObjectId || !targetObjectId}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
