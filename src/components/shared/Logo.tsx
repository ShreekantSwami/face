import { APP_NAME } from '@/lib/constants';
import { CheckSquare } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export function Logo({ className, iconSize = 24, textSize = "text-xl" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CheckSquare size={iconSize} className="text-primary" />
      <span className={`font-bold ${textSize} text-foreground`}>{APP_NAME}</span>
    </div>
  );
}
