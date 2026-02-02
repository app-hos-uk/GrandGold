import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Admin analytics - returns mock data. Wire to real aggregation in production. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30days';

  const now = new Date();
  const days = range === '7days' ? 7 : range === '90days' ? 90 : range === 'year' ? 365 : 30;

  const count = Math.min(Math.ceil(days / 30), 12);
  const revenueData = Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    const rev = 3200000 + Math.random() * 1500000 + i * 80000;
    const ord = Math.floor(200 + Math.random() * 150 + i * 15);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: Math.round(rev),
      orders: ord,
    };
  });

  const metrics = {
    totalRevenue: 45200000,
    totalOrders: 3847,
    avgOrderValue: 11750,
    newUsers: 423,
    revenueChange: 12.5,
    ordersChange: 8.2,
  };

  const categoryData = [
    { name: 'Necklaces', value: 35, revenue: 15800000 },
    { name: 'Earrings', value: 25, revenue: 11200000 },
    { name: 'Rings', value: 22, revenue: 9900000 },
    { name: 'Bracelets', value: 12, revenue: 5400000 },
    { name: 'Others', value: 6, revenue: 2700000 },
  ];

  const topProducts = [
    { name: 'Traditional Kundan Necklace Set', sales: 156, revenue: 2886000 },
    { name: 'Solitaire Engagement Ring', sales: 98, revenue: 2401000 },
    { name: 'Diamond Studded Jhumkas', sales: 134, revenue: 1051900 },
    { name: 'Temple Design Choker', sales: 67, revenue: 1976500 },
    { name: 'Classic Gold Bangle Set', sales: 89, revenue: 1112500 },
  ];

  return NextResponse.json({
    success: true,
    data: {
      range,
      metrics,
      revenueData,
      categoryData,
      topProducts,
    },
  });
}
