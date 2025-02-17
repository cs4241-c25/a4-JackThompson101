import React from 'react';

const Login = () => {
    const handleGitHubLogin = () => {
        window.location.href = "http://localhost:3001/auth/github";
      };
      

  return (
    <div
      className="flex flex-col items-center justify-center text-center bg-[#222] text-white m-0 p-5 min-h-screen"
      style={{ fontFamily: "'Archivo Black', Arial, sans-serif" }}
    >
      <img
        src="https://pngimg.com/uploads/barbell/barbell_PNG16360.png"
        className="w-20 mb-4"
        alt="Barbell"
      />
      <header>
        <h1
          id="header"
          className="text-[#ff0000] mb-2 font-bold"
          style={{ textShadow: '2px 2px 4px black' }}
        >
          1 Rep Max Tracker - Login
        </h1>
      </header>
      <button
        onClick={handleGitHubLogin}
        className="px-3 py-2 rounded font-bold transition duration-300 bg-[#ff0000] text-black cursor-pointer hover:bg-[#cc0000] hover:scale-105"
      >
        Login with GitHub
      </button>
    </div>
  );
};

export default Login;
