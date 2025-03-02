# 3D Model Customizer

A web application for customizing 3D models with real-time preview and configuration management.

## Features

- Real-time 3D model visualization using Three.js
- Interactive part selection and customization
- Color picker for model parts
- Support for part dependencies
- Backend API for saving and loading configurations
- MongoDB database for storing model configurations

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/3d-customizer
NODE_ENV=development
```

## Development

1. Start the backend server:
```bash
npm run server
```

2. Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

- `/src` - Frontend React application
  - `/components` - React components
  - `/models` - 3D model related components
- `/server` - Backend Node.js application
  - `/models` - MongoDB schemas
  - `/routes` - API routes
- `/assets` - 3D models and textures

## Adding New Models

1. Place your 3D model files in the `/assets` folder
2. Create a new model configuration through the API
3. Define customizable parts and their options
4. Set up any dependencies between parts

## License

MIT
