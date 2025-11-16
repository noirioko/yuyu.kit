# YuyuToon - Day/Night Theme Specification

## Galaxy Color Palette
```javascript
const galaxyColors = {
  deepSpace: '#101c29',
  midnight: '#0a1c3d',
  cosmicBlue: '#2868c6',
  nebulaSky: '#91d2f4',
  stardustPurple: '#cba2ea',
  mysticViolet: '#3f3381',
  twilight: '#131f5a'
};
```

---

## Theme Toggle Implementation

### State Management
```javascript
const [theme, setTheme] = useState('night'); // 'day' or 'night'

// Toggle button in sidebar (top right of header)
<button onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}>
  {theme === 'night' ? '☀️' : '🌙'}
</button>
```

---

## 🌙 NIGHT MODE (Default)

### Background
```css
background: linear-gradient(to bottom right, #0a1c3d, #101c29)
```

### Sidebar
```css
background: linear-gradient(to bottom, #0a1c3d, #131f5a)
border-right: 1px solid #2868c6
text: white / white opacity variations
```

### Main Content Area
```css
background: transparent (shows main gradient)
```

### Cards/Components
```css
background: rgba(255, 255, 255, 0.05) (white with 5% opacity)
backdrop-filter: blur(10px) (glassmorphism!)
border: 1px solid [galaxy accent color per section]
text: white
```

### Galaxy Banner
```css
background: linear-gradient(135deg, 
  #101c29 0%, 
  #0a1c3d 25%, 
  #131f5a 50%, 
  #3f3381 75%, 
  #2868c6 100%
)
```
- 30 animated star dots (white, random positions, pulse animation)
- 3 nebula clouds (large blurred circles: #cba2ea, #91d2f4, #2868c6)
- Text: white with drop-shadow

### Buttons
- Primary: `background: #2868c6`
- Secondary: `background: #cba2ea`
- Accent: `background: #91d2f4` with dark text

---

## ☀️ DAY MODE

### Background
```css
background: linear-gradient(to bottom right, #f8fafc, #e2e8f0)
/* Tailwind: from-slate-50 to-slate-200 */
```

### Sidebar
```css
background: white
border-right: 1px solid #e2e8f0 (slate-200)
text: #0f172a (slate-900) / slate variations

/* Active section highlight */
background: linear-gradient(135deg, #91d2f4, #2868c6)
text: white
```

### Main Content Area
```css
background: transparent (shows light gradient)
```

### Cards/Components
```css
background: white
border: 1px solid [galaxy accent color per section]
text: slate-900
box-shadow: subtle shadow for depth
```

### Galaxy Banner (Lighter Version!)
```css
background: linear-gradient(135deg,
  #91d2f4 0%,   /* lighter blue */
  #2868c6 25%,
  #cba2ea 50%,  /* purple */
  #91d2f4 75%,
  #2868c6 100%
)
```
- Same 30 star dots but WHITE with more opacity (0.8)
- Nebula clouds lighter: #cba2ea, #91d2f4 with less blur
- Text: white with stronger drop-shadow for readability

### Buttons
- Primary: `background: #2868c6` (same!)
- Secondary: `background: #cba2ea` (same!)
- Accent: `background: #91d2f4` with dark text (same!)

**Key: Galaxy accent colors stay the same in both modes!**

---

## Component-Specific Accent Colors

### By Section (same in both modes!)
- **Garden**: Primary accent `#91d2f4` (nebula sky blue)
- **Cast**: Primary accent `#cba2ea` (stardust purple)
- **Vault**: Primary accent `#2868c6` (cosmic blue)
- **Crew**: Primary accent `#cba2ea` (stardust purple)
- **Chronicle**: Primary accent `#2868c6` (cosmic blue)
- **Palette**: Primary accent `#3f3381` (mystic violet)
- **Seeds**: Primary accent `#91d2f4` (nebula sky)

These accent colors are used for:
- Card borders
- Status badges
- Section headers
- Interactive elements

---

## Galaxy Banner Implementation Details

### HTML Structure
```jsx
<div className="banner-container">
  {/* Gradient background */}
  <div className="banner-gradient">
    {/* Stars layer */}
    <div className="stars-layer">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="star"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.3,
            animationDuration: `${Math.random() * 3 + 2}s`
          }}
        />
      ))}
    </div>
    
    {/* Nebula clouds */}
    <div className="nebula-cloud purple" />
    <div className="nebula-cloud blue" />
    <div className="nebula-cloud cyan" />
  </div>
  
  {/* Content overlay */}
  <button className="change-banner-btn">Change banner</button>
  <div className="banner-title">
    <h2>My Webtoon Project</h2>
    <p>Last updated 2 hours ago</p>
  </div>
</div>
```

### CSS/Tailwind Classes
```css
/* Banner container */
.banner-container {
  position: relative;
  height: 208px; /* 52 in Tailwind (h-52) */
  overflow: hidden;
}

/* Stars */
.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: pulse;
}

@keyframes pulse {
  0%, 100% { opacity: var(--star-opacity); }
  50% { opacity: calc(var(--star-opacity) * 0.3); }
}

/* Nebula clouds */
.nebula-cloud {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}

.nebula-cloud.purple {
  width: 160px;
  height: 160px;
  top: 40px;
  right: 80px;
  background: #cba2ea;
  opacity: 0.3;
}

.nebula-cloud.blue {
  width: 192px;
  height: 192px;
  bottom: 40px;
  left: 40px;
  background: #91d2f4;
  opacity: 0.25;
}

.nebula-cloud.cyan {
  width: 144px;
  height: 144px;
  top: 50%;
  left: 50%;
  background: #2868c6;
  opacity: 0.2;
}

/* Change banner button */
.change-banner-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  /* Glassmorphism in night mode */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  /* Or in day mode */
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Title overlay */
.banner-title {
  position: absolute;
  bottom: 24px;
  left: 32px;
}

.banner-title h2 {
  color: white;
  font-size: 1.875rem; /* text-3xl */
  font-weight: 700;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.banner-title p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem; /* text-sm */
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
```

---

## Quick Theme Comparison Table

| Element | Night Mode | Day Mode |
|---------|-----------|----------|
| **Main BG** | Dark gradient (#0a1c3d → #101c29) | Light gradient (slate-50 → slate-200) |
| **Sidebar BG** | Dark gradient (#0a1c3d → #131f5a) | White |
| **Sidebar Text** | White | Slate-900 |
| **Card BG** | Glass (white 5% + blur) | White solid |
| **Card Text** | White | Slate-900 |
| **Banner BG** | Dark galaxy gradient | Light galaxy gradient |
| **Accent Colors** | **Same galaxy colors!** | **Same galaxy colors!** |
| **Borders** | Galaxy accent + transparency | Galaxy accent solid |

---

## Implementation Notes for Claude Code

1. **Create a theme context:**
```javascript
const ThemeContext = createContext();

function App() {
  const [theme, setTheme] = useState('night');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <YuyuToonWiki />
    </ThemeContext.Provider>
  );
}
```

2. **Use conditional classes:**
```javascript
const { theme } = useContext(ThemeContext);

<div className={theme === 'night' 
  ? 'bg-gradient-to-br from-[#0a1c3d] to-[#101c29]'
  : 'bg-gradient-to-br from-slate-50 to-slate-200'
}>
```

3. **Or use CSS variables (cleaner!):**
```javascript
// Set CSS variables based on theme
useEffect(() => {
  if (theme === 'night') {
    document.documentElement.style.setProperty('--bg-main', 'linear-gradient(...)');
    document.documentElement.style.setProperty('--text-primary', '#ffffff');
    // etc...
  } else {
    document.documentElement.style.setProperty('--bg-main', 'linear-gradient(...)');
    document.documentElement.style.setProperty('--text-primary', '#0f172a');
    // etc...
  }
}, [theme]);
```

4. **Save theme preference to localStorage:**
```javascript
useEffect(() => {
  localStorage.setItem('yuyutoon-theme', theme);
}, [theme]);
```

5. **Banner gradient should update based on theme:**
```javascript
const bannerGradient = theme === 'night'
  ? 'linear-gradient(135deg, #101c29 0%, #0a1c3d 25%, #131f5a 50%, #3f3381 75%, #2868c6 100%)'
  : 'linear-gradient(135deg, #91d2f4 0%, #2868c6 25%, #cba2ea 50%, #91d2f4 75%, #2868c6 100%)';
```

---

## Critical Reminders

- ✨ Galaxy accent colors NEVER change between modes
- 🌙 Night mode = dark backgrounds, light text
- ☀️ Day mode = light backgrounds, dark text, WHITE sidebar
- 🎨 Banner has stars + nebula in BOTH modes (just different gradients)
- 💫 Glassmorphism (backdrop-blur) only in night mode
- 🔄 Theme toggle button in sidebar header (sun/moon icon)
- 💾 Remember user's theme choice in localStorage

---

**The goal:** Beautiful galaxy aesthetic that works in both light and dark environments, with those gorgeous cosmic colors always shining through! 🌌✨