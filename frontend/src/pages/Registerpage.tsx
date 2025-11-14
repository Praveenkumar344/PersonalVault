import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import { useNavigate } from "react-router-dom";
const Register = () => {
  // 1. State for the input type (true = text, false = password)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showcreateaccount, setshowcreateaccount] = useState(false);
  const [createAccountClicked, setCreateAccountClicked] = useState(false);

  // Optional: State for the password value
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 2. Function to toggle the password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  const isStrongPassword = (pwd: string) => {
    // At least 6 characters, one uppercase letter, one lowercase letter, one number, and one special character
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()[\]{}|\\;:'",.<>/~`_+-=]).{6,}$/;
    return regex.test(pwd);
  };
  const createAccount = async (e: any) => {
    e.preventDefault();
    if (
      name.trim() === "" ||
      email.trim() === "" ||
      password.trim() === "" ||
      confirmPassword.trim() === ""
    ) {
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (isStrongPassword(password) === false) {
      toast.error(
        "Password must contain uppercase, lowercase, number, and special character"
      );
      return;
    }
    try {
      setCreateAccountClicked(true);
      startTimer();
      toast.success("Creating account...");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );
      if (response.status !== 200) {
        const data = await response.json();
        toast.error(
          data.message || "Failed to create account. Please try again."
        );
        return;
      }
      toast.success("Account created! Please verify your email.");
    } catch (err) {
      console.log(err);
    }
  };
  const resendRequest = async () => {
    if (email.trim() === "") {
      toast.error("Please enter your email to resend verification.");
      return;
    }
    try {
      startTimer();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );
      if (response.status !== 200) {
        toast.error("Failed to resend verification email. Please try again.");
        return;
      }
      toast.success("Verification email resent! Please check your inbox.");
    } catch (err: any) {
      console.log(err);
      toast.error(err.message);
    }
  };

  const startTimer = () => {
    setTimeLeft(15);
    setIsRunning(true);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (
      password === confirmPassword &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      name.length > 0 &&
      email.length > 0
    ) {
      setshowcreateaccount(true);
    } else {
      setshowcreateaccount(false);
    }
  }, [name, email, password, confirmPassword]);
  return (
    <div>
      <Toaster />
      <div
        id="register-bg"
        className="relative w-full h-screen overflow-hidden"
      >
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
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
              <h1 className="text-lg md:text-2xl font-bold font-mono">
                Welcome to Personal Vault
              </h1>
              <p className="mb-5 text-gray-500 font-mono">
                Please register to continue
              </p>
              <form
                className="flex flex-col gap-4"
                action="submit"
                method="post"
              >
                <input
                  type="text"
                  placeholder="Username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="p-2 rounded-md border border-white/80 bg-transparent text-white"
                />
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
                {/* confirm password */}
                <div className="p-2 rounded-md border border-white/80 bg-transparent flex flex-row justify-between items-center text-white focus-within:ring-1 focus-within:ring-offset-0 focus-within:ring-white">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className=" w-full bg-transparent outline-none text-white"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="cursor-pointer pr-1 "
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <button
                  className={`mt-4 p-2 rounded-md bg-white/95 text-gray-800 font-bold  
          ${
            showcreateaccount
              ? "opacity-100 cursor-pointer  hover:-translate-y-0.5"
              : "opacity-50 "
          }`}
                  onClick={createAccount}
                >
                  Create Account
                </button>
              </form>
              {createAccountClicked && (
                <div className="mt-2 text-gray-500 font-mono ">
                  Resend email ? {timeLeft}s{" "}
                  <button
                    onClick={resendRequest}
                    disabled={isRunning}
                    className={`{ ${
                      !isRunning
                        ? "text-white underline cursor-pointer"
                        : "text-gray-500 "
                    }`}
                  >
                    Resend
                  </button>
                </div>
              )}
              <div className="mt-2 text-gray-500 font-mono border-t pt-2 ">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    navigate("/login");
                  }}
                  className="text-white underline cursor-pointer"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
