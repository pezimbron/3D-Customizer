import { Paper, Typography, Box, Slider } from '@mui/material';
import { HexColorPicker } from 'react-colorful';

interface PartCustomizerProps {
  selectedPart: string;
  customizations: Record<string, any>;
  onCustomizationChange: (partName: string, changes: Record<string, any>) => void;
  allowedColors: string[];
  allowMetalness: boolean;
  allowRoughness: boolean;
}

export default function PartCustomizer({ 
  selectedPart, 
  customizations, 
  onCustomizationChange,
  allowedColors,
  allowMetalness,
  allowRoughness
}: PartCustomizerProps) {
  const currentCustomization = customizations[selectedPart] || {
    color: allowedColors.length > 0 ? allowedColors[0] : '#ffffff',
    metalness: 0,
    roughness: 0.5
  };

  const handleColorChange = (color: string) => {
    if (allowedColors.length === 0 || allowedColors.includes(color)) {
      onCustomizationChange(selectedPart, {
        ...currentCustomization,
        color
      });
    }
  };

  const handleMetalnessChange = (_: Event, value: number | number[]) => {
    if (allowMetalness !== false) {
      onCustomizationChange(selectedPart, {
        ...currentCustomization,
        metalness: value as number
      });
    }
  };

  const handleRoughnessChange = (_: Event, value: number | number[]) => {
    if (allowRoughness !== false) {
      onCustomizationChange(selectedPart, {
        ...currentCustomization,
        roughness: value as number
      });
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 2,
        width: 300,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        color: 'rgba(0, 0, 0, 0.87)',
        '& .MuiTypography-root': {
          color: 'rgba(0, 0, 0, 0.87)',
        },
        '& .MuiTypography-subtitle1': {
          color: 'rgba(0, 0, 0, 0.6)',
        }
      }}
    >
      <Typography variant="h6" gutterBottom>
        Part Customization
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {selectedPart}
      </Typography>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Part Color
        </Typography>
        {allowedColors.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {allowedColors.map((color) => (
              <Box
                key={color}
                onClick={() => handleColorChange(color)}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: color,
                  border: currentCustomization.color === color ? '2px solid #000' : '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              />
            ))}
          </Box>
        ) : (
          <HexColorPicker
            color={currentCustomization.color}
            onChange={handleColorChange}
            style={{ width: '100%', height: 200 }}
          />
        )}
      </Box>

      {allowMetalness !== false && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Metallic Effect ({Math.round(currentCustomization.metalness * 100)}%)
          </Typography>
          <Slider
            value={currentCustomization.metalness}
            onChange={handleMetalnessChange}
            min={0}
            max={1}
            step={0.01}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
          />
        </Box>
      )}

      {allowRoughness !== false && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Surface Roughness ({Math.round(currentCustomization.roughness * 100)}%)
          </Typography>
          <Slider
            value={currentCustomization.roughness}
            onChange={handleRoughnessChange}
            min={0}
            max={1}
            step={0.01}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
          />
        </Box>
      )}
    </Paper>
  );
}
