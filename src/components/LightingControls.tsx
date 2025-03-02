import { Typography, Slider } from '@mui/material';
import { LightSettings } from '../types/admin';

interface LightingControlsProps {
  settings: LightSettings;
  onSettingsChange: (settings: LightSettings) => void;
}

const defaultSettings: LightSettings = {
  ambientIntensity: 0.5,
  spotlightIntensity: 1,
  pointLightIntensity: 1,
  spotlightPosition: [10, 10, 10],
  pointLightPosition: [-10, -10, -10],
};

export default function LightingControls({
  settings = defaultSettings,
  onSettingsChange,
}: LightingControlsProps) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <Typography variant="subtitle2" gutterBottom>
          Global Ambient Light
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Overall scene brightness
        </Typography>
        <Slider
          value={settings.ambientIntensity}
          onChange={(_, value) => {
            if (typeof value === 'number') {
              onSettingsChange({
                ...settings,
                ambientIntensity: value
              });
            }
          }}
          min={0}
          max={2}
          step={0.1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Typography variant="subtitle2" gutterBottom>
          Main Spotlight
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Focused light from above
        </Typography>
        <Slider
          value={settings.spotlightIntensity}
          onChange={(_, value) => {
            if (typeof value === 'number') {
              onSettingsChange({
                ...settings,
                spotlightIntensity: value
              });
            }
          }}
          min={0}
          max={2}
          step={0.1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Typography variant="subtitle2" gutterBottom>
          Fill Light
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Secondary light for shadows
        </Typography>
        <Slider
          value={settings.pointLightIntensity}
          onChange={(_, value) => {
            if (typeof value === 'number') {
              onSettingsChange({
                ...settings,
                pointLightIntensity: value
              });
            }
          }}
          min={0}
          max={2}
          step={0.1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
        />
      </div>
    </div>
  );
}

export type { LightSettings };
