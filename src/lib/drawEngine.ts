// src/lib/drawEngine.ts
const toMoney = (num: number): number => Math.round(num * 100) / 100;

export interface User {
  id: string;
  subscription_plan: "monthly" | "yearly"; // NEEDED FOR MATH
  subscription_amount: number;
  charity_percentage: number;
  selected_charity: string;
  scores: number[];
}

export function calculateCharity(users: User[]) {
  let totalCharity = 0;
  const charityAggregations: Record<string, number> = {};

  users.forEach((user) => {
    // CRITICAL MATH FIX: A Yearly user pays $250 once.
    // Their monthly contribution to the active draw pool is $250 / 12 months.
    const isYearly = user.subscription_plan === "yearly";
    const monthlyValue = isYearly
      ? user.subscription_amount / 12
      : user.subscription_amount;

    const userCharityContribution = toMoney(
      monthlyValue * (user.charity_percentage / 100)
    );
    totalCharity = toMoney(totalCharity + userCharityContribution);

    // Split impact among multiple charities if selected
    const chosenCharities = user.selected_charity
      ? user.selected_charity
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (chosenCharities.length > 0) {
      const splitImpact = userCharityContribution / chosenCharities.length;
      chosenCharities.forEach((cName) => {
        charityAggregations[cName] =
          (charityAggregations[cName] || 0) + splitImpact;
      });
    } else {
      charityAggregations["Unallocated Funds"] =
        (charityAggregations["Unallocated Funds"] || 0) +
        userCharityContribution;
    }
  });

  return { totalCharity, charityAggregations };
}

export function calculatePrizePool(
  users: User[],
  totalCharity: number,
  previousRollover: number = 0
) {
  // CRITICAL MATH FIX: We only calculate THIS MONTH'S generated revenue for the active draw
  const monthlyRevenue = users.reduce((acc, u) => {
    const isYearly = u.subscription_plan === "yearly";
    const val = isYearly ? u.subscription_amount / 12 : u.subscription_amount;
    return acc + val;
  }, 0);

  // The base generated pool for this specific draw
  const baseGeneratedPool = toMoney(monthlyRevenue - totalCharity);

  // Total Prize Pool (Generated + Previous Jackpot)
  const totalPrizePool = toMoney(baseGeneratedPool + previousRollover);

  return {
    monthlyRevenue,
    baseGeneratedPool,
    totalPrizePool,
    allocations: {
      // 40% of the entire pool (which includes the rollover) goes to Match 5
      match5: toMoney(totalPrizePool * 0.4),
      // 35% of the BASE pool goes to Match 4 (Rollovers do not trickle down to lower tiers)
      match4: toMoney(baseGeneratedPool * 0.35),
      // 25% of the BASE pool goes to Match 3
      match3: toMoney(baseGeneratedPool * 0.25),
    },
  };
}

export function runDrawSimulation(
  users: User[],
  mode: "random" | "algorithm"
): number[] {
  if (mode === "random") {
    const draw = new Set<number>();
    while (draw.size < 5) draw.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(draw);
  }

  if (mode === "algorithm") {
    const frequency: Record<number, number> = {};
    users.forEach((u) =>
      u.scores.forEach((s) => {
        frequency[s] = (frequency[s] || 0) + 1;
      })
    );

    const sortedScores = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => parseInt(entry[0]));
    const draw = new Set<number>();
    for (let i = 0; i < Math.min(3, sortedScores.length); i++)
      draw.add(sortedScores[i]);
    while (draw.size < 5) draw.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(draw);
  }
  return [];
}

export function distributePrizes(
  users: User[],
  drawNumbers: number[],
  allocations: { match5: number; match4: number; match3: number }
) {
  const drawSet = new Set(drawNumbers);
  const winners = {
    match5: [] as string[],
    match4: [] as string[],
    match3: [] as string[],
  };

  users.forEach((user) => {
    const matchedCount = user.scores.filter((score) =>
      drawSet.has(score)
    ).length;
    if (matchedCount === 5) winners.match5.push(user.id);
    else if (matchedCount === 4) winners.match4.push(user.id);
    else if (matchedCount === 3) winners.match3.push(user.id);
  });

  // STRICT ROLLOVER ENFORCEMENT: ONLY 5-MATCH ROLLS OVER
  let nextMonthJackpot = 0;
  const payouts: { userId: string; amount: number; tier: number }[] = [];

  // Tier 1: 5 Matches (Jackpot)
  if (winners.match5.length > 0) {
    const payoutPerUser = toMoney(allocations.match5 / winners.match5.length);
    winners.match5.forEach((id) =>
      payouts.push({ userId: id, amount: payoutPerUser, tier: 5 })
    );
  } else {
    // Unclaimed! Rolls over to next month's jackpot
    nextMonthJackpot += allocations.match5;
  }

  // Tier 2: 4 Matches (Does NOT rollover per rules)
  if (winners.match4.length > 0) {
    const payoutPerUser = toMoney(allocations.match4 / winners.match4.length);
    winners.match4.forEach((id) =>
      payouts.push({ userId: id, amount: payoutPerUser, tier: 4 })
    );
  }

  // Tier 3: 3 Matches (Does NOT rollover per rules)
  if (winners.match3.length > 0) {
    const payoutPerUser = toMoney(allocations.match3 / winners.match3.length);
    winners.match3.forEach((id) =>
      payouts.push({ userId: id, amount: payoutPerUser, tier: 3 })
    );
  }

  return { payouts, nextMonthJackpot };
}
