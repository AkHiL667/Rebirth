// ─── Motivational Notification Messages ─────────────────────
// 200 unique messages across 8 categories

export interface NotificationMessage {
  text: string;
  category: 'identity' | 'discipline' | 'self-control' | 'family' | 'gym' | 'money' | 'recovery' | 'focus';
}

export const notifications: NotificationMessage[] = [
  // ═══════════════════════════════════════════════════════════
  // IDENTITY (40)
  // ═══════════════════════════════════════════════════════════
  { text: "You didn't start Rebirth to count days. You started it to take back control.", category: 'identity' },
  { text: "The man you were six months ago wouldn't recognise you. Keep going.", category: 'identity' },
  { text: "You're not quitting smoking. You're becoming someone who doesn't smoke.", category: 'identity' },
  { text: "Every decision today is a vote for the person you're becoming.", category: 'identity' },
  { text: "You're not fixing yourself. You're building yourself from scratch.", category: 'identity' },
  { text: "The old version of you was comfortable. This version is dangerous.", category: 'identity' },
  { text: "You chose the harder path. That's exactly why it's working.", category: 'identity' },
  { text: "Stop trying to prove them wrong. Start proving yourself right.", category: 'identity' },
  { text: "You're 23 and rebuilding your entire life. Most people never even start.", category: 'identity' },
  { text: "Identity isn't given. It's forged through hundreds of boring, disciplined days.", category: 'identity' },
  { text: "You don't need motivation. You need to remember who you decided to become.", category: 'identity' },
  { text: "The version of you that smoked, procrastinated, and drifted — he's dead. Honour that.", category: 'identity' },
  { text: "Self-made means no one is coming to save you. And you don't need saving.", category: 'identity' },
  { text: "Your past doesn't define you. Your next 24 hours do.", category: 'identity' },
  { text: "You're not recovering. You're evolving.", category: 'identity' },
  { text: "People change when the pain of staying the same exceeds the pain of change. You chose change.", category: 'identity' },
  { text: "Being self-made isn't a title. It's a daily practice.", category: 'identity' },
  { text: "You're engineering your own life now. No bugs allowed.", category: 'identity' },
  { text: "The gap between who you are and who you want to be closes with action, not intention.", category: 'identity' },
  { text: "Nobody handed you a blueprint. You're writing your own.", category: 'identity' },
  { text: "Your transformation isn't loud. It's the quiet war you win every morning.", category: 'identity' },
  { text: "Rebirth isn't an app. It's the standard you hold yourself to.", category: 'identity' },
  { text: "You didn't come this far to only come this far.", category: 'identity' },
  { text: "The strongest steel is forged in the hottest fire. You're in the fire right now.", category: 'identity' },
  { text: "At 23, most people are lost. You're building.", category: 'identity' },
  { text: "Character is what you do when no one is tracking your streak.", category: 'identity' },
  { text: "The world doesn't owe you anything. That's your advantage — you expect nothing and build everything.", category: 'identity' },
  { text: "You don't have a backup plan because you don't need one.", category: 'identity' },
  { text: "Comfort was killing you slowly. Discomfort is making you.", category: 'identity' },
  { text: "Your identity is no longer negotiable. You set the standard.", category: 'identity' },
  { text: "You're not the guy who quits anymore. Full stop.", category: 'identity' },
  { text: "Every hard choice you make today is an investment in who you'll be at 30.", category: 'identity' },
  { text: "The mirror doesn't show your discipline. Your results will.", category: 'identity' },
  { text: "You're an engineer. You solve problems. Your life is just the biggest project.", category: 'identity' },
  { text: "The person who built this app is the same person strong enough to follow through.", category: 'identity' },
  { text: "Your name will mean something. Keep building.", category: 'identity' },
  { text: "Quiet confidence. Loud results. That's your style now.", category: 'identity' },
  { text: "You stopped asking for permission to change. That's when everything shifted.", category: 'identity' },
  { text: "The old habits are gone. The new identity stays.", category: 'identity' },
  { text: "When they ask how you changed, they won't understand — because they never fought the war you're fighting.", category: 'identity' },

  // ═══════════════════════════════════════════════════════════
  // DISCIPLINE (40)
  // ═══════════════════════════════════════════════════════════
  { text: "Discipline is choosing between what you want now and what you want most.", category: 'discipline' },
  { text: "You don't have to feel like it. You just have to do it.", category: 'discipline' },
  { text: "The house won't rebuild itself. Win today.", category: 'discipline' },
  { text: "Future stability is built from ordinary disciplined days.", category: 'discipline' },
  { text: "Nobody sees today's battle. Everyone sees tomorrow's results.", category: 'discipline' },
  { text: "Show up. Even when it's boring. Especially when it's boring.", category: 'discipline' },
  { text: "Motivation got you started. Systems keep you moving.", category: 'discipline' },
  { text: "Your daily routine is your architecture. Design it with intent.", category: 'discipline' },
  { text: "Consistency is not exciting. That's why most people can't do it.", category: 'discipline' },
  { text: "One good day means nothing. A hundred good days changes your life.", category: 'discipline' },
  { text: "Discipline looks like boredom to people who've never built anything.", category: 'discipline' },
  { text: "Skip one day and it becomes two. Then a week. Then who you were before.", category: 'discipline' },
  { text: "The schedule doesn't care about your feelings. Follow it.", category: 'discipline' },
  { text: "You're not grinding for today. You're compounding for the next decade.", category: 'discipline' },
  { text: "Every shortcut has a hidden tax. Pay the full price upfront.", category: 'discipline' },
  { text: "Do the hard thing first. Everything else gets easier after that.", category: 'discipline' },
  { text: "Your standards should scare you a little. That means they're high enough.", category: 'discipline' },
  { text: "Small wins stack. Don't underestimate the power of showing up.", category: 'discipline' },
  { text: "The day you don't feel like training is the most important day to train.", category: 'discipline' },
  { text: "Progress doesn't announce itself. It reveals itself after months of silence.", category: 'discipline' },
  { text: "Wake up with intent. Sleep with satisfaction. Repeat.", category: 'discipline' },
  { text: "Your alarm is the first test of discipline every day. Pass it.", category: 'discipline' },
  { text: "Average effort produces average results. You decided to be above average.", category: 'discipline' },
  { text: "The compound effect doesn't care if you noticed it. It's working regardless.", category: 'discipline' },
  { text: "Discipline is a muscle. The more you use it, the stronger it gets.", category: 'discipline' },
  { text: "If it were easy, everyone would do it. You're not everyone.", category: 'discipline' },
  { text: "Routine isn't a prison. It's the foundation of freedom.", category: 'discipline' },
  { text: "Don't negotiate with the version of you that wants to skip today.", category: 'discipline' },
  { text: "Results are just receipts for work already done.", category: 'discipline' },
  { text: "Your future self is watching you right now through your choices.", category: 'discipline' },
  { text: "Be so consistent that people think you're obsessed. Let them.", category: 'discipline' },
  { text: "Every 'I'll do it tomorrow' is a withdrawal from your future.", category: 'discipline' },
  { text: "Discipline isn't punishment. It's respect for the life you want.", category: 'discipline' },
  { text: "Stop waiting for perfect conditions. Start in chaos.", category: 'discipline' },
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", category: 'discipline' },
  { text: "Ten minutes of focused work beats two hours of distracted noise.", category: 'discipline' },
  { text: "Champions are built in the off-season. This is your off-season.", category: 'discipline' },
  { text: "The best day to start was yesterday. The second best is now.", category: 'discipline' },
  { text: "Every action either builds the future or repeats the past. Choose wisely.", category: 'discipline' },
  { text: "The scoreboard doesn't care about excuses. Neither should you.", category: 'discipline' },

  // ═══════════════════════════════════════════════════════════
  // SELF CONTROL (30)
  // ═══════════════════════════════════════════════════════════
  { text: "A craving lasts minutes. Your character lasts longer.", category: 'self-control' },
  { text: "That cigarette won't solve anything. You know this already.", category: 'self-control' },
  { text: "The urge is temporary. The regret is permanent.", category: 'self-control' },
  { text: "Your brain is lying to you. It wants comfort, not progress.", category: 'self-control' },
  { text: "Every time you resist, you rewire your brain. Literally.", category: 'self-control' },
  { text: "You don't need a cigarette. You need to sit with the discomfort.", category: 'self-control' },
  { text: "The craving is just your old identity trying to pull you back.", category: 'self-control' },
  { text: "Three deep breaths. Walk away. The moment will pass.", category: 'self-control' },
  { text: "Nicotine didn't give you anything. It took everything and charged you for it.", category: 'self-control' },
  { text: "The hardest battles are the ones nobody knows you're fighting.", category: 'self-control' },
  { text: "You're not depriving yourself. You're freeing yourself.", category: 'self-control' },
  { text: "Every craving defeated is a rep for your willpower.", category: 'self-control' },
  { text: "You already survived the worst cravings. Today's is nothing.", category: 'self-control' },
  { text: "Your lungs are healing right now. Don't interrupt the process.", category: 'self-control' },
  { text: "One cigarette won't undo your progress. But it will undo your trust in yourself.", category: 'self-control' },
  { text: "The voice saying 'just one' is the same voice that kept you addicted.", category: 'self-control' },
  { text: "Impulse control separates builders from destroyers. Which are you today?", category: 'self-control' },
  { text: "Every second of resistance builds neural pathways for strength.", category: 'self-control' },
  { text: "You're stronger than a chemical. Prove it again today.", category: 'self-control' },
  { text: "Smoking was never a choice. It was a chain. You broke it.", category: 'self-control' },
  { text: "Your body is recovering. Your mind just needs to catch up.", category: 'self-control' },
  { text: "Don't let five minutes of weakness erase months of strength.", category: 'self-control' },
  { text: "The discomfort you feel right now is the price of transformation.", category: 'self-control' },
  { text: "Replace the craving with a push-up. Watch what happens.", category: 'self-control' },
  { text: "Addictions thrive in boredom. Stay busy. Stay building.", category: 'self-control' },
  { text: "You controlled nothing when you smoked. Now you control everything.", category: 'self-control' },
  { text: "Your willpower is a finite resource. Spend it on what matters.", category: 'self-control' },
  { text: "Temptation is a test, not a sentence. Pass it.", category: 'self-control' },
  { text: "The version of you that reaches for a cigarette no longer exists.", category: 'self-control' },
  { text: "Every craving you beat today makes tomorrow's easier. Stack them.", category: 'self-control' },

  // ═══════════════════════════════════════════════════════════
  // FAMILY (20)
  // ═══════════════════════════════════════════════════════════
  { text: "Your family doesn't need your excuses. They need your consistency.", category: 'family' },
  { text: "Every rupee saved from cigarettes goes toward their future too.", category: 'family' },
  { text: "Your parents sacrificed so you could build. Don't waste it.", category: 'family' },
  { text: "The best thing you can give your family is a version of you that's in control.", category: 'family' },
  { text: "They won't always understand your journey. But they'll benefit from your results.", category: 'family' },
  { text: "Being responsible isn't glamorous. It's necessary.", category: 'family' },
  { text: "Your family is watching. Not to judge — to hope.", category: 'family' },
  { text: "The stability you're building now will protect them for decades.", category: 'family' },
  { text: "You're not just changing for yourself. You're changing the trajectory of your entire family.", category: 'family' },
  { text: "A healthy you is the greatest gift your family will ever receive.", category: 'family' },
  { text: "Your parents didn't raise you to be ordinary. Rise to that.", category: 'family' },
  { text: "The house needs a pillar. You're becoming it.", category: 'family' },
  { text: "Think about the dinner table ten years from now. Build that reality today.", category: 'family' },
  { text: "They believed in you before you believed in yourself. Honour that.", category: 'family' },
  { text: "Responsibility isn't a burden. It's proof that someone depends on your strength.", category: 'family' },
  { text: "Your siblings look up to you whether you know it or not.", category: 'family' },
  { text: "One day they'll tell stories about how you turned everything around.", category: 'family' },
  { text: "Family doesn't need a hero. They need someone who shows up every day.", category: 'family' },
  { text: "The sacrifices you make now will echo through generations.", category: 'family' },
  { text: "Protect them with your discipline. Shield them with your growth.", category: 'family' },

  // ═══════════════════════════════════════════════════════════
  // GYM (20)
  // ═══════════════════════════════════════════════════════════
  { text: "The gym doesn't care about your mood. Show up anyway.", category: 'gym' },
  { text: "Every set is a conversation with your future body.", category: 'gym' },
  { text: "Skipping the gym today won't kill you. But the habit of skipping will.", category: 'gym' },
  { text: "You're not training for aesthetics. You're training for war.", category: 'gym' },
  { text: "The iron doesn't lie. It doesn't flatter. It just tells you where you stand.", category: 'gym' },
  { text: "Legs day isn't optional. Neither is becoming the best version of yourself.", category: 'gym' },
  { text: "Your body is the only machine you can't replace. Maintain it.", category: 'gym' },
  { text: "Progressive overload applies to life too. Add weight. Keep growing.", category: 'gym' },
  { text: "The pump fades. The discipline stays.", category: 'gym' },
  { text: "An hour in the gym pays dividends for the other 23.", category: 'gym' },
  { text: "Soreness is just evidence that you showed up yesterday.", category: 'gym' },
  { text: "Your PR today was your impossible six months ago.", category: 'gym' },
  { text: "Train like someone who respects the body they're rebuilding.", category: 'gym' },
  { text: "The gym is the one place where suffering is productive.", category: 'gym' },
  { text: "A strong body houses a strong mind. Build both.", category: 'gym' },
  { text: "Rest days are earned, not defaulted to.", category: 'gym' },
  { text: "You don't need a perfect program. You need consistent effort.", category: 'gym' },
  { text: "The weights don't get lighter. You get stronger.", category: 'gym' },
  { text: "Physical strength is the foundation of mental resilience.", category: 'gym' },
  { text: "The hardest rep is the one you almost didn't do. That's the one that counts.", category: 'gym' },

  // ═══════════════════════════════════════════════════════════
  // MONEY (20)
  // ═══════════════════════════════════════════════════════════
  { text: "Every cigarette you didn't buy is money in your future.", category: 'money' },
  { text: "Financial freedom starts with small daily choices. You're making them.", category: 'money' },
  { text: "Save like your life depends on it. Because your freedom does.", category: 'money' },
  { text: "Broke is temporary. Poor mindset is permanent. You have neither.", category: 'money' },
  { text: "Track every rupee. What gets measured gets managed.", category: 'money' },
  { text: "The money you wasted on cigarettes could have been an emergency fund by now.", category: 'money' },
  { text: "Wealth isn't built in a day. It's built in a thousand disciplined days.", category: 'money' },
  { text: "Spend on assets, not addictions.", category: 'money' },
  { text: "Your bank account is a scoreboard for your discipline.", category: 'money' },
  { text: "At 23, compound interest is your greatest weapon. Start now.", category: 'money' },
  { text: "Financial stability isn't luck. It's engineering. You're an engineer.", category: 'money' },
  { text: "Every unnecessary expense is a vote against your future.", category: 'money' },
  { text: "The lifestyle you want in five years requires the savings habits you build today.", category: 'money' },
  { text: "Money follows value. Create value.", category: 'money' },
  { text: "Your skills are your earning potential. Sharpen them daily.", category: 'money' },
  { text: "Rich isn't a number. It's the freedom to say no to things that don't matter.", category: 'money' },
  { text: "Stop spending money to impress people who don't matter.", category: 'money' },
  { text: "Every skill you learn is an asset that can't be taken from you.", category: 'money' },
  { text: "Build multiple income streams. One job is a single point of failure.", category: 'money' },
  { text: "The gap between your income and spending is your opportunity.", category: 'money' },

  // ═══════════════════════════════════════════════════════════
  // RECOVERY (15)
  // ═══════════════════════════════════════════════════════════
  { text: "Recovery isn't linear. Bad days don't erase good weeks.", category: 'recovery' },
  { text: "You didn't relapse by having a craving. You relapse by acting on it.", category: 'recovery' },
  { text: "Healing is uncomfortable. That's how you know it's working.", category: 'recovery' },
  { text: "Your lungs have been healing since day one. Your mind is catching up.", category: 'recovery' },
  { text: "Progress isn't always visible. Trust the process even when results hide.", category: 'recovery' },
  { text: "The withdrawal symptoms are temporary. The freedom is permanent.", category: 'recovery' },
  { text: "Every day smoke-free is a day your body thanks you in ways you can't see.", category: 'recovery' },
  { text: "You're not just quitting a habit. You're healing a decade of damage.", category: 'recovery' },
  { text: "Setbacks are data, not verdicts. Learn and move.", category: 'recovery' },
  { text: "The brain fog clears. The energy returns. Give it time.", category: 'recovery' },
  { text: "You survived 100% of your worst days. Your track record is perfect.", category: 'recovery' },
  { text: "Recovery is the most selfish and selfless thing you'll ever do.", category: 'recovery' },
  { text: "Some days you'll feel invincible. Other days you'll barely hold on. Both count.", category: 'recovery' },
  { text: "Your body is rebuilding cell by cell. You just need to not interfere.", category: 'recovery' },
  { text: "The hardest part isn't quitting. It's staying quit when life gets hard.", category: 'recovery' },

  // ═══════════════════════════════════════════════════════════
  // FOCUS (15)
  // ═══════════════════════════════════════════════════════════
  { text: "Your phone is a tool, not a pacifier. Use it with intent.", category: 'focus' },
  { text: "Deep work isn't a luxury. It's the only work that compounds.", category: 'focus' },
  { text: "Distractions don't knock. They sneak in through habits.", category: 'focus' },
  { text: "Protect your attention like you protect your money.", category: 'focus' },
  { text: "One focused hour beats eight distracted ones.", category: 'focus' },
  { text: "Social media shows you everyone else's highlight reel. Build your own.", category: 'focus' },
  { text: "The ability to sit with boredom is a superpower in the attention economy.", category: 'focus' },
  { text: "Delete the apps that steal your time and give nothing back.", category: 'focus' },
  { text: "Focus on the process. The outcome takes care of itself.", category: 'focus' },
  { text: "Your attention is your most valuable currency. Stop giving it away for free.", category: 'focus' },
  { text: "Multitasking is a myth. Do one thing. Do it completely.", category: 'focus' },
  { text: "The difference between busy and productive is intention.", category: 'focus' },
  { text: "Every notification is someone else's priority. Guard yours.", category: 'focus' },
  { text: "The work you avoid is usually the work that matters most.", category: 'focus' },
  { text: "Clear mind. Clear desk. Clear purpose. That's the formula.", category: 'focus' },
];

// ─── Utility: get random non-repeating notification ─────────
const LAST_INDEX_KEY = 'rebirth_last_notification_index';

export function getRandomNotification(): NotificationMessage {
  const lastIndex = parseInt(localStorage.getItem(LAST_INDEX_KEY) || '-1', 10);
  let index: number;
  do {
    index = Math.floor(Math.random() * notifications.length);
  } while (index === lastIndex && notifications.length > 1);
  localStorage.setItem(LAST_INDEX_KEY, index.toString());
  return notifications[index];
}

export function getRandomNotificationByCategory(category: NotificationMessage['category']): NotificationMessage {
  const filtered = notifications.filter(n => n.category === category);
  if (filtered.length === 0) return getRandomNotification();
  return filtered[Math.floor(Math.random() * filtered.length)];
}
