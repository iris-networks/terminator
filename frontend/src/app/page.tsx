'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { Layout } from '@/components/layout/Layout';

export default function HomePage() {
  return (
    <Layout>
      <ChatInterface />
    </Layout>
  );
}