import { useState } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { Canvas } from '@react-three/fiber';
import PersistentOrbitControls from '../PersistentOrbitControls';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { PartGroup, AdminConfig } from '../../types/admin';
import PartGroupEditor from './PartGroupEditor';
import LightingControls from '../LightingControls';
import Model from '../Model';
import SceneObjectManager from './SceneObjectManager';
import DependencyRuleManager from './DependencyRuleManager';
import SelectionGroupManager from './SelectionGroupManager';

interface AdminPanelProps {
  onClose: () => void;
  config: AdminConfig;
  onConfigChange: (config: AdminConfig) => void;
  availableParts: string[];
  modelData: ArrayBuffer;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && (
        <div style={{ height: '100%' }}>
          {children}
        </div>
      )}
    </div>
  );
}

const DRAWER_WIDTH = 400;

export default function AdminPanel({
  onClose,
  config,
  onConfigChange,
  availableParts,
  modelData,
}: AdminPanelProps) {
  const [selectedGroup, setSelectedGroup] = useState<PartGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const handleAddGroup = () => {
    const newGroup: PartGroup = {
      id: Date.now().toString(),
      name: 'New Group',
      parts: [],
      allowedColors: [],
      allowMetalness: false,
      allowRoughness: false,
      colors: []
    };
    
    onConfigChange({
      ...config,
      partGroups: [...config.partGroups, newGroup]
    });

    setSelectedGroup(newGroup);
    setIsEditing(true);
  };

  const handleEditGroup = (group: PartGroup) => {
    setSelectedGroup(group);
    setIsEditing(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    onConfigChange({
      ...config,
      partGroups: config.partGroups.filter(g => g.id !== groupId)
    });

    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null);
      setIsEditing(false);
    }
  };

  const handlePartClick = (partName: string) => {
    setSelectedPart(partName);
    // If we're editing a group, add the part to the selected parts
    if (isEditing && selectedGroup) {
      const updatedGroup = {
        ...selectedGroup,
        parts: selectedGroup.parts.includes(partName) 
          ? selectedGroup.parts.filter(p => p !== partName)
          : [...selectedGroup.parts, partName]
      };
      setSelectedGroup(updatedGroup);
    }
  };

  const handleLightSettingsChange = (newSettings: typeof config.lightSettings) => {
    onConfigChange({
      ...config,
      lightSettings: newSettings,
    });
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 3D Model View */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#f5f5f5' }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <PersistentOrbitControls makeDefault />
          <Model
            modelData={modelData}
            config={config}
            selectedPart={selectedPart}
            onPartClick={handlePartClick}
            isAdminMode={true}
          />
        </Canvas>
      </div>

      {/* Sidebar */}
      <div
        style={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          borderLeft: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Customization Settings
          </Typography>
          <IconButton onClick={onClose} size="small">
            <ChevronRightIcon />
          </IconButton>
        </div>

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          style={{ borderBottom: '1px solid #ddd', padding: '0 16px' }}
        >
          <Tab label="Part Groups" />
          <Tab label="Scene Objects" />
          <Tab label="Dependencies" />
          <Tab label="Selection Groups" />
          <Tab label="Lighting" />
        </Tabs>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }} className="scrollable-content">
          <TabPanel value={activeTab} index={0}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Typography variant="subtitle1">
                  Part Groups
                </Typography>
                <IconButton
                  onClick={handleAddGroup}
                  color="primary"
                  title="Add Group"
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </div>

              <div style={{ overflow: 'auto', flex: 1 }}>
                <List dense>
                  {config.partGroups.map((group) => (
                    <ListItem
                      key={group.id}
                      secondaryAction={
                        <div>
                          <IconButton
                            edge="end"
                            onClick={() => handleEditGroup(group)}
                            title="Edit Group"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteGroup(group.id)}
                            title="Delete Group"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      }
                    >
                      <ListItemText
                        primary={group.name}
                        secondary={`${group.parts.length} parts`}
                      />
                    </ListItem>
                  ))}
                  {config.partGroups.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      style={{ padding: '16px', textAlign: 'center' }}
                    >
                      No groups created yet. Click the + button to create a new
                      group.
                    </Typography>
                  )}
                </List>
              </div>

              {isEditing && selectedGroup && (
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <PartGroupEditor
                    config={config}
                    onConfigChange={onConfigChange}
                    availableParts={availableParts}
                    selectedGroup={selectedGroup}
                    onCancel={() => {
                      setSelectedGroup(null);
                      setIsEditing(false);
                    }}
                  />
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <div style={{ height: '100%', overflow: 'auto' }}>
              <SceneObjectManager 
                config={config}
                onConfigChange={onConfigChange}
                availableParts={availableParts}
              />
            </div>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <div style={{ height: '100%', overflow: 'auto' }}>
              <DependencyRuleManager 
                config={config}
                onConfigChange={onConfigChange}
              />
            </div>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <div style={{ height: '100%', overflow: 'auto' }}>
              <SelectionGroupManager 
                config={config}
                onConfigChange={onConfigChange}
              />
            </div>
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <div style={{ height: '100%', overflow: 'auto' }}>
              <Typography variant="subtitle1" gutterBottom>
                Lighting Settings
              </Typography>
              <LightingControls
                settings={config.lightSettings}
                onSettingsChange={handleLightSettingsChange}
              />
            </div>
          </TabPanel>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '16px', padding: '16px', borderTop: '1px solid #ddd' }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              // Save to local storage
              localStorage.setItem('adminConfig', JSON.stringify(config));
            }}
          >
            Save Changes
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
