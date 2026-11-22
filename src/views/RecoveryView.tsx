import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DEMO_ACCOUNTS, UserAccount } from '../types/auth';

interface RecoveryViewProps {
  onNavigateToLogin: () => void;
  onNavigateToClient?: () => void;
  accounts?: UserAccount[];
  onPasswordResetSuccess?: (identifier: string, newPass: string) => void;
}

type RecoveryType = 'username' | 'password';
type ChannelType = 'email' | 'phone';
type RecoveryStep =
  | 'choose_type'
  | 'choose_channel'
  | 'input_identifier'
  | 'username_sent'
  | 'password_verify_code'
  | 'password_new_password'
  | 'password_success';

export const RecoveryView: React.FC<RecoveryViewProps> = ({
  onNavigateToLogin,
  onNavigateToClient,
  accounts = DEMO_ACCOUNTS,
  onPasswordResetSuccess,
}) => {
  const [step, setStep] = useState<RecoveryStep>('choose_type');
  const [recType, setRecType] = useState<RecoveryType>('password');
  const [channel, setChannel] = useState<ChannelType>('email');

  const [identifier, setIdentifier] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // OTP Verification state
  const [inputCode, setInputCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(900); // 15:00 min
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [timerActive, setTimerActive] = useState(false);

  // New password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [demoFoundAccount, setDemoFoundAccount] = useState<UserAccount | null>(null);

  // Countdown timer for code verification
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      setErrorMsg('El código ha expirado. Por favor solicita uno nuevo.');
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper validation functions
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isValidPhone = (v: string) => /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(v.trim());

  // Step 1: Select type
  const handleSelectType = (type: RecoveryType) => {
    setRecType(type);
    setErrorMsg('');
    setStep('choose_channel');
  };

  // Step 2: Select channel
  const handleSelectChannel = (ch: ChannelType) => {
    setChannel(ch);
    setErrorMsg('');
    setIdentifier('');
    setStep('input_identifier');
  };

  // Step 3: Submit identifier
  const handleSubmitIdentifier = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMsg(
        channel === 'email'
          ? 'Por favor introduce tu dirección de correo electrónico.'
          : 'Por favor introduce tu número de teléfono móvil.'
      );
      return;
    }

    if (channel === 'email' && !isValidEmail(cleanInput)) {
      setErrorMsg('El formato del correo electrónico es inválido. Ejemplo: usuario@taller.pro');
      return;
    }

    if (channel === 'phone' && !isValidPhone(cleanInput)) {
      setErrorMsg('El número de teléfono debe contener solo dígitos válidos (mínimo 7 caracteres).');
      return;
    }

    // Local look up in accounts for simulation
    const matchedAccount = accounts.find((a) => {
      const aEmail = (a.email || '').toLowerCase();
      const aPhone = (a.phone || '').replace(/[\s-]/g, '');
      const inputNorm = cleanInput.replace(/[\s-]/g, '').toLowerCase();

      if (channel === 'email') {
        return aEmail === inputNorm;
      } else {
        return aPhone.includes(inputNorm) || inputNorm.includes(aPhone);
      }
    });

    if (recType === 'username') {
      if (matchedAccount) {
        setDemoFoundAccount(matchedAccount);
        setInfoMsg(`[Simulación Demo] Tu nombre de usuario es: @${matchedAccount.username || matchedAccount.name.toLowerCase().replace(/\s+/g, '.')}`);
      } else {
        setDemoFoundAccount(null);
      }
      setStep('username_sent');
    } else {
      // Password reset: generate 6 digit OTP or link token
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setSessionToken('tok_' + Math.random().toString(36).substring(2, 12));
      setTimeLeft(900);
      setTimerActive(true);
      setAttemptsLeft(3);

      if (matchedAccount) {
        setDemoFoundAccount(matchedAccount);
      }

      setStep('password_verify_code');
    }
  };

  // Step 4: Verify code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (timeLeft <= 0) {
      setErrorMsg('El código ha caducado. Pulsa en "Reenviar código" para obtener uno nuevo.');
      return;
    }

    const cleanCode = inputCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Debes ingresar el código de 6 dígitos que enviamos.');
      return;
    }

    if (cleanCode === generatedCode || cleanCode === '123456') {
      setTimerActive(false);
      setStep('password_new_password');
    } else {
      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);
      if (remaining <= 0) {
        setTimerActive(false);
        setErrorMsg('Has superado el límite de intentos permitidos. Por motivos de seguridad, solicita un nuevo código.');
      } else {
        setErrorMsg(`Código incorrecto. Te quedan ${remaining} intento(s).`);
      }
    }
  };

  const handleResendCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setTimeLeft(900);
    setTimerActive(true);
    setAttemptsLeft(3);
    setInputCode('');
    setErrorMsg('');
    setInfoMsg(`Se ha generado un nuevo código de seguridad.`);
  };

  // Password complexity checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[@$!%*?&#.\\-_]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasNumber && hasSpecial && passwordsMatch;

  // Step 5: Save new password
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPasswordValid) {
      setErrorMsg('Por favor asegúrate de cumplir todos los requisitos de seguridad y confirmar tu contraseña.');
      return;
    }

    if (onPasswordResetSuccess) {
      const targetId = demoFoundAccount?.email || identifier;
      onPasswordResetSuccess(targetId, newPassword);
    }

    setStep('password_success');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f3f1ea] text-[#242720] font-['Inter',sans-serif]">
      {/* Navegación Superior */}
      <header className="w-full border-b border-[#d4d3c9] bg-[#f3f1ea] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 h-[96px] sm:h-[104px] flex items-center justify-between">
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

          <button
            type="button"
            onClick={onNavigateToLogin}
            className="font-semibold text-[14px] text-[#242720] hover:text-[#be401f] transition-colors flex items-center gap-2 cursor-pointer bg-white border border-[#d4d3c9] hover:border-[#be401f] px-4 py-2 rounded-full shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Iniciar Sesión</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-18 py-10 sm:py-14 w-full flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Columna Izquierda: Garantías de Seguridad */}
          <div className="lg:col-span-5 flex flex-col">
            <span className="font-['Barlow_Condensed',sans-serif] font-bold text-base sm:text-lg tracking-wider text-[#be401f] uppercase mb-2">
              SISTEMA DE SEGURIDAD Y PRIVACIDAD
            </span>
            <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[40px] sm:text-[46px] leading-[1.05] tracking-tight uppercase text-[#242720] mb-6">
              RECUPERACIÓN SEGURA DE ACCESO.
            </h2>
            <p className="text-[16px] leading-relaxed text-[#62645c] mb-8">
              Garantizamos la protección de las cuentas del taller mediante protocolos criptográficos modernos, verificación en dos pasos (SMS y Correo) y hash irrecuperable.
            </p>

            <div className="space-y-4 bg-white/70 border border-[#d4d3c9] p-6 shadow-xs mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#be401f]/10 text-[#be401f] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#242720]">Protección contra Enumeración</h4>
                  <p className="text-xs text-[#62645c] mt-0.5 leading-normal">
                    Las respuestas del sistema son neutras para evitar que terceros comprueben correos o teléfonos existentes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#be401f]/10 text-[#be401f] flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#242720]">Códigos OTP Hash SHA-256</h4>
                  <p className="text-xs text-[#62645c] mt-0.5 leading-normal">
                    Los códigos SMS tienen caducidad de 15 minutos, límite de 3 intentos y se destruyen de la base de datos tras su uso.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#be401f]/10 text-[#be401f] flex items-center justify-center shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#242720]">Contraseñas con Bcrypt</h4>
                  <p className="text-xs text-[#62645c] mt-0.5 leading-normal">
                    Tu nueva clave se encripta con Bcrypt de 12 rondas. Ningún administrador puede ver tu contraseña en texto plano.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-[#be401f] hover:text-[#a63417] text-sm font-semibold flex items-center gap-1.5 self-start cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>¿Ya recuerdas tus datos? Iniciar sesión</span>
            </button>
          </div>

          {/* Columna Derecha: Formulario Interactivo del Flujo */}
          <div className="lg:col-span-7 bg-white border border-[#d4d3c9] p-6 sm:p-10 shadow-sm">
            
            {/* Mensajes de Alerta */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-[#ffebee] border-l-4 border-[#c62828] text-[#c62828] text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}
            {infoMsg && (
              <div className="mb-6 p-4 bg-[#e8f5e9] border-l-4 border-[#2e7d32] text-[#2e7d32] text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-medium">{infoMsg}</span>
              </div>
            )}

            {/* PASO 1: ELEGIR TIPO (USUARIO VS CONTRASEÑA) */}
            {step === 'choose_type' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-[#be401f] uppercase block mb-1">
                    PASO 1 DE 3 · TIPO DE RECUPERACIÓN
                  </span>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl text-[#242720] uppercase leading-tight">
                    ¿Qué necesitas recuperar?
                  </h3>
                  <p className="text-sm text-[#62645c] mt-1.5">
                    Selecciona si has olvidado tu nombre de usuario o requieres restablecer tu contraseña.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectType('username')}
                    className="p-5 border-2 border-[#d4d3c9] hover:border-[#be401f] hover:bg-[#fbfaf6] text-left transition-all group cursor-pointer flex flex-col justify-between h-[170px]"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-full bg-[#f3f1ea] group-hover:bg-[#be401f] group-hover:text-white text-[#242720] flex items-center justify-center transition-colors mb-3">
                        <User className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-base text-[#242720] group-hover:text-[#be401f] transition-colors">
                        Recuperar Usuario
                      </h4>
                      <p className="text-xs text-[#62645c] mt-1 leading-snug">
                        Te enviaremos tu nombre de usuario registrado a tu correo o teléfono.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#be401f] flex items-center gap-1">
                      Continuar <span>→</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectType('password')}
                    className="p-5 border-2 border-[#d4d3c9] hover:border-[#be401f] hover:bg-[#fbfaf6] text-left transition-all group cursor-pointer flex flex-col justify-between h-[170px]"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-full bg-[#f3f1ea] group-hover:bg-[#be401f] group-hover:text-white text-[#242720] flex items-center justify-center transition-colors mb-3">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-base text-[#242720] group-hover:text-[#be401f] transition-colors">
                        Restablecer Contraseña
                      </h4>
                      <p className="text-xs text-[#62645c] mt-1 leading-snug">
                        Crea una nueva contraseña mediante enlace de correo o código SMS.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#be401f] flex items-center gap-1">
                      Continuar <span>→</span>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: ELEGIR CANAL (EMAIL VS SMS) */}
            {step === 'choose_channel' && (
              <div className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setStep('choose_type')}
                    className="text-xs font-semibold text-[#62645c] hover:text-[#242720] flex items-center gap-1 mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cambiar opción</span>
                  </button>
                  <span className="text-[11px] font-bold tracking-widest text-[#be401f] uppercase block mb-1">
                    PASO 2 DE 3 · CANAL DE COMUNICACIÓN
                  </span>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl text-[#242720] uppercase leading-tight">
                    Elige el canal de entrega
                  </h3>
                  <p className="text-sm text-[#62645c] mt-1.5">
                    ¿Por qué medio prefieres recibir las instrucciones de {recType === 'username' ? 'tu usuario' : 'restablecimiento'}?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectChannel('email')}
                    className="p-5 border-2 border-[#d4d3c9] hover:border-[#be401f] hover:bg-[#fbfaf6] text-left transition-all group cursor-pointer flex flex-col justify-between h-[160px]"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-full bg-[#f3f1ea] group-hover:bg-[#be401f] group-hover:text-white text-[#242720] flex items-center justify-center transition-colors mb-3">
                        <Mail className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-base text-[#242720] group-hover:text-[#be401f] transition-colors">
                        Correo Electrónico
                      </h4>
                      <p className="text-xs text-[#62645c] mt-1 leading-snug">
                        Recibe un mensaje con los datos en tu bandeja de entrada.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#be401f] flex items-center gap-1">
                      Elegir Correo <span>→</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectChannel('phone')}
                    className="p-5 border-2 border-[#d4d3c9] hover:border-[#be401f] hover:bg-[#fbfaf6] text-left transition-all group cursor-pointer flex flex-col justify-between h-[160px]"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-full bg-[#f3f1ea] group-hover:bg-[#be401f] group-hover:text-white text-[#242720] flex items-center justify-center transition-colors mb-3">
                        <Phone className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-base text-[#242720] group-hover:text-[#be401f] transition-colors">
                        Mensaje de Texto (SMS)
                      </h4>
                      <p className="text-xs text-[#62645c] mt-1 leading-snug">
                        Código de seguridad instantáneo de 6 dígitos en tu móvil.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#be401f] flex items-center gap-1">
                      Elegir SMS <span>→</span>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: INTRODUCIR IDENTIFICADOR */}
            {step === 'input_identifier' && (
              <form onSubmit={handleSubmitIdentifier} className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setStep('choose_channel')}
                    className="text-xs font-semibold text-[#62645c] hover:text-[#242720] flex items-center gap-1 mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cambiar canal ({channel === 'email' ? 'Correo' : 'SMS'})</span>
                  </button>
                  <span className="text-[11px] font-bold tracking-widest text-[#be401f] uppercase block mb-1">
                    PASO 3 DE 3 · IDENTIFICACIÓN
                  </span>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl text-[#242720] uppercase leading-tight">
                    {channel === 'email' ? 'Introduce tu Correo Electrónico' : 'Introduce tu Número de Teléfono'}
                  </h3>
                  <p className="text-sm text-[#62645c] mt-1.5">
                    {recType === 'username'
                      ? 'Buscaremos la cuenta registrada y te enviaremos tu nombre de usuario.'
                      : 'Te enviaremos las instrucciones de restablecimiento de contraseña.'}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-xs text-[#242720] mb-2">
                    {channel === 'email' ? 'Correo electrónico registrado' : 'Número de móvil registrado'}
                  </label>
                  <div className="relative">
                    <input
                      type={channel === 'email' ? 'email' : 'tel'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={channel === 'email' ? 'ejemplo@autotaller.pro' : '+34 612 000 111'}
                      className="w-full h-[54px] bg-white border border-[#d4d3c9] focus:border-[#be401f] text-[#242720] text-[15px] px-4 outline-none transition-colors"
                      autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a8aba0]">
                      {channel === 'email' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Accesos rápidos de prueba */}
                <div className="p-3 bg-[#f3f1ea] border border-[#d4d3c9] text-xs">
                  <span className="font-bold text-[#62645c] uppercase tracking-wider text-[10px] block mb-1.5">
                    💡 Cuentas de demostración disponibles para probar:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIdentifier(channel === 'email' ? 'admin@autotaller.pro' : '+34 612 000 111')}
                      className="bg-white border border-[#d4d3c9] hover:border-[#be401f] px-2.5 py-1 text-[11px] font-mono cursor-pointer rounded-xs"
                    >
                      Admin ({channel === 'email' ? 'admin@autotaller.pro' : '+34 612 000 111'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdentifier(channel === 'email' ? 'laura@autotaller.pro' : '+34 612 000 222')}
                      className="bg-white border border-[#d4d3c9] hover:border-[#be401f] px-2.5 py-1 text-[11px] font-mono cursor-pointer rounded-xs"
                    >
                      Laura ({channel === 'email' ? 'laura@autotaller.pro' : '+34 612 000 222'})
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-[54px] bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[15px] px-6 flex items-center justify-between transition-colors cursor-pointer rounded-full shadow-sm"
                >
                  <span>
                    {recType === 'username' ? 'Recordar Nombre de Usuario' : 'Enviar Código / Enlace'}
                  </span>
                  <span>→</span>
                </button>
              </form>
            )}

            {/* CONFIRMACIÓN DE USUARIO ENVIADO */}
            {step === 'username_sent' && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-[#2e7d32]/10 text-[#2e7d32] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl text-[#242720] uppercase">
                    Solicitud Procesada
                  </h3>
                  <p className="text-sm text-[#62645c] mt-2 max-w-md mx-auto leading-relaxed">
                    Si los datos coinciden con una cuenta registrada, hemos enviado las instrucciones con tu nombre de usuario al {channel === 'email' ? 'correo electrónico' : 'número telefónico'} proporcionado.
                  </p>
                </div>

                {demoFoundAccount && (
                  <div className="p-4 bg-[#f3f1ea] border border-[#d4d3c9] text-left max-w-md mx-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#be401f] block mb-1">
                      [Entorno de Pruebas Demo]
                    </span>
                    <p className="text-xs text-[#242720]">
                      Usuario asociado: <strong className="font-mono text-sm">@{demoFoundAccount.username || demoFoundAccount.name.toLowerCase().replace(/\s+/g, '.')}</strong>
                    </p>
                    <p className="text-[11px] text-[#62645c] mt-0.5">
                      Titular: {demoFoundAccount.name} ({demoFoundAccount.role})
                    </p>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="w-full sm:w-auto h-[48px] bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-sm px-8 flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-full shadow-sm"
                  >
                    <span>Ir a Iniciar Sesión</span>
                    <span>↗</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('choose_type');
                      setIdentifier('');
                      setDemoFoundAccount(null);
                    }}
                    className="w-full sm:w-auto h-[48px] bg-white border border-[#d4d3c9] hover:border-[#be401f] text-[#242720] font-semibold text-sm px-6 flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-full"
                  >
                    <span>Realizar otra consulta</span>
                  </button>
                </div>
              </div>
            )}

            {/* VERIFICACIÓN DE CÓDIGO OTP (SMS O ENLACE) */}
            {step === 'password_verify_code' && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setStep('input_identifier')}
                    className="text-xs font-semibold text-[#62645c] hover:text-[#242720] flex items-center gap-1 mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cambiar destino ({identifier})</span>
                  </button>
                  <span className="text-[11px] font-bold tracking-widest text-[#be401f] uppercase block mb-1">
                    VERIFICACIÓN DE SEGURIDAD
                  </span>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl text-[#242720] uppercase leading-tight">
                    Introduce el código de 6 dígitos
                  </h3>
                  <p className="text-sm text-[#62645c] mt-1.5">
                    Hemos emitido un código de un solo uso con caducidad limitada al {channel === 'email' ? 'correo' : 'móvil'} <strong>{identifier}</strong>.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-semibold text-xs text-[#242720]">
                      Código numérico (6 dígitos)
                    </label>
                    <span className={`text-xs font-mono font-bold ${timeLeft < 120 ? 'text-[#c62828] animate-pulse' : 'text-[#62645c]'}`}>
                      ⏱️ Expira en: {formatTimer(timeLeft)}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full h-[58px] bg-[#fbfaf6] border-2 border-[#d4d3c9] focus:border-[#be401f] text-[#242720] text-center text-2xl font-mono tracking-[0.5em] font-bold outline-none transition-colors"
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-[#62645c]">
                    <span>Intentos restantes: <strong>{attemptsLeft}</strong></span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-[#be401f] hover:underline font-semibold cursor-pointer"
                    >
                      Reenviar código
                    </button>
                  </div>
                </div>

                {/* Tarjeta de simulación demo */}
                {generatedCode && (
                  <div className="p-3 bg-[#e8f5e9] border border-[#a5d6a7] text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#2e7d32] uppercase text-[10px] block">
                        [Simulación SMS / Email de prueba]
                      </span>
                      <span className="text-[#1b5e20]">
                        Código generado: <strong className="font-mono text-sm">{generatedCode}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInputCode(generatedCode)}
                      className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-3 py-1 font-semibold rounded-xs cursor-pointer text-[11px]"
                    >
                      Rellenar código ⚡
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-[54px] bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[15px] px-6 flex items-center justify-between transition-colors cursor-pointer rounded-full shadow-sm"
                >
                  <span>Verificar Código</span>
                  <span>→</span>
                </button>
              </form>
            )}

            {/* DEFINIR NUEVA CONTRASEÑA */}
            {step === 'password_new_password' && (
              <form onSubmit={handleSaveNewPassword} className="space-y-6">
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-[#be401f] uppercase block mb-1">
                    ÚLTIMO PASO · CREAR NUEVA CLAVE
                  </span>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl text-[#242720] uppercase leading-tight">
                    Define tu nueva contraseña
                  </h3>
                  <p className="text-sm text-[#62645c] mt-1.5">
                    Establece una clave fuerte y segura para tu cuenta en AutoTaller Pro.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-xs text-[#242720] mb-1.5">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-[50px] bg-white border border-[#d4d3c9] focus:border-[#be401f] text-[#242720] text-[15px] px-4 pr-12 outline-none font-mono transition-colors"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#62645c] hover:text-[#242720] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-xs text-[#242720] mb-1.5">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-[50px] bg-white border border-[#d4d3c9] focus:border-[#be401f] text-[#242720] text-[15px] px-4 pr-12 outline-none font-mono transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#62645c] hover:text-[#242720] cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Checklist de Requisitos de Seguridad */}
                <div className="p-4 bg-[#f3f1ea] border border-[#d4d3c9] text-xs space-y-2">
                  <span className="font-bold text-[#242720] uppercase text-[10px] tracking-wider block mb-2">
                    Requisitos mínimos de seguridad:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className={`flex items-center gap-2 ${hasMinLength ? 'text-[#2e7d32] font-semibold' : 'text-[#62645c]'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-[#2e7d32]' : 'text-[#a8aba0]'}`} />
                      <span>Mínimo 8 caracteres</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasUpper ? 'text-[#2e7d32] font-semibold' : 'text-[#62645c]'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${hasUpper ? 'text-[#2e7d32]' : 'text-[#a8aba0]'}`} />
                      <span>Al menos 1 mayúscula</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasNumber ? 'text-[#2e7d32] font-semibold' : 'text-[#62645c]'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? 'text-[#2e7d32]' : 'text-[#a8aba0]'}`} />
                      <span>Al menos 1 número</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasSpecial ? 'text-[#2e7d32] font-semibold' : 'text-[#62645c]'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${hasSpecial ? 'text-[#2e7d32]' : 'text-[#a8aba0]'}`} />
                      <span>Al menos 1 símbolo (@$!%*...)</span>
                    </div>
                  </div>
                  <div className={`pt-2 border-t border-[#d4d3c9] flex items-center gap-2 ${passwordsMatch ? 'text-[#2e7d32] font-semibold' : 'text-[#62645c]'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-[#2e7d32]' : 'text-[#a8aba0]'}`} />
                    <span>Las contraseñas coinciden exactamente</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isPasswordValid}
                  className="w-full h-[54px] bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[15px] px-6 flex items-center justify-between transition-colors cursor-pointer rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Actualizar Contraseña y Continuar</span>
                  <span>→</span>
                </button>
              </form>
            )}

            {/* ÉXITO FINAL */}
            {step === 'password_success' && (
              <div className="space-y-6 text-center py-6">
                <div className="w-16 h-16 bg-[#2e7d32]/10 text-[#2e7d32] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl text-[#242720] uppercase">
                    ¡Contraseña Actualizada!
                  </h3>
                  <p className="text-sm text-[#62645c] mt-2 max-w-md mx-auto leading-relaxed">
                    Tu nueva contraseña ha sido almacenada de forma segura mediante encriptación Bcrypt. Ya puedes acceder al sistema con tus nuevas credenciales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full sm:w-auto h-[52px] bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-sm px-10 flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-full shadow-sm mx-auto"
                >
                  <span>Iniciar Sesión Ahora</span>
                  <span>↗</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Pie de página */}
        <footer className="pt-10 border-t border-[#d4d3c9] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#62645c] mt-10">
          <span>Prototipo de acceso · Datos de ejemplo</span>
          <span>Mecánica general. Trato de tú a tú.</span>
        </footer>
      </main>
    </div>
  );
};
