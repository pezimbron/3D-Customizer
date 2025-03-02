import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

// Global state to persist camera position between renders
const globalCameraState = {
  position: [0, 0, 5],
  target: [0, 0, 0],
  zoom: 1
};

export default function PersistentOrbitControls(props: any) {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  
  // Apply stored camera state on mount
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      // Set camera position from stored state
      camera.position.set(
        globalCameraState.position[0],
        globalCameraState.position[1],
        globalCameraState.position[2]
      );
      
      // Set target from stored state
      controls.target.set(
        globalCameraState.target[0],
        globalCameraState.target[1],
        globalCameraState.target[2]
      );
      
      camera.zoom = globalCameraState.zoom;
      camera.updateProjectionMatrix();
      controls.update();
    }
  }, [camera]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      {...props}
      onChange={(e) => {
        // Store camera state on change
        if (e.target) {
          globalCameraState.position = e.target.object.position.toArray();
          globalCameraState.target = e.target.target.toArray();
          globalCameraState.zoom = e.target.object.zoom;
        }
        if (props.onChange) {
          props.onChange(e);
        }
      }}
    />
  );
}
