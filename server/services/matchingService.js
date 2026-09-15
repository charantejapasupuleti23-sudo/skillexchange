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
 * @returns {Object} { score, isExactBidirectional, matchType, categoryOverlap, matchedSkills, skillsTheyTeachYou, skillsYouTeachThem, reasons, breakdown }
 */
const calculateMatchScore = (userA, userB) => {
  if (!userA || !userB || userA._id.toString() === userB._id.toString()) {
    return {
      score: 0,
      isExactBidirectional: false,
      matchType: 'None',
      categoryOverlap: [],
      matchedSkills: [],
      skillsTheyTeachYou: [],
      skillsYouTeachThem: [],
      reasons: [],
      breakdown: { mutual: 0, barterBonus: 0, category: 0, level: 0, availability: 0, rating: 0 },
    };
  }

  const reasons = [];
  const matchedSkillsSet = new Set();
  const skillsTheyTeachYou = [];
  const skillsYouTeachThem = [];

  // 1. SKILLS USER B TEACHES THAT USER A WANTS TO LEARN
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
          category: teachMatch.skill?.category || learnItem.skill?.category || 'General',
          learnerTargetLevel: learnItem.level,
          teacherLevel: teachMatch.level,
          yearsOfExperience: teachMatch.yearsOfExperience,
        });
        matchedSkillsSet.add(skillName);
      }
    });

    if (skillsTheyTeachYou.length > 0) {
      matchTheyTeachYouPoints = Math.min(25, (skillsTheyTeachYou.length / userA.skillsToLearn.length) * 20 + 5);
      reasons.push(
        `They teach ${skillsTheyTeachYou.map((s) => s.name).join(', ')}, which you want to learn.`
      );
    }
  }

  // 2. SKILLS USER A TEACHES THAT USER B WANTS TO LEARN
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
          category: teachMatch.skill?.category || learnItem.skill?.category || 'General',
          learnerTargetLevel: learnItem.level,
          teacherLevel: teachMatch.level,
        });
        matchedSkillsSet.add(skillName);
      }
    });

    if (skillsYouTeachThem.length > 0) {
      matchYouTeachThemPoints = Math.min(25, (skillsYouTeachThem.length / userB.skillsToLearn.length) * 20 + 5);
      reasons.push(
        `You teach ${skillsYouTeachThem.map((s) => s.name).join(', ')}, which they want to learn.`
      );
    }
  }

  const mutualScore = Math.min(50, Math.round(matchTheyTeachYouPoints + matchYouTeachThemPoints));

  // 3. EXACT BIDIRECTIONAL BARTER BONUS (15 points)
  // UserA.teaches ∩ UserB.learns AND UserB.teaches ∩ UserA.learns
  const isExactBidirectional = skillsTheyTeachYou.length > 0 && skillsYouTeachThem.length > 0;
  let barterBonus = 0;
  if (isExactBidirectional) {
    barterBonus = 15;
    reasons.unshift('Perfect 1:1 Direct Barter Match (Mutual Exchange)!');
  }

  // Determine Match Type
  let matchType = 'General Match';
  if (isExactBidirectional) {
    matchType = 'Exact 1:1 Barter';
  } else if (skillsTheyTeachYou.length > 0) {
    matchType = 'One-Way (They Teach You)';
  } else if (skillsYouTeachThem.length > 0) {
    matchType = 'One-Way (You Teach Them)';
  }

  // 4. CATEGORY OVERLAP (Max 10 points)
  const categoriesA = new Set([
    ...(userA.skillsToTeach || []).map((s) => s.skill?.category).filter(Boolean),
    ...(userA.skillsToLearn || []).map((s) => s.skill?.category).filter(Boolean),
  ]);
  const categoriesB = new Set([
    ...(userB.skillsToTeach || []).map((s) => s.skill?.category).filter(Boolean),
    ...(userB.skillsToLearn || []).map((s) => s.skill?.category).filter(Boolean),
  ]);

  const categoryOverlap = [];
  categoriesA.forEach((cat) => {
    if (categoriesB.has(cat)) {
      categoryOverlap.push(cat);
    }
  });

  let categoryScore = 0;
  if (categoryOverlap.length > 0) {
    categoryScore = Math.min(10, categoryOverlap.length * 4);
    if (!isExactBidirectional && matchType === 'General Match') {
      matchType = 'Category Synergy';
      reasons.push(`Shared interests in ${categoryOverlap.slice(0, 3).join(', ')}.`);
    }
  }

  // 5. SKILL LEVEL & PROFICIENCY ALIGNMENT (Max 10 points)
  let levelScore = 0;
  if (skillsTheyTeachYou.length > 0 || skillsYouTeachThem.length > 0) {
    let optimalCount = 0;
    let totalAssessed = 0;

    skillsTheyTeachYou.forEach((match) => {
      totalAssessed++;
      const teacherVal = LEVEL_MAP[match.teacherLevel] || 2;
      const learnerVal = LEVEL_MAP[match.learnerTargetLevel] || 1;
      if (teacherVal >= learnerVal) optimalCount++;
    });

    skillsYouTeachThem.forEach((match) => {
      totalAssessed++;
      const teacherVal = LEVEL_MAP[match.teacherLevel] || 2;
      const learnerVal = LEVEL_MAP[match.learnerTargetLevel] || 1;
      if (teacherVal >= learnerVal) optimalCount++;
    });

    if (totalAssessed > 0) {
      levelScore = Math.round((optimalCount / totalAssessed) * 10);
      if (levelScore >= 7) {
        reasons.push('High proficiency alignment for productive sessions.');
      }
    }
  }

  // 6. AVAILABILITY OVERLAP (Max 10 points)
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
      availabilityScore = Math.min(10, overlappingDays.length * 3 + 1);
      reasons.push(`Availability overlaps on ${overlappingDays.slice(0, 3).join(', ')}.`);
    }
  }

  // 7. RATING & CREDIBILITY FACTOR (Max 5 points)
  const userRating = userB.rating || 5.0;
  const ratingScore = Math.round((userRating / 5.0) * 5);
  if (userRating >= 4.7) {
    reasons.push(`Highly rated peer mentor (${userRating.toFixed(1)} / 5.0).`);
  }

  // Compute Final Total Match Score (0 to 100)
  let totalScore = mutualScore + barterBonus + categoryScore + levelScore + availabilityScore + ratingScore;

  if (skillsTheyTeachYou.length === 0 && skillsYouTeachThem.length === 0) {
    // Partial / Category suggestion when no exact skills match
    totalScore = Math.min(35, Math.max(10, Math.round(categoryScore + availabilityScore + ratingScore)));
  } else {
    totalScore = Math.min(99, Math.max(25, Math.round(totalScore)));
  }

  return {
    score: totalScore,
    isExactBidirectional,
    matchType,
    categoryOverlap,
    matchedSkills: Array.from(matchedSkillsSet),
    skillsTheyTeachYou,
    skillsYouTeachThem,
    reasons,
    breakdown: {
      mutual: mutualScore,
      barterBonus,
      category: categoryScore,
      level: levelScore,
      availability: availabilityScore,
      rating: ratingScore,
    },
  };
};

/**
 * Find recommended matches for a user across the database.
 * @param {string} userId - ID of current user
 * @param {Object} options - Pagination & filter options
 */
const findMatchesForUser = async (userId, options = {}) => {
  const { limit = 12, minScore = 15, matchTypeFilter } = options;

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
  let scoredMatches = candidates.map((candidate) => {
    const matchResult = calculateMatchScore(currentUser, candidate);
    return {
      user: candidate,
      matchScore: matchResult.score,
      isExactBidirectional: matchResult.isExactBidirectional,
      matchType: matchResult.matchType,
      categoryOverlap: matchResult.categoryOverlap,
      matchedSkills: matchResult.matchedSkills,
      skillsTheyTeachYou: matchResult.skillsTheyTeachYou,
      skillsYouTeachThem: matchResult.skillsYouTeachThem,
      reasons: matchResult.reasons,
      breakdown: matchResult.breakdown,
    };
  });

  if (matchTypeFilter === 'exact') {
    scoredMatches = scoredMatches.filter((m) => m.isExactBidirectional);
  } else if (matchTypeFilter === 'partial') {
    scoredMatches = scoredMatches.filter((m) => !m.isExactBidirectional);
  }

  return scoredMatches
    .filter((match) => match.matchScore >= minScore)
    .sort((a, b) => {
      // Prioritize exact bidirectional matches, then highest score
      if (a.isExactBidirectional && !b.isExactBidirectional) return -1;
      if (!a.isExactBidirectional && b.isExactBidirectional) return 1;
      return b.matchScore - a.matchScore;
    })
    .slice(0, limit);
};

module.exports = {
  calculateMatchScore,
  findMatchesForUser,
};
