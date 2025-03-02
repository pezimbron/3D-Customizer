import { useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Popover,
  Button,
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { HexColorPicker } from 'react-colorful';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column'
});

const ColorContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '16px'
});

const ColorSwatch = styled(Paper)<{ bgcolor: string }>(({ bgcolor }) => ({
  width: 40,
  height: 40,
  backgroundColor: bgcolor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  cursor: 'pointer',
  '&:hover .delete-button': {
    opacity: 1,
  },
}));

const DeleteButton = styled(IconButton)({
  position: 'absolute',
  opacity: 0,
  transition: 'opacity 0.2s',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

const AddButton = styled(Button)({
  minWidth: 40,
  minHeight: 40,
  padding: 0
});

const StyledPopover = styled(Popover)({
  '& .MuiPopover-paper': {
    padding: 16
  }
});

const ColorInputContainer = styled(Box)({
  marginTop: 16,
  display: 'flex',
  gap: 8
});

const ColorInput = styled(TextField)({
  '& .MuiInputBase-input': {
    width: 120
  }
});

const AddColorButton = styled(Button)({
  minWidth: 80
});

interface ColorPickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

export default function ColorPicker({ colors, onChange }: ColorPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [customColor, setCustomColor] = useState('#000000');

  const handleAddColor = () => {
    if (!colors.includes(customColor)) {
      onChange([...colors, customColor]);
    }
    setAnchorEl(null);
  };

  const handleRemoveColor = (colorToRemove: string) => {
    onChange(colors.filter(color => color !== colorToRemove));
  };

  const isValidHexColor = (color: string) => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  return (
    <Container>
      <ColorContainer>
        {colors.map((color) => (
          <ColorSwatch key={color} bgcolor={color}>
            <DeleteButton
              size="small"
              className="delete-button"
              onClick={() => handleRemoveColor(color)}
            >
              <DeleteIcon fontSize="small" />
            </DeleteButton>
          </ColorSwatch>
        ))}
        <AddButton
          variant="outlined"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <AddIcon />
        </AddButton>
      </ColorContainer>

      <StyledPopover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <HexColorPicker
          color={currentColor}
          onChange={(color) => {
            setCurrentColor(color);
            setCustomColor(color);
          }}
        />
        <ColorInputContainer>
          <ColorInput
            size="small"
            value={customColor}
            onChange={(e) => {
              const value = e.target.value;
              if (value.startsWith('#')) {
                setCustomColor(value);
                if (isValidHexColor(value)) {
                  setCurrentColor(value);
                }
              }
            }}
            error={!isValidHexColor(customColor)}
            helperText={!isValidHexColor(customColor) ? 'Invalid hex color' : ''}
          />
          <AddColorButton
            variant="contained"
            onClick={handleAddColor}
            disabled={!isValidHexColor(customColor)}
          >
            Add
          </AddColorButton>
        </ColorInputContainer>
      </StyledPopover>
    </Container>
  );
}
