import { useNavigate } from "react-router-dom";
import { signOut } from "../lib/auth";
import { useGlobalData } from "@/contexts/AdminDataContext";

type NavBarProps = {
  onSave: (data: { name: string; email: string; comment: string; rating: number }) => void;
};

const NavBar = ({ onSave }: NavBarProps) => {
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
        <button className={`bg-[#9F9F9F] text-white rounded-md px-4 py-2 text-base cursor-pointer`}>
          Nuevo
        </button>

        <button onClick={() => onSave({ name: "", email: "", comment: "", rating: 0 })}
          className={`bg-[#9F9F9F] text-white rounded-md px-4 py-2 text-base cursor-pointer`}
        >
          Guardar
        </button>

        <button
          className={`bg-[#707070] rounded-md px-4 py-2 text-base cursor-pointer text-white ml-6`}
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
