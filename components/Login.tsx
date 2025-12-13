import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // Defaults based on the Swagger screenshot provided in requirements
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('1234567890');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call the actual API
      await api.login(email, password);
      onLogin(); // Navigate to dashboard on success
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
        
        {/* Left Side Text */}
        <div className="mb-12 md:mb-0 md:max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Welcome to the <br />
            Crowd Management System
          </h1>
        </div>

        {/* Right Side Login Card */}
        <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-primary-darker py-8 flex justify-center items-center">
            <div className="flex items-center gap-2 text-white text-2xl font-bold">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-radio-tower">
                 <path d="M4.9 16.1C3.1 14.3 2 11.8 2 9c0-2.8 1.1-5.3 2.9-7.1"/>
                 <path d="M9.1 11.9c-1.1-1.1-1.8-2.6-1.8-4.3 0-1.7.7-3.2 1.8-4.3"/>
                 <circle cx="12" cy="9" r="2"/>
                 <path d="M12 2v20"/>
                 <path d="M20 22v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
               </svg>
               kloudspot
            </div>
          </div>

          {/* Login Form */}
          <div className="p-8 pt-10">
            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Email ID *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-gray-500 uppercase">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors pr-10"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-xs italic bg-red-50 p-2 rounded border border-red-100">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white font-medium py-3 rounded hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                {isLoading ? 'Authenticating...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 text-white/50 text-sm">
        Kloudspot - Test Task (UI Engineering)
      </div>
    </div>
  );
};

export default Login;