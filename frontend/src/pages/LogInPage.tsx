import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import { useNavigate } from "react-router-dom";
const Login = () => {
  // 1. State for the input type (true = text, false = password)
  const [showPassword, setShowPassword] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Optional: State for the password value
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  // 2. Function to toggle the password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data.message || "Login failed");

      if (data.require2FASetup) {
        // first-time user → show QR code
        navigate("/setup-2fa");
      } else {
        // login success without 2FA (if temporarily disabled)
        toast.success("Logged in successfully!");
        navigate("/verify-2fa", { state: { email, password } });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message);
    }
  };
  const handleForgotPassword = async () => {
    // const emailInput = prompt("Enter your registered email:");
    // if (!emailInput) return;
    if(!email.trim()){
      toast.error("Enter the Email in the Email field before forgot password  ")
      return
    }
    try {
       toast.success("Sending email for resetting password");
      const res = await fetch(
        "http://localhost:5000/api/auth/request-password-change",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email }),
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to send reset email.");

      toast.success("Password reset link sent! Check your inbox.");
    } catch (err: any) {
      console.error("Forgot password error:", err);
      toast.error(err.message || "Something went wrong.");
    }
  };

  useEffect(() => {
    if (password.length > 0 && email.length > 0) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [email, password]);
  return (
    <div>
      <Toaster />
      <div
        id="register-bg"
        className="relative w-full h-screen overflow-hidden"
      >
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
          {/* <VantaBackground /> */}
          {/* <div className="absolute inset-0 h-full w-full bg-[#0e0e0e] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [bg-size:16px_16px] mask]"></div> */}
          <div className="absolute inset-0 h-full w-full bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#111_50%,transparent_100%)]"></div>
        </div>

        {/* Foreground Layer */}
        <div className="relative z-10 flex items-center justify-center h-full w-[80%] md:w-full m-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className=" text-white backdrop-blur-md bg-black/5 rounded-xl p-10  border shadow-amber-50 border-white/80 shadow-[0_0_10px_rgba(0,0,0,0.3)]">
              <img
                src="/pv_logo.png"
                alt="logo"
                className="w-16 h-18 mx-auto mb-4"
              />
              <h1 className=" text-lg md:text-2xl font-bold font-mono">
                Welcome to Personal Vault
              </h1>
              <p className="mb-5 text-gray-500 font-mono">LogIn to continue</p>
              <form
                className="flex flex-col gap-4"
                action="submit"
                method="post"
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-2 rounded-md border border-white/80 bg-transparent text-white"
                />
                {/* password */}
                <div className="p-2 rounded-md border border-white/80 bg-transparent flex flex-row justify-between items-center text-white focus-within:ring-1 focus-within:ring-offset-0 focus-within:ring-white">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className=" w-full bg-transparent outline-none text-white"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="cursor-pointer pr-1 "
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <button
                  className={`mt-4 p-2 rounded-md bg-white/95 text-gray-800 font-bold  
          ${
            showLogin
              ? "opacity-100 cursor-pointer  hover:-translate-y-0.5"
              : "opacity-50 "
          }`}
                  onClick={login}
                  disabled={!showLogin}
                >
                  Log In
                </button>
              </form>
              <button
                onClick={handleForgotPassword}
                className="my-2 underline text-gray-500 hover:text-gray-200 cursor-pointer font-mono"
              >
                Forgot Password
              </button>
              <div className=" text-gray-500 font-mono border-t pt-2">
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    navigate("/register");
                  }}
                  className="text-white underline cursor-pointer"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
