import React from 'react';
import AnimatedContent from '../../AnimatedContent';

interface SceneButtonProps {
  showUpload: boolean;
  onClick: () => void;
}

const SceneButton: React.FC<SceneButtonProps> = ({ showUpload, onClick }) => {
  if (showUpload) return null;
  
  return (
    <AnimatedContent
      distance={100}
      direction="horizontal"
      reverse={true}
      config={{ tension: 80, friction: 20 }}
      initialOpacity={0.2}
      animateOpacity={true}
      scale={1.1}
      threshold={0.2}
      delay={0}
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-12 w-40 items-center justify-center rounded-button border border-purple-600 bg-transparent px-6 text-purple-600 transition-colors duration-300 hover:bg-purple-600 hover:text-white"
      >
        <span className="bg-gradient-to-r from-blue-500 to-white bg-clip-text text-xl font-bold text-transparent">
          Scene
        </span>
      </button>
    </AnimatedContent>
  );
};

export default SceneButton;
