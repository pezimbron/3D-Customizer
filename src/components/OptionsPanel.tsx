import { 
  Paper, 
  Typography, 
  Box, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material';
import ColorPicker from './ColorPicker';

interface OptionsPanelProps {
  selectedPart: string | null;
  customizations: Record<string, any>;
  onCustomizationChange: (partName: string, value: any) => void;
}

export default function OptionsPanel({
  selectedPart,
  customizations,
  onCustomizationChange
}: OptionsPanelProps) {
  // This would come from your backend in a real application
  const parts = [
    { name: 'hull', label: 'Hull', type: 'color' },
    { name: 'deck', label: 'Deck', type: 'color' },
    { name: 'cabin', label: 'Cabin', type: 'color' }
  ];

  return (
    <Paper sx={{ 
      width: 300, 
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      <Typography variant="h6">Customize Model</Typography>
      <Divider />
      
      <List>
        {parts.map((part) => (
          <ListItem key={part.name} disablePadding>
            <ListItemButton selected={selectedPart === part.name}>
              <ListItemText primary={part.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {selectedPart && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Options for {selectedPart}
          </Typography>
          <ColorPicker
            color={customizations[selectedPart] || '#ffffff'}
            onChange={(color) => onCustomizationChange(selectedPart, color)}
          />
        </Box>
      )}
    </Paper>
  );
}
