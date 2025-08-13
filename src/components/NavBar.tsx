import { useNavigate } from "react-router-dom";
import { signOut } from "../lib/auth";
import { useGlobalData } from "@/contexts/AdminDataContext";

type NavBarProps = {
  onSave: (data: { name: string; email: string; comment: string; rating: number }) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
};

const NavBar = ({ onSave, onUndo, onRedo, canUndo = false, canRedo = false }: NavBarProps) => {
  const { data } = useGlobalData();
  const navigate = useNavigate();

  return (
    <nav className="flex w-full items-center justify-between bg-white shadow px-8 h-14">
      <div className="flex w-1/2 gap-6 h-fit">
        <img className="h-fit max-h-10" src="/Logo.svg" alt="logo" />
        {data.config?.logo_url && (
          <img className="h-fit max-h-10" src={data.config.logo_url} alt="logo marca" />
        )}
      </div>

      <div className="flex items-center space-x-4">
        <button
          className={`bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition ${data.config?.nav_button_font}`}
          style={{
            backgroundColor: data.config?.nav_btn_bg_color,
            color: data.config?.nav_btn_text_color,
          }}
        >
          Nuevo
        </button>

        {/* Undo/Redo buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-md px-3 py-2 text-base transition"
            style={{
              backgroundColor: canUndo
                ? data.config?.nav_btn_bg_color || "#f3f4f6"
                : "#d1d5db",
              color: data.config?.nav_btn_text_color || "#374151",
              cursor: canUndo ? "pointer" : "not-allowed",
            }}
            title="Deshacer (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="rounded-md px-3 py-2 text-base transition"
            style={{
              backgroundColor: canRedo
                ? data.config?.nav_btn_bg_color || "#f3f4f6"
                : "#d1d5db",
              color: data.config?.nav_btn_text_color || "#374151",
              cursor: canRedo ? "pointer" : "not-allowed",
            }}
            title="Rehacer (Ctrl+Y)"
          >
            ↷
          </button>
        </div>

        <button
          onClick={() => onSave({ name: "", email: "", comment: "", rating: 0 })}
          className={`bg-gray-100 rounded-md px-4 py-2 text-base hover:bg-gray-200 transition ${data.config?.nav_button_font}`}
          style={{
            backgroundColor: data.config?.nav_btn_bg_color,
            color: data.config?.nav_btn_text_color,
          }}
        >
          Guardar
        </button>

        <button
          className={`bg-red-600 rounded-md px-4 py-2 text-base hover:bg-red-700 transition ${data.config?.nav_button_font}`}
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
