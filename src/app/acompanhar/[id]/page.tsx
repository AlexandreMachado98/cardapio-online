'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import TrackingView from '@/components/tracking/TrackingView';

export default function AcompanharPage() {
  const params = useParams();
  const id = params?.id as string;

  return <TrackingView id={id} />;
}
