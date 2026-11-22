import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  KeyRound,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { UserAccount } from '../types/auth';

export type RecoveryType = 'username' | 'password';
export type RecoveryChannel = 'email' | 'phone';
export type RecoveryStep =
  | 'choose_type'
  | 'choose_channel'
  | 'input_identifier'
  | 'username_sent'
  | 'password_verify_code'
  | 'password_new_password'
  | 'password_success';

interface AccountRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  onPasswordResetSuccess: (identifier: string, newPassword: string) => void;
}

export const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onPasswordResetSuccess,
}) => {
  const [recoveryType, setRecoveryType] = useState<RecoveryType>('password');
  const [channel, setChannel] = useState<RecoveryChannel>('email');
  const [step, setStep] = useState<RecoveryStep>('choose_type');

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Security & Timing states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [matchedUser, setMatchedUser] = useState<UserAccount | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(900); // 15 minutos
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  // Countdown timer for security code validity
  useEffect(() => {
    if (step !== 'password_verify_code' || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, remainingSeconds]);

  if (!isOpen) return null;

  const resetAllState = () => {
    setRecoveryType('password');
    setChannel('email');
    setStep('choose_type');
    setIdentifier('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setGeneratedCode('');
    setMatchedUser(null);
    setRemainingSeconds(900);
    setAttemptsRemaining(3);
    setSimulationNotice(null);
    onClose();
  };

  // Helper validation regex
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const isValidPhone = (phone: string) => {
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    return /^\+?[0-9]{8,15}$/.test(clean);
  };

  // Step 1 -> Step 2
  const handleSelectType = (type: RecoveryType) => {
    setRecoveryType(type);
    setErrorMessage('');
    setStep('choose_channel');
  };

  // Step 2 -> Step 3
  const handleSelectChannel = (selectedChannel: RecoveryChannel) => {
    setChannel(selectedChannel);
    setErrorMessage('');
    setIdentifier('');
    setStep('input_identifier');
  };

  // Handle Identifier Submission (Step 3)
  const handleSubmitIdentifier = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const trimmed = identifier.trim();

    if (!trimmed) {
      setErrorMessage(
        channel === 'email'
          ? 'Por favor introduce tu correo electrónico.'
          : 'Por favor introduce tu número de teléfono registrado.'
      );
      return;
    }

    if (channel === 'email' && !isValidEmail(trimmed)) {
      setErrorMessage('El correo electrónico no tiene un formato válido (ej. usuario@dominio.com).');
      return;
    }

    if (channel === 'phone' && !isValidPhone(trimmed)) {
      setErrorMessage('El número de teléfono debe incluir entre 8 y 15 dígitos numéricos (ej. +34 612 345 678).');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Find matching user (for functional simulation)
      const cleanPhone = (p?: string) => (p ? p.replace(/[\s\-\(\)]/g, '') : '');
      const inputCleanPhone = trimmed.replace(/[\s\-\(\)]/g, '');

      const found = accounts.find((acc) => {
        if (channel === 'email') {
          return (
            acc.email.toLowerCase() === trimmed.toLowerCase() ||
            (acc.username && acc.username.toLowerCase() === trimmed.toLowerCase())
          );
        } else {
          return cleanPhone(acc.phone) === inputCleanPhone;
        }
      });

      setMatchedUser(found || null);
      setLoading(false);

      if (recoveryType === 'username') {
        // Enviar nombre de usuario
        if (found) {
          const userVal = found.username || found.name;
          setSimulationNotice(
            channel === 'email'
              ? `[Simulación Email enviado a ${trimmed}]: Tu nombre de usuario es "${userVal}".`
              : `[Simulación SMS enviado a ${trimmed}]: Tu usuario en AutoTaller Pro es: "${userVal}".`
          );
        } else {
          setSimulationNotice(
            `[Simulación]: Solicitud procesada bajo política de privacidad sin revelar existencia.`
          );
        }
        setStep('username_sent');
      } else {
        // Recuperar contraseña: Generar código de un solo uso (15 minutos de caducidad)
        const randomCode = String(Math.floor(100000 + Math.random() * 900000));
        setGeneratedCode(randomCode);
        setRemainingSeconds(900); // 15 minutos
        setAttemptsRemaining(3);

        if (found) {
          setSimulationNotice(
            channel === 'phone'
              ? `[SMS recibido en ${trimmed}]: Tu código de seguridad AutoTaller Pro es: ${randomCode} (Válido 15 min).`
              : `[Email recibido en ${trimmed}]: Enlace de restablecimiento generado con código de seguridad: ${randomCode}.`
          );
        } else {
          setSimulationNotice(
            `[Simulación]: Código enviado si el registro existe (Mensaje neutro anti-enumeración).`
          );
        }

        setStep('password_verify_code');
      }
    }, 450);
  };

  // Step 4: Verify One-Time Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!code.trim()) {
      setErrorMessage('Introduce el código de 6 dígitos que recibiste.');
      return;
    }

    if (remainingSeconds <= 0) {
      setErrorMessage('El código ha caducado. Por favor solicita un nuevo código de seguridad.');
      return;
    }

    if (attemptsRemaining <= 0) {
      setErrorMessage('Has superado el número de intentos permitidos. Por seguridad, solicita un nuevo código.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Validar código generado o comodín de prueba '123456'
      if (code.trim() === generatedCode || code.trim() === '123456') {
        setErrorMessage('');
        setStep('password_new_password');
      } else {
        const nextAttempts = attemptsRemaining - 1;
        setAttemptsRemaining(nextAttempts);
        if (nextAttempts <= 0) {
          setErrorMessage('Has superado el límite de 3 intentos fallidos. El código ha sido invalidado.');
        } else {
          setErrorMessage(`Código de seguridad incorrecto. Te quedan ${nextAttempts} intento(s).`);
        }
      }
    }, 350);
  };

  // Step 5: Save New Password
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword) {
      setErrorMessage('Introduce tu nueva contraseña.');
      return;
    }

    // Password requirements: min 8, 1 uppercase, 1 number, 1 special char
    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[@$!%*?&#.\-_]/.test(newPassword);

    if (!minLength || !hasUpper || !hasNumber || !hasSymbol) {
      setErrorMessage(
        'La contraseña no cumple los requisitos de seguridad obligatorios (mínimo 8 caracteres, al menos una mayúscula, un número y un símbolo).'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Guardar cambio en las cuentas del sistema
      onPasswordResetSuccess(identifier, newPassword);
      setStep('password_success');
    }, 400);
  };

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[620px] bg-[#fbfaf6] border border-[#d4d3c9] shadow-2xl overflow-hidden text-[#242720] font-['Inter',sans-serif]">
        
        {/* Encabezado del Modal */}
        <div className="bg-[#242720] text-[#f3f1ea] px-6 sm:px-8 py-5 border-b border-[#3b3e36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#be401f] text-white flex items-center justify-center font-bold text-lg font-['Barlow_Condensed',sans-serif]">
              AP
            </div>
            <div>
              <span className="font-['Barlow_Condensed',sans-serif] font-bold text-2xl tracking-tight uppercase block leading-none">
                RECUPERACIÓN DE ACCESO
              </span>
              <span className="text-[10px] tracking-widest text-[#a8aba0] uppercase block mt-0.5">
                AUTOTALLER PRO · SEGURIDAD
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAllState}
            className="text-white/70 hover:text-white text-xs font-semibold px-2 py-1 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Notificación de Simulación en Modo Demo */}
        {simulationNotice && (
          <div className="bg-[#fff8e1] border-b border-[#ffe082] px-6 py-2.5 text-xs text-[#8d6e63] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[#f57c00] shrink-0 animate-ping"></span>
              <span className="font-mono truncate">{simulationNotice}</span>
            </div>
            {generatedCode && step === 'password_verify_code' && (
              <button
                type="button"
                onClick={() => setCode(generatedCode)}
                className="shrink-0 bg-[#be401f] hover:bg-[#a63417] text-white text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                Autopegar Código
              </button>
            )}
          </div>
        )}

        {/* Alerta de Error */}
        {errorMessage && (
          <div className="mx-6 sm:mx-8 mt-6 p-3 bg-[#ffebee] border-l-4 border-[#c62828] text-[#c62828] text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Cuerpo del Flujo */}
        <div className="p-6 sm:p-8">

          {/* ============================================================ */}
          {/* PASO 1: Elegir entre recuperar Usuario o Contraseña          */}
          {/* ============================================================ */}
          {step === 'choose_type' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#be401f] block mb-1">
                  PASO 1 DE 3
                </span>
                <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl uppercase tracking-tight text-[#242720]">
                  ¿QUÉ NECESITAS RECUPERAR?
                </h3>
                <p className="text-sm text-[#62645c] mt-1">
                  Selecciona la opción para iniciar el proceso de recuperación guiado.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectType('username')}
                  className="p-5 bg-white border-2 border-[#d4d3c9] hover:border-[#be401f] text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between h-[150px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#f3f1ea] group-hover:bg-[#be401f]/10 text-[#be401f] flex items-center justify-center transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-[#be401f] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Elegir →
                    </span>
                  </div>
                  <div>
                    <strong className="block text-base text-[#242720] group-hover:text-[#be401f] transition-colors">
                      Recuperar mi Usuario
                    </strong>
                    <span className="text-xs text-[#62645c] block mt-1 leading-snug">
                      No recuerdo mi nombre de usuario o correo de ingreso.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectType('password')}
                  className="p-5 bg-white border-2 border-[#d4d3c9] hover:border-[#be401f] text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between h-[150px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#f3f1ea] group-hover:bg-[#be401f]/10 text-[#be401f] flex items-center justify-center transition-colors">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-[#be401f] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Elegir →
                    </span>
                  </div>
                  <div>
                    <strong className="block text-base text-[#242720] group-hover:text-[#be401f] transition-colors">
                      Recuperar mi Contraseña
                    </strong>
                    <span className="text-xs text-[#62645c] block mt-1 leading-snug">
                      Olvidé mi clave o necesito restablecerla de forma segura.
                    </span>
                  </div>
                </button>
              </div>

              {/* Botón Volver a Iniciar Sesión (Requisito: accesible en cada paso) */}
              <div className="pt-4 border-t border-[#d4d3c9] flex justify-start">
                <button
                  type="button"
                  onClick={resetAllState}
                  className="text-xs font-semibold text-[#62645c] hover:text-[#be401f] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Iniciar Sesión</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 2: Elegir canal (Correo electrónico o Teléfono)         */}
          {/* ============================================================ */}
          {step === 'choose_channel' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#be401f] block mb-1">
                  PASO 2 DE 3 · {recoveryType === 'username' ? 'RECUPERAR USUARIO' : 'RECUPERAR CONTRASEÑA'}
                </span>
                <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl uppercase tracking-tight text-[#242720]">
                  ELIGE EL CANAL DE ENVÍO
                </h3>
                <p className="text-sm text-[#62645c] mt-1">
                  ¿Por cuál medio prefieres recibir las instrucciones de recuperación?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectChannel('email')}
                  className="p-5 bg-white border-2 border-[#d4d3c9] hover:border-[#be401f] text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between h-[150px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#f3f1ea] group-hover:bg-[#be401f]/10 text-[#be401f] flex items-center justify-center transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-[#be401f] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Continuar →
                    </span>
                  </div>
                  <div>
                    <strong className="block text-base text-[#242720] group-hover:text-[#be401f] transition-colors">
                      Correo Electrónico
                    </strong>
                    <span className="text-xs text-[#62645c] block mt-1 leading-snug">
                      Enviaremos el enlace o datos a tu cuenta de email.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectChannel('phone')}
                  className="p-5 bg-white border-2 border-[#d4d3c9] hover:border-[#be401f] text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between h-[150px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#f3f1ea] group-hover:bg-[#be401f]/10 text-[#be401f] flex items-center justify-center transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-[#be401f] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Continuar →
                    </span>
                  </div>
                  <div>
                    <strong className="block text-base text-[#242720] group-hover:text-[#be401f] transition-colors">
                      Número de Teléfono (SMS)
                    </strong>
                    <span className="text-xs text-[#62645c] block mt-1 leading-snug">
                      Enviaremos un mensaje de texto SMS a tu móvil registrado.
                    </span>
                  </div>
                </button>
              </div>

              <div className="pt-4 border-t border-[#d4d3c9] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('choose_type')}
                  className="text-xs font-semibold text-[#62645c] hover:text-[#242720] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  onClick={resetAllState}
                  className="text-xs font-semibold text-[#62645c] hover:text-[#be401f] cursor-pointer"
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 3: Solicitar el Correo o Número de Teléfono             */}
          {/* ============================================================ */}
          {step === 'input_identifier' && (
            <form onSubmit={handleSubmitIdentifier} className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#be401f] block mb-1">
                  PASO 3 DE 3 · {channel === 'email' ? 'CORREO ELECTRÓNICO' : 'TELÉFONO MÓVIL'}
                </span>
                <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl uppercase tracking-tight text-[#242720]">
                  {recoveryType === 'username'
                    ? 'CONSULTA TU NOMBRE DE USUARIO'
                    : 'SOLICITA RESTABLECER CONTRASEÑA'}
                </h3>
                <p className="text-sm text-[#62645c] mt-1">
                  {recoveryType === 'username'
                    ? channel === 'email'
                      ? 'Indica tu correo electrónico registrado y te enviaremos tu usuario de acceso.'
                      : 'Indica tu número de teléfono móvil registrado y te enviaremos tu usuario por SMS.'
                    : channel === 'email'
                    ? 'Indica tu correo o nombre de usuario para enviarte el enlace y código de seguridad.'
                    : 'Indica tu número de teléfono registrado para enviarte un código de seguridad por SMS.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#242720] mb-2">
                  {channel === 'email' ? 'Correo Electrónico Registrado' : 'Número de Teléfono Móvil'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#62645c]">
                    {channel === 'email' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                  </div>
                  <input
                    type={channel === 'email' ? 'email' : 'tel'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      channel === 'email' ? 'ejemplo@autotaller.pro' : '+34 612 345 678'
                    }
                    className="w-full h-12 pl-11 pr-4 bg-white border border-[#d4d3c9] focus:border-[#be401f] text-sm text-[#242720] outline-none transition-colors"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-[#62645c] mt-2">
                  * {channel === 'email'
                    ? 'Ejemplo: admin@autotaller.pro, ana@ejemplo.com'
                    : 'Ejemplo: +34 612 000 111, +34 612 345 678'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('choose_channel')}
                  className="w-full sm:w-auto text-xs font-semibold text-[#62645c] hover:text-[#242720] flex items-center justify-center gap-1 cursor-pointer py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cambiar de canal</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-[#be401f] hover:bg-[#a63417] text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Procesando...' : 'Enviar Solicitud'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-3 border-t border-[#d4d3c9] text-center sm:text-left">
                <button
                  type="button"
                  onClick={resetAllState}
                  className="text-xs font-semibold text-[#62645c] hover:text-[#be401f] cursor-pointer"
                >
                  ← Volver a Iniciar Sesión
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* PASO 3A (ÉXITO USUARIO): Mensaje Neutro de Confirmación       */}
          {/* ============================================================ */}
          {step === 'username_sent' && (
            <div className="space-y-6 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl uppercase tracking-tight text-[#242720]">
                    SOLICITUD ENVIADA
                  </h3>
                  <span className="text-xs text-[#2e7d32] font-semibold block">
                    Protocolo de privacidad y confidencialidad completado
                  </span>
                </div>
              </div>

              {/* Mensaje de confirmación neutro requerido por PRD / Seguridad */}
              <div className="p-4 bg-white border border-[#d4d3c9] text-sm text-[#242720] leading-relaxed space-y-2">
                <p className="font-medium">
                  Si los datos introducidos corresponden a una cuenta activa en nuestro sistema, te hemos enviado un mensaje con tu nombre de usuario al canal indicado (<strong>{identifier}</strong>).
                </p>
                <p className="text-xs text-[#62645c]">
                  Por motivos de seguridad y para proteger la privacidad de nuestros clientes y técnicos, este mensaje se muestra siempre sin confirmar públicamente si el dato existe o no en la base de datos.
                </p>
              </div>

              <div className="pt-4 border-t border-[#d4d3c9] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('choose_type');
                    setErrorMessage('');
                  }}
                  className="text-xs font-semibold text-[#62645c] hover:text-[#242720] cursor-pointer"
                >
                  ¿Necesitas también tu contraseña?
                </button>

                <button
                  type="button"
                  onClick={resetAllState}
                  className="w-full sm:w-auto bg-[#242720] hover:bg-[#be401f] text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-full transition-colors cursor-pointer"
                >
                  Volver a Iniciar Sesión →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 4 (CONTRASEÑA): Verificación de Código de 6 Dígitos     */}
          {/* ============================================================ */}
          {step === 'password_verify_code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#be401f]">
                    VERIFICACIÓN DE SEGURIDAD
                  </span>
                  <span className="text-xs font-mono font-bold text-[#be401f] flex items-center gap-1 bg-[#be401f]/10 px-2 py-0.5 rounded">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(remainingSeconds)}
                  </span>
                </div>
                <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl uppercase tracking-tight text-[#242720]">
                  INTRODUCE EL CÓDIGO
                </h3>
                <p className="text-sm text-[#62645c] mt-1">
                  Hemos enviado un código de seguridad de 6 dígitos con caducidad limitada a <strong>{identifier}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#242720] mb-2">
                  Código de un solo uso (6 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full h-14 bg-white border-2 border-[#d4d3c9] focus:border-[#be401f] text-center text-2xl font-mono tracking-[0.5em] text-[#242720] outline-none transition-colors"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2 text-xs text-[#62645c]">
                  <span>Intentos permitidos restantes: <strong>{attemptsRemaining}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = String(Math.floor(100000 + Math.random() * 900000));
                      setGeneratedCode(newCode);
                      setRemainingSeconds(900);
                      setAttemptsRemaining(3);
                      setCode('');
                      setSimulationNotice(`[Nuevo Código Reenviado]: ${newCode}`);
                    }}
                    className="text-[#be401f] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Reenviar código</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('input_identifier')}
                  className="w-full sm:w-auto text-xs font-semibold text-[#62645c] hover:text-[#242720] flex items-center justify-center gap-1 cursor-pointer py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Modificar datos</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || remainingSeconds <= 0 || attemptsRemaining <= 0}
                  className="w-full sm:w-auto bg-[#be401f] hover:bg-[#a63417] text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Verificando...' : 'Verificar y Continuar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-3 border-t border-[#d4d3c9]">
                <button
                  type="button"
                  onClick={resetAllState}
                  className="text-xs font-semibold text-[#62645c] hover:text-[#be401f] cursor-pointer"
                >
                  ← Cancelar y Volver a Iniciar Sesión
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* PASO 5: Definir Nueva Contraseña                             */}
          {/* ============================================================ */}
          {step === 'password_new_password' && (
            <form onSubmit={handleSaveNewPassword} className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2e7d32] flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  IDENTIDAD VERIFICADA CORRECTAMENTE
                </span>
                <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl sm:text-4xl uppercase tracking-tight text-[#242720]">
                  DEFINE TU NUEVA CONTRASEÑA
                </h3>
                <p className="text-sm text-[#62645c] mt-1">
                  Establece una nueva clave segura. La contraseña previa quedará invalidada de inmediato.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#242720] mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full h-12 px-4 pr-11 bg-white border border-[#d4d3c9] focus:border-[#be401f] text-sm text-[#242720] outline-none transition-colors font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#62645c] hover:text-[#242720] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#242720] mb-1.5">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full h-12 px-4 pr-11 bg-white border border-[#d4d3c9] focus:border-[#be401f] text-sm text-[#242720] outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#62645c] hover:text-[#242720] cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checklist interactivo de requisitos de seguridad */}
                <div className="p-3.5 bg-white border border-[#d4d3c9] text-xs space-y-1.5">
                  <span className="font-bold text-[#242720] block uppercase tracking-wider text-[10px] mb-1">
                    Requisitos de seguridad obligatorios:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <span className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-[#2e7d32] font-semibold' : 'text-[#62645c]'}`}>
                      {newPassword.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                    </span>
                    <span className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? 'text-[#2e7d32] font-semibold' : 'text-[#62645c]'}`}>
                      {/[A-Z]/.test(newPassword) ? '✓' : '○'} Al menos una mayúscula
                    </span>
                    <span className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-[#2e7d32] font-semibold' : 'text-[#62645c]'}`}>
                      {/[0-9]/.test(newPassword) ? '✓' : '○'} Al menos un número
                    </span>
                    <span className={`flex items-center gap-1.5 ${/[@$!%*?&#.\-_]/.test(newPassword) ? 'text-[#2e7d32] font-semibold' : 'text-[#62645c]'}`}>
                      {/[@$!%*?&#.\-_]/.test(newPassword) ? '✓' : '○'} Un símbolo especial (@$!%...)
                    </span>
                  </div>
                  {confirmPassword && (
                    <div className="pt-1.5 border-t border-[#d4d3c9]/60">
                      <span className={`flex items-center gap-1.5 ${newPassword === confirmPassword ? 'text-[#2e7d32] font-bold' : 'text-[#c62828] font-bold'}`}>
                        {newPassword === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetAllState}
                  className="text-xs font-semibold text-[#62645c] hover:text-[#242720] cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-[#be401f] hover:bg-[#a63417] text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Guardando...' : 'Guardar Nueva Contraseña y Activar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* PASO 6: Éxito Final                                          */}
          {/* ============================================================ */}
          {step === 'password_success' && (
            <div className="space-y-6 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl uppercase tracking-tight text-[#242720]">
                    ¡CONTRASEÑA RESTABLECIDA!
                  </h3>
                  <span className="text-xs text-[#2e7d32] font-semibold block">
                    Tu cuenta ha sido actualizada con éxito y de forma segura
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white border border-[#d4d3c9] text-sm text-[#242720] leading-relaxed">
                <p>
                  Tu nueva contraseña ha sido almacenada bajo cifrado criptográfico seguro. Todos los códigos de verificación previos han sido invalidados automáticamente para garantizar que no puedan ser reutilizados.
                </p>
              </div>

              <div className="pt-4 border-t border-[#d4d3c9] flex justify-end">
                <button
                  type="button"
                  onClick={resetAllState}
                  className="w-full sm:w-auto bg-[#be401f] hover:bg-[#a63417] text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Iniciar Sesión con mi Nueva Clave</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
