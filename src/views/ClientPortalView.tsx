import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types/auth';

interface ClientPortalViewProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToProfile?: () => void;
}

export function ClientPortalView({
  currentUser,
  onLogout,
  onNavigateToAdmin,
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToProfile,
}: ClientPortalViewProps) {
  // Accordion state for FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(0); // First FAQ open by default like in Figma

  // Hero Carousel State & Auto-play (Figma 2:27, 63:6, 63:7, 63:8)
  const [heroSlide, setHeroSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const heroSlides = [
    {
      num: '01',
      src: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
      caption: '01 / EL OFICIO ESTÁ EN LOS DETALLES.',
      alt: 'Mecánico de precisión trabajando en el bloque de motor',
    },
    {
      num: '02',
      src: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
      caption: '02 / MECÁNICA SIN PRISAS Y BIEN HECHA.',
      alt: 'Revisión técnica de componentes y puesta a punto',
    },
    {
      num: '03',
      src: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80',
      caption: '03 / ELEVADORES Y DIAGNÓSTICO ESTRUCTURAL.',
      alt: 'Vehículo montado en elevador hidráulico en bahía de servicio',
    },
    {
      num: '04',
      src: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=1200&q=80',
      caption: '04 / FRENOS, SUSPENSIÓN Y SEGURIDAD ACTIVA.',
      alt: 'Inspección minuciosa de discos de freno y amortiguadores',
    },
    {
      num: '05',
      src: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
      caption: '05 / TELEMETRÍA Y DIAGNÓSTICO DIGITAL OBD-II.',
      alt: 'Escaneo computarizado de centralitas y sensores',
    },
    {
      num: '06',
      src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      caption: '06 / ENTREGA IMPECABLE Y CONTROL DE CALIDAD.',
      alt: 'Vehículo revisado y listo para entrega al cliente',
    },
  ];

  // Cambio automático por defecto (autoplay cada 4 segundos)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, heroSlides.length]);

  // Appointment form state
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    descripcion: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.telefono) return;
    setSubmitted(true);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#f3f1ea] text-[#242720] min-h-screen w-full flex flex-col font-['Inter',sans-serif]">
      {/* 2:3 Navegación */}
      <header className="w-full border-b border-[#d4d3c9] bg-[#f3f1ea] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 h-[96px] sm:h-[104px] flex items-center justify-between">
          {/* Brand con Logo del Taller y Acento de marca (Figma 63:3) */}
          <div className="flex items-center gap-3.5 sm:gap-4 select-none">
            {/* Logo del Taller */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#be401f] text-white font-bold flex items-center justify-center font-['Barlow_Condensed',sans-serif] text-2xl sm:text-[26px] tracking-tight shadow-sm shrink-0">
              AP
            </div>
            <div className="flex flex-col">
              <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[28px] sm:text-[33px] leading-[34px] tracking-tight text-[#242720]">
                AUTOTALLER PRO
              </span>
              <span className="font-semibold text-[10px] tracking-[0.25em] text-[#242720] uppercase leading-tight mt-0.5">
                T A L L E R &nbsp; M E C Á N I C O
              </span>
              <div className="w-11 h-[3px] bg-[#be401f] mt-1 shrink-0" style={{ width: '44px', height: '3px' }}></div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[14px] text-[#242720] font-normal">
            <button
              onClick={() => scrollTo('servicios')}
              className="hover:text-[#be401f] transition-colors cursor-pointer"
            >
              Servicios
            </button>
            <button
              onClick={() => scrollTo('el-taller')}
              className="hover:text-[#be401f] transition-colors cursor-pointer"
            >
              El taller
            </button>
            <button
              onClick={() => scrollTo('como-trabajamos')}
              className="hover:text-[#be401f] transition-colors cursor-pointer"
            >
              Cómo trabajamos
            </button>

            {/* Enlaces según estado de sesión (Figma 63:4, 63:5 vs 63:263, 63:264) */}
            {currentUser ? (
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    // Si el usuario es administrador, no cambia de comportamiento ni redirige
                    if (currentUser.role === 'admin') {
                      return;
                    }
                    if (onNavigateToProfile) {
                      onNavigateToProfile();
                    }
                  }}
                  title={
                    currentUser.role === 'admin'
                      ? `Sesión activa: ${currentUser.name}`
                      : 'Ver y modificar mi perfil'
                  }
                  className={`flex items-center gap-2 bg-[#d9381e] px-4 py-1.5 border border-[#b82d17] text-xs font-bold text-white rounded-full shadow-xs transition-colors select-none ${currentUser.role === 'admin'
                    ? 'cursor-default'
                    : 'cursor-pointer hover:bg-[#c42e15] active:scale-[0.99]'
                    }`}
                >
                  <span
                    className="w-2 h-2 rounded-full bg-white shadow-xs shrink-0"
                    aria-hidden="true"
                  ></span>
                  <span>Mi sesión ({currentUser.name})</span>
                </button>
                {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && onNavigateToAdmin && (
                  <button
                    onClick={onNavigateToAdmin}
                    className="bg-[#be401f] hover:bg-[#a63417] text-white text-[12px] font-semibold px-3 py-1 flex items-center gap-1 transition-colors cursor-pointer rounded-full"
                  >
                    <span>Ir a Administración</span>
                    <span>↗</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="text-[#62645c] hover:text-[#be401f] text-[13px] font-semibold transition-colors cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-5">
                {onNavigateToLogin && (
                  <button
                    onClick={onNavigateToLogin}
                    className="text-[#242720] hover:text-[#be401f] font-semibold text-[14px] transition-colors cursor-pointer"
                  >
                    Iniciar sesión
                  </button>
                )}
                {onNavigateToRegister && (
                  <button
                    onClick={onNavigateToRegister}
                    className="text-[#242720] hover:text-[#be401f] font-semibold text-[14px] transition-colors cursor-pointer"
                  >
                    Registrarse
                  </button>
                )}
              </div>
            )}
          </nav>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollTo('contacto')}
              className="bg-[#be401f] hover:bg-[#a63417] text-white text-[15px] font-semibold px-6 py-3.5 flex items-center gap-2 transition-colors cursor-pointer shadow-sm rounded-full"
            >
              <span>Pedir cita</span>
              <span className="text-[17px] leading-none">↗</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2:4 Presentación / Hero */}
      <section className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 pt-10 sm:pt-14 pb-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          {/* Left Column (Content) */}
          <div className="lg:col-span-6 flex flex-col pt-2">
            <p className="font-semibold text-[#be401f] text-[12px] tracking-[0.08em] uppercase mb-4">
              MECÁNICA DE BARRIO. BIEN HECHA.
            </p>
            <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-6xl sm:text-7xl lg:text-[112px] leading-[0.95] tracking-tight uppercase mb-8">
              TU COCHE,<br />
              EN BUENAS<br />
              MANOS.
            </h1>
            <p className="text-[#62645c] text-base sm:text-lg lg:text-[18px] leading-[29px] max-w-[560px] mb-10">
              Sin cambiar piezas por cambiar. Revisamos tu coche, te contamos qué le pasa y lo arreglamos contigo.
            </p>

            <div className="flex flex-wrap items-center gap-6 mb-12">
              <button
                onClick={() => scrollTo('contacto')}
                className="bg-[#be401f] hover:bg-[#a33518] text-white text-[15px] font-semibold px-7 py-4 flex items-center gap-3 transition-colors cursor-pointer shadow-sm rounded-full"
              >
                <span>Cuéntanos qué le pasa</span>
                <span className="text-lg leading-none">↗</span>
              </button>
              <button
                onClick={() => scrollTo('servicios')}
                className="text-[#242720] text-[14px] font-medium hover:text-[#be401f] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Ver nuestros servicios</span>
                <span className="text-base leading-none">↓</span>
              </button>
            </div>

            <p className="text-[#62645c] text-[13px] font-normal">
              Todas las marcas. El mismo cuidado.
            </p>
          </div>

          {/* Right Column (Hero Carousel - Figma 2:27, 63:6, 63:7, 63:8) */}
          <div className="lg:col-span-6 flex flex-col">
            <div
              className="relative w-full h-[360px] sm:h-[480px] lg:h-[560px] bg-[#242720] overflow-hidden shadow-md border border-[#d4d3c9] group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {heroSlides.map((slide, idx) => (
                <img
                  key={slide.num}
                  src={slide.src}
                  alt={slide.alt}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${idx === heroSlide ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                    }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-20"></div>

              {/* Live badge */}
              <div className="absolute top-4 right-4 z-30 bg-[#be401f] text-white text-[11px] font-bold px-2.5 py-1 tracking-wider uppercase font-mono shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                <span>EN DIRECTO</span>
              </div>

              {/* Bottom Carousel Controls Bar (Figma 2:28, 63:6, 63:7, 63:8) */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/95 to-transparent flex items-center justify-between text-white select-none z-30">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-xs sm:text-[13px] tracking-wider font-medium">
                    {heroSlides[heroSlide]?.caption}
                  </span>
                  {/* Indicator dots */}
                  <div className="flex items-center gap-1.5">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHeroSlide(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === heroSlide ? 'w-6 bg-[#be401f]' : 'w-2 bg-white/40 hover:bg-white/80'
                          }`}
                        title={`Ver foto 0${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#242720]/80 backdrop-blur px-3 py-1.5 border border-[#45483e]">
                  <button
                    type="button"
                    onClick={() => setHeroSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                    className="w-7 h-7 flex items-center justify-center hover:bg-[#be401f] text-white transition-colors cursor-pointer text-sm font-bold"
                    title="Anterior foto"
                  >
                    ←
                  </button>
                  <span className="font-mono text-xs font-semibold px-1 text-[#e4e2d8]">
                    {heroSlides[heroSlide]?.num} / 0{heroSlides.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHeroSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))}
                    className="w-7 h-7 flex items-center justify-center hover:bg-[#be401f] text-white transition-colors cursor-pointer text-sm font-bold"
                    title="Siguiente foto"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* División de pantalla entre Hero y Servicios */}
      <div className="w-full border-b border-[#d4d3c9] relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 flex items-center">
          <div className="w-11 h-[3px] bg-[#be401f] -mb-[2px] shrink-0" style={{ width: '44px', height: '3px' }}></div>
        </div>
      </div>

      {/* 2:6 Servicios */}
      <section id="servicios" className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 py-16 lg:py-24">
        <p className="font-semibold text-[#be401f] text-[12px] tracking-[0.08em] uppercase mb-3">
          01 / LO QUE HACEMOS
        </p>
        <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-4xl sm:text-5xl lg:text-[52px] leading-[1.05] tracking-tight uppercase mb-3">
          LO DE SIEMPRE. Y ESE RUIDO RARO.
        </h2>
        <p className="text-[#62645c] text-[16px] max-w-[800px] mb-12 sm:mb-16">
          Del mantenimiento de cada año a la avería que no te deja tranquilo.
        </p>

        {/* 6 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-12">
          {/* 01 */}
          <div className="flex flex-col pt-4 border-t border-[#d4d3c9]">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-semibold text-[#be401f] text-[11px] font-mono">01</span>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[23px] leading-[30px]">
                Mantenimiento y revisiones
              </h3>
            </div>
            <p className="text-[#62645c] text-[14px] leading-[23px]">
              Aceite, filtros y una revisión a fondo. Para que sigas sumando kilómetros.
            </p>
          </div>

          {/* 02 */}
          <div className="flex flex-col pt-4 border-t border-[#d4d3c9]">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-semibold text-[#be401f] text-[11px] font-mono">02</span>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[23px] leading-[30px]">
                Frenos y suspensión
              </h3>
            </div>
            <p className="text-[#62645c] text-[14px] leading-[23px]">
              Pastillas, discos y amortiguadores. Lo importante es llegar bien.
            </p>
          </div>

          {/* 03 */}
          <div className="flex flex-col pt-4 border-t border-[#d4d3c9]">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-semibold text-[#be401f] text-[11px] font-mono">03</span>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[23px] leading-[30px]">
                Diagnosis electrónica
              </h3>
            </div>
            <p className="text-[#62645c] text-[14px] leading-[23px]">
              Buscamos el origen del fallo. No nos quedamos en apagar la luz.
            </p>
          </div>

          {/* 04 */}
          <div className="flex flex-col pt-4 border-t border-[#d4d3c9]">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-semibold text-[#be401f] text-[11px] font-mono">04</span>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[23px] leading-[30px]">
                Embrague y distribución
              </h3>
            </div>
            <p className="text-[#62645c] text-[14px] leading-[23px]">
              Las reparaciones grandes, explicadas con calma y con un presupuesto claro.
            </p>
          </div>

          {/* 05 */}
          <div className="flex flex-col pt-4 border-t border-[#d4d3c9]">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-semibold text-[#be401f] text-[11px] font-mono">05</span>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[23px] leading-[30px]">
                Neumáticos y alineación
              </h3>
            </div>
            <p className="text-[#62645c] text-[14px] leading-[23px]">
              Desgaste, presión y equilibrado. Tu coche, bien pegado al asfalto.
            </p>
          </div>

          {/* 06 */}
          <div className="flex flex-col pt-4 border-t border-[#d4d3c9]">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-semibold text-[#be401f] text-[11px] font-mono">06</span>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[23px] leading-[30px]">
                Aire acondicionado y pre-ITV
              </h3>
            </div>
            <p className="text-[#62645c] text-[14px] leading-[23px]">
              Ponemos a punto lo que necesitas antes del calor o de la inspección.
            </p>
          </div>
        </div>
      </section>

      {/* 2:7 El taller con cuadrantes circulares */}
      <section id="el-taller" className="w-full bg-[#242720] text-[#f3f1ea] py-16 lg:py-24 border-b border-[#45483e]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column (Manifesto) */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            <p className="font-semibold text-[#be401f] text-[12px] tracking-[0.08em] uppercase">
              02 / UN TALLER, NO UNA CADENA
            </p>
            <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-white text-4xl sm:text-5xl lg:text-[58px] leading-[1.05] tracking-tight uppercase">
              AQUÍ HABLAS CON<br />
              QUIEN ABRE EL CAPÓ.
            </h2>
            <p className="text-[#c1c3b7] text-[17px] leading-[28px]">
              Somos Autotaller Pro. Llevamos más de veinte años arreglando coches como se han arreglado siempre: escuchando el motor, manchándonos las manos y hablando de frente.
            </p>
            <p className="text-[#a5a89a] text-[15px] leading-[25px]">
              Trabajamos con herramienta moderna y diagnosis oficial, pero sin perder lo importante: que sepas quién toca tu coche, qué le pasa exactamente y cuánto te va a costar antes de que empecemos.
            </p>
            <p className="font-semibold text-white text-[15px] pt-1">
              Trato directo. Sin letra pequeña.
            </p>
          </div>

          {/* Right Column (Separated Circular Portions with Floating Hover & Perfect Alignment) */}
          <div className="lg:col-span-7 flex justify-center items-center py-4">
            {/* Círculo con 4 porciones separadas por un espacio visible e información alineada */}
            <div className="circle-portions-grid w-full max-w-[360px] sm:max-w-[480px] lg:max-w-[530px] aspect-square gap-3 sm:gap-4 lg:gap-5 select-none">

              {/* PORCIÓN 1 (Superior Izquierda): +20 AÑOS EN EL OFICIO */}
              <div className="circle-portion portion-top-left flex items-center justify-center p-3 sm:p-5 lg:p-6 shadow-lg">
                <div className="w-full max-w-[130px] sm:max-w-[165px] lg:max-w-[185px] flex flex-col items-start text-left translate-x-1 sm:translate-x-2 translate-y-1 sm:translate-y-2">
                  <span className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl lg:text-5xl text-[#be401f] leading-none mb-1 sm:mb-1.5 tracking-tight">
                    +20
                  </span>
                  <h4 className="text-white font-bold uppercase tracking-wider text-[10px] sm:text-[12px] lg:text-[13px] leading-tight mb-1 sm:mb-1.5">
                    AÑOS EN EL OFICIO
                  </h4>
                  <p className="text-[#a5a89a] text-[9px] sm:text-[11px] lg:text-[12px] leading-tight sm:leading-snug font-normal">
                    Experiencia acumulada en todas las marcas y motores.
                  </p>
                </div>
              </div>

              {/* PORCIÓN 2 (Superior Derecha): 6 ELEVADORES ACTIVOS */}
              <div className="circle-portion portion-top-right flex items-center justify-center p-3 sm:p-5 lg:p-6 shadow-lg">
                <div className="w-full max-w-[130px] sm:max-w-[165px] lg:max-w-[185px] flex flex-col items-start text-left -translate-x-1 sm:-translate-x-2 translate-y-1 sm:translate-y-2">
                  <span className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl lg:text-5xl text-[#be401f] leading-none mb-1 sm:mb-1.5 tracking-tight">
                    6
                  </span>
                  <h4 className="text-white font-bold uppercase tracking-wider text-[10px] sm:text-[12px] lg:text-[13px] leading-tight mb-1 sm:mb-1.5">
                    ELEVADORES ACTIVOS
                  </h4>
                  <p className="text-[#a5a89a] text-[9px] sm:text-[11px] lg:text-[12px] leading-tight sm:leading-snug font-normal">
                    Capacidad para atender sin colas ni esperas eternas.
                  </p>
                </div>
              </div>

              {/* PORCIÓN 3 (Inferior Izquierda): 100% GARANTÍA EN PIEZAS */}
              <div className="circle-portion portion-bottom-left flex items-center justify-center p-3 sm:p-5 lg:p-6 shadow-lg">
                <div className="w-full max-w-[130px] sm:max-w-[165px] lg:max-w-[185px] flex flex-col items-start text-left translate-x-1 sm:translate-x-2 -translate-y-1 sm:-translate-y-2">
                  <span className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl lg:text-5xl text-[#be401f] leading-none mb-1 sm:mb-1.5 tracking-tight">
                    100%
                  </span>
                  <h4 className="text-white font-bold uppercase tracking-wider text-[10px] sm:text-[12px] lg:text-[13px] leading-tight mb-1 sm:mb-1.5">
                    GARANTÍA EN PIEZAS
                  </h4>
                  <p className="text-[#a5a89a] text-[9px] sm:text-[11px] lg:text-[12px] leading-tight sm:leading-snug font-normal">
                    Recambios originales o equivalentes de primer equipo.
                  </p>
                </div>
              </div>

              {/* PORCIÓN 4 (Inferior Derecha): 4.9 VALORACIÓN CLIENTES */}
              <div className="circle-portion portion-bottom-right flex items-center justify-center p-3 sm:p-5 lg:p-6 shadow-lg">
                <div className="w-full max-w-[130px] sm:max-w-[165px] lg:max-w-[185px] flex flex-col items-start text-left -translate-x-1 sm:-translate-x-2 -translate-y-1 sm:-translate-y-2">
                  <div className="inline-flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                    <span className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl lg:text-5xl text-[#be401f] leading-none tracking-tight">
                      4.9
                    </span>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#be401f] fill-[#be401f] shrink-0 -mt-1" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-[10px] sm:text-[12px] lg:text-[13px] leading-tight mb-1 sm:mb-1.5">
                    VALORACIÓN CLIENTES
                  </h4>
                  <p className="text-[#a5a89a] text-[9px] sm:text-[11px] lg:text-[12px] leading-tight sm:leading-snug font-normal">
                    Cientos de conductores confían en nosotros cada año.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2:8 Cómo trabajamos */}
      <section id="como-trabajamos" className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 py-16 lg:py-24">
        <p className="font-semibold text-[#be401f] text-[12px] tracking-[0.08em] uppercase mb-3">
          03 / SIN VUELTAS
        </p>
        <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-4xl sm:text-5xl lg:text-[52px] leading-[1.05] tracking-tight uppercase mb-12 sm:mb-16">
          LAS COSAS CLARAS, DESDE EL PRINCIPIO.
        </h2>

        {/* 3 Step Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Step 1 */}
          <div className="flex flex-col pt-4 border-t border-[#d4d3c9]">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#be401f] text-[39px] leading-none">
                01
              </span>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[21px] leading-[30px]">
                Nos lo cuentas
              </h3>
            </div>
            <p className="text-[#62645c] text-[14px] leading-[23px]">
              Qué notas, desde cuándo y qué te preocupa. Tú conoces tu coche mejor que nadie.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col pt-4 border-t border-[#d4d3c9]">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#be401f] text-[39px] leading-none">
                02
              </span>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[21px] leading-[30px]">
                Lo revisamos contigo
              </h3>
            </div>
            <p className="text-[#62645c] text-[14px] leading-[23px]">
              Buscamos el problema y te explicamos las opciones antes de tocar nada.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col pt-4 border-t border-[#d4d3c9]">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#be401f] text-[39px] leading-none">
                03
              </span>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[21px] leading-[30px]">
                Tú decides. Nosotros reparamos.
              </h3>
            </div>
            <p className="text-[#62645c] text-[14px] leading-[23px]">
              Aprobamos el presupuesto contigo. Si aparece algo más, te avisamos.
            </p>
          </div>
        </div>
      </section>

      {/* 2:9 Preguntas frecuentes */}
      <section className="w-full border-t border-[#d4d3c9]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left Column */}
            <div className="lg:col-span-5 flex flex-col">
              <p className="font-semibold text-[#be401f] text-[12px] tracking-[0.08em] uppercase mb-3">
                04 / POR SI TE LO PREGUNTAS
              </p>
              <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-4xl sm:text-5xl lg:text-[56px] leading-[1.05] tracking-tight uppercase">
                ANTES DE<br />
                TRAER EL COCHE.
              </h2>
            </div>

            {/* Right Column (Accordions) */}
            <div className="lg:col-span-7 flex flex-col divide-y divide-[#d4d3c9]">
              {/* FAQ 1 */}
              <div className="pb-6">
                <button
                  onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
                  className="w-full flex items-center justify-between text-left py-2 group cursor-pointer"
                >
                  <span className="font-semibold text-[#242720] text-[18px] group-hover:text-[#be401f] transition-colors">
                    ¿Tengo que pedir cita?
                  </span>
                  <span className="text-[22px] font-light text-[#242720] w-6 text-center">
                    {openFaq === 0 ? '−' : '+'}
                  </span>
                </button>
                {openFaq === 0 && (
                  <p className="text-[#62645c] text-[15px] leading-[25px] mt-2 pr-6">
                    Es lo mejor para dedicarte el tiempo que necesitas. Déjanos tus datos y te contactamos para buscar un hueco.
                  </p>
                )}
              </div>

              {/* FAQ 2 */}
              <div className="py-6">
                <button
                  onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                  className="w-full flex items-center justify-between text-left py-2 group cursor-pointer"
                >
                  <span className="font-semibold text-[#242720] text-[17px] group-hover:text-[#be401f] transition-colors">
                    ¿Me avisáis antes de hacer una reparación?
                  </span>
                  <span className="text-[22px] font-light text-[#242720] w-6 text-center">
                    {openFaq === 1 ? '−' : '+'}
                  </span>
                </button>
                {openFaq === 1 && (
                  <p className="text-[#62645c] text-[15px] leading-[25px] mt-2 pr-6">
                    Por supuesto. Jamás tocamos nada sin que conozcas el diagnóstico, el presupuesto cerrado y nos des tu aprobación explícita.
                  </p>
                )}
              </div>

              {/* FAQ 3 */}
              <div className="pt-6">
                <button
                  onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                  className="w-full flex items-center justify-between text-left py-2 group cursor-pointer"
                >
                  <span className="font-semibold text-[#242720] text-[17px] group-hover:text-[#be401f] transition-colors">
                    ¿Trabajáis con cualquier marca?
                  </span>
                  <span className="text-[22px] font-light text-[#242720] w-6 text-center">
                    {openFaq === 2 ? '−' : '+'}
                  </span>
                </button>
                {openFaq === 2 && (
                  <p className="text-[#62645c] text-[15px] leading-[25px] mt-2 pr-6">
                    Sí, contamos con equipamiento de diagnosis multimarca avanzado y recambios homologados para turismos, furgonetas y vehículos comerciales.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2:10 Contacto / Pide tu cita */}
      <section id="contacto" className="w-full bg-[#242720] text-[#f3f1ea] py-16 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left Column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <p className="font-semibold text-[#e8a38a] text-[12px] tracking-[0.08em] uppercase mb-4">
                  05 / PIDE TU CITA
                </p>
                <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#f3f1ea] text-6xl sm:text-7xl lg:text-[80px] leading-[1] tracking-tight uppercase mb-6">
                  ¿LO MIRAMOS?
                </h2>
                <p className="text-[#d0d1c6] text-[18px] leading-[29px] max-w-[420px] mb-8">
                  Cuéntanos qué necesita tu coche.<br />
                  Te contactamos para acordar día y hora.
                </p>
              </div>
              <p className="text-[#d0d1c6] text-[13px]">
                Sin compromiso. Y hablando claro.
              </p>
            </div>

            {/* Right Column (Form) */}
            <div className="lg:col-span-7">
              {submitted ? (
                <div className="bg-[#363930] p-8 sm:p-10 text-center flex flex-col items-center justify-center border border-[#45483e]">
                  <div className="w-14 h-14 rounded-full bg-[#be401f] text-white flex items-center justify-center text-2xl font-bold mb-4">
                    ✓
                  </div>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl text-[#f3f1ea] uppercase mb-2">
                    ¡Solicitud Recibida!
                  </h3>
                  <p className="text-[#c1c3b7] text-[15px] max-w-md mb-6">
                    Gracias, <strong>{formData.nombre}</strong>. Hemos registrado tu petición con teléfono <strong>{formData.telefono}</strong>. Te llamaremos en breve para coordinar tu cita.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ nombre: '', telefono: '', descripcion: '' });
                    }}
                    className="bg-[#242720] hover:bg-[#45483e] text-white text-xs font-semibold px-5 py-2.5 uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Campo Nombre */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[12px] font-medium text-[#f3f1ea]">
                        Tu nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="¿Cómo te llamas?"
                        className="bg-[#363930] border border-transparent focus:border-[#be401f] text-[#f3f1ea] placeholder-[#c1c3b7] text-[14px] px-4 py-3 outline-none transition-colors"
                      />
                    </div>

                    {/* Campo Teléfono */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[12px] font-medium text-[#f3f1ea]">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="Tu número de contacto"
                        className="bg-[#363930] border border-transparent focus:border-[#be401f] text-[#f3f1ea] placeholder-[#c1c3b7] text-[14px] px-4 py-3 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Campo Descripción */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-medium text-[#f3f1ea]">
                      ¿Qué le pasa a tu coche?
                    </label>
                    <textarea
                      rows={3}
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Marca, modelo y lo que has notado…"
                      className="bg-[#363930] border border-transparent focus:border-[#be401f] text-[#f3f1ea] placeholder-[#c1c3b7] text-[14px] px-4 py-3 outline-none resize-none transition-colors"
                    ></textarea>
                  </div>

                  <p className="text-[#c1c3b7] text-[11px]">
                    Al enviar, aceptas la política de privacidad.
                  </p>

                  <button
                    type="submit"
                    className="bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[15px] py-4 px-8 w-full flex items-center justify-between transition-colors cursor-pointer shadow-md rounded-full"
                  >
                    <span>Solicitar cita</span>
                    <span className="text-[20px] leading-none">↗</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2:11 Pie de página */}
      <footer className="w-full bg-[#f3f1ea] border-t border-[#d4d3c9] py-12 px-6 sm:px-12 lg:px-18">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-[#be401f] text-white font-bold flex items-center justify-center font-['Barlow_Condensed',sans-serif] text-xl shadow-sm shrink-0">
              AP
            </div>
            <div>
              <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-[28px] leading-none mb-1">
                AUTOTALLER PRO
              </p>
              <p className="text-[#62645c] text-[13px]">
                Mecánica general. Trato de tú a tú.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-3 text-[13px]">
            <div className="flex items-center gap-6 font-medium text-[#242720]">
              <button onClick={() => scrollTo('servicios')} className="hover:text-[#be401f] transition-colors cursor-pointer">
                Servicios
              </button>
              <button onClick={() => scrollTo('el-taller')} className="hover:text-[#be401f] transition-colors cursor-pointer">
                El taller
              </button>
              <button onClick={() => scrollTo('contacto')} className="hover:text-[#be401f] transition-colors cursor-pointer">
                Pedir cita
              </button>
              <button onClick={onNavigateToAdmin} className="text-[#be401f] hover:underline font-semibold cursor-pointer">
                Administración ↗
              </button>
            </div>
            <div className="flex items-center gap-5 text-[11px] text-[#62645c]">
              <span className="hover:text-[#242720] cursor-pointer">Aviso legal</span>
              <span className="hover:text-[#242720] cursor-pointer">Privacidad</span>
              <span className="hover:text-[#242720] cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

