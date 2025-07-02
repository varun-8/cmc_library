import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  biography: {
    type: String,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  birthYear: {
    type: Number
  },
  specialization: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Author', authorSchema);