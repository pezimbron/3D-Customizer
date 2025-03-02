import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Collapse,
  Divider,
  Typography,
  Slider,
  Checkbox,
  Radio,
  FormControlLabel,
  FormGroup,
  RadioGroup
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { AdminConfig, PartGroup, SceneObject } from '../types/admin';

const DrawerWidth = 300;

const MenuContainer = styled(Box)({
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 1000,
});

const ColorSwatch = styled(Box)<{ color: string }>(({ color }) => ({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: color,
  border: '1px solid #ccc',
  cursor: 'pointer',
  margin: '0 4px',
}));

const ColorSwatchContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
  marginBottom: 8,
});

const HeaderBox = styled(Box)({
  marginBottom: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

interface DrawerContentProps {
  config: AdminConfig;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (groupId: string) => void;
  handleColorChange: (groupId: string, partIndex: number, color: string) => void;
  handleMetalnessChange: (groupId: string, partIndex: number, value: number) => void;
  handleRoughnessChange: (groupId: string, partIndex: number, value: number) => void;
  onClose: () => void;
  selectedObjects?: string[];
  onObjectSelect?: (objectId: string, selected: boolean) => void;
}

const DrawerContent = ({
  config,
  expandedGroups,
  toggleGroup,
  handleColorChange,
  handleMetalnessChange,
  handleRoughnessChange,
  onClose,
  selectedObjects = [],
  onObjectSelect
}: DrawerContentProps) => {
  // Group scene objects by their selection groups
  const objectsBySelectionGroup = React.useMemo(() => {
    if (!config.selectionGroups || !config.sceneObjects) return {};
    
    const result: Record<string, SceneObject[]> = {};
    
    config.selectionGroups.forEach(group => {
      result[group.id] = group.objectIds
        .map(id => config.sceneObjects?.find(obj => obj.id === id))
        .filter((obj): obj is SceneObject => obj !== undefined);
    });
    
    return result;
  }, [config.selectionGroups, config.sceneObjects]);
  
  // Get objects that are not in any selection group
  const ungroupedObjects = React.useMemo(() => {
    if (!config.sceneObjects) return [];
    
    const groupedObjectIds = config.selectionGroups
      ? config.selectionGroups.flatMap(group => group.objectIds)
      : [];
      
    return config.sceneObjects.filter(obj => !groupedObjectIds.includes(obj.id));
  }, [config.sceneObjects, config.selectionGroups]);

  return (
    <>
      <HeaderBox>
        <Typography variant="h6" component="div">
          Customize Model
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </HeaderBox>
      <Divider />
      
      {/* Selection Groups */}
      {config.selectionGroups && config.selectionGroups.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Options
          </Typography>
          <List>
            {config.selectionGroups.map((group) => (
              <React.Fragment key={group.id}>
                <ListItem 
                  button 
                  onClick={() => toggleGroup(`selection-${group.id}`)}
                >
                  <ListItemText primary={group.name} />
                  {expandedGroups[`selection-${group.id}`] ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={expandedGroups[`selection-${group.id}`]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {group.type === 'single' ? (
                      <RadioGroup
                        value={selectedObjects.find(id => group.objectIds.includes(id)) || ''}
                        onChange={(e) => {
                          if (onObjectSelect) {
                            const selectedValue = e.target.value;
                            const currentlySelected = selectedObjects.find(id => group.objectIds.includes(id));
                            
                            // If clicking on the same radio button that's already selected, deselect it
                            if (currentlySelected === selectedValue) {
                              onObjectSelect(selectedValue, false);
                              return;
                            }
                            
                            // Deselect all other objects in this group
                            group.objectIds.forEach(id => {
                              if (id !== selectedValue && selectedObjects.includes(id)) {
                                onObjectSelect(id, false);
                              }
                            });
                            
                            // Select the new one
                            onObjectSelect(selectedValue, true);
                          }
                        }}
                      >
                        {objectsBySelectionGroup[group.id]?.map((object) => (
                          <ListItem key={object.id} sx={{ pl: 4 }}>
                            <FormControlLabel
                              value={object.id}
                              control={<Radio />}
                              label={object.name}
                            />
                          </ListItem>
                        ))}
                      </RadioGroup>
                    ) : (
                      <FormGroup>
                        {objectsBySelectionGroup[group.id]?.map((object) => (
                          <ListItem key={object.id} sx={{ pl: 4 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedObjects.includes(object.id)}
                                  onChange={(e) => {
                                    if (onObjectSelect) {
                                      onObjectSelect(object.id, e.target.checked);
                                    }
                                  }}
                                />
                              }
                              label={object.name}
                            />
                          </ListItem>
                        ))}
                      </FormGroup>
                    )}
                  </List>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
        </>
      )}
      
      {/* Ungrouped Objects */}
      {ungroupedObjects.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Additional Options
          </Typography>
          <List>
            <ListItem 
              button 
              onClick={() => toggleGroup('ungrouped-objects')}
            >
              <ListItemText primary="Other Options" />
              {expandedGroups['ungrouped-objects'] ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedGroups['ungrouped-objects']} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <FormGroup>
                  {ungroupedObjects.map((object) => (
                    <ListItem key={object.id} sx={{ pl: 4 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedObjects.includes(object.id)}
                            onChange={(e) => {
                              if (onObjectSelect) {
                                onObjectSelect(object.id, e.target.checked);
                              }
                            }}
                          />
                        }
                        label={object.name}
                      />
                    </ListItem>
                  ))}
                </FormGroup>
              </List>
            </Collapse>
          </List>
          <Divider sx={{ my: 2 }} />
        </>
      )}
      
      {/* Part Groups for Customization */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
        Customize Colors
      </Typography>
      <List>
        {config.partGroups.map((group: PartGroup) => (
          <React.Fragment key={group.id}>
            <ListItem 
              button 
              onClick={() => toggleGroup(group.id)}
            >
              <ListItemText primary={group.name} />
              {expandedGroups[group.id] ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedGroups[group.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {group.parts.map((part: string, partIndex: number) => (
                  <ListItem key={part} sx={{ pl: 4 }}>
                    <Box component="div" sx={{ width: '100%' }}>
                      
                      <ColorSwatchContainer>
                        {group.allowedColors.map((color: string) => (
                          <ColorSwatch 
                            key={color} 
                            color={color}
                            onClick={() => handleColorChange(group.id, partIndex, color)}
                            sx={{
                              outline: group.colors[partIndex] === color ? '2px solid blue' : 'none',
                              transform: group.colors[partIndex] === color ? 'scale(1.2)' : 'scale(1)'
                            }}
                          />
                        ))}
                      </ColorSwatchContainer>
                      
                      {group.allowMetalness && (
                        <Box component="div" sx={{ mt: 2 }}>
                          <Typography variant="caption">Metalness</Typography>
                          <Slider
                            size="small"
                            min={0}
                            max={1}
                            step={0.01}
                            value={group.metalness?.[partIndex] !== undefined ? group.metalness[partIndex] : 0.5}
                            valueLabelDisplay="auto"
                            onChange={(_, value: number | number[], _activeThumb) => 
                              handleMetalnessChange(group.id, partIndex, value as number)
                            }
                          />
                        </Box>
                      )}
                      
                      {group.allowRoughness && (
                        <Box component="div" sx={{ mt: 2 }}>
                          <Typography variant="caption">Roughness</Typography>
                          <Slider
                            size="small"
                            min={0}
                            max={1}
                            step={0.01}
                            value={group.roughness?.[partIndex] !== undefined ? group.roughness[partIndex] : 0.5}
                            valueLabelDisplay="auto"
                            onChange={(_, value: number | number[], _activeThumb) => 
                              handleRoughnessChange(group.id, partIndex, value as number)
                            }
                          />
                        </Box>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </>
  );
};

interface PartGroupMenuProps {
  config: AdminConfig;
  onPartGroupUpdate: (groupId: string, partIndex: number, color: string) => void;
  onMetalnessChange?: (groupId: string, partIndex: number, value: number) => void;
  onRoughnessChange?: (groupId: string, partIndex: number, value: number) => void;
  selectedObjects?: string[];
  onObjectSelect?: (objectId: string, selected: boolean) => void;
}

export default function PartGroupMenu({
  config,
  onPartGroupUpdate,
  onMetalnessChange,
  onRoughnessChange,
  selectedObjects = [],
  onObjectSelect
}: PartGroupMenuProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleColorChange = (groupId: string, partIndex: number, color: string) => {
    onPartGroupUpdate(groupId, partIndex, color);
  };

  const handleMetalnessChange = (groupId: string, partIndex: number, value: number) => {
    if (onMetalnessChange) {
      onMetalnessChange(groupId, partIndex, value);
    }
  };

  const handleRoughnessChange = (groupId: string, partIndex: number, value: number) => {
    if (onRoughnessChange) {
      onRoughnessChange(groupId, partIndex, value);
    }
  };

  return (
    <>
      <MenuContainer>
        <IconButton 
          color="primary" 
          onClick={toggleDrawer}
          sx={{ 
            bgcolor: 'white', 
            boxShadow: 2,
            '&:hover': { bgcolor: 'white' } 
          }}
        >
          <MenuIcon />
        </IconButton>
      </MenuContainer>

      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        hideBackdrop={true}
        sx={{
          width: DrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DrawerWidth,
            boxSizing: 'border-box',
            padding: 2
          },
        }}
      >
        <DrawerContent 
          config={config}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          handleColorChange={handleColorChange}
          handleMetalnessChange={handleMetalnessChange}
          handleRoughnessChange={handleRoughnessChange}
          onClose={toggleDrawer}
          selectedObjects={selectedObjects}
          onObjectSelect={onObjectSelect}
        />
      </Drawer>
    </>
  );
}
