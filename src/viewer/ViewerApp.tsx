import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import ModelViewer from '../components/ModelViewer';
import { ModelMetadata } from '../types/models';
import { AdminConfig } from '../types/admin';
import { getModelData, listAllModelIds, saveModelData } from '../utils/db';

const Container = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh'
});

const ViewerContainer = styled(Box)({
  width: '100%',
  height: '100vh'
});

export default function ViewerApp() {
  const [model, setModel] = useState<ModelMetadata | null>(null);
  const [modelData, setModelData] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentConfig, setCurrentConfig] = useState<AdminConfig | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);

  const loadModel = async (id: string) => {
    try {
      setLoading(true);
      console.log('Attempting to load model with ID:', id);

      // Check what model IDs are available in the database
      const dbModelIds = await listAllModelIds();
      console.log('Model IDs in database:', dbModelIds);

      // Load model metadata from localStorage
      const savedMetadata = localStorage.getItem('modelMetadata');
      console.log('Saved metadata from localStorage:', savedMetadata);
      
      if (!savedMetadata) {
        throw new Error('No models found');
      }

      const metadata = JSON.parse(savedMetadata) as ModelMetadata[];
      console.log('Parsed metadata:', metadata);
      
      // Log all available model IDs to help diagnose the issue
      console.log('Available model IDs in metadata:', metadata.map(m => m.id));
      
      // First try to find the exact model ID
      let foundModel = metadata.find(m => m.id === id);
      
      // If not found, try to find a model with a similar ID (case insensitive)
      if (!foundModel) {
        foundModel = metadata.find(m => 
          m.id.toLowerCase() === id.toLowerCase() || 
          m.id.replace(/[^a-zA-Z0-9]/g, '') === id.replace(/[^a-zA-Z0-9]/g, '')
        );
        
        if (foundModel) {
          console.log(`Found model with similar ID: ${foundModel.id} (requested: ${id})`);
        }
      }
      
      console.log('Found model:', foundModel);

      if (!foundModel) {
        throw new Error('Model not found');
      }

      // Load model data from IndexedDB using the actual model ID from metadata
      console.log('Attempting to load model data from IndexedDB for ID:', foundModel.id);
      const data = await getModelData(foundModel.id);
      console.log('Model data loaded from IndexedDB:', data ? 'Data found' : 'No data found');
      
      if (!data) {
        throw new Error('Model data not found');
      }

      setModel(foundModel);
      setModelData(data);
      setCurrentConfig(foundModel.config);
      setError(null);
    } catch (err) {
      console.error('Error loading model:', err);
      setError(err instanceof Error ? err.message : 'Failed to load model');
      setModel(null);
      setModelData(null);
    } finally {
      setLoading(false);
    }
  };

  // Create a test model with ID "boat5"
  const createTestModel = async () => {
    try {
      setLoading(true);
      
      // First, check if a model with ID "boat5" already exists
      const dbModelIds = await listAllModelIds();
      if (dbModelIds.includes('boat5')) {
        console.log('Model with ID "boat5" already exists');
        await loadModel('boat5');
        return;
      }
      
      // Get existing model data to clone
      const existingModelId = dbModelIds[0]; // Use the first available model
      if (!existingModelId) {
        throw new Error('No existing models to clone');
      }
      
      const existingModelData = await getModelData(existingModelId);
      if (!existingModelData) {
        throw new Error('Failed to get existing model data');
      }
      
      // Get existing metadata
      const savedMetadata = localStorage.getItem('modelMetadata');
      if (!savedMetadata) {
        throw new Error('No model metadata found');
      }
      
      const metadata = JSON.parse(savedMetadata) as ModelMetadata[];
      const existingModel = metadata.find(m => m.id === existingModelId);
      if (!existingModel) {
        throw new Error('Existing model metadata not found');
      }
      
      // Create new model with ID "boat5"
      const newModelId = 'boat5';
      await saveModelData(newModelId, existingModelData);
      
      // Create new metadata entry
      const newModel: ModelMetadata = {
        id: newModelId,
        name: 'Test Boat Model',
        config: existingModel.config,
      };
      
      // Update metadata in localStorage
      const updatedMetadata = [...metadata, newModel];
      localStorage.setItem('modelMetadata', JSON.stringify(updatedMetadata));
      
      console.log('Created test model with ID "boat5"');
      console.log('Updated metadata:', updatedMetadata);
      
      // Load the new model
      await loadModel(newModelId);
    } catch (err) {
      console.error('Error creating test model:', err);
      setError(err instanceof Error ? err.message : 'Failed to create test model');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Get model ID from URL
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      setModelId(id);

      if (!id) {
        setError('No model ID specified');
        setLoading(false);
        return;
      }

      await loadModel(id);
    };

    init();
  }, []);

  if (loading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    const errorBoxStyle = {
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 2
    };
    
    return (
      <Container>
        <Box sx={errorBoxStyle}>
          <Typography color="error">
            {error}
          </Typography>
          {modelId === 'boat5' && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={createTestModel}
            >
              Create Test Model with ID "boat5"
            </Button>
          )}
        </Box>
      </Container>
    );
  }

  if (!model || !modelData) {
    return (
      <Container>
        <Typography color="error">
          Failed to load model
        </Typography>
      </Container>
    );
  }

  return (
    <ViewerContainer>
      <ModelViewer
        modelData={modelData}
        config={currentConfig || model.config}
        onConfigChange={(updatedConfig) => {
          setCurrentConfig(updatedConfig);
          // You could save changes to localStorage for persistence if needed
        }}
      />
    </ViewerContainer>
  );
}
