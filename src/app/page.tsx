import AppLayout from '@/components/AppLayout';
import ProfileHeader from '@/app/ProfileHeader';
import ProfileSubscriptions from '@/app/ProfileSubscriptions';
import ProfileContents from '@/app/ProfileContents';

export const revalidate = 60; // ISR every 60 seconds

export default function Home() {
  return (
    <AppLayout>
      <ProfileHeader/>
      <ProfileSubscriptions/>
      <ProfileContents/>
    </AppLayout>
  );
}
