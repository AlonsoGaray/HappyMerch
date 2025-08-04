interface DoneProps {
  titleFont: string;
  subtitleFont: string;
}

const Done = ({ titleFont, subtitleFont }: DoneProps) => {
  return (
    <>
      <img className="absolute top-0 right-0 w-80" src="/Asset_2.png" alt="asset_2" />
      <img className="absolute bottom-0 left-0 w-96" src="/Asset_3.png" alt="asset_3" />
      <div className="flex flex-col items-center justify-center w-full h-full z-10 text-center">
        <h1 className={`text-white text-3xl md:text-4xl font-extrabold leading-tight mb-2 drop-shadow-lg uppercase  ${titleFont}`}>
          ¡FELICIDADES!<br />TU DISEÑO ESTÁ LISTO
        </h1>
        <p className={`text-white text-xl font-medium opacity-90 max-w-md mx-auto ${subtitleFont}`}>
          Tu merch está listo para ti. Llévalo contigo y disfruta de tu creación, ¡es todo tuyo!
        </p>
      </div>
    </>
  );
};

export default Done;