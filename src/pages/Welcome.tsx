import { useGlobalData } from "@/contexts/AdminDataContext";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();
  const { data } = useGlobalData();

  return (
    <div className="relative flex flex-col items-center text-center justify-center gap-8 w-full h-dvh font-montserrat" 
      style={{
        background: data.config?.main_color,
      }}
    >
      <div className="flex flex-col gap-7 items-center">
        <span className={`text-white text-4xl font-bold ${data.config?.welcome_title_font}`} style={{ color: data.config?.welcome_title_color }}>PERSONALIZA EN VIVO, <br/> CREA SIN LÍMITES</span>
        {data.config?.logo_url && <img className="max-w-64" src={data.config.logo_url} alt="logo" />}
        <span className={`text-xl text-gray-200 ${data.config?.welcome_subtitle_font}`} style={{ color: data.config?.welcome_subtitle_color }}>Diseña tu merch a tu estilo, en tiempo real. <br/> Elige, edita y hazlo único en solo unos pasos</span>
      </div>
      <img className="max-w-2xl" src="/Welcome.png" alt="Products" />
      <button type="button" className={`p-4 text-white font-bold rounded cursor-pointer text-2xl ${data.config?.welcome_button_font}`} onClick={() => navigate("/edit")} style={{ background: data.config?.welcome_button_color, color: data.config?.welcome_button_text_color }}>¡MANOS A LA OBRA!</button>

      <img className="absolute top-0 right-0 w-80" src="/Asset_2.png" alt="asset_2" />
      <img className="absolute bottom-0 left-0 w-96" src="/Asset_3.png" alt="asset_3" />
    </div>
  );
};

export default Welcome;