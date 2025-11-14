import { useState } from "react";
import type { PasswordEntry } from "../types";
import { Toaster, toast } from "sonner";
interface PasswordFormProps {
  onSave: (entry: Omit<PasswordEntry, "id">) => void;
  toggleForm: () => void;
}

export default function PasswordForm({
  onSave,
  toggleForm,
}: PasswordFormProps) {
  const [form, setForm] = useState({
    site: "",
    username: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.site || !form.username || !form.password) {
      toast.error("All fields are required.");
      return;
    }
    console.log("Submitting password form with data:", form);
    onSave(form);
    setForm({ site: "", username: "", password: "" });
  };

  return (
    <div>
      <Toaster />

      <form
        onSubmit={handleSubmit}
        className="mb-3 bg-[#0f0f0f] p-3 rounded flex flex-col gap-2"
      >
        <div className="flex flex-col gap-2 md:flex-row w-full">
          <input
            placeholder="Site"
            className="p-2 bg-[#1a1a1a] rounded md:w-[33.33%] "
            value={form.site}
            onChange={(e) => setForm({ ...form, site: e.target.value })}
          />
          <input
            placeholder="Username"
            className="p-2 bg-[#1a1a1a] rounded flex-1 md:w-[33.33%]"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            placeholder="Password"
            type="password" 
            className="p-2 bg-[#1a1a1a] rounded flex-1 md:w-[33.33%]"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="flex flex-row justify-center">
          <button
            type="submit"
            className="mt-2 bg-[#09a5d0] m-1 px-3 py-1 rounded hover:bg-[#0abeef] transition cursor-pointer "
          >
            Save
          </button>
          <button
            type="button"
            onClick={toggleForm}
            className="mt-2 bg-[#ff4d4d] m-1 px-3 py-1 rounded hover:bg-[#ff1a1a] transition cursor-pointer "
          >
            close
          </button>
        </div>
      </form>
    </div>
  );
}
