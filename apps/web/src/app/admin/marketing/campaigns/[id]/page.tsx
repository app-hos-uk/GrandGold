'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Marketing', href: '/admin/marketing' },
          { label: id === 'new' ? 'New Campaign' : `Campaign ${id}` },
        ]}
      />
      <div className="mb-6">
        <Link
          href="/admin/marketing"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gold-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketing
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {id === 'new' ? 'New Campaign' : `Campaign ${id}`}
        </h1>
        <p className="text-gray-500">Campaign details and editing coming soon.</p>
      </div>
    </div>
  );
}
