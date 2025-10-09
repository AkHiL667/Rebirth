# 🌱 Rebirth - Your Smoke-Free Journey

A beautiful, modern Progressive Web App (PWA) designed to help you track your smoke-free journey with daily check-ins, achievements, and personalized goals. Built with React, TypeScript, and Tailwind CSS.

![Rebirth App](public/Rebirth_icon.png)

## ✨ Features

### 🎯 Core Functionality
- **Daily Streak Tracking**: Monitor your smoke-free days with beautiful visual progress
- **Daily Check-ins**: Simple one-click daily confirmation system
- **Achievement System**: Unlock milestones as you progress through your journey
- **Personal Goals**: Set and track custom goals to stay motivated
- **Custom Statistics**: Personalize your impact calculations (cigarettes avoided, money saved)
- **Custom Quit Date**: Set your actual quit date if you started before using the app

### 📱 Mobile-First PWA Experience
- **Installable App**: Download and install as a native app on your device
- **Offline Support**: Full functionality without internet connection
- **Push Notifications**: Daily reminders and milestone celebrations
- **Haptic Feedback**: Vibration feedback for all interactions
- **Gesture Navigation**: Swipe between pages for intuitive navigation
- **Pull-to-Refresh**: Refresh content by pulling down
- **Safe Area Support**: Optimized for notched devices (iPhone X+)

### 🎨 Beautiful Design
- **Glassmorphism UI**: Modern glass-like design with beautiful gradients
- **Smooth Animations**: GPU-accelerated animations for optimal performance
- **Dark Theme**: Easy on the eyes with customizable color schemes
- **Responsive Design**: Perfect on all screen sizes
- **Accessibility**: WCAG compliant with proper contrast and touch targets

### 🔧 Advanced Features
- **Data Persistence**: All data saved locally using localStorage
- **Service Worker**: Background sync and offline functionality
- **Notification Settings**: Customizable reminder preferences
- **Export/Import**: Data portability (coming soon)
- **Multi-language Support**: Ready for internationalization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser with PWA support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rebirth-app.git
   cd rebirth-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   ```
   http://localhost:8080
   ```

### Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory, ready for deployment.

## 📱 PWA Installation

### Desktop (Chrome, Edge, Safari)
1. Look for the install button in the address bar
2. Click "Install Rebirth" when prompted
3. The app will be added to your applications

### Mobile (iOS Safari, Android Chrome)
1. Open the app in your mobile browser
2. If you see an Install/Add to Home Screen prompt in the address bar/menu, use it
3. If the in‑app Install button is visible in Profile, tap it to trigger the native prompt
4. If no button is visible, use the Manual Installation steps below
5. The app will appear on your home screen

### Manual Installation
If automatic installation isn't available:
- **iOS**: Tap the share button → "Add to Home Screen"
- **Android**: Tap the menu (⋮) → "Add to Home Screen"

#### Why an in‑app Install button may not appear
- Modern browsers sometimes suppress the `beforeinstallprompt` event and show their own install UI (omnibox/menu)
- The app remains installable; use the browser UI described above
- In the Profile page, the Install button remains available and will either trigger the prompt (when supported) or guide you to install via the browser menu

## 🎯 Usage Guide

### First Time Setup
1. **Set Your Name**: Personalize your experience
2. **Set Quit Date**: Enter when you stopped smoking (or today's date)
3. **Customize Stats**: Set your daily cigarette consumption and cost
4. **Enable Notifications**: Allow daily reminders and celebrations

### Daily Routine
1. **Check In**: Tap the daily check-in button to confirm you stayed smoke-free
2. **View Progress**: See your streak, achievements, and impact statistics
3. **Set Goals**: Add personal goals to stay motivated
4. **Celebrate**: Unlock achievements as you reach milestones

### Customization
- **Profile Settings**: Update your name, quit date, and statistics
- **Notification Preferences**: Choose when and how you want reminders
- **Goal Management**: Add, edit, and complete personal goals
- **App Installation**: Download the app for better experience

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful, accessible component library
- **React Router**: Client-side routing
- **Lucide React**: Beautiful icon library

### PWA Features
- **Service Worker**: Offline functionality and background scheduling
- **Web App Manifest**: App installation and metadata
- **Notifications**: Daily reminders and milestone celebrations
- **Haptic Feedback**: Touch device vibration
- **Gesture Navigation**: Swipe and pull interactions

### State Management
- **React Hooks**: Custom hooks for different features
- **localStorage**: Client-side data persistence
- **Context API**: Global state management
- **React Query**: Server state management (ready for backend)

### Performance Optimizations
- **Code Splitting**: Lazy loading for better performance
- **Image Optimization**: Optimized assets and icons
- **Bundle Analysis**: Optimized bundle size
- **Service Worker Caching**: Smart caching strategies
- **GPU Acceleration**: Hardware-accelerated animations

## 📁 Project Structure

```
rebirth-app/
├── public/
│   ├── Rebirth_icon.png      # App icon
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── favicon.ico           # Favicon
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── DailyCheckin.tsx # Daily check-in component
│   │   ├── PWAInstallBanner.tsx
│   │   └── NotificationSettings.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── usePWA.ts        # PWA functionality
│   │   ├── useStreakTimer.ts # Streak calculations
│   │   ├── useHapticFeedback.ts # Vibration feedback
│   │   ├── useGestureNavigation.ts # Swipe navigation
│   │   └── useNotifications.ts # Push notifications
│   ├── pages/               # Page components
│   │   ├── Home.tsx         # Dashboard
│   │   ├── Achievements.tsx # Achievement gallery
│   │   ├── Goals.tsx        # Goal management
│   │   └── Profile.tsx      # User settings
│   ├── data/                # Static data
│   │   └── achievements.ts  # Achievement definitions
│   ├── lib/                 # Utilities
│   │   └── utils.ts         # Helper functions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## 🎨 Design System

### Color Palette
- **Primary**: Emerald green (#10b981) - Growth and health
- **Secondary**: Sky blue (#0ea5e9) - Trust and stability
- **Success**: Green (#22c55e) - Achievement and progress
- **Achievement**: Gold (#f59e0b) - Celebration and rewards
- **Background**: Dark theme with glassmorphism effects

### Typography
- **Headings**: Outfit font family - Modern and clean
- **Body**: Inter font family - Highly readable
- **Sizes**: Responsive typography scale

### Components
- **Glass Cards**: Frosted glass effect with subtle borders
- **Gradient Buttons**: Beautiful gradient backgrounds
- **Animated Counters**: Smooth number animations
- **Progress Rings**: Circular progress indicators
- **Toast Notifications**: Non-intrusive feedback messages

## 🔧 Configuration

### Environment Variables
Create a `.env` file for configuration:
```env
VITE_APP_NAME=Rebirth
VITE_APP_VERSION=1.0.0
VITE_PWA_ENABLED=true
```

### PWA Configuration
The PWA is configured in `public/manifest.json`:
- App name and description
- Icon sizes and purposes
- Theme colors
- Display mode
- Shortcuts and screenshots

### Service Worker
The service worker (`public/sw.js`) provides:
- Offline functionality and smart caching
- Background scheduling for local notifications (via messages from the app)
- Optional periodic background sync (browser support varies; falls back gracefully)
- Basic push handler (for future server‑driven push)
- Update handling and versioned caches

Notes:
- Background timers may be throttled by OS/browser when the app is closed. For guaranteed delivery while fully closed, integrate server push or alarm services.

## 📊 Data Management

### Local Storage
All user data is stored locally:
- User profile and settings
- Streak data and quit date
- Daily check-ins
- Personal goals
- Notification preferences
- Custom statistics

### Data Structure
```typescript
interface UserData {
  userName: string;
  quitDate: Date;
  customStats: {
    cigarettesPerDay: number;
    costPerCigarette: number;
  };
  dailyCheckins: CheckinData[];
  goals: Goal[];
  notificationSettings: NotificationSettings;
}
```

## 🚀 Deployment

### Static Hosting (Recommended)
Deploy to any static hosting service:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: `npm run build && gh-pages -d dist`
- **Firebase Hosting**: `firebase deploy`

### Server Requirements
- HTTPS required for PWA features
- Service worker support
- Push notification support
- Modern browser support

### Vercel / Netlify
- This app builds as a static site (`dist/`) and works well on Vercel/Netlify
- Ensure `sw.js` and `manifest.json` are served from the site root (default config already does this)

### Cache Busting
- The service worker uses versioned cache names in `public/sw.js`
- When static assets or caching strategy changes, bump the version to force updates

## 🧩 Troubleshooting

- I don’t see an Install button
  - Use the browser’s install UI (omnibox icon or menu → Install/Add to Home Screen)
  - Ensure HTTPS (or `localhost`) and that the tab isn’t private/incognito
  - Confirm that `/manifest.json` and `/sw.js` are reachable

- Notifications don’t appear while the app is closed
  - Local scheduled notifications depend on OS/browser background allowances
  - For reliable delivery while closed, integrate Push Notifications with a server; the worker includes a basic `push` handler

- Service worker changes don’t apply
  - Hard‑refresh, or close all app tabs and re‑open
  - On mobile PWA, swipe it away and reopen to activate updates

## 🔐 Permissions

- Notifications require user consent. If permission is “Denied”, re‑enable it in your browser/site settings.
- Background sync/periodic sync support varies by browser/OS and may be unavailable.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Test on multiple devices and browsers
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful component library
- **Tailwind CSS** for utility-first styling
- **Lucide** for beautiful icons
- **Vite** for fast development experience
- **React** team for the amazing framework

## 📞 Support

- **Email**: konda.akhil456@gmail.com
## 🔮 Roadmap

### Version 1.1
- [ ] Data export/import functionality
- [ ] Multiple language support
- [ ] Advanced statistics and charts
- [ ] Social sharing features

### Version 1.2
- [ ] Cloud sync with user accounts
- [ ] Community features
- [ ] Advanced goal templates
- [ ] Integration with health apps

### Version 2.0
- [ ] AI-powered insights
- [ ] Gamification elements
- [ ] Team challenges
- [ ] Professional counseling integration

---

**Made with ❤️ for your smoke-free journey**

*Remember: Every day smoke-free is a victory worth celebrating!* 🎉
