# OwnerDashboard - Think Different

A modern, responsive web application inspired by Apple's iconic "Think Different" campaign. Built with the latest web technologies and design systems.

## Features

- **Modern UI/UX**: Sleek design with gradient backgrounds, glassmorphism effects, and smooth animations
- **Fully Responsive**: Optimized for all screen sizes (mobile, tablet, desktop)
- **Dark Mode Ready**: Built-in support for light and dark themes
- **Animated Components**: Smooth transitions using Framer Motion
- **Accessible**: Built with Radix UI primitives for accessibility
- **Type-safe**: Structured component design with proper prop handling

## Tech Stack

- **React 18** - Latest React with hooks
- **Vite** - Next-generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Production-ready motion library
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Beautiful & consistent icon set
- **CVA** - Class Variance Authority for component variants

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd OwnerDashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:5173
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
OwnerDashboard/
├── src/
│   ├── components/
│   │   └── ui/          # Reusable UI components
│   │       ├── button.jsx
│   │       └── card.jsx
│   ├── lib/
│   │   └── utils.js     # Utility functions
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles & Tailwind imports
├── public/              # Static assets
├── tailwind.config.js   # Tailwind configuration
├── vite.config.js       # Vite configuration
└── package.json         # Project dependencies
```

## Customization

### Adding New Components

Components follow the shadcn/ui pattern. Create new components in `src/components/ui/`:

```jsx
import { cn } from "@/lib/utils";

export const YourComponent = ({ className, ...props }) => {
  return (
    <div className={cn("base-classes", className)} {...props} />
  );
};
```

### Modifying Theme

Edit `src/index.css` to customize color schemes:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  /* Add your custom colors */
}
```

### Adding Animations

Use Framer Motion for animations:

```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Your content
</motion.div>
```

## Design System

The project uses a comprehensive design system with:

- **Color Tokens**: HSL-based color system for easy theme switching
- **Spacing**: Consistent spacing scale using Tailwind
- **Typography**: Responsive font sizes with proper hierarchy
- **Components**: Reusable, composable UI components
- **Animations**: Smooth, purposeful motion

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- **Fast Refresh**: Instant updates during development
- **Optimized Build**: Production builds are optimized and minified
- **Code Splitting**: Automatic code splitting for optimal loading
- **Tree Shaking**: Unused code is removed from production builds

## License

MIT

## Credits

Inspired by Apple's "Think Different" campaign (1997)

---

Built with React, Vite, Tailwind CSS, Framer Motion & Radix UI
