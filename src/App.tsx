import { useState, useEffect } from 'react';
import { Box, ThemeProvider, createTheme, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import ModelViewer from './components/ModelViewer';
import { Model } from './types/models';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

export default function App() {
  const [models, setModels] = useState<Model[]>(() => {
    const saved = localStorage.getItem('models');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [availableParts, setAvailableParts] = useState<string[]>([]);

  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        width: '100vw', 
        height: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Model Selector */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Model</InputLabel>
            <Select
              value={selectedModelId || ''}
              onChange={(e) => setSelectedModelId(e.target.value)}
              label="Select Model"
            >
              {models.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Model Viewer */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {selectedModel ? (
            <ModelViewer
              config={selectedModel.config}
              modelFile={selectedModel.file}
              onPartsLoaded={setAvailableParts}
            />
          ) : (
            <Box 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              Please select a model to customize
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
