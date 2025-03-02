import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Input,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ListItemButton,
  Collapse
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  ExpandLess,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import type { AlertColor } from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import PersistentOrbitControls from '../components/PersistentOrbitControls';
import { ModelMetadata } from '../types/models';
import { AdminConfig, LightSettings, PartGroup } from '../types/admin';
import { getModelData, saveModelData, deleteModelData, getAllModelData, clearDatabase } from '../utils/db';
import Model from '../components/Model';
import PartGroupEditor from '../components/admin/PartGroupEditor';
import SelectionGroupManager from '../components/admin/SelectionGroupManager';
import SceneObjectManager from '../components/admin/SceneObjectManager';
import DependencyRuleManager from '../components/admin/DependencyRuleManager';
import BaseDimensionsEditor from '../components/admin/BaseDimensionsEditor';
import LightingControls from '../components/LightingControls';

const defaultConfig: AdminConfig = {
  partGroups: [],
  defaultColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000'],
  lightSettings: {
    ambientIntensity: 0.5,
    spotlightIntensity: 1,
    pointLightIntensity: 1,
    spotlightPosition: [10, 10, 10],
    pointLightPosition: [-10, -10, -10],
  },
  sceneObjects: [],
  dependencyRules: [],
  selectionGroups: [],
  modelDimensions: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  }
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DRAWER_WIDTH = 350;

const AppContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden'
});

const MainContainer = styled('div')({
  display: 'flex',
  flex: 1,
  position: 'relative',
  overflow: 'hidden'
});

const StyledDrawer = styled(Drawer)({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    position: 'relative',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden'
  }
});

const DrawerContent = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden'
});

const SidebarScrollContainer = styled('div')({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'calc(100vh - 64px)' // Subtract the AppBar height
});

const ModelList = styled(List)({
  flex: 'none'
});

const ModelListItem = styled(ListItem)<{ selected?: boolean }>(({ theme, selected }) => ({
  cursor: 'pointer',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const ContentContainer = styled('div')({
  flex: 1,
  position: 'relative',
  height: '100%'
});

const FileInput = styled(Input)({
  marginTop: 16
});

const SectionContent = styled('div')({
  padding: 16
});

export default function AdminApp() {
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata[]>(() => {
    const saved = localStorage.getItem('modelMetadata');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedModel, setSelectedModel] = useState<ModelMetadata | null>(null);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [customModelId, setCustomModelId] = useState<string>('');
  const [customModelIdError, setCustomModelIdError] = useState<string>('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingModelId, setIsEditingModelId] = useState(false);
  const [newModelId, setNewModelId] = useState<string>('');
  const [newModelIdError, setNewModelIdError] = useState<string>('');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [modelData, setModelData] = useState<ArrayBuffer | null>(null);

  // Sidebar section states
  const [openSections, setOpenSections] = useState({
    models: true,
    partGroups: false,
    selectionGroups: false,
    sceneObjects: false,
    dependencies: false,
    baseDimensions: false,
    lighting: false,
    debug: false,
  });

  // Part group state
  const [selectedPartGroup, setSelectedPartGroup] = useState<PartGroup | null>(null);

  // Part management
  const [selectedPart, setSelectedPart] = useState<string | undefined>(undefined);
  const [availableParts, setAvailableParts] = useState<string[]>([]);

  const handlePartsLoaded = (parts: string[]) => {
    setAvailableParts(parts);
  };

  const handlePartClick = (partName: string) => {
    setSelectedPart(partName);
  };

  // Toggle section
  const handleSectionToggle = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    try {
      localStorage.setItem('modelMetadata', JSON.stringify(modelMetadata));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      setNotification({
        open: true,
        message: 'Failed to save changes. Please try again.',
        severity: 'error'
      });
    }
  }, [modelMetadata]);

  useEffect(() => {
    async function loadModelData() {
      if (selectedModel) {
        try {
          const data = await getModelData(selectedModel.id);
          setModelData(data);
        } catch (error) {
          console.error('Failed to load model data:', error);
          setNotification({
            open: true,
            message: 'Failed to load model data',
            severity: 'error'
          });
        }
      } else {
        setModelData(null);
      }
    }
    loadModelData();
  }, [selectedModel]);

  const handleAddModel = async () => {
    if (!modelFile || !newModelName.trim()) return;

    // Validate custom model ID
    if (!validateCustomModelId(customModelId)) {
      return;
    }

    if (modelFile.size > MAX_FILE_SIZE) {
      setNotification({
        open: true,
        message: 'File size exceeds 10MB limit',
        severity: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const modelData = e.target?.result as ArrayBuffer;
        // Use custom model ID if provided, otherwise generate one
        const modelId = customModelId.trim() || Date.now().toString();

        try {
          // Store model data in IndexedDB
          await saveModelData(modelId, modelData);

          const newModel: ModelMetadata = {
            id: modelId,
            name: newModelName.trim(),
            config: defaultConfig,
          };

          setModelMetadata(prev => [...prev, newModel]);
          setIsAddingModel(false);
          setNewModelName('');
          setCustomModelId('');
          setModelFile(null);
          setNotification({
            open: true,
            message: 'Model added successfully!',
            severity: 'success'
          });
        } catch (error) {
          console.error('Failed to save model data:', error);
          setNotification({
            open: true,
            message: 'Failed to save model. Please try again.',
            severity: 'error'
          });
        }
        setIsLoading(false);
      };

      reader.onerror = () => {
        setNotification({
          open: true,
          message: 'Failed to read model file',
          severity: 'error'
        });
        setIsLoading(false);
      };

      reader.readAsArrayBuffer(modelFile);
    } catch (error) {
      console.error('Error processing model:', error);
      setNotification({
        open: true,
        message: 'Failed to process model file.',
        severity: 'error'
      });
      setIsLoading(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      // Delete model data from IndexedDB
      await deleteModelData(modelId);

      setModelMetadata(prev => prev.filter(m => m.id !== modelId));
      if (selectedModel?.id === modelId) {
        setSelectedModel(null);
      }
      setNotification({
        open: true,
        message: 'Model deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      setNotification({
        open: true,
        message: 'Failed to delete model.',
        severity: 'error'
      });
    }
  };

  const handleConfigChange = (newConfig: AdminConfig) => {
    if (!selectedModel) return;

    try {
      const updatedModel = {
        ...selectedModel,
        config: newConfig
      };

      // Update model metadata in state (and localStorage via useEffect)
      setModelMetadata(prev => prev.map(m =>
        m.id === selectedModel.id ? updatedModel : m
      ));
      setSelectedModel(updatedModel);

      // Ensure the model data in IndexedDB is also updated
      if (modelData) {
        // Re-save the model data with the same ID to update its metadata
        saveModelData(selectedModel.id, modelData);
        console.log('Updated model data in IndexedDB for ID:', selectedModel.id);
      }

      setNotification({
        open: true,
        message: 'Changes saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save changes:', error);
      setNotification({
        open: true,
        message: 'Failed to save changes',
        severity: 'error'
      });
    }
  };

  // Config update helpers
  const updateLightSettings = (newSettings: LightSettings) => {
    if (!selectedModel) return;

    const updatedConfig: AdminConfig = {
      ...selectedModel.config,
      lightSettings: newSettings
    };
    handleConfigChange(updatedConfig);
  };

  // Part group handlers
  const handleAddPartGroup = () => {
    if (!selectedModel) return;

    const newGroup: PartGroup = {
      id: Date.now().toString(),
      name: 'New Group',
      parts: [],
      allowedColors: [],
      allowMetalness: false,
      allowRoughness: false,
      colors: []
    };

    const updatedConfig: AdminConfig = {
      ...selectedModel.config,
      partGroups: [...selectedModel.config.partGroups, newGroup]
    };

    handleConfigChange(updatedConfig);
    setSelectedPartGroup(newGroup);
  };

  const handleEditPartGroup = (group: PartGroup) => {
    setSelectedPartGroup(group);
  };

  const handleCancelPartGroupEdit = () => {
    setSelectedPartGroup(null);
  };

  const handleDeletePartGroup = (groupId: string) => {
    if (!selectedModel) return;

    const updatedConfig: AdminConfig = {
      ...selectedModel.config,
      partGroups: selectedModel.config.partGroups.filter(g => g.id !== groupId)
    };

    handleConfigChange(updatedConfig);
    if (selectedPartGroup?.id === groupId) {
      setSelectedPartGroup(null);
    }
  };

  const validateCustomModelId = (id: string): boolean => {
    // If empty, it's valid (we'll generate an ID)
    if (!id.trim()) {
      setCustomModelIdError('');
      return true;
    }

    // Check for valid characters (letters, numbers, hyphens)
    const validFormat = /^[a-zA-Z0-9-]+$/.test(id);
    if (!validFormat) {
      setCustomModelIdError('ID can only contain letters, numbers, and hyphens');
      return false;
    }

    // Check if ID already exists
    const idExists = modelMetadata.some(model => model.id === id.trim());
    if (idExists) {
      setCustomModelIdError('This ID is already in use');
      return false;
    }

    setCustomModelIdError('');
    return true;
  };

  const handleEditModelId = async () => {
    if (!selectedModel) return;

    // Validate the new model ID
    if (!validateModelId(newModelId, selectedModel.id)) {
      return;
    }

    setIsLoading(true);

    try {
      // Get the model data from IndexedDB
      const modelData = await getModelData(selectedModel.id);

      if (!modelData) {
        throw new Error('Model data not found');
      }

      // Save the model data with the new ID
      await saveModelData(newModelId, modelData);

      // Delete the old model data
      await deleteModelData(selectedModel.id);

      // Update the model metadata
      const updatedMetadata = modelMetadata.map(model =>
        model.id === selectedModel.id
          ? { ...model, id: newModelId }
          : model
      );

      setModelMetadata(updatedMetadata);
      setSelectedModel({ ...selectedModel, id: newModelId });

      // Close the dialog
      setIsEditingModelId(false);
      setNewModelId('');
      setNewModelIdError('');

      setNotification({
        open: true,
        message: 'Model ID updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update model ID:', error);
      setNotification({
        open: true,
        message: 'Failed to update model ID. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateModelId = (id: string, currentId?: string): boolean => {
    // If empty, it's invalid
    if (!id.trim()) {
      setNewModelIdError('Model ID cannot be empty');
      return false;
    }

    // Check for valid characters (letters, numbers, hyphens)
    const validFormat = /^[a-zA-Z0-9-]+$/.test(id);
    if (!validFormat) {
      setNewModelIdError('ID can only contain letters, numbers, and hyphens');
      return false;
    }

    // Check if ID already exists (skip if it's the same as the current ID)
    if (id !== currentId) {
      const idExists = modelMetadata.some(model => model.id === id.trim());
      if (idExists) {
        setNewModelIdError('This ID is already in use');
        return false;
      }
    }

    setNewModelIdError('');
    return true;
  };

  // Debug state
  const [dbModelData, setDbModelData] = useState<{ id: string, size: number }[]>([]);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [isLoadingDbData, setIsLoadingDbData] = useState(false);

  const loadDbData = async () => {
    setIsLoadingDbData(true);
    try {
      const data = await getAllModelData();
      setDbModelData(data);
    } catch (error) {
      console.error('Error loading database data:', error);
      setNotification({
        open: true,
        message: 'Failed to load database data',
        severity: 'error'
      });
    } finally {
      setIsLoadingDbData(false);
    }
  };

  const handleClearDatabase = async () => {
    if (window.confirm('Are you sure you want to clear the entire database? This action cannot be undone.')) {
      try {
        await clearDatabase();
        setDbModelData([]);
        setNotification({
          open: true,
          message: 'Database cleared successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error clearing database:', error);
        setNotification({
          open: true,
          message: 'Failed to clear database',
          severity: 'error'
        });
      }
    }
  };

  return (
    <AppContainer>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            3D Customizer Admin
          </Typography>
          <IconButton color="inherit" onClick={() => setIsDebugPanelOpen(true)}>
            <BugReportIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <MainContainer>
        {/* Sidebar */}
        <StyledDrawer variant="permanent">
          <DrawerContent>
            <SidebarScrollContainer>
              {/* Models Section */}
              <List>
                <ListItemButton onClick={() => handleSectionToggle('models')}>
                  <ListItemText primary="Models" />
                  {openSections.models ? <ExpandLess /> : <ExpandMoreIcon />}
                </ListItemButton>
                <Collapse in={openSections.models}>
                  <SectionContent>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setIsAddingModel(true)}
                      variant="contained"
                      size="small"
                      fullWidth
                    >
                      Add Model
                    </Button>

                    <ModelList sx={{ mt: 2 }}>
                      {modelMetadata.map((model) => (
                        <ModelListItem
                          key={model.id}
                          selected={selectedModel?.id === model.id}
                          onClick={() => setSelectedModel(model)}
                          secondaryAction={
                            <div>
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedModel(model);
                                  setNewModelId(model.id);
                                  setIsEditingModelId(true);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteModel(model.id);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </div>
                          }
                        >
                          <ListItemText primary={model.name} />
                        </ModelListItem>
                      ))}
                      {modelMetadata.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No models yet. Click "Add Model" to create one.
                        </Typography>
                      )}
                    </ModelList>
                  </SectionContent>
                </Collapse>
              </List>

              {selectedModel && (
                <>
                  {/* Part Groups Section */}
                  <List>
                    <ListItemButton onClick={() => handleSectionToggle('partGroups')}>
                      <ListItemText primary="Part Groups" />
                      {openSections.partGroups ? <ExpandLess /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={openSections.partGroups}>
                      <SectionContent>
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">Part Groups</Typography>
                          <IconButton
                            onClick={handleAddPartGroup}
                            color="primary"
                            title="Add Group"
                            size="small"
                          >
                            <AddIcon />
                          </IconButton>
                        </div>

                        <div style={{ overflow: 'auto' }} className="scrollable-content">
                          <List dense>
                            {selectedModel.config.partGroups.map((group) => (
                              <ListItem
                                key={group.id}
                                selected={selectedPartGroup?.id === group.id}
                                secondaryAction={
                                  <div>
                                    <IconButton
                                      edge="end"
                                      onClick={() => handleEditPartGroup(group)}
                                      title="Edit Group"
                                      size="small"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton
                                      edge="end"
                                      onClick={() => handleDeletePartGroup(group.id)}
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
                            {selectedModel.config.partGroups.length === 0 && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ p: 2, textAlign: 'center' }}
                              >
                                No groups created yet. Click the + button to create a new group.
                              </Typography>
                            )}
                          </List>
                        </div>

                        {selectedPartGroup && (
                          <div style={{ marginTop: '16px' }}>
                            <PartGroupEditor
                              config={selectedModel.config}
                              onConfigChange={handleConfigChange}
                              availableParts={availableParts}
                              selectedGroup={selectedPartGroup}
                              onCancel={handleCancelPartGroupEdit}
                              highlightedPart={selectedPart}
                            />
                          </div>
                        )}
                      </SectionContent>
                    </Collapse>
                  </List>

                  {/* Scene Objects Section */}
                  <List>
                    <ListItemButton onClick={() => handleSectionToggle('sceneObjects')}>
                      <ListItemText primary="Scene Objects" />
                      {openSections.sceneObjects ? <ExpandLess /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={openSections.sceneObjects}>
                      <SectionContent>
                        <SceneObjectManager
                          config={selectedModel.config}
                          onConfigChange={(newConfig) => {
                            handleConfigChange(newConfig);
                          }}
                          availableParts={availableParts}
                        />
                      </SectionContent>
                    </Collapse>
                  </List>

                  {/* Dependency Rules Section */}
                  <List>
                    <ListItemButton onClick={() => handleSectionToggle('dependencies')}>
                      <ListItemText primary="Dependency Rules" />
                      {openSections.dependencies ? <ExpandLess /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={openSections.dependencies}>
                      <SectionContent>
                        <DependencyRuleManager
                          config={selectedModel.config}
                          onConfigChange={(newConfig) => {
                            handleConfigChange(newConfig);
                          }}
                        />
                      </SectionContent>
                    </Collapse>
                  </List>

                  {/* Selection Groups Section */}
                  <List>
                    <ListItemButton onClick={() => handleSectionToggle('selectionGroups')}>
                      <ListItemText primary="Selection Groups" />
                      {openSections.selectionGroups ? <ExpandLess /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={openSections.selectionGroups}>
                      <SectionContent>
                        <SelectionGroupManager
                          config={selectedModel.config}
                          onConfigChange={(newConfig) => {
                            handleConfigChange(newConfig);
                          }}
                        />
                      </SectionContent>
                    </Collapse>
                  </List>

                  {/* Base Dimensions Section */}
                  <List>
                    <ListItemButton onClick={() => handleSectionToggle('baseDimensions')}>
                      <ListItemText primary="Base Dimensions" />
                      {openSections.baseDimensions ? <ExpandLess /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={openSections.baseDimensions}>
                      <SectionContent>
                        <BaseDimensionsEditor
                          config={selectedModel.config}
                          onConfigChange={handleConfigChange}
                        />
                      </SectionContent>
                    </Collapse>
                  </List>

                  {/* Lighting Section */}
                  <List>
                    <ListItemButton onClick={() => handleSectionToggle('lighting')}>
                      <ListItemText primary="Lighting" />
                      {openSections.lighting ? <ExpandLess /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={openSections.lighting}>
                      <SectionContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Lighting Settings
                        </Typography>
                        <LightingControls
                          settings={selectedModel.config.lightSettings}
                          onSettingsChange={updateLightSettings}
                        />
                      </SectionContent>
                    </Collapse>
                  </List>
                </>
              )}
            </SidebarScrollContainer>
          </DrawerContent>
        </StyledDrawer>

        {/* Main Content */}
        <ContentContainer>
          {selectedModel && modelData ? (
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              style={{ width: '100%', height: '100%', background: '#f5f5f5' }}
            >
              <ambientLight intensity={selectedModel.config.lightSettings.ambientIntensity} />
              <pointLight
                position={selectedModel.config.lightSettings.pointLightPosition}
                intensity={selectedModel.config.lightSettings.pointLightIntensity}
              />
              <spotLight
                position={selectedModel.config.lightSettings.spotlightPosition}
                intensity={selectedModel.config.lightSettings.spotlightIntensity}
                angle={Math.PI / 4}
                penumbra={0.1}
                castShadow
              />
              <PersistentOrbitControls makeDefault />
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
              <Model
                modelData={modelData}
                config={selectedModel.config}
                selectedPart={selectedPart}
                onPartClick={handlePartClick}
                onPartsLoaded={handlePartsLoaded}
                isAdminMode={true}
              />
            </Canvas>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#757575',
            }}>
              {selectedModel ? 'Loading model...' : 'Select a model to customize'}
            </div>
          )}
        </ContentContainer>
      </MainContainer>

      {/* Add Model Dialog */}
      <Dialog
        open={isAddingModel}
        onClose={() => {
          setIsAddingModel(false);
          setNewModelName('');
          setCustomModelId('');
          setModelFile(null);
        }}
        container={document.body}
        disablePortal={false}
        disableEnforceFocus
      >
        <DialogTitle>Add New Model</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Model Name"
            fullWidth
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Custom Model ID (optional)"
            fullWidth
            value={customModelId}
            onChange={(e) => {
              const value = e.target.value;
              setCustomModelId(value);
              validateCustomModelId(value);
            }}
            error={!!customModelIdError}
            helperText={customModelIdError || "Leave empty to generate automatically. Use only letters, numbers, and hyphens."}
          />
          <FileInput
            type="file"
            inputProps={{
              accept: '.glb,.gltf'
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (file) setModelFile(file);
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Maximum file size: 10MB
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsAddingModel(false);
            setNewModelName('');
            setCustomModelId('');
            setModelFile(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddModel}
            disabled={!newModelName.trim() || !modelFile || isLoading}
            variant="contained"
          >
            {isLoading ? <CircularProgress size={24} /> : 'Add Model'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Model ID Dialog */}
      <Dialog
        open={isEditingModelId}
        onClose={() => {
          setIsEditingModelId(false);
          setNewModelId('');
          setNewModelIdError('');
        }}
        container={document.body}
        disablePortal={false}
        disableEnforceFocus
      >
        <DialogTitle>Edit Model ID</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Changing the model ID will update all URLs that reference this model.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Model ID"
            fullWidth
            value={newModelId}
            onChange={(e) => {
              const value = e.target.value;
              setNewModelId(value);
              validateModelId(value, selectedModel?.id);
            }}
            error={!!newModelIdError}
            helperText={newModelIdError || "Use only letters, numbers, and hyphens."}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsEditingModelId(false);
            setNewModelId('');
            setNewModelIdError('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleEditModelId}
            disabled={!newModelId.trim() || !!newModelIdError || isLoading || newModelId === selectedModel?.id}
            variant="contained"
          >
            {isLoading ? <CircularProgress size={24} /> : 'Update ID'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Debug Panel Dialog */}
      <Dialog
        open={isDebugPanelOpen}
        onClose={() => setIsDebugPanelOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Database Debug Panel</DialogTitle>
        <DialogContent>
          <Box component="div" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={loadDbData}
              disabled={isLoadingDbData}
              sx={{ mr: 1 }}
            >
              {isLoadingDbData ? <CircularProgress size={24} /> : 'Load Database Data'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearDatabase}
              disabled={isLoadingDbData}
            >
              Clear Database
            </Button>
          </Box>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            IndexedDB Contents:
          </Typography>

          {isLoadingDbData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }} component="div">
              <CircularProgress />
            </Box>
          ) : dbModelData.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model ID</TableCell>
                    <TableCell>Data Size (bytes)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dbModelData.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>{model.id}</TableCell>
                      <TableCell>{model.size}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No data in database or data not loaded yet.</Typography>
          )}

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            LocalStorage Contents:
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model ID</TableCell>
                  <TableCell>Model Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modelMetadata.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>{model.id}</TableCell>
                    <TableCell>{model.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDebugPanelOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </AppContainer>
  );
}
