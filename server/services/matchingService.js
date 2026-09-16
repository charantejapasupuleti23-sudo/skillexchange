const User = require('../models/User');
const { computeSkillSimilarity, normalizeSkillName } = require('../utils/skillTaxonomy');

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
 * @param {Object} options - Custom options (e.g., minimum floor)
 * @returns {Object} Full match details
 */
const calculateMatchScore = (userA, userB, options = {}) => {
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
      breakdown: {
        skillsScore: 0,
        proficiencyScore: 0,
        scheduleScore: 0,
        reputationScore: 0,
        total: 0,
        percentages: { skills: 0, proficiency: 0, schedule: 0, reputation: 0 },
      },
    };
  }

  const reasons = [];
  const matchedSkillsSet = new Set();
  const skillsTheyTeachYou = [];
  const skillsYouTeachThem = [];

  // 1. SKILLS USER B TEACHES THAT USER A WANTS TO LEARN (Semantic + Synonyms)
  let theyTeachYouSimSum = 0;
  if (userA.skillsToLearn && userA.skillsToLearn.length > 0 && userB.skillsToTeach && userB.skillsToTeach.length > 0) {
    userA.skillsToLearn.forEach((learnItem) => {
      const aSkill = learnItem.skill;

      let bestMatch = null;
      let highestSim = 0;

      userB.skillsToTeach.forEach((teachItem) => {
        const bSkill = teachItem.skill;
        const sim = computeSkillSimilarity(aSkill, bSkill);
        if (sim > highestSim && sim >= 0.6) {
          highestSim = sim;
          bestMatch = teachItem;
        }
      });

      if (bestMatch && highestSim >= 0.6) {
        const skillName = bestMatch.skill?.name || aSkill?.name || 'Desired Skill';
        skillsTheyTeachYou.push({
          name: skillName,
          category: bestMatch.skill?.category || aSkill?.category || 'General',
          learnerTargetLevel: learnItem.level || 'Beginner',
          teacherLevel: bestMatch.level || 'Intermediate',
          similarity: highestSim,
          isSynonymMatch: highestSim < 1.0 && highestSim >= 0.85,
          isClusterMatch: highestSim < 0.85,
        });
        matchedSkillsSet.add(skillName);
        theyTeachYouSimSum += highestSim;
      }
    });

    if (skillsTheyTeachYou.length > 0) {
      const names = skillsTheyTeachYou.map((s) => s.name).slice(0, 2).join(', ');
      reasons.push(`They offer ${names}, matching what you want to learn.`);
    }
  }

  // 2. SKILLS USER A TEACHES THAT USER B WANTS TO LEARN (Semantic + Synonyms)
  let youTeachThemSimSum = 0;
  if (userB.skillsToLearn && userB.skillsToLearn.length > 0 && userA.skillsToTeach && userA.skillsToTeach.length > 0) {
    userB.skillsToLearn.forEach((learnItem) => {
      const bSkill = learnItem.skill;

      let bestMatch = null;
      let highestSim = 0;

      userA.skillsToTeach.forEach((teachItem) => {
        const aSkill = teachItem.skill;
        const sim = computeSkillSimilarity(aSkill, bSkill);
        if (sim > highestSim && sim >= 0.6) {
          highestSim = sim;
          bestMatch = teachItem;
        }
      });

      if (bestMatch && highestSim >= 0.6) {
        const skillName = bestMatch.skill?.name || bSkill?.name || 'Offered Skill';
        skillsYouTeachThem.push({
          name: skillName,
          category: bestMatch.skill?.category || bSkill?.category || 'General',
          learnerTargetLevel: learnItem.level || 'Beginner',
          teacherLevel: bestMatch.level || 'Intermediate',
          similarity: highestSim,
          isSynonymMatch: highestSim < 1.0 && highestSim >= 0.85,
          isClusterMatch: highestSim < 0.85,
        });
        matchedSkillsSet.add(skillName);
        youTeachThemSimSum += highestSim;
      }
    });

    if (skillsYouTeachThem.length > 0) {
      const names = skillsYouTeachThem.map((s) => s.name).slice(0, 2).join(', ');
      reasons.push(`You offer ${names}, matching their desired skills.`);
    }
  }

  // Base Skills Match Points (Max 45 points)
  let skillsScore = 0;
  if (skillsTheyTeachYou.length > 0 || skillsYouTeachThem.length > 0) {
    const rawTeachYou = Math.min(22.5, theyTeachYouSimSum * 22.5);
    const rawTeachThem = Math.min(22.5, youTeachThemSimSum * 22.5);
    skillsScore = Math.round(rawTeachYou + rawTeachThem);
  }

  // 3. EXACT 1:1 BARTER BONUS (15 points)
  const isExactBidirectional = skillsTheyTeachYou.length > 0 && skillsYouTeachThem.length > 0;
  let barterBonus = 0;
  if (isExactBidirectional) {
    barterBonus = 15;
    reasons.unshift('Perfect 1:1 Direct Barter Match (Mutual 2-Way Exchange)');
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

  // 4. PROFICIENCY LEVEL THRESHOLDS & MENTOR-LEARNER ALIGNMENT (Max 15 points)
  let proficiencyScore = 0;
  if (skillsTheyTeachYou.length > 0 || skillsYouTeachThem.length > 0) {
    let optimalCount = 0;
    let totalAssessed = 0;

    // Check teacher vs learner levels
    skillsTheyTeachYou.forEach((match) => {
      totalAssessed++;
      const teacherVal = LEVEL_MAP[match.teacherLevel] || 2;
      const learnerVal = LEVEL_MAP[match.learnerTargetLevel] || 1;
      // Senior mentor to beginner/intermediate is optimal
      if (teacherVal >= learnerVal) {
        optimalCount += 1;
        if (teacherVal >= 3 && learnerVal <= 2) optimalCount += 0.5; // Mentor synergy bonus
      } else {
        // Teacher is junior to learner desired level -> penalty
        optimalCount -= 0.5;
      }
    });

    skillsYouTeachThem.forEach((match) => {
      totalAssessed++;
      const teacherVal = LEVEL_MAP[match.teacherLevel] || 2;
      const learnerVal = LEVEL_MAP[match.learnerTargetLevel] || 1;
      if (teacherVal >= learnerVal) {
        optimalCount += 1;
        if (teacherVal >= 3 && learnerVal <= 2) optimalCount += 0.5;
      } else {
        optimalCount -= 0.5;
      }
    });

    if (totalAssessed > 0) {
      const ratio = Math.max(0, Math.min(1.0, optimalCount / totalAssessed));
      proficiencyScore = Math.round(ratio * 15);
      if (proficiencyScore >= 12) {
        reasons.push('Excellent proficiency alignment (experienced mentor fit).');
      }
    }
  }

  // 5. SCHEDULE AVAILABILITY OVERLAP (Max 15 points)
  let scheduleScore = 0;
  const overlappingDays = [];
  if (userA.availability && userB.availability) {
    const daysA = new Set(userA.availability.map((a) => a.day));
    userB.availability.forEach((b) => {
      if (daysA.has(b.day)) {
        overlappingDays.push(b.day);
      }
    });

    if (overlappingDays.length > 0) {
      scheduleScore = Math.min(15, overlappingDays.length * 5);
      reasons.push(`Overlapping schedule on ${overlappingDays.slice(0, 3).join(', ')}.`);
    }
  }

  // 6. RATING & REPUTATION FACTOR (Max 10 points)
  const userRating = userB.rating || 5.0;
  const reviewCount = userB.reviewCount || 0;
  const reputationScore = Math.min(10, Math.round((userRating / 5.0) * 8 + Math.min(2, reviewCount * 0.5)));
  if (userRating >= 4.7 && reviewCount > 0) {
    reasons.push(`High mentor rating (${userRating.toFixed(1)} ★ with ${reviewCount} reviews).`);
  }

  // Calculate Raw Total
  const totalSkills = skillsScore + barterBonus;
  let totalScore = totalSkills + proficiencyScore + scheduleScore + reputationScore;

  // Minimum Match Floor calculation:
  // If no skills overlap (neither teach nor learn), cap match score low so irrelevant profiles don't dominate
  if (skillsTheyTeachYou.length === 0 && skillsYouTeachThem.length === 0) {
    totalScore = Math.min(20, Math.round((scheduleScore + reputationScore) * 0.5));
  } else {
    totalScore = Math.min(99, Math.max(25, Math.round(totalScore)));
  }

  // Normalized percentages for visual breakdown bar
  const displayTotal = totalScore || 1;
  const breakdownPercentages = {
    skills: Math.round((totalSkills / displayTotal) * 100) || 0,
    proficiency: Math.round((proficiencyScore / displayTotal) * 100) || 0,
    schedule: Math.round((scheduleScore / displayTotal) * 100) || 0,
    reputation: Math.round((reputationScore / displayTotal) * 100) || 0,
  };

  return {
    score: totalScore,
    isExactBidirectional,
    matchType,
    matchedSkills: Array.from(matchedSkillsSet),
    skillsTheyTeachYou,
    skillsYouTeachThem,
    overlappingDays,
    reasons,
    breakdown: {
      skillsScore: totalSkills,
      mutual: totalSkills,
      proficiencyScore,
      scheduleScore,
      availability: scheduleScore,
      reputationScore,
      total: totalScore,
      percentages: breakdownPercentages,
    },
  };
};

/**
 * Multi-Way (3-Way) Barter Cycle Engine
 * Finds circular 3-way barter loops:
 * User A (Current User) teaches User B -> User B teaches User C -> User C teaches User A.
 * @param {string} currentUserId
 * @param {Array} allUsers
 * @returns {Array} List of 3-way circular trade loops
 */
const find3WayLoops = (currentUser, candidates) => {
  if (!currentUser || !candidates || candidates.length < 2) return [];

  const loops = [];
  const seenLoopKeys = new Set();

  const doesUserTeachTarget = (teacher, learner) => {
    if (!teacher.skillsToTeach || !learner.skillsToLearn) return null;
    for (const t of teacher.skillsToTeach) {
      for (const l of learner.skillsToLearn) {
        const sim = computeSkillSimilarity(t.skill, l.skill);
        if (sim >= 0.6) {
          return {
            skill: t.skill?.name || l.skill?.name || 'Skill',
            teacherLevel: t.level || 'Intermediate',
            learnerLevel: l.level || 'Beginner',
            similarity: sim,
          };
        }
      }
    }
    return null;
  };

  for (let i = 0; i < candidates.length; i++) {
    const userB = candidates[i];
    if (userB._id.toString() === currentUser._id.toString()) continue;

    // Step 1: User A teaches User B (Skill AB)
    const matchAB = doesUserTeachTarget(currentUser, userB);
    if (!matchAB) continue;

    for (let j = 0; j < candidates.length; j++) {
      if (i === j) continue;
      const userC = candidates[j];
      if (userC._id.toString() === currentUser._id.toString()) continue;

      // Step 2: User B teaches User C (Skill BC)
      const matchBC = doesUserTeachTarget(userB, userC);
      if (!matchBC) continue;

      // Step 3: User C teaches User A (Skill CA)
      const matchCA = doesUserTeachTarget(userC, currentUser);
      if (!matchCA) continue;

      // Unique loop key to avoid duplicate combinations
      const loopKey = [userB._id.toString(), userC._id.toString()].sort().join('_');
      if (seenLoopKeys.has(loopKey)) continue;
      seenLoopKeys.add(loopKey);

      // Loop Score Calculation
      const avgSim = (matchAB.similarity + matchBC.similarity + matchCA.similarity) / 3;
      const loopScore = Math.min(96, Math.max(70, Math.round(avgSim * 85 + 10)));

      loops.push({
        id: `loop_${userB._id}_${userC._id}`,
        score: loopScore,
        step1: {
          from: { _id: currentUser._id, name: currentUser.name, username: currentUser.username, avatar: currentUser.profileImage?.url },
          to: { _id: userB._id, name: userB.name, username: userB.username, avatar: userB.profileImage?.url },
          skill: matchAB.skill,
          teacherLevel: matchAB.teacherLevel,
        },
        step2: {
          from: { _id: userB._id, name: userB.name, username: userB.username, avatar: userB.profileImage?.url },
          to: { _id: userC._id, name: userC.name, username: userC.username, avatar: userC.profileImage?.url },
          skill: matchBC.skill,
          teacherLevel: matchBC.teacherLevel,
        },
        step3: {
          from: { _id: userC._id, name: userC.name, username: userC.username, avatar: userC.profileImage?.url },
          to: { _id: currentUser._id, name: currentUser.name, username: currentUser.username, avatar: currentUser.profileImage?.url },
          skill: matchCA.skill,
          teacherLevel: matchCA.teacherLevel,
        },
        userB,
        userC,
      });
    }
  }

  return loops.sort((a, b) => b.score - a.score);
};

/**
 * Find recommended matches and multi-way loops for a user across the database.
 * @param {string} userId - ID of current user
 * @param {Object} options - Filtering & options
 */
const findMatchesForUser = async (userId, options = {}) => {
  const {
    limit = 20,
    minScore = 25, // Minimum match floor
    day,
    category,
    minRating = 0,
    matchTypeFilter, // 'all', 'exact', 'partial', 'loops'
  } = options;

  const currentUser = await User.findById(userId)
    .populate('skillsToTeach.skill', 'name category icon')
    .populate('skillsToLearn.skill', 'name category icon');

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Find all other candidate users
  const candidates = await User.find({ _id: { $ne: userId } })
    .select('-password')
    .populate('skillsToTeach.skill', 'name category icon')
    .populate('skillsToLearn.skill', 'name category icon');

  // 1. Compute 1:1 match scores
  let scoredMatches = candidates.map((candidate) => {
    const matchResult = calculateMatchScore(currentUser, candidate);
    return {
      user: candidate,
      matchScore: matchResult.score,
      isExactBidirectional: matchResult.isExactBidirectional,
      matchType: matchResult.matchType,
      matchedSkills: matchResult.matchedSkills,
      skillsTheyTeachYou: matchResult.skillsTheyTeachYou,
      skillsYouTeachThem: matchResult.skillsYouTeachThem,
      overlappingDays: matchResult.overlappingDays,
      reasons: matchResult.reasons,
      breakdown: matchResult.breakdown,
    };
  });

  // 2. Compute 3-Way Loops
  const threeWayLoops = find3WayLoops(currentUser, candidates);

  // 3. Apply Filters
  // Minimum Match Floor Filter
  scoredMatches = scoredMatches.filter((m) => m.matchScore >= minScore);

  // Day filter
  if (day && day !== 'all' && day !== 'Any') {
    scoredMatches = scoredMatches.filter((m) =>
      m.user.availability?.some((a) => a.day.toLowerCase() === day.toLowerCase())
    );
  }

  // Category filter
  if (category && category !== 'all') {
    scoredMatches = scoredMatches.filter((m) =>
      m.user.skillsToTeach?.some((s) => s.skill?.category?.toLowerCase() === category.toLowerCase()) ||
      m.user.skillsToLearn?.some((s) => s.skill?.category?.toLowerCase() === category.toLowerCase())
    );
  }

  // Min Rating filter
  if (minRating > 0) {
    scoredMatches = scoredMatches.filter((m) => (m.user.rating || 5.0) >= minRating);
  }

  // Match Type filter
  if (matchTypeFilter === 'exact') {
    scoredMatches = scoredMatches.filter((m) => m.isExactBidirectional);
  } else if (matchTypeFilter === 'partial') {
    scoredMatches = scoredMatches.filter((m) => !m.isExactBidirectional);
  }

  // Sort: Exact 1:1 first, then by match score descending
  const sortedMatches = scoredMatches.sort((a, b) => {
    if (a.isExactBidirectional && !b.isExactBidirectional) return -1;
    if (!a.isExactBidirectional && b.isExactBidirectional) return 1;
    return b.matchScore - a.matchScore;
  });

  return {
    matches: sortedMatches.slice(0, limit),
    threeWayLoops,
    stats: {
      totalCandidates: candidates.length,
      exactMatchesCount: scoredMatches.filter((m) => m.isExactBidirectional).length,
      partialMatchesCount: scoredMatches.filter((m) => !m.isExactBidirectional).length,
      threeWayLoopsCount: threeWayLoops.length,
    },
  };
};

module.exports = {
  calculateMatchScore,
  find3WayLoops,
  findMatchesForUser,
};
