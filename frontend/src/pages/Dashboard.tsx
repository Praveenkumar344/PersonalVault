import {  useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import DivisionCard from "../components/DivisionCard";
import UploadFile from "../components/HandlingFiles";
import { FaTrash } from "react-icons/fa";

import type { Division } from "../types";

export default function Dashboard() {
  const { logout } = useAuth();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [newDivision, setNewDivision] = useState("");
  const [username, setUsername] = useState("");
  const [showpass, setShowpass] = useState(true);

  // fetch vault from backend
  useEffect(() => {
    const fetchVault = async () => {
      try {
        const res = await api.get("/api/dashboard");
    console.log("Fetched divisions after adding:", res.data);
        setUsername(res.data.name);
        setDivisions(res.data.divisions || []);
      } catch (err: any) {
        if (err.response?.status === 401) logout();
      }
    };
    fetchVault();
  }, []);
useEffect(() => {
  console.log("Divisions updated:", divisions);
}, [divisions]);

  // add / update
  const addDivision = async (name: string) => {
    if (!name.trim()) return;
    await api.post("/api/dashboard/createdivision", { divisionName: name });
    const res = await api.get("/api/dashboard");
    setDivisions(res.data.divisions || []);
  };

  const removeDivision = async (id: number) => {
    const div = divisions.find((d) => d.id === id);
    if (!div) return;
    await api.delete("/api/dashboard/deleteDivision", {
      data: { divisionName: div.name },
    });
    setDivisions(divisions.filter((d) => d.id !== id));
  };

  const updateDivision = async (id: number, updatedDivision: Division) => {
    const old = divisions.find((d) => d.id === id);
    console.log("Updating division:", id, updatedDivision);
    if (!old) return;
    console.log("Old division data:", old);
    setDivisions((prev) =>
      prev.map((d) => (d.id === id ? updatedDivision : d))
    );
  };
  return (
    <div className=" relative min-h-screen bg-[#0a0a0a] text-white p-2 md:p-6">
      <div
        className="absolute inset-0 z-0 
              bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] 
              dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] 
              bg-size-[40px_40px]"
      ></div>

      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center 
              bg-white dark:bg-black 
              mask-[radial-gradient(ellipse_at_center,transparent_20%,black)]"
      ></div>

      <div className="max-w-5xl mx-auto z-10  relative">
        <div className="flex flex-row justify-start items-center mb-4">
          <img src="/pv_logo.png" alt="logo" className="w-10 h-12 mr-2" />
          <h1 className="text-lg md:text-3xl font-bold "> Personal Vault</h1>
          <button
            onClick={logout}
            className="ml-auto bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
        {/* Add new division input */}
        <p className="pl-1 pb-3 my-5 text-lg md:text-3xl font-bold">Welcome   {username}</p>
        <div className="flex flex-row gap-4 w-full justify-center text-center items-center mb-6"> 
          <button className={`text-2xl w-[150px] border-white border  rounded-2xl p-1 cursor-pointer ${showpass ? "bg-[#ffffff] text-black" : ""}`} onClick={() => setShowpass(true)}>Passwords</button>
          <button className={`text-2xl w-[150px] border-white border  rounded-2xl p-1 cursor-pointer ${!showpass ? "bg-[#ffffff] text-black" : ""}`} onClick={() => setShowpass(false)}>Files</button>
        </div>

        {showpass && <div className="p-2 md:p-5 rounded-2xl">
          <div className="flex gap-2 mb-6 flex-col sm:flex-row justify-center items-center">
            <input
              type="text"
              value={newDivision}
              onChange={(e) => setNewDivision(e.target.value)}
              placeholder="Add new division (e.g. Work)"
              className="flex-1 p-2 rounded bg-[#1f1f1f] border  border-gray-500 focus:outline-none focus:border-gray-200"
            />
            <button
              onClick={() => {
                if (newDivision.trim().length > 0) {
                  addDivision(newDivision);
                  setNewDivision("");
                }
              }}
              className="bg-[#09a5d0] px-4 py-2 rounded hover:bg-[#0abeef] transition cursor-pointer"
            >
              Add
            </button>
          </div>
          {/* Division list */}
          <div className="grid md:grid-cols-2 gap-4">
            {Array.isArray(divisions) && divisions.length > 0 ? (
              divisions.map((div) => (
                <DivisionCard
                  key={div.id}
                  division={div}
                  removeDivision={removeDivision}
                  updateDivision={updateDivision}
                />
              ))
            ) : (
              <p className="text-gray-400 text-center col-span-2">
                No divisions yet. Add one to get started.
              </p>
            )}
          </div>
        </div>}
      { !showpass && <UploadFile />}
      </div>
    </div>
  );
}
