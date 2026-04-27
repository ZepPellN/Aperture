import WikiLayout from '@/components/WikiLayout';
import LifeDashboard from '@/components/LifeDashboard';
import { loadLifeDashboard } from '@/lib/life-loader';

export const metadata = {
  title: 'Life — Aperture',
  description: 'Personal life system dashboard.',
};

export default async function LifePage() {
  const data = await loadLifeDashboard();
  return (
    <WikiLayout>
      <LifeDashboard data={data} />
    </WikiLayout>
  );
}
