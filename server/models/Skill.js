const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      maxlength: [60, 'Skill name cannot exceed 60 characters'],
    },
    category: {
      type: String,
      required: [true, 'Skill category is required'],
      enum: {
        values: [
          'Programming',
          'Design',
          'Business',
          'Creative',
          'Language',
          'Marketing',
          'Data & AI',
          'Music',
          'Other',
        ],
        message: '{VALUE} is not a supported category',
      },
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [300, 'Description cannot exceed 300 characters'],
      trim: true,
    },
    icon: {
      type: String,
      default: 'Code',
    },
    popularity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

skillSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Skill', skillSchema);
