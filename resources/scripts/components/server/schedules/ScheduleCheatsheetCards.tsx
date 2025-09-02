const ScheduleCheatsheetCards = () => {
    return (
        <>
            <div className={`md:w-1/2 h-full bg-zinc-600`}>
                <div className={`flex flex-col`}>
                    <h2 className={`py-4 px-6 font-bold`}>Ejemplos</h2>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>*/5 * * * *</div>
                        <div className={`w-1/2`}>cada 5 minutos</div>
                    </div>
                    <div className={`flex py-4 px-6`}>
                        <div className={`w-1/2`}>0 */1 * * *</div>
                        <div className={`w-1/2`}>cada hora</div>
                    </div>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>0 8-12 * * *</div>
                        <div className={`w-1/2`}>rango de horas</div>
                    </div>
                    <div className={`flex py-4 px-6`}>
                        <div className={`w-1/2`}>0 0 * * *</div>
                        <div className={`w-1/2`}>una vez al día</div>
                    </div>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>0 0 * * MON</div>
                        <div className={`w-1/2`}>cada lunes</div>
                    </div>
                </div>
            </div>
            <div className={`md:w-1/2 h-full bg-zinc-600`}>
                <h2 className={`py-4 px-6 font-bold`}>Caracteres especiales</h2>
                <div className={`flex flex-col`}>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>*</div>
                        <div className={`w-1/2`}>cualquier valor</div>
                    </div>
                    <div className={`flex py-4 px-6`}>
                        <div className={`w-1/2`}>,</div>
                        <div className={`w-1/2`}>separador de lista de valores</div>
                    </div>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>-</div>
                        <div className={`w-1/2`}>valor de rango</div>
                    </div>
                    <div className={`flex py-4 px-6`}>
                        <div className={`w-1/2`}>/</div>
                        <div className={`w-1/2`}>valor de pasos</div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ScheduleCheatsheetCards;
