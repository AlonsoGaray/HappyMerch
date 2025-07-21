import { useNavigate } from "react-router-dom";
import { signOut } from "../lib/auth";
import FeedbackDialog from "./FeedbackDialog";
import { useState } from "react";

type NavBarProps = {
  onSave: (data: {
    name: string;
    email: string;
    comment: string;
    rating: number;
  }) => void;
};

const NavBar = ({ onSave }: NavBarProps) => {
  const navigate = useNavigate();
  const [isFeedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const handleSave = () => {
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmit = (data: {
    name: string;
    email: string;
    comment: string;
    rating: number;
  }) => {
    onSave(data);
    setFeedbackDialogOpen(false);
  };

  return (
    <>
      <nav className="flex w-full items-center justify-between bg-white shadow px-8 h-14">
        <img className="h-fit max-h-10" src="/Logo.svg" alt="logo" />
        <div className="flex items-center space-x-4">
          <button className="bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition">Nuevo</button>
          <button
            onClick={handleSave}
            className="bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition"
          >
            Guardar
          </button>
          <button
            className="bg-red-600 rounded-md px-4 py-2 text-base hover:bg-red-700 transition"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      <FeedbackDialog
        isOpen={isFeedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
};

export default NavBar; 