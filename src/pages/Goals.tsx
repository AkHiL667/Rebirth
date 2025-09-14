import { useState } from 'react';
import { useGoals } from '@/hooks/useGoals';
import { Plus, Target, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Goals = () => {
  const { goals, addGoal, removeGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalText, setGoalText] = useState('');
  const [goalImage, setGoalImage] = useState('');

  const predefinedImages = [
    { icon: '💰', label: 'Money/Savings', value: '💰' },
    { icon: '🏃‍♂️', label: 'Running/Fitness', value: '🏃‍♂️' },
    { icon: '❤️', label: 'Health/Heart', value: '❤️' },
    { icon: '🎯', label: 'Goals/Target', value: '🎯' },
    { icon: '🌟', label: 'Achievement', value: '🌟' },
    { icon: '🍎', label: 'Healthy Eating', value: '🍎' },
    { icon: '😊', label: 'Happiness', value: '😊' },
    { icon: '💪', label: 'Strength', value: '💪' },
  ];

  const handleAddGoal = () => {
    if (goalText.trim() && goalImage) {
      addGoal(goalText, goalImage);
      setGoalText('');
      setGoalImage('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Goals</h2>
          <p className="text-muted-foreground">
            Personal motivations to stay smoke-free
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6 bg-primary hover:bg-primary-light text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Add Personal Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalText">Goal Description</Label>
                <Input
                  id="goalText"
                  placeholder="e.g., Save ₹4,000 for vacation"
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Choose an Icon</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {predefinedImages.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setGoalImage(item.value)}
                      className={`p-3 rounded-lg border-2 text-2xl transition-all hover:scale-105 ${
                        goalImage === item.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddGoal}
                disabled={!goalText.trim() || !goalImage}
                className="w-full bg-primary hover:bg-primary-light text-primary-foreground"
              >
                Add Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Add your first personal goal to stay motivated!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="relative p-4 bg-card rounded-2xl shadow-soft border border-border hover-lift"
              >
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-80 hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
                
                <div className="text-center">
                  <div className="text-3xl mb-3">{goal.image}</div>
                  <p className="text-sm font-medium text-foreground">
                    {goal.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;