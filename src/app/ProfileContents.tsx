import ProfileProjects from '@/app/ProfileProjects';
import ProfileContentsTabBar from '@/app/ProfileContentsTabBar';
import ProfilePosts from '@/app/ProfilePosts';

export const tabs = [{
  key: 'posts',
  label: 'Posts',
  content: <ProfilePosts/>
}, {
  key: 'projects',
  label: 'Projects',
  content: <ProfileProjects/>
}];

export default function ProfileContents() {
  return <div className={'bg-white border-t'}>
    <ProfileContentsTabBar/>
    <div className={'bg-neutral-100'}>
      {tabs.map(tab => (
        <div key={tab.key} className={`hidden profile-tab profile-tab-${tab.key}`}>
          {tab.content}
        </div>
      ))}
    </div>
  </div>;
}
