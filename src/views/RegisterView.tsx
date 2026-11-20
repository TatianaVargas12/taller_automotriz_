import React, { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { DEMO_ACCOUNTS, UserAccount } from '../types/auth';

interface RegisterViewProps {
  onRegister: (newUser: UserAccount) => void;
  onNavigateToLogin: () => void;
  onNavigateToClient?: () => void;
  accounts?: UserAccount[];
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegister,
  onNavigateToLogin,
  onNavigateToClient,
  accounts = DEMO_ACCOUNTS,
}) => {
  const [name, setName] = useState('Ana García');
  const [phone, setPhone] = useState('612 345 678');
  const [email, setEmail] = useState('ana@ejemplo.com');
  const [password, setPassword] = useState('••••••••••••');
  const [termsAccepted, setTermsAccepted] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setErrorMessage('Por favor introduce tu nombre completo.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Por favor introduce un correo electrónico válido.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('El correo electrónico ingresado no tiene un formato válido.');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Debes aceptar los términos y la política de privacidad para continuar.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const newUser: UserAccount = {
        id: `client-${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        role: 'client' as any,
        phone: phone.trim(),
        createdAt: new Date().toISOString(),
      };

      setLoading(false);
      setSuccessMessage('¡Cuenta creada con éxito! Redirigiendo al inicio...');

      setTimeout(() => {
        onRegister(newUser);
      }, 350);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f3f1ea] text-[#242720] font-['Inter',sans-serif]">
      {/* Navegación de Acceso (Figma 63:389) */}
      <header className="w-full border-b border-[#d4d3c9] bg-[#f3f1ea] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 h-[96px] sm:h-[104px] flex items-center justify-between">
          {/* Brand con Logo del Taller y Acento de marca (Figma 63:396-63:399) */}
          <button
            type="button"
            onClick={onNavigateToClient}
            className="flex items-center gap-3.5 sm:gap-4 select-none text-left cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#be401f] text-white font-bold flex items-center justify-center font-['Barlow_Condensed',sans-serif] text-2xl sm:text-[26px] tracking-tight shadow-sm shrink-0 group-hover:bg-[#a63417] transition-colors">
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
          </button>

          {/* Volver al inicio (Figma 63:402) */}
          {onNavigateToClient && (
            <button
              type="button"
              onClick={onNavigateToClient}
              className="font-semibold text-[14px] text-[#242720] hover:text-[#be401f] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>← Volver al inicio</span>
            </button>
          )}
        </div>
      </header>

      {/* Cuerpo de Acceso (Figma 63:403) */}
      <main className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 py-10 sm:py-14 w-full flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Columna Izquierda: El oficio del taller y Manifiesto (Figma 63:427 & 63:428) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative w-full h-[320px] sm:h-[410px] bg-[#242720] overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80"
                alt="El oficio del taller"
                className="w-full h-full object-cover grayscale-[20%] contrast-[1.05]"
              />
              <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
            </div>
            
            <div className="bg-[#242720] text-[#f3f1ea] p-8 sm:p-10 shadow-md">
              <p className="font-semibold text-[11px] text-[#f3f1ea]/80 tracking-widest uppercase mb-3">
                AUTOTALLER PRO / A TU LADO
              </p>
              <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-4xl sm:text-[53px] leading-[1.08] text-[#f3f1ea] uppercase mb-4">
                TU COCHE.<br />TODO MÁS CLARO.
              </h2>
              <div className="text-[15px] text-[#d0d1c6] leading-relaxed space-y-1">
                <p>Una cuenta para tus citas y tu vehículo.</p>
                <p>El mismo trato directo de siempre.</p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario Crear Cuenta (Figma 63:388) */}
          <div className="lg:col-span-7 max-w-[560px] w-full">
            <p className="font-semibold text-[12px] text-[#be401f] tracking-widest uppercase mb-2">
              NUEVO EN EL TALLER
            </p>
            <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-5xl sm:text-[56px] text-[#242720] leading-none mb-3 uppercase">
              CREA TU CUENTA.
            </h1>
            <p className="text-[16px] text-[#62645c] mb-6">
              Regístrate y ten a mano todo lo que necesita tu coche.
            </p>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-[#ffebee] border-l-4 border-[#c62828] text-[#c62828] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-5 p-3.5 bg-[#e8f5e9] border-l-4 border-[#2e7d32] text-[#2e7d32] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-semibold text-[12px] text-[#242720] mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ana García"
                    className="w-full h-[54px] bg-white border border-[#d4d3c9] focus:border-[#be401f] text-[#242720] text-[15px] px-4 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[12px] text-[#242720] mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="612 345 678"
                    className="w-full h-[54px] bg-white border border-[#d4d3c9] focus:border-[#be401f] text-[#242720] text-[15px] px-4 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[12px] text-[#242720] mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ana@ejemplo.com"
                  className="w-full h-[54px] bg-white border border-[#d4d3c9] focus:border-[#be401f] text-[#242720] text-[15px] px-4 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-[12px] text-[#242720] mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  className="w-full h-[54px] bg-white border border-[#d4d3c9] focus:border-[#be401f] text-[#242720] text-[15px] px-4 outline-none transition-colors font-mono"
                />
                <p className="text-[12px] text-[#62645c] mt-1">
                  Usa al menos 8 caracteres.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="reg-terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-[18px] h-[18px] accent-[#242720] cursor-pointer"
                />
                <label htmlFor="reg-terms" className="text-[13px] text-[#62645c] cursor-pointer select-none">
                  Acepto los términos y la política de privacidad.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[15px] px-8 flex items-center justify-between transition-colors cursor-pointer shadow-sm mt-4 disabled:opacity-70 rounded-full"
              >
                <span>{loading ? 'Creando cuenta...' : 'Crear cuenta y entrar'}</span>
                <span className="text-xl">↗</span>
              </button>
            </form>

            <div className="h-px bg-[#d4d3c9] my-6"></div>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-[14px] font-semibold text-[#be401f] hover:underline cursor-pointer"
            >
              ¿Ya tienes una cuenta? Inicia sesión →
            </button>
          </div>
        </div>

        {/* Pie de página de Acceso (Figma 63:425 & 63:426) */}
        <footer className="pt-10 border-t border-[#d4d3c9] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#62645c] mt-10">
          <span>Prototipo de acceso · Datos de ejemplo</span>
          <span>Mecánica general. Trato de tú a tú.</span>
        </footer>
      </main>
    </div>
  );
};
