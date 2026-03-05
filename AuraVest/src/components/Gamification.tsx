'use client';

import { Trophy, Flame, Target, TrendingUp, Award, Zap, Crown } from 'lucide-react';

export default function Gamification() {
  const achievements = [
    { id: 1, icon: Trophy, title: 'First Trade', desc: 'Complete your first trade', unlocked: true, color: 'text-yellow-500' },
    { id: 2, icon: Flame, title: '7-Day Streak', desc: 'Trade for 7 days straight', unlocked: true, color: 'text-orange-500' },
    { id: 3, icon: Target, title: 'Portfolio Master', desc: 'Reach $100K portfolio', unlocked: true, color: 'text-purple-500' },
    { id: 4, icon: TrendingUp, title: 'Profit Maker', desc: 'Earn 10% returns', unlocked: false, color: 'text-green-500' },
    { id: 5, icon: Crown, title: 'Diamond Hands', desc: 'Hold for 30 days', unlocked: false, color: 'text-blue-500' },
    { id: 6, icon: Zap, title: 'Speed Trader', desc: 'Complete 100 trades', unlocked: false, color: 'text-cyan-500' },
  ];

  const streak = {
    current: 7,
    best: 12,
  };

  const level = {
    current: 5,
    progress: 68,
    next: 6,
  };

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <div className="bg-gradient-to-br from-crimson-600 to-white rounded-xl p-6 text-black">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">Level {level.current}</h3>
            <p className="text-sm opacity-70">{level.progress}% to Level {level.next}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-black/10 backdrop-blur-sm flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
        </div>
        <div className="w-full bg-black/10 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${level.progress}%` }}
          />
        </div>
      </div>

      {/* Streak Counter */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h4 className="font-semibold text-sm">Current Streak</h4>
          </div>
          <p className="text-3xl font-bold text-orange-500">{streak.current} days</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h4 className="font-semibold text-sm">Best Streak</h4>
          </div>
          <p className="text-3xl font-bold text-yellow-500">{streak.best} days</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Achievements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-lg border transition-all ${
                  achievement.unlocked
                    ? 'border-primary/20 bg-primary/5 hover:scale-105'
                    : 'border-border bg-muted/50 opacity-50 grayscale'
                }`}
              >
                {achievement.unlocked && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <Icon className={`w-8 h-8 ${achievement.color} mb-2`} />
                <p className="font-semibold text-xs mb-1">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">{achievement.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Daily Challenges</h3>
        <div className="space-y-3">
          {[
            { task: 'Complete 3 trades', progress: 2, total: 3, reward: '50 XP' },
            { task: 'Check portfolio', progress: 1, total: 1, reward: '25 XP' },
            { task: 'Read 2 articles', progress: 0, total: 2, reward: '30 XP' },
          ].map((challenge, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{challenge.task}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {challenge.reward}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {challenge.progress}/{challenge.total}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
