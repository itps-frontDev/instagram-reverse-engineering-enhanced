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
    id: string | number;
    email: string | null;
    phone_number: string | null;
  };
}

export default function SecurityForm({ user }: SecurityFormProps) {
  const [formData, setFormData] = useState({
    email: user.email || '',
    phoneNumber: user.phone_number || '',
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
  const emailChanged = formData.email !== (user.email || '');
  const phoneChanged = formData.phoneNumber !== (user.phone_number || '');
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
      const res = await fetch('/api/profiles/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email || null,
          phone_number: formData.phoneNumber || null,
          current_password: formData.currentPassword || null,
          new_password: formData.newPassword || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Mappa errori ai campi appropriati
        if (errorData.error.includes('email') || errorData.error.includes('Email')) {
          setErrors(prev => ({ ...prev, email: errorData.error }));
        } else if (errorData.error.includes('password') || errorData.error.includes('Password')) {
          setErrors(prev => ({ ...prev, currentPassword: errorData.error }));
        } else if (errorData.error.includes('phone') || errorData.error.includes('telefono')) {
          setErrors(prev => ({ ...prev, phoneNumber: errorData.error }));
        } else {
          setErrors(prev => ({ ...prev, email: errorData.error }));
        }
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Impostazioni di sicurezza aggiornate!');
      // Pulisce i campi password
      setFormData({
        ...formData,
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
