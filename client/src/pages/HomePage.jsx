import { Outlet } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import CommentSection from "../components/CommentSection";
import UploadUI from "../components/Upload";
import SeeFollows from "../components/SeeFollows";
import { useAuth } from "../Contexts/AuthContext";
import { useUi } from "../Contexts/UiContext";
import { useSocial } from "@/Contexts/SocialContext";
import { useComment } from "@/Contexts/CommentContext";
import StoryViewer from "@/components/Story";

function HomePage() {
  const { doComment, setDoComment, derivedPost } = useComment();
  const { isAuthenticated, setiIsAuthenticated } = useAuth();
  const { extend, setExtend, visibleUpload, setVisibleUpload } = useUi();
  const { followPopup, setFollowPopup, followArray } = useSocial();

  if (!isAuthenticated) return <p>Please first authenticate</p>;

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
      <SeeFollows
        followArray={followArray}
        setFollowPopup={setFollowPopup}
        followPopup={followPopup}
      />

      <StoryViewer />

      {/* Left Sidebar */}
      <LeftSidebar
        setVisibleUpload={setVisibleUpload}
        setiIsAuthenticated={setiIsAuthenticated}
      />

      {/* Main Content */}
      <main className="flex-1 w-full items-center justify-center md:ml-64 ml-0 border-r">
        <Outlet />
        {extend && (
          <CommentSection
            derivedPost={derivedPost}
            setDoComment={setDoComment}
            setExtend={setExtend}
          />
        )}
        {doComment && (
          <CommentSection
            derivedPost={derivedPost}
            setDoComment={setDoComment}
            setExtend={setExtend}
          />
        )}
        {visibleUpload && <UploadUI setVisibleUpload={setVisibleUpload} />}
      </main>
    </div>
  );
}

export default HomePage;
