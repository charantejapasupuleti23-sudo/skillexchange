const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session reference is required'],
      unique: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
      index: true,
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewed user is required'],
      index: true,
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill reference is required'],
    },
    roleReviewed: {
      type: String,
      enum: ['mentor', 'learner'],
      default: 'mentor',
    },
    rating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    categoryRatings: {
      communication: {
        type: Number,
        min: 1,
        max: 5,
        default: 5,
      },
      technicalMastery: {
        type: Number,
        min: 1,
        max: 5,
        default: 5,
      },
      punctuality: {
        type: Number,
        min: 1,
        max: 5,
        default: 5,
      },
      helpfulness: {
        type: Number,
        min: 1,
        max: 5,
        default: 5,
      },
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
    endorsedSkill: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Static method to recalculate multi-pillar average rating & star distribution
reviewSchema.statics.calculateAverageRating = async function (userId) {
  const reviews = await this.find({ reviewedUser: new mongoose.Types.ObjectId(userId) });

  try {
    if (reviews.length > 0) {
      let totalRating = 0;
      let totalComm = 0;
      let totalTech = 0;
      let totalPunct = 0;
      let totalHelp = 0;

      const distribution = {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      };

      reviews.forEach((r) => {
        totalRating += r.rating || 5;
        const cat = r.categoryRatings || {};
        totalComm += cat.communication || r.rating || 5;
        totalTech += cat.technicalMastery || r.rating || 5;
        totalPunct += cat.punctuality || r.rating || 5;
        totalHelp += cat.helpfulness || r.rating || 5;

        const rounded = Math.round(r.rating || 5);
        if (rounded >= 5) distribution.fiveStar += 1;
        else if (rounded === 4) distribution.fourStar += 1;
        else if (rounded === 3) distribution.threeStar += 1;
        else if (rounded === 2) distribution.twoStar += 1;
        else distribution.oneStar += 1;
      });

      const count = reviews.length;
      await mongoose.model('User').findByIdAndUpdate(userId, {
        rating: Math.round((totalRating / count) * 10) / 10,
        reviewCount: count,
        ratingBreakdown: {
          communication: Math.round((totalComm / count) * 10) / 10,
          technicalMastery: Math.round((totalTech / count) * 10) / 10,
          punctuality: Math.round((totalPunct / count) * 10) / 10,
          helpfulness: Math.round((totalHelp / count) * 10) / 10,
        },
        ratingDistribution: distribution,
      });
    } else {
      await mongoose.model('User').findByIdAndUpdate(userId, {
        rating: 5.0,
        reviewCount: 0,
        ratingBreakdown: {
          communication: 5.0,
          technicalMastery: 5.0,
          punctuality: 5.0,
          helpfulness: 5.0,
        },
        ratingDistribution: {
          fiveStar: 0,
          fourStar: 0,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0,
        },
      });
    }
  } catch (err) {
    console.error('Error updating user average rating:', err);
  }
};

// Call calculateAverageRating after save and delete
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.reviewedUser);
});

reviewSchema.post('remove', async function () {
  await this.constructor.calculateAverageRating(this.reviewedUser);
});

module.exports = mongoose.model('Review', reviewSchema);
