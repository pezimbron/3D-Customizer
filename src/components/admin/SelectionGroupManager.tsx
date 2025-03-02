import { useState } from 'react';
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
  TextField,
  Checkbox,
  ListItemIcon,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';
import { AdminConfig, SelectionGroup } from '../../types/admin';

interface SelectionGroupManagerProps {
  config: AdminConfig;
  onConfigChange: (config: AdminConfig) => void;
}

export default function SelectionGroupManager({
  config,
  onConfigChange
}: SelectionGroupManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<'multiple' | 'single'>('multiple');
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [defaultSelectedIds, setDefaultSelectedIds] = useState<string[]>([]);

  const handleAddGroup = () => {
    setIsEditing(false);
    setCurrentGroupId(null);
    setGroupName('');
    setGroupType('multiple');
    setSelectedObjectIds([]);
    setDefaultSelectedIds([]);
    setIsDialogOpen(true);
  };

  const handleEditGroup = (groupId: string) => {
    const group = config.selectionGroups?.find(g => g.id === groupId);
    if (!group) return;
    
    setIsEditing(true);
    setCurrentGroupId(groupId);
    setGroupName(group.name);
    setGroupType(group.type);
    setSelectedObjectIds(group.objectIds);
    setDefaultSelectedIds(group.defaultSelectedIds);
    setIsDialogOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    const updatedConfig = { ...config };
    
    // Initialize selectionGroups if it doesn't exist
    if (!updatedConfig.selectionGroups) {
      updatedConfig.selectionGroups = [];
      return; // Nothing to delete if array is empty
    }
    
    updatedConfig.selectionGroups = updatedConfig.selectionGroups.filter(group => group.id !== groupId);
    onConfigChange(updatedConfig);
  };

  const handleSaveGroup = () => {
    if (!groupName) return;
    
    // For single selection type, ensure only one default is selected
    let finalDefaultSelectedIds = defaultSelectedIds;
    if (groupType === 'single' && defaultSelectedIds.length > 1) {
      finalDefaultSelectedIds = [defaultSelectedIds[0]];
    }
    
    const newGroup: SelectionGroup = {
      id: isEditing ? currentGroupId! : uuidv4(),
      name: groupName,
      type: groupType,
      objectIds: selectedObjectIds,
      defaultSelectedIds: finalDefaultSelectedIds
    };
    
    const updatedConfig = { ...config };
    
    // Initialize selectionGroups if it doesn't exist
    if (!updatedConfig.selectionGroups) {
      updatedConfig.selectionGroups = [];
    }
    
    if (isEditing) {
      updatedConfig.selectionGroups = updatedConfig.selectionGroups.map(group => 
        group.id === currentGroupId ? newGroup : group
      );
    } else {
      updatedConfig.selectionGroups = [...updatedConfig.selectionGroups, newGroup];
    }
    
    onConfigChange(updatedConfig);
    setIsDialogOpen(false);
  };

  const handleObjectToggle = (objectId: string) => {
    if (selectedObjectIds.includes(objectId)) {
      setSelectedObjectIds(selectedObjectIds.filter(id => id !== objectId));
      setDefaultSelectedIds(defaultSelectedIds.filter(id => id !== objectId));
    } else {
      setSelectedObjectIds([...selectedObjectIds, objectId]);
    }
  };

  const handleDefaultToggle = (objectId: string) => {
    if (groupType === 'single') {
      setDefaultSelectedIds([objectId]);
    } else {
      if (defaultSelectedIds.includes(objectId)) {
        setDefaultSelectedIds(defaultSelectedIds.filter(id => id !== objectId));
      } else {
        setDefaultSelectedIds([...defaultSelectedIds, objectId]);
      }
    }
  };

  return (
    <div>
      <Box component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Selection Groups</Typography>
        <Button 
          startIcon={<AddIcon />} 
          variant="contained" 
          color="primary"
          onClick={handleAddGroup}
          disabled={!config.sceneObjects || config.sceneObjects.length < 1}
        >
          Add Group
        </Button>
      </Box>
      
      <List>
        {config.selectionGroups?.map((group) => (
          <ListItem 
            key={group.id}
            secondaryAction={
              <>
                <IconButton edge="end" onClick={() => handleEditGroup(group.id)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteGroup(group.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText 
              primary={group.name} 
              secondary={`Type: ${group.type}, Objects: ${group.objectIds.length}`} 
            />
          </ListItem>
        ))}
        {(!config.selectionGroups || config.selectionGroups.length === 0) && (
          <ListItem>
            <ListItemText primary="No selection groups defined yet. Click 'Add Group' to create one." />
          </ListItem>
        )}
      </List>
      
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        container={document.body}
        disablePortal={false}
        disableEnforceFocus
      >
        <DialogTitle>
          {isEditing ? 'Edit Selection Group' : 'Add Selection Group'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Group Type</InputLabel>
            <Select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value as 'multiple' | 'single')}
              label="Group Type"
            >
              <MenuItem value="multiple">Multiple Selection (Checkboxes)</MenuItem>
              <MenuItem value="single">Single Selection (Radio Buttons)</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Objects in Group</Typography>
          <List>
            {config.sceneObjects?.map((object) => (
              <ListItem key={object.id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedObjectIds.includes(object.id)}
                    onChange={() => handleObjectToggle(object.id)}
                  />
                </ListItemIcon>
                <ListItemText primary={object.name} />
                {selectedObjectIds.includes(object.id) && (
                  <Checkbox
                    edge="end"
                    checked={defaultSelectedIds.includes(object.id)}
                    onChange={() => handleDefaultToggle(object.id)}
                    disabled={groupType === 'single' && defaultSelectedIds.length > 0 && !defaultSelectedIds.includes(object.id)}
                  />
                )}
                {selectedObjectIds.includes(object.id) && (
                  <Typography variant="body2" color="textSecondary">
                    Default
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveGroup} 
            variant="contained" 
            color="primary"
            disabled={!groupName || selectedObjectIds.length === 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
