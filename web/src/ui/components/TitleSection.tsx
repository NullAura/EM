import React from 'react';
import AnimatedContent from '../../AnimatedContent';

interface TitleSectionProps {
  showUpload: boolean;
}

const TitleSection: React.FC<TitleSectionProps> = ({ showUpload }) => {
  return (
    <div 
      className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-700 text-center z-10" 
      style={{ 
        paddingTop: showUpload ? '40vh' : '60vh', 
        opacity: showUpload ? 0.7 : 1
      }}
    >
      <AnimatedContent
        distance={300}
        direction="vertical"
        reverse={true}
        config={{ tension: 80, friction: 20 }}
        initialOpacity={0.2}
        animateOpacity={true}
        scale={1.1}
        threshold={0.2}
      >
        <div className="absolute" style={{ top: '-40vh', left: '50%', transform: 'translateX(-50%)' }}>
          <h1 className="text-8xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-white bg-clip-text text-transparent whitespace-nowrap">Make UR Audio</h1>
          <h1 className="text-6xl font-semibold mb-8 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">Unlearnable</h1>
        </div>
      </AnimatedContent>
    </div>
  );
};

export default TitleSection; 