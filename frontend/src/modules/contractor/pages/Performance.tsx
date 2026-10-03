import { PageHeader, Card } from '../components/ui';
import { useAuth } from '@/core/auth/useAuth';

export default function Performance() {
  const { session } = useAuth();
  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      <PageHeader title="My Performance" subtitle={session?.organization?.name || 'Organization not available'} />
      <Card className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
        No verified performance records are available yet.
      </Card>
    </div>
  );
}
