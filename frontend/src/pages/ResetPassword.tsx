import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Invalid or missing password reset token.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
     const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()[\]{}|\\;:'",.<>/~`_+-=]).{6,}$/;
    
    e.preventDefault();

    // frontend validation
    if (!password || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if(regex.test(password) === false){
        toast.error(
        "Password must contain uppercase, lowercase, number, and special character"
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) toast.error(data.message || "Password reset failed.");

      toast.success("Password updated successfully!");
      navigate("/login"); // redirect to login
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] text-white">
      <Toaster />
      <div className="bg-[#111] p-8 rounded-md shadow-lg border border-gray-600 w-[90%] max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">
          Reset Your Password
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New password"
            className="p-2 rounded bg-[#1a1a1a] border border-gray-500 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="p-2 rounded bg-[#1a1a1a] border border-gray-500 text-white"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className={`mt-2 bg-[#09a5d0] px-3 py-2 rounded font-semibold ${
              loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#0abeef] transition cursor-pointer"
            }`}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
