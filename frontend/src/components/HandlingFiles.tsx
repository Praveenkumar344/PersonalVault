import { useState, useEffect } from "react";
import api from "../api";
import { Toaster, toast } from "sonner";
import { FaDownload, FaTrash } from "react-icons/fa";
import ConfirmDialog from "./ConfirmDialog.tsx";

export default function UploadFile() {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<any[]>([]);

  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<
    null | (() => Promise<void>)
  >(null);

  const [dragActive, setDragActive] = useState(false);
  const MAX_SIZE_MB = 16;
  const fetchFiles = async () => {
    const res = await api.get("/api/files");

    console.log("Fetched files:", res.data);
    console.log("Fetched files insite:", res.data.files);
    setFiles(res.data.files);
  };
  useEffect(() => {
    console.log("Files state updated:", files);
  }, [files]); // runs every time `files` changes

  const handleUpload = async () => {
    if (!file) {
      toast.error("No file selected.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File size exceeds ${MAX_SIZE_MB} MB limit.`);
      setFile(null);

      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Uploaded successfully!");
      setFile(null);
      fetchFiles();
    } catch {
      toast.error("Upload failed.");
      setFile(null);
    }
  };

  

  const handleDownload = async (id: string) => {
    try {
      const res = await api.get(`/api/files/download/${id}`, {
        responseType: "blob", // Important to receive binary data
      });
      console.log(res.headers["content-disposition"]);
      // const blob = new Blob([res.data]);
      const blob = new Blob([res.data], { type: res.headers["content-type"] });

      const url = window.URL.createObjectURL(blob);

      // Extract filename from Content-Disposition header
      const contentDisposition = res.headers["content-disposition"];
      let filename = "downloaded-file";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }

      // Create temporary download link
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("File downloaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download file.");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    setFile(droppedFile || null);
    handleUpload();
  };
  return (
    <div className="bg-[#0d0d0d] pt-10 p-5 rounded-lg flex flex-col items-center">
      <Toaster />
      <div className="flex flex-col items-center">
        <input
          type="file"
          accept="*"
          id="file-upload"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <label
          htmlFor="file-upload"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full max-w-sm cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition mb-3 
        ${
          dragActive
            ? "border-blue-500 bg-blue-300 text-blue-500"
            : file
            ? "border-green-500 text-green-600"
            : "border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-400"
        }`}
        >
          {file ? file.name : "Click to choose a file or drag and drop"}
        </label>
      </div>
      <div className="pt-2">
        <button
          onClick={handleUpload}
          className="bg-[#09a5d0] px-4 py-2 rounded hover:bg-[#0abeef] transition cursor-pointer"
        >
          Upload File
        </button>
        <button
          className="bg-red-500 px-2 py-2 rounded hover:bg-red-600 transition ml-2 cursor-pointer"
          onClick={() => setFile(null)}
        >
          clear
        </button>
      </div>

      <ul className="mt-4 w-full text-white grid grid-cols-1 md:grid-cols-2 gap-4">
        {files &&
          files.map((f) => (
            <li
              key={f._id}
              className="flex flex-col justify-between border-2 border-white p-3 border-t-5 items-center my-2  m-auto  rounded-lg bg-[#1a1a1a] hover:bg-[#222222] transition"
            >
              <span title={f.fileName} className="p-5 w-100 text-center">
                {f.fileName.length > 20
                  ? f.fileName.slice(0, 20) + "..."
                  : f.fileName}
              </span>
              <div className="flex items-center my-2">
                <button
                  onClick={() => handleDownload(f._id)}
                  className="text-blue-400 hover:text-blue-600 hover:transition  hover:scale-130 px-2 cursor-pointer"
                >
                  <FaDownload />
                </button>
                <button
                  onClick={() => {
                    setConfirmMessage(`Delete "${f.fileName}"?`);
                    setConfirmAction(() => async () => {
                      try {
                        await api.delete(`/api/files/delete/${f._id}`);
                        toast.success("File deleted.");
                        fetchFiles();
                        setConfirmAction(null);
                      } catch {
                        toast.error("Delete failed.");
                        setConfirmAction(null);
                      }
                    });
                  }}
                  className="text-red-400 hover:text-red-600 hover:transition  hover:scale-130 cursor-pointer ml-2"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
      </ul>
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
