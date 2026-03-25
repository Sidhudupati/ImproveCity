import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/themeStore';
import { RiMoonFill, RiSunFill } from 'react-icons/ri';

export default function ThemeSwitcher() {
  const { theme, toggle } = useThemeStore();

  const toggleTheme = useCallback(() => {
    toggle();
  }, [toggle]);

  const isDark = theme === 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="relative overflow-hidden transition-all hover:scale-105"
    >
      {isDark ? (
        <RiSunFill className="h-[1.2rem] w-[1.2rem] text-amber-500 rotate-0 scale-100 transition-all" />
      ) : (
        <RiMoonFill className="h-[1.2rem] w-[1.2rem] text-slate-700 dark:text-slate-300 rotate-0 scale-100 transition-all" />
      )}
    </Button>
  );
}