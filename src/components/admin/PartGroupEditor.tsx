import { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { AdminConfig, PartGroup } from '../../types/admin';
import ColorPicker from '../ColorPicker';

interface GroupFormProps {
  groupName: string;
  selectedParts: string[];
  availableParts: string[];
  allowedColors: string[];
  allowMetalness: boolean;
  allowRoughness: boolean;
  onNameChange: (name: string) => void;
  onPartsChange: (parts: string[]) => void;
  onColorsChange: (colors: string[]) => void;
  onMetalnessChange: (value: boolean) => void;
  onRoughnessChange: (value: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  // We only need highlightedPart for highlighting in the UI
  highlightedPart?: string;
}

interface AvailablePartsListProps {
  parts: string[];
  selectedParts: string[];
  onPartToggle: (part: string) => void;
  highlightedPart?: string;
}

function AvailablePartsList({ parts, selectedParts, onPartToggle, highlightedPart }: AvailablePartsListProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
      {parts.map((part) => (
        <Chip
          key={part}
          label={part}
          onClick={() => onPartToggle(part)}
          color={selectedParts.includes(part) ? "primary" : "default"}
          variant={selectedParts.includes(part) ? "filled" : "outlined"}
          style={{ 
            cursor: 'pointer',
            backgroundColor: highlightedPart === part ? '#e3f2fd' : undefined,
            border: highlightedPart === part ? '2px solid #2196f3' : undefined
          }}
        />
      ))}
    </div>
  );
}

interface SelectedPartsListProps {
  parts: string[];
  onPartRemove: (part: string) => void;
}

function SelectedPartsList({ parts, onPartRemove }: SelectedPartsListProps) {
  if (parts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No parts selected
      </Typography>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {parts.map((part) => (
        <Chip
          key={part}
          label={part}
          onDelete={() => onPartRemove(part)}
          color="primary"
          size="small"
          style={{ cursor: 'pointer' }}  // Use style instead of sx
        />
      ))}
    </div>
  );
}

function GroupForm({
  groupName,
  selectedParts,
  availableParts,
  allowedColors,
  allowMetalness,
  allowRoughness,
  onNameChange,
  onPartsChange,
  onColorsChange,
  onMetalnessChange,
  onRoughnessChange,
  onSave,
  onCancel,
  highlightedPart
}: GroupFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TextField
        label="Group Name"
        value={groupName}
        onChange={(e) => onNameChange(e.target.value)}
        size="small"
        fullWidth
      />

      <div>
        <Typography variant="subtitle2" gutterBottom>
          Selected Parts
        </Typography>
        <SelectedPartsList
          parts={selectedParts}
          onPartRemove={(part) => {
            const newParts = selectedParts.filter(p => p !== part);
            onPartsChange(newParts);
          }}
        />
      </div>

      <div>
        <Typography variant="subtitle2" gutterBottom>
          Available Parts
        </Typography>
        <AvailablePartsList
          parts={availableParts}
          selectedParts={selectedParts}
          onPartToggle={(part) => {
            if (selectedParts.includes(part)) {
              onPartsChange(selectedParts.filter(p => p !== part));
            } else {
              onPartsChange([...selectedParts, part]);
            }
          }}
          highlightedPart={highlightedPart}
        />
      </div>

      <div>
        <Typography variant="subtitle2" gutterBottom>
          Allowed Colors
        </Typography>
        <ColorPicker
          colors={allowedColors}
          onChange={onColorsChange}
        />
      </div>

      <div>
        <FormControlLabel
          control={
            <Checkbox
              checked={allowMetalness}
              onChange={(e) => onMetalnessChange(e.target.checked)}
              size="small"
            />
          }
          label="Allow Metalness Adjustment"
        />
      </div>

      <div>
        <FormControlLabel
          control={
            <Checkbox
              checked={allowRoughness}
              onChange={(e) => onRoughnessChange(e.target.checked)}
              size="small"
            />
          }
          label="Allow Roughness Adjustment"
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button
          onClick={onCancel}
          size="small"
        >
          Cancel
        </Button>
        <Button 
          onClick={onSave}
          disabled={!groupName.trim()}
          variant="contained"
          size="small"
        >
          Save
        </Button>
      </div>
    </div>
  );
}

interface PartGroupEditorProps {
  config: AdminConfig;
  onConfigChange: (config: AdminConfig) => void;
  availableParts: string[];
  selectedGroup: PartGroup;
  onCancel: () => void;
  highlightedPart?: string;
}

export default function PartGroupEditor({ 
  config, 
  onConfigChange, 
  availableParts, 
  selectedGroup, 
  onCancel,
  highlightedPart
}: PartGroupEditorProps) {
  const [editingGroup, setEditingGroup] = useState<PartGroup | null>(null);

  useEffect(() => {
    if (selectedGroup) {
      setEditingGroup({...selectedGroup});
    } else {
      setEditingGroup(null);
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (highlightedPart && editingGroup && !editingGroup.parts.includes(highlightedPart)) {
      // Add the highlighted part to the group when clicked in the 3D model
      setEditingGroup({ ...editingGroup, parts: [...editingGroup.parts, highlightedPart] });
    }
  }, [highlightedPart, editingGroup]);

  const handleSave = () => {
    if (!editingGroup) return;

    const updatedGroups = config.partGroups.map(group => 
      group.id === editingGroup.id ? editingGroup : group
    );

    onConfigChange({
      ...config,
      partGroups: updatedGroups
    });
  };

  if (!editingGroup) return null;

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Edit Part Group: {editingGroup.name}
      </Typography>
      <GroupForm
        groupName={editingGroup.name}
        selectedParts={editingGroup.parts}
        availableParts={availableParts}
        allowedColors={editingGroup.allowedColors}
        allowMetalness={editingGroup.allowMetalness}
        allowRoughness={editingGroup.allowRoughness}
        onNameChange={(name) => setEditingGroup({ ...editingGroup, name })}
        onPartsChange={(parts) => setEditingGroup({ ...editingGroup, parts })}
        onColorsChange={(colors) => setEditingGroup({ ...editingGroup, allowedColors: colors })}
        onMetalnessChange={(value) => setEditingGroup({ ...editingGroup, allowMetalness: value })}
        onRoughnessChange={(value) => setEditingGroup({ ...editingGroup, allowRoughness: value })}
        onSave={handleSave}
        onCancel={onCancel}
        highlightedPart={highlightedPart}
      />
    </div>
  );
}
