// Achievement data for the Rebirth smoke-free tracking app

export interface Achievement {
  day: number;
  title: string;
  description: string;
  type: 'healing' | 'motivational';
}

// Science-based healing achievements
export const healingAchievements: Achievement[] = [
  { day: 1, title: "Oxygen Levels Improve", description: "Within 24 hours, oxygen levels in your blood rise and carbon monoxide levels drop.", type: 'healing' },
  { day: 2, title: "Nicotine Leaves the Body", description: "By 48 hours, nicotine has fully left your body. Your sense of taste and smell start to improve.", type: 'healing' },
  { day: 3, title: "Breathing Improves", description: "Bronchial tubes begin to relax, making breathing easier.", type: 'healing' },
  { day: 14, title: "Circulation Boosts", description: "2 weeks smoke-free improves blood circulation and physical stamina.", type: 'healing' },
  { day: 30, title: "Lung Function Begins to Recover", description: "After 1 month, lung function improves, making exercise easier.", type: 'healing' },
  { day: 90, title: "Energy Returns", description: "At 3 months, your lung capacity has increased and you feel less fatigue.", type: 'healing' },
  { day: 180, title: "Cough and Breathing Improve", description: "At 6 months, cilia in your lungs regrow, reducing coughing and mucus buildup.", type: 'healing' },
  { day: 270, title: "Strong Lungs", description: "At 9 months, lung efficiency is much higher, and infections are less frequent.", type: 'healing' },
  { day: 365, title: "Heart Health Boost", description: "At 1 year, your risk of heart disease is cut in half compared to a smoker.", type: 'healing' },
  { day: 730, title: "Near Non-Smoker Circulation", description: "At 2 years, your circulation and lung health are close to a non-smoker's.", type: 'healing' }
];

// Motivational achievements (every 30 days)
export const motivationalAchievements: Achievement[] = [
  { day: 30, title: "30 Days Strong", description: "1 month smoke-free! You saved money and improved your stamina.", type: 'motivational' },
  { day: 60, title: "2 Months Clean", description: "Two months strong! Your cravings are less frequent now.", type: 'motivational' },
  { day: 90, title: "3 Months Power", description: "Quarter year done! Energy and lung health are better.", type: 'motivational' },
  { day: 120, title: "4 Months Milestone", description: "You stayed consistent for 120 days. Amazing control!", type: 'motivational' },
  { day: 150, title: "5 Months Warrior", description: "Almost half a year! You've avoided thousands of cigarettes.", type: 'motivational' },
  { day: 180, title: "6 Months Champion", description: "Half a year smoke-free! Your body has healed massively.", type: 'motivational' },
  { day: 210, title: "7 Months Fighter", description: "You've built a strong smoke-free habit for 7 months.", type: 'motivational' },
  { day: 240, title: "8 Months Progress", description: "Confidence grows stronger every day!", type: 'motivational' },
  { day: 270, title: "9 Months Winner", description: "Lungs healthier, infections rarer — keep it up.", type: 'motivational' },
  { day: 300, title: "10 Months Free", description: "Double digits in months! You've saved a lot of money too.", type: 'motivational' },
  { day: 330, title: "11 Months Fighter", description: "Nearly a year without smoking. Massive achievement.", type: 'motivational' },
  { day: 365, title: "1 Year Smoke-Free!", description: "Heart risk halved, new life gained.", type: 'motivational' },
  { day: 395, title: "13 Months Clean", description: "Past the one-year mark — now truly a lifestyle.", type: 'motivational' },
  { day: 425, title: "14 Months Free", description: "Your body is recovering deeper now.", type: 'motivational' },
  { day: 455, title: "15 Months Strong", description: "Consistency is your biggest weapon!", type: 'motivational' },
  { day: 485, title: "16 Months Resilient", description: "Almost a year and a half smoke-free.", type: 'motivational' },
  { day: 515, title: "17 Months Milestone", description: "Your cravings are rare, and your health is much stronger.", type: 'motivational' },
  { day: 545, title: "18 Months Freedom", description: "You've avoided long-term damage by staying clean.", type: 'motivational' },
  { day: 575, title: "19 Months Fighter", description: "Your new lifestyle is permanent now.", type: 'motivational' },
  { day: 605, title: "20 Months Hero", description: "You're inspiring others to quit by your example.", type: 'motivational' },
  { day: 635, title: "21 Months Champion", description: "Your lungs and heart are near non-smoker levels.", type: 'motivational' },
  { day: 665, title: "22 Months Strong", description: "Every day smoke-free adds years to your life.", type: 'motivational' },
  { day: 695, title: "23 Months Victory", description: "Just one month away from 2 years!", type: 'motivational' },
  { day: 730, title: "2 Years Smoke-Free!", description: "Your circulation and lung health are close to a non-smoker's. Truly free!", type: 'motivational' }
];

// Combined and sorted achievements
export const allAchievements = [...healingAchievements, ...motivationalAchievements]
  .sort((a, b) => a.day - b.day);

// Get next unachieved milestone
export const getNextAchievement = (currentDays: number): Achievement | null => {
  return allAchievements.find(achievement => achievement.day > currentDays) || null;
};

// Get all unlocked achievements
export const getUnlockedAchievements = (currentDays: number): Achievement[] => {
  return allAchievements.filter(achievement => achievement.day <= currentDays);
};