const mongoose = require('mongoose');

const customizablePartSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['color', 'texture', 'model'], required: true },
  options: [{
    name: String,
    value: mongoose.Schema.Types.Mixed
  }],
  defaultValue: mongoose.Schema.Types.Mixed
});

const dependencySchema = new mongoose.Schema({
  sourcePart: { type: String, required: true },
  targetPart: { type: String, required: true },
  rule: { type: String, required: true } // JSON string containing the dependency logic
});

const modelConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  modelPath: { type: String, required: true },
  customizableParts: [customizablePartSchema],
  dependencies: [dependencySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

modelConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ModelConfig', modelConfigSchema);
