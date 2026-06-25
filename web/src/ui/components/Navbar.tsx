import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md z-50">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center space-x-2">
          <i className="fas fa-music text-2xl bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"></i>
          <span className="text-lg font-bold text-white sm:text-xl">AudioShield</span>
        </div>
        <div className="hidden items-center space-x-8 md:flex">
          <a href="/" className="text-white hover:text-purple-500 transition-colors">主页</a>
          <a href="#how-it-works" className="text-white hover:text-purple-500 transition-colors">工作原理</a>
          <a href="#examples" className="text-white hover:text-purple-500 transition-colors">示例</a>
          <a href="#pricing" className="text-white hover:text-purple-500 transition-colors">定价</a>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden text-white transition-colors hover:text-purple-500 sm:inline">|</span>
          <button type="button" className="whitespace-nowrap rounded-button text-white transition-colors hover:text-purple-500">登录</button>
          <button type="button" className="whitespace-nowrap rounded-button bg-purple-600 px-3 py-2 font-bold text-white transition-colors hover:bg-purple-700 sm:px-4">注册</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
