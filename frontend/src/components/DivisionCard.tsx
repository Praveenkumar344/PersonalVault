import { useState } from "react";
import PasswordForm from "./PasswordForm.tsx";
import PasswordTable from "./PasswordTable.tsx";
import type { Division, PasswordEntry } from "../types/index.ts";
import ConfirmDialog from "./ConfirmDialog.tsx";
import api from "../api.ts";
import { Toaster } from "sonner";
interface Props {
  division: Division;
  removeDivision: (id: number) => void;
  updateDivision: (id: number, updatedDivision: Division) => void;
}

export default function DivisionCard({
  division,
  removeDivision,
  updateDivision,
}: Props) {
  const [showForm, setShowForm] = useState(true);

  // for confirmation dialog
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);
const addPassword = async (entry: PasswordEntry | Omit<PasswordEntry, "id">) => {
  let updatedCredentials = [...(division.credentials ?? [])];

  const isEditing = "id" in entry && updatedCredentials.some(p => p.id === entry.id);

  let updatedEntry: PasswordEntry;
  if (isEditing) {
    // Replace the old one
    updatedCredentials = updatedCredentials.map(p =>
      p.id === entry.id ? { ...p, ...entry } : p
    );

    // Call API update endpoint (you could reuse the delete + add logic if no update route)
    await api.post("/api/dashboard/update", {
      divisionName: division.name,
      site: entry.site,
      username: entry.username,
      password: entry.password,
    });
  } else {
    // Create new entry
    updatedEntry = { id: Date.now(), ...entry };
    updatedCredentials.push(updatedEntry);

    await api.post("/api/dashboard/update", {
      divisionName: division.name,
      site: entry.site,
      username: entry.username,
      password: entry.password,
    });
  }

  const updated: Division = {
    ...division,
    credentials: updatedCredentials,
  };

  updateDivision(division.id, updated);
};


  const deletePassword = (id: number) => {
    const target = division.credentials.find((p) => p.id === id);
    if (!target) return;

    // ask for confirmation first
    setConfirmMessage(`Delete credential for "${target.site}" from "${division.name}"?`);
    setConfirmAction(() => async () => {
      await api.delete("/api/dashboard/deleteCredential", {
        data: {
          divisionName: division.name,
          site: target.site,
        },
      });

      const updated: Division = {
        ...division,
        credentials: division.credentials.filter((p) => p.id !== id),
      };

      updateDivision(division.id, updated);
      setConfirmAction(null);
    });
  };

  const deleteDivisionWithConfirm = () => {
    setConfirmMessage(`Delete entire division "${division.name}" and all its credentials?`);
    setConfirmAction(() => async () => {
      await api.delete("/api/dashboard/deleteDivision", {
        data: { divisionName: division.name },
      });
      removeDivision(division.id);
      setConfirmAction(null);
    });
  };

  const togglePasswordForm = () => setShowForm(!showForm);

  return (
    <div className="flex flex-col shadow-[#ffffff] shadow-[0_0_2px_2px_rgba(0,0,0,0.5)] rounded-md overflow-hidden mb-2 mr-2">
      <Toaster />
      <div className="bg-amber-50 pt-1"></div>
      <div className="bg-[#1a1a1a] rounded-b-md p-4 h-full">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">{division.name}</h2>
          <div className="flex gap-2">
            {showForm && (
              <button
                onClick={togglePasswordForm}
                className="text-sm bg-[#09a5d0] px-2 py-1 rounded hover:bg-[#0abeef] transition cursor-pointer"
              >
                Add password
              </button>
            )}
            <button
              onClick={deleteDivisionWithConfirm}
              className="text-sm bg-[#ff4d4d] px-2 py-1 rounded hover:bg-[#ff1a1a] transition cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>

        {!showForm && (
          <PasswordForm onSave={addPassword} toggleForm={togglePasswordForm} />
        )}

        <PasswordTable
          passwords={division.credentials || []}
          onSave={addPassword}
          onDelete={deletePassword}
        />
      </div>

      {confirmAction && (
        <ConfirmDialog
          message={confirmMessage}
          onConfirm={confirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
