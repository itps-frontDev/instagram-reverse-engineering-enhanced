/**
 * @fileoverview Form sicurezza account.
 * 
 * Form per modificare password, email e numero di telefono.
 * 
 * FUNZIONALITÀ:
 * - Sezione cambio password
 *   - Password attuale obbligatoria
 *   - Nuova password con requisiti
 *   - Conferma password
 *   - Toggle visibilità password
 * - Sezione contatti
 *   - Modifica email con validazione
 *   - Modifica telefono con validazione
 * - Validazione real-time tutti i campi
 * 
 * @module components/settings/SecurityForm
 */

'use client';

import { useState } from 'react';
import { updateSecurityAction } from '@/features/profile';
import { 
  PageHeader, 
  FormField, 
  PasswordInput, 
  SuccessMessage, 
  SubmitButton,
  getInputClassName 
} from '@/components/ui';

interface SecurityFormProps {
  user: {
    email: string | null;
    phoneNumber: string | null;
  };
}

export default function SecurityForm({ user }: SecurityFormProps) {
  const [initialValues, setInitialValues] = useState({
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
  });
  const [formData, setFormData] = useState({
    email: initialValues.email,
    phoneNumber: initialValues.phoneNumber,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateEmail = (email: string): string => {
    if (email.length > 255) {
      return 'L\'email non può superare i 255 caratteri';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      return 'Inserisci un indirizzo email valido';
    }
    return '';
  };

  const validatePhoneNumber = (phone: string): string => {
    if (phone && !/^[\d\s\-+()]+$/.test(phone)) {
      return 'Il numero di telefono può contenere solo numeri, spazi, +, -, ( )';
    }
    return '';
  };

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    setErrors({ ...errors, email: validateEmail(value) });
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phoneNumber: value });
    setErrors({ ...errors, phoneNumber: validatePhoneNumber(value) });
  };

  const handlePasswordChange = (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  // Verifica se il form può essere inviato
  const hasErrors = Object.values(errors).some(error => error !== '');
  const emailChanged = formData.email !== initialValues.email;
  const phoneChanged = formData.phoneNumber !== initialValues.phoneNumber;
  const passwordChanging = formData.newPassword || formData.confirmPassword || formData.currentPassword;
  const hasChanges = emailChanged || phoneChanged || passwordChanging;
  const passwordFieldsComplete = !passwordChanging || (formData.currentPassword && formData.newPassword && formData.confirmPassword);
  const isFormValid = !hasErrors && hasChanges && passwordFieldsComplete;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrors({
      email: '',
      phoneNumber: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    // Validate passwords if attempting to change
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setErrors(prev => ({ ...prev, currentPassword: 'Inserisci la password attuale per cambiarla' }));
        setIsSubmitting(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Le nuove password non corrispondono' }));
        setIsSubmitting(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setErrors(prev => ({ ...prev, newPassword: 'La password deve contenere almeno 6 caratteri' }));
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const payload: {
        email?: string | null;
        phoneNumber?: string | null;
        currentPassword?: string;
        newPassword?: string;
      } = {};

      if (emailChanged) {
        payload.email = formData.email.trim() || null;
      }
      if (phoneChanged) {
        payload.phoneNumber = formData.phoneNumber.trim() || null;
      }
      if (formData.currentPassword || formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const result = await updateSecurityAction(payload);
      if (!result.success) {
        const message = result.error || 'Errore durante l\'aggiornamento delle impostazioni di sicurezza';
        if (message.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: message }));
        } else if (message.toLowerCase().includes('phone')) {
          setErrors(prev => ({ ...prev, phoneNumber: message }));
        } else if (message.toLowerCase().includes('password')) {
          setErrors(prev => ({ ...prev, currentPassword: message }));
        } else {
          setErrors(prev => ({ ...prev, email: message }));
        }
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Impostazioni di sicurezza aggiornate!');
      const nextEmail = result.data?.email ?? null;
      const nextPhoneNumber = result.data?.phoneNumber ?? null;
      setInitialValues({
        email: nextEmail || '',
        phoneNumber: nextPhoneNumber || '',
      });
      // Pulisce i campi password
      setFormData({
        email: nextEmail || '',
        phoneNumber: nextPhoneNumber || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating security settings:', err);
      setErrors(prev => ({ ...prev, email: 'Si è verificato un errore. Riprova più tardi.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Sicurezza e accesso" />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Email Field */}
        <FormField
          label="Email"
          htmlFor="email"
          error={errors.email}
          helperText="Useremo questa email per inviarti notifiche importanti."
        >
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={getInputClassName(!!errors.email)}
            placeholder="email@esempio.com"
          />
        </FormField>

        {/* Phone Number Field */}
        <FormField
          label="Numero di telefono"
          htmlFor="phoneNumber"
          error={errors.phoneNumber}
          helperText="Aggiungi un numero di telefono per recuperare il tuo account."
        >
          <input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={getInputClassName(!!errors.phoneNumber)}
            placeholder="+39 123 456 7890"
            pattern="[\d\s\-+()]+"
            maxLength={15}
          />
        </FormField>

        {/* Divider */}
        <div className="my-8 border-t border-gray-200 dark:border-gray-700" />

        {/* Password Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">Cambia password</h2>
          
          {/* Current Password */}
          <FormField
            label="Password attuale"
            htmlFor="currentPassword"
            error={errors.currentPassword}
            labelSize="sm"
          >
            <PasswordInput
              id="currentPassword"
              value={formData.currentPassword}
              onChange={(value) => handlePasswordChange('currentPassword', value)}
              placeholder="Password attuale"
              hasError={!!errors.currentPassword}
              autoComplete="current-password"
            />
          </FormField>

          {/* New Password */}
          <FormField
            label="Nuova password"
            htmlFor="newPassword"
            error={errors.newPassword}
            labelSize="sm"
          >
            <PasswordInput
              id="newPassword"
              value={formData.newPassword}
              onChange={(value) => handlePasswordChange('newPassword', value)}
              placeholder="Nuova password"
              hasError={!!errors.newPassword}
              autoComplete="new-password"
            />
          </FormField>

          {/* Confirm Password */}
          <FormField
            label="Conferma nuova password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword}
            labelSize="sm"
          >
            <PasswordInput
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(value) => handlePasswordChange('confirmPassword', value)}
              placeholder="Conferma nuova password"
              hasError={!!errors.confirmPassword}
              autoComplete="new-password"
            />
          </FormField>

          <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] leading-4">
            La password deve contenere almeno 6 caratteri.
          </p>
        </div>

        <SuccessMessage message={successMessage} />

        {/* Submit Button */}
        <div className="flex justify-end">
          <SubmitButton
            isSubmitting={isSubmitting}
            disabled={!isFormValid}
            label="Invia"
          />
        </div>
      </form>
    </div>
  );
}
