import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { FaInfoCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext"; 

const Verify2FA = () => {
  const [code, setCode] = useState("");

  const { login } = useAuth(); 
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const [showVerifyButton, setShowVerifyButton] = useState(false);

  const isValidSixDigitNumber = (str: string) => {
    const regex = /^\d{6}$/;
    return regex.test(str);
  };
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // body: JSON.stringify({ email: state.email, code }),
        body: JSON.stringify({ otp: code }),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data.message);
      toast.success("2FA verified successfully!");
      login(data.accessToken, data.user||null);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  useEffect(() => {
    setShowVerifyButton(isValidSixDigitNumber(code));
  }, [code]);
  const reauth = async () => {
    try {
       await fetch("http://localhost:5000/api/auth/reauth",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",} );
      toast.success("Reauthentication email sent! Please check your inbox.");
      navigate("/login");
    } catch (err: any) {
      console.error("Reauth error:", err);
      toast.error(err.message);
    }
  };
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
              <h1 className="text-lg md:text-2xl font-bold font-mono text-center">
                Two factor Authentication
              </h1>
              <p className="mb-5 text-gray-500 font-mono">
                Enter the 6-digit code from your authenticator app
              </p>
              <form
                onSubmit={verifyCode}
                className="flex flex-col gap-4 items-center"
              >
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="p-2 rounded-md border border-white bg-transparent text-center text-white tracking-widest"
                />
                <button
                  className={`p-2 rounded-md ${
                    showVerifyButton
                      ? "bg-white cursor-pointer hover:scale-105"
                      : "bg-white/50 "
                  } text-black font-bold `}
                  disabled={!showVerifyButton}
                >
                  Verify
                </button>
              </form>
              <div className="mt-4 text-gray-500 font-mono border-t pt-2 flex flex-row justify-center items-center gap-2">
                <button
                  onClick={reauth}
                  className="text-gray-400 underline  cursor-pointer "
                >
                  Lost your authenticator app? Regenerate QR
                </button>
                <FaInfoCircle
                  className="text-gray-100 w-5 h-5"
                  onMouseEnter={() => setShowInfo(true)}
                  onMouseLeave={() => setShowInfo(false)}
                />

                {showInfo && (
                 <div
  className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 
    backdrop-blur-md bg-black text-white text-sm rounded-md 
    px-3 py-2 whitespace-normal shadow-lg z-10 
    
    w-[300px] sm:w-[400px] md:w-[500px] 
    transform transition-all duration-5000 ease-in-out 
    ${showInfo ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
>
  {"After clicking 'Regenerate QR', you will be redirected to the login page and receive a verification email. After verifying your email, log in again to get a new QR code."}
</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify2FA;
