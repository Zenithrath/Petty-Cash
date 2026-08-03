import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="px-5 py-4">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="mt-1.5 truncate text-xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
