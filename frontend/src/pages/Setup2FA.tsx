import { useEffect, useState } from "react";
import {  useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Setup2FA = () => {
  const [qrCode, setQrCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/generate-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        //   body: JSON.stringify({ email: state.email }),
        });
        if (!res.ok) throw new Error("Failed to generate QR code");
        const data = await res.json();
        console.log(data);
        setQrCode(data.qrCodeUrl);
      } catch {
        toast.error("Failed to generate QR code");
      }
    };
    fetchQR();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h2 className="text-3xl mb-4 font-mono text-center">Set up Two-Factor Authentication</h2>
      <p className="text-red-500 font-bold tracking-widest text-lg">Please Do not save or share this QR code with anyone</p>
      <p className="pb-2 text-lg">Scan the QR code below with your authenticator app</p>
      <p className="pb-4 italic">{"[ Eg: Google Authenticator, Microsoft Authenticator, etc.. ]"}</p>
      {qrCode ? (
        <img src={qrCode} alt="2FA QR Code" className="border-2 border-white rounded-md mb-4 h-[200px] w-[200px]" />
      ) : (
        <p>Loading QR Code...</p>
      )}
      <button
        onClick={() => navigate("/verify-2fa", { state: { email:"" } })}
        className="p-2 rounded-md bg-white text-black font-bold hover:scale-105"
      >
        Continue
      </button>
    </div>
  );
};

export default Setup2FA;
