import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
  icon?: LucideIcon;
  gradient?: boolean;
}

export function PageHeader({ title, description, badge, icon: Icon, gradient = true }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4"
    >
      {Icon && (
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {gradient ? <span className="text-gradient">{title}</span> : title}
          </h1>
          {badge && (
            <Badge variant="secondary" className="text-xs font-medium">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm md:text-base">{description}</p>
      </div>
    </motion.div>
  );
}