import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthUser, DEMO_ACCOUNTS, DEMO_USERS, UserAccount } from '../types/auth';

interface LoginViewProps {
  onLogin: (user: AuthUser) => void;
  onNavigateToRegister: () => void;
  onNavigateToClient?: () => void;
  accounts?: UserAccount[];
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onNavigateToRegister,
  onNavigateToClient,
  accounts = DEMO_ACCOUNTS,
}) => {
  const [email, setEmail] = useState('ana@ejemplo.com');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSelectDemoUser = (user: AuthUser) => {
    setEmail(user.email);
    setPassword('autotaller2026!');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Por favor introduce tu correo electrónico.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor introduce tu contraseña.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Find matching account or create a client session
      const matchedAccount = accounts.find(
        (a) => a.email.toLowerCase() === trimmedEmail
      );

      const userToLogin: AuthUser = matchedAccount
        ? {
            id: matchedAccount.id,
            name: matchedAccount.name,
            email: matchedAccount.email,
            role: matchedAccount.role,
            avatar: matchedAccount.avatar,
          }
        : {
            id: 'client-user-1',
            name: trimmedEmail.includes('admin')
              ? 'Admin Central'
              : trimmedEmail.includes('ana')
              ? 'Ana García'
              : 'Cliente Registrado',
            email: trimmedEmail,
            role: trimmedEmail.includes('admin') ? 'admin' : ('client' as any),
          };

      const isAdmin =
        userToLogin.role === 'admin' ||
        userToLogin.role === 'supervisor' ||
        userToLogin.role === 'technician' ||
        userToLogin.role === 'advisor';

      setLoading(false);
      setSuccessMessage(
        isAdmin
          ? '¡Acceso concedido como Administrador! Redirigiendo al panel de gestión...'
          : '¡Acceso concedido! Redirigiendo a la página principal...'
      );

      setTimeout(() => {
        onLogin(userToLogin);
      }, 350);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f3f1ea] text-[#242720] font-['Inter',sans-serif]">
      {/* Navegación de Acceso (Figma 63:373) */}
      <header className="w-full border-b border-[#d4d3c9] bg-[#f3f1ea] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 h-[96px] sm:h-[104px] flex items-center justify-between">
          {/* Brand con Logo del Taller y Acento de marca (Figma 63:380-63:383) */}
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

          {/* Volver al inicio (Figma 63:386) */}
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

      {/* Cuerpo de Acceso (Figma 63:387) */}
      <main className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 py-10 sm:py-14 w-full flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Columna Izquierda: El oficio del taller y Manifiesto (Figma 63:404 & 63:405) */}
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

          {/* Columna Derecha: Formulario Iniciar Sesión (Figma 63:372) */}
          <div className="lg:col-span-7 max-w-[560px] w-full">
            <p className="font-semibold text-[12px] text-[#be401f] tracking-widest uppercase mb-2">
              BIENVENIDO DE NUEVO
            </p>
            <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-5xl sm:text-[56px] text-[#242720] leading-none mb-3 uppercase">
              INICIA SESIÓN.
            </h1>
            <p className="text-[16px] text-[#62645c] mb-6">
              Entra con tus datos. Las cuentas de administración se dirigen al panel de gestión y los clientes a la web pública.
            </p>

            {/* Tarjeta Destacada de Credenciales de Administrador */}
            <div className="mb-6 bg-[#242720] text-[#f3f1ea] border-l-4 border-[#be401f] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#be401f] animate-pulse"></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#be401f]">
                    Credenciales de Administrador
                  </span>
                </div>
                <span className="text-[10px] text-[#c1c3b7] uppercase font-mono tracking-widest bg-white/10 px-2 py-0.5">
                  Acceso Gestión
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-black/40 p-3 border border-white/10">
                <div>
                  <span className="text-[#a8aba0] text-[10px] uppercase block tracking-wider mb-0.5">Correo / Usuario:</span>
                  <span className="text-white font-semibold select-all text-[13px]">admin@autotaller.pro</span>
                </div>
                <div>
                  <span className="text-[#a8aba0] text-[10px] uppercase block tracking-wider mb-0.5">Contraseña:</span>
                  <span className="text-white font-semibold select-all text-[13px]">autotaller2026!</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/10 text-xs">
                <span className="text-[11px] text-[#c1c3b7]">
                  Acceso completo a las 7 pantallas de gestión del taller
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const adminAccount = DEMO_USERS.find((u) => u.role === 'admin') || {
                      id: 'user-admin',
                      name: 'Admin Central',
                      email: 'admin@autotaller.pro',
                      role: 'admin',
                      roleLabel: 'Administrador del Sistema',
                      initials: 'AD',
                    };
                    handleSelectDemoUser(adminAccount as AuthUser);
                  }}
                  className="bg-[#be401f] hover:bg-[#a63417] text-white text-[11px] font-semibold px-4 py-2 flex items-center gap-1.5 transition-colors cursor-pointer rounded-full"
                >
                  <span>Autocompletar Administrador</span>
                  <span>⚡</span>
                </button>
              </div>
            </div>

            {/* Acceso Rápido Demo (1 clic) */}
            <div className="mb-6 p-3.5 bg-[#e9e7df] border border-[#d4d3c9]">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#62645c] mb-2">
                ⚡ Cuentas de prueba en 1 clic:
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const adminAccount = DEMO_USERS.find((u) => u.role === 'admin') || {
                      id: 'user-admin',
                      name: 'Admin Central',
                      email: 'admin@autotaller.pro',
                      role: 'admin',
                      roleLabel: 'Administrador',
                      initials: 'AD',
                    };
                    handleSelectDemoUser(adminAccount as AuthUser);
                  }}
                  className="p-2 bg-white hover:bg-[#be401f] hover:text-white border border-[#d4d3c9] text-left transition-colors cursor-pointer"
                >
                  <strong className="block truncate">Admin Central</strong>
                  <span className="text-[10px] opacity-80 block truncate">Administrador</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDemoUser(DEMO_USERS[0])}
                  className="p-2 bg-white hover:bg-[#be401f] hover:text-white border border-[#d4d3c9] text-left transition-colors cursor-pointer"
                >
                  <strong className="block truncate">Laura Giménez</strong>
                  <span className="text-[10px] opacity-80 block truncate">Jefa de Taller</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDemoUser({ id: 'c1', name: 'Ana García', email: 'ana@ejemplo.com', role: 'client' as any, roleLabel: 'Cliente', initials: 'AG' })}
                  className="p-2 bg-white hover:bg-[#be401f] hover:text-white border border-[#d4d3c9] text-left transition-colors cursor-pointer"
                >
                  <strong className="block truncate">Ana García</strong>
                  <span className="text-[10px] opacity-80 block truncate">Cliente</span>
                </button>
              </div>
            </div>

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
              <div>
                <label className="block font-semibold text-[12px] text-[#242720] mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  className="w-full h-[54px] bg-white border border-[#d4d3c9] focus:border-[#be401f] text-[#242720] text-[15px] px-4 outline-none transition-colors font-mono"
                />
              </div>

              <p className="text-[13px] text-[#62645c]">
                Al acceder volverás al inicio con tu sesión abierta.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[15px] px-8 flex items-center justify-between transition-colors cursor-pointer shadow-sm mt-3 disabled:opacity-70 rounded-full"
              >
                <span>{loading ? 'Verificando credenciales...' : 'Iniciar sesión'}</span>
                <span className="text-xl">↗</span>
              </button>
            </form>

            <div className="h-px bg-[#d4d3c9] my-6"></div>

            <div className="space-y-1">
              <p className="text-[15px] text-[#242720]">
                ¿Es tu primera visita?
              </p>
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-[15px] font-semibold text-[#be401f] hover:underline cursor-pointer"
              >
                Crea tu cuenta →
              </button>
            </div>
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
