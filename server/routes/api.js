import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all model configurations
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.modelConfig.findMany({
      include: {
        parts: true
      }
    });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific model configuration
router.get('/:id', async (req, res) => {
  try {
    const config = await prisma.modelConfig.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        parts: {
          include: {
            dependencies: true,
            dependentOn: true
          }
        }
      }
    });
    if (!config) return res.status(404).json({ message: 'Configuration not found' });
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new model configuration
router.post('/', async (req, res) => {
  try {
    const { name, modelPath, parts } = req.body;
    
    const newConfig = await prisma.modelConfig.create({
      data: {
        name,
        modelPath,
        parts: {
          create: parts.map(part => ({
            name: part.name,
            type: part.type,
            options: JSON.stringify(part.options),
            defaultValue: part.defaultValue
          }))
        }
      },
      include: {
        parts: true
      }
    });
    
    res.status(201).json(newConfig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a model configuration
router.patch('/:id', async (req, res) => {
  try {
    const { name, modelPath, parts } = req.body;
    
    const updatedConfig = await prisma.modelConfig.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        modelPath,
        parts: {
          deleteMany: {},
          create: parts.map(part => ({
            name: part.name,
            type: part.type,
            options: JSON.stringify(part.options),
            defaultValue: part.defaultValue
          }))
        }
      },
      include: {
        parts: true
      }
    });
    
    res.json(updatedConfig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
