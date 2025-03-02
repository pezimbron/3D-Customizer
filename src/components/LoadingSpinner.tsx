import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  progress?: number;
}

export default function LoadingSpinner({ progress }: LoadingSpinnerProps) {
  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      sx={{
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        zIndex: 1000,
      }}
    >
      <CircularProgress size={60} />
      {progress !== undefined && (
        <Typography variant="body1" color="primary">
          Loading: {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );
}
