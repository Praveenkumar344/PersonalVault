import type { PasswordEntry } from "../types";
import { useState } from "react";
import { FaEye, FaEyeSlash, FaTrash, FaPen } from "react-icons/fa";
import {toast} from "sonner";
interface Props {
  passwords: PasswordEntry[];
  onDelete: (id: number) => void;
  onSave: (entry: Omit<PasswordEntry, "id">) => void; // optional, if you want to handle editing
}

export default function PasswordTable({ passwords, onDelete, onSave }: Props) {
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<number, boolean>
  >({});
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    id:0,
    site: "",
    username: "",
    password: "",
  });
  const toggleVisibility = (id: number) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.site || !form.username || !form.password) {
      toast.error("All fields are required.");
      return;
    }
    console.log("Submitting password form with data:", form);
    onSave(form);
    // onDelete(form.id);
    setForm({id:0, site: "", username: "", password: "" });
    
    setIsEditing(false);
  };

  if (!passwords || passwords.length === 0)
    return <p className="text-gray-400 text-sm">No passwords yet.</p>;

  return (
    <table className="w-full  table-fixed text-center text-sm mt-2 border-collapse">
      
      <thead>
        <tr className="text-gray-400 border-b border-gray-700">
          <th className="p-2">Site</th>
          <th className="p-2 px-3">Username</th>
          <th className="p-2">Password</th>
          <th className="p-2"></th>
        </tr>
      </thead>
      <tbody>
        {passwords.map((p) => {
          const isVisible = visiblePasswords[p.id] ?? false;

          return (
            <tr
              key={p.id}
              className="border-b border-gray-700 text-center hover:bg-gray-800 transition-colors"
            >
              <td className="truncate w-[31.66%] py-2 ">{p.site}</td>
              <td className="truncate w-[31.66%] py-2">{p.username}</td>
              <td className="w-[31.66%] py-2">
                <div className="flex justify-center items-center gap-2">
                  {isVisible ? (
                    <FaEyeSlash
                      className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors duration-200"
                      onClick={() => toggleVisibility(p.id)}
                    />
                  ) : (
                    <FaEye
                      className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors duration-200"
                      onClick={() => toggleVisibility(p.id)}
                    />
                  )}
                  <input
                    type={isVisible ? "text" : "password"}
                    value={p.password}
                    readOnly
                    className="bg-transparent w-auto text-center focus:outline-none"
                  />
                </div>
              </td>
              <td className=" ">
                <div className="flex justify-center items-center gap-3">
                  {isVisible ? (
                    <FaEyeSlash
                      className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors duration-200 "
                      onClick={() => toggleVisibility(p.id)}
                    />
                  ) : (
                    <FaEye
                      className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors duration-200 "
                      onClick={() => toggleVisibility(p.id)}
                    />
                  )}
                  {/* Edit button */}
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setForm({
                        id:p.id,
                        site: p.site,
                        username: p.username,
                        password: p.password,
                      });
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 cursor-pointer "
                    title="Edit"
                  >
                    <FaPen />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-red-500 hover:text-red-400 transition-colors duration-200 cursor-pointer"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
      {isEditing && (
        <div className="fixed inset-0 bg-transparent bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[#ffffff] text-black rounded-lg p-6 shadow-lg min-w-[280px] border-2 border-black">
            <p className="text-center mb-4">
              Enter your updated Credentials for <br />
              {form.site}
            </p>
            <div className="flex justify-center gap-4">
              <form onSubmit={handleSubmit}>
                <div className="flex gap-2 flex-col w-full">
                  <div>
                    <label className="mr-auto">USERNAME </label>
                    <input
                      placeholder="Username"
                      className="p-2 bg-[#a3a3a3] rounded flex-1 md:w-[33.33%]"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                    />
                  </div>
                    <div>
                      <label className="mr-auto">PASSWORD </label>
                                        <input
                      placeholder="Password"
                      type="text"
                      className="p-2 bg-[#a3a3a3] rounded flex-1 md:w-[33.33%] mb-2"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                       />
                    </div>
                </div>
                <button
                  type="submit"
                  className="bg-red-500 text-white px-4 py-1 mx-1 rounded hover:bg-red-600 transition cursor-pointer"
                >
                  save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);

                    setForm({ id:0,site: "", username: "", password: "" });
                  }}
                  className="bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400 transition cursor-pointer"
                >
                  cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </table>
  );
}
