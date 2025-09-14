import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, BellOff, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NotificationSettings = () => {
  const {
    isSupported,
    permission,
    settings,
    requestPermission,
    updateSettings,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      // Show success feedback
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-primary" />
          <span className="font-medium">Notifications</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {permission === 'denied' && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        </div>
      )}

      {permission === 'default' && (
        <div className="p-3 bg-muted/50 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            Enable notifications to get reminders and celebrate your progress!
          </p>
          <Button
            onClick={handlePermissionRequest}
            size="sm"
            className="bg-primary hover:bg-primary-light"
          >
            <Bell className="w-4 h-4 mr-2" />
            Enable Notifications
          </Button>
        </div>
      )}

      {isOpen && permission === 'granted' && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Notification Settings</CardTitle>
            <CardDescription className="text-xs">
              Customize when and how you receive notifications
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Daily Check-in */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="daily-checkin" className="text-sm font-medium">
                  Daily Check-in Reminders
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get reminded to check in each day
                </p>
              </div>
              <Switch
                id="daily-checkin"
                checked={settings.dailyCheckin}
                onCheckedChange={(checked) => 
                  updateSettings({ dailyCheckin: checked })
                }
              />
            </div>

            {/* Check-in Time */}
            {settings.dailyCheckin && (
              <div className="space-y-2">
                <Label htmlFor="checkin-time" className="text-sm font-medium">
                  Reminder Time
                </Label>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="checkin-time"
                    type="time"
                    value={settings.checkinTime}
                    onChange={(e) => updateSettings({ checkinTime: e.target.value })}
                    className="w-32"
                  />
                </div>
              </div>
            )}

            {/* Milestone Reminders */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="milestone-reminders" className="text-sm font-medium">
                  Milestone Celebrations
                </Label>
                <p className="text-xs text-muted-foreground">
                  Celebrate when you reach achievements
                </p>
              </div>
              <Switch
                id="milestone-reminders"
                checked={settings.milestoneReminders}
                onCheckedChange={(checked) => 
                  updateSettings({ milestoneReminders: checked })
                }
              />
            </div>

            {/* Streak Reminders */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="streak-reminders" className="text-sm font-medium">
                  Streak Encouragement
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get motivational messages about your progress
                </p>
              </div>
              <Switch
                id="streak-reminders"
                checked={settings.streakReminders}
                onCheckedChange={(checked) => 
                  updateSettings({ streakReminders: checked })
                }
              />
            </div>

            {/* Achievement Unlocks */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="achievement-unlocks" className="text-sm font-medium">
                  Achievement Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when you unlock new achievements
                </p>
              </div>
              <Switch
                id="achievement-unlocks"
                checked={settings.achievementUnlocks}
                onCheckedChange={(checked) => 
                  updateSettings({ achievementUnlocks: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationSettings;
