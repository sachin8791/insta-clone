import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

export default function StoryViewer() {
  const [progress, setProgress] = useState(0);
  const [pause, setPause] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const duration = 5000; // 5 seconds

  useEffect(() => {
    if (isVisible && !pause) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const newProgress = (elapsedTime / duration) * 100;

        if (newProgress >= 100) {
          setIsVisible(false);
          setProgress(0);
          clearInterval(timer);
        } else {
          setProgress(newProgress);
        }
      }, 10);

      return () => clearInterval(timer);
    }
  }, [isVisible, pause]);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setIsVisible(true)} className="px-6 z-50 py-2">
        View Story
      </Button>

      {isVisible && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className=" h-4/5 max-w-md flex justify-center relative">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600 z-10">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Header */}
            <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 border-2 border-white">
                  <img src="/placeholder.svg" alt="User avatar" />
                </Avatar>
                <div className="text-white text-sm">
                  <span className="font-semibold">username</span>
                  <span className="ml-2 opacity-70">1h</span>
                </div>
              </div>
              <div className="flex items-center  gap-4">
                <Button variant="ghost" size="icon" className="text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                </Button>
                {/* {pause === true ? (
                  <Play
                    onClick={() => setPause(true)}
                    className="w-5 h-5 text-white"
                  />
                ) : (
                  <Pause
                    onClick={() => setPause(false)}
                    className="w-5 h-5 text-white"
                  />
                )} */}

                {pause === true && (
                  <Play
                    className="text-white cursor-pointer h-4 w-4"
                    onClick={() => setPause(false)}
                  />
                )}

                {pause === false && (
                  <Pause
                    onClick={() => setPause(true)}
                    className="w-5 h-5 cursor-pointer text-white"
                  />
                )}

                {/* Close button */}
                <button
                  onClick={() => setIsVisible(false)}
                  className=" text-white z-20"
                  aria-label="Close story"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Story Content */}
            <div className="relative aspect-[9/16]  bg-gradient-to-b from-sky-600 to-orange-500 overflow-hidden">
              {/* Snow Animation */}
              <div className="absolute inset-0 snow-container">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className="snow"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${Math.random() * 3 + 2}s`,
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                <div className="w-full flex flex-col items-center gap-2 max-w-sm">
                  <img
                    src="https://dfbtmrgmlxamkjbiccqo.supabase.co/storage/v1/object/public/profile-pics/post/1735097280911-IMG_6853.JPG"
                    alt="Snowy mountain landscape"
                    className="w-full h-auto"
                  />

                  <h1>Text Here</h1>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-4 right-4 flex gap-4">
                <Button variant="ghost" size="icon" className="text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                  </svg>
                </Button>
                <Button variant="ghost" size="icon" className="text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
