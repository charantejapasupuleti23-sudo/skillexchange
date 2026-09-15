const User = require('../models/User');

const LEVEL_MAP = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

/**
 * Calculate the match score between two users with transparent reasons and breakdown.
 * @param {Object} userA - The current user
 * @param {Object} userB - The potential peer user
 * @returns {Object} { score, matchedSkills, skillsTheyTeachYou, skillsYouTeachThem, reasons, breakdown }
 */
const calculateMatchScore = (userA, userB) => {
  if (!userA || !userB || userA._id.toString() === userB._id.toString()) {
    return {
      score: 0,
      matchedSkills: [],
      skillsTheyTeachYou: [],
      skillsYouTeachThem: [],
      reasons: [],
      breakdown: { mutual: 0, level: 0, availability: 0, rating: 0, activity: 0 },
    };
  }

  const reasons = [];
  const matchedSkillsSet = new Set();
  const skillsTheyTeachYou = [];
  const skillsYouTeachThem = [];

  // 1. MUTUAL TEACHING & LEARNING COMPATIBILITY (Max 60 points)
  // Skills A wants to learn that B teaches
  let matchTheyTeachYouPoints = 0;
  if (userA.skillsToLearn && userA.skillsToLearn.length > 0 && userB.skillsToTeach && userB.skillsToTeach.length > 0) {
    userA.skillsToLearn.forEach((learnItem) => {
      const aSkillId = learnItem.skill?._id?.toString() || learnItem.skill?.toString();
      const aSkillName = learnItem.skill?.name;

      const teachMatch = userB.skillsToTeach.find((teachItem) => {
        const bSkillId = teachItem.skill?._id?.toString() || teachItem.skill?.toString();
        return bSkillId === aSkillId;
      });

      if (teachMatch) {
        const skillName = aSkillName || teachMatch.skill?.name || 'Desired Skill';
        skillsTheyTeachYou.push({
          name: skillName,
          learnerTargetLevel: learnItem.level,
          teacherLevel: teachMatch.level,
          yearsOfExperience: teachMatch.yearsOfExperience,
        });
        matchedSkillsSet.add(skillName);
      }
    });

    if (skillsTheyTeachYou.length > 0) {
      // Up to 30 points for teaching what A wants
      matchTheyTeachYouPoints = Math.min(30, (skillsTheyTeachYou.length / userA.skillsToLearn.length) * 30 + 10);
      reasons.push(
        `They teach ${skillsTheyTeachYou.map((s) => s.name).join(', ')}, which you want to learn.`
      );
    }
  }

  // Skills B wants to learn that A teaches
  let matchYouTeachThemPoints = 0;
  if (userB.skillsToLearn && userB.skillsToLearn.length > 0 && userA.skillsToTeach && userA.skillsToTeach.length > 0) {
    userB.skillsToLearn.forEach((learnItem) => {
      const bSkillId = learnItem.skill?._id?.toString() || learnItem.skill?.toString();
      const bSkillName = learnItem.skill?.name;

      const teachMatch = userA.skillsToTeach.find((teachItem) => {
        const aSkillId = teachItem.skill?._id?.toString() || teachItem.skill?.toString();
        return aSkillId === bSkillId;
      });

      if (teachMatch) {
        const skillName = bSkillName || teachMatch.skill?.name || 'Offered Skill';
        skillsYouTeachThem.push({
          name: skillName,
          learnerTargetLevel: learnItem.level,
          teacherLevel: teachMatch.level,
        });
        matchedSkillsSet.add(skillName);
      }
    });

    if (skillsYouTeachThem.length > 0) {
      // Up to 30 points for teaching what B wants
      matchYouTeachThemPoints = Math.min(30, (skillsYouTeachThem.length / userB.skillsToLearn.length) * 30 + 10);
      reasons.push(
        `You teach ${skillsYouTeachThem.map((s) => s.name).join(', ')}, which they want to learn.`
      );
    }
  }

  const mutualScore = Math.min(60, Math.round(matchTheyTeachYouPoints + matchYouTeachThemPoints));

  // 2. SKILL LEVEL COMPATIBILITY (Max 15 points)
  let levelScore = 0;
  if (skillsTheyTeachYou.length > 0) {
    let optimalCount = 0;
    skillsTheyTeachYou.forEach((match) => {
      const teacherVal = LEVEL_MAP[match.teacherLevel] || 2;
      const learnerVal = LEVEL_MAP[match.learnerTargetLevel] || 1;
      if (teacherVal >= learnerVal) {
        optimalCount++;
      }
    });

    const levelRatio = optimalCount / skillsTheyTeachYou.length;
    levelScore = Math.round(levelRatio * 15);
    if (levelScore >= 10) {
      reasons.push('High skill-level compatibility for effective mentorship.');
    }
  }

  // 3. AVAILABILITY OVERLAP (Max 10 points)
  let availabilityScore = 0;
  const overlappingDays = [];

  if (userA.availability && userB.availability) {
    const daysA = new Set(userA.availability.map((a) => a.day));
    userB.availability.forEach((b) => {
      if (daysA.has(b.day)) {
        overlappingDays.push(b.day);
      }
    });

    if (overlappingDays.length > 0) {
      availabilityScore = Math.min(10, overlappingDays.length * 4);
      reasons.push(`Availability overlaps on ${overlappingDays.slice(0, 3).join(', ')}.`);
    }
  }

  // 4. RATING FACTOR (Max 10 points)
  const userRating = userB.rating || 5.0;
  const ratingScore = Math.round((userRating / 5.0) * 10);
  if (userRating >= 4.7) {
    reasons.push(`Top rated peer mentor (${userRating.toFixed(1)} / 5.0).`);
  }

  // 5. PROFILE ACTIVITY & COMPLETENESS (Max 5 points)
  let activityScore = 0;
  if (userB.bio && userB.bio.length > 20) activityScore += 2;
  if (userB.completedSessions > 0) activityScore += 2;
  if (userB.location) activityScore += 1;

  // Compute Final Total Match Score (0 to 100)
  // If there are zero mutual skill matches, cap score at 20 to prevent false matches
  let totalScore = mutualScore + levelScore + availabilityScore + ratingScore + activityScore;
  if (skillsTheyTeachYou.length === 0 && skillsYouTeachThem.length === 0) {
    totalScore = Math.min(15, Math.round(ratingScore + activityScore));
  } else {
    totalScore = Math.min(99, Math.max(10, Math.round(totalScore)));
  }

  return {
    score: totalScore,
    matchedSkills: Array.from(matchedSkillsSet),
    skillsTheyTeachYou,
    skillsYouTeachThem,
    reasons,
    breakdown: {
      mutual: mutualScore,
      level: levelScore,
      availability: availabilityScore,
      rating: ratingScore,
      activity: activityScore,
    },
  };
};

/**
 * Find recommended matches for a user across the database.
 * @param {string} userId - ID of current user
 * @param {Object} options - Pagination & filter options
 */
const findMatchesForUser = async (userId, options = {}) => {
  const { limit = 10, minScore = 25 } = options;

  const currentUser = await User.findById(userId)
    .populate('skillsToTeach.skill', 'name category icon')
    .populate('skillsToLearn.skill', 'name category icon');

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Find all other users
  const candidates = await User.find({ _id: { $ne: userId } })
    .select('-password')
    .populate('skillsToTeach.skill', 'name category icon')
    .populate('skillsToLearn.skill', 'name category icon');

  // Compute scores for each candidate
  const scoredMatches = candidates
    .map((candidate) => {
      const matchResult = calculateMatchScore(currentUser, candidate);
      return {
        user: candidate,
        matchScore: matchResult.score,
        matchedSkills: matchResult.matchedSkills,
        skillsTheyTeachYou: matchResult.skillsTheyTeachYou,
        skillsYouTeachThem: matchResult.skillsYouTeachThem,
        reasons: matchResult.reasons,
        breakdown: matchResult.breakdown,
      };
    })
    .filter((match) => match.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return scoredMatches;
};

module.exports = {
  calculateMatchScore,
  findMatchesForUser,
};
