/**
 * @fileoverview Form informazioni personali.
 * 
 * Form per modificare username e nome completo.
 * 
 * FUNZIONALITÀ:
 * - Modifica username (max 32 caratteri)
 * - Modifica nome completo (max 64 caratteri)
 * - Validazione real-time
 * - Controllo caratteri permessi username
 * - Verifica disponibilità username
 * - Messaggi errore specifici
 * 
 * @module components/settings/PersonalInfoForm
 */

'use client';

import { useState } from 'react';
import { 
  PageHeader, 
  FormField, 
  SuccessMessage, 
  SubmitButton,
  getInputClassName 
} from '@/components/ui';

interface PersonalInfoFormProps {
  profile: {
    id: number;
    username: string;
    full_name: string | null;
  };
}

export default function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState({
    username: profile.username,
    fullName: profile.full_name || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({
    username: '',
    fullName: '',
  });

  // Validazione client-side
  const validateUsername = (username: string): string => {
    if (!username.trim()) {
      return 'Il nome utente è obbligatorio';
    }
    if (username.length > 32) {
      return 'Il nome utente non può superare i 32 caratteri';
    }
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return 'Il nome utente può contenere solo lettere, numeri, punti e trattini bassi';
    }
    return '';
  };

  const validateFullName = (fullName: string): string => {
    if (fullName.length > 64) {
      return 'Il nome non può superare i 64 caratteri';
    }
    return '';
  };

  const handleUsernameChange = (value: string) => {
    setFormData({ ...formData, username: value });
    setErrors({ ...errors, username: validateUsername(value) });
  };

  const handleFullNameChange = (value: string) => {
    setFormData({ ...formData, fullName: value });
    setErrors({ ...errors, fullName: validateFullName(value) });
  };

  // Verifica se il form può essere inviato
  const isFormValid = !errors.username && 
    !errors.fullName && 
    (formData.username !== profile.username || formData.fullName !== (profile.full_name || '')) &&
    formData.username.trim() !== '' &&
    !validateUsername(formData.username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    // Validazione completa prima di inviare
    const usernameError = validateUsername(formData.username);
    const fullNameError = validateFullName(formData.fullName);

    if (usernameError || fullNameError) {
      setErrors({
        username: usernameError,
        fullName: fullNameError,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/profiles/personal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          full_name: formData.fullName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Mostra l'errore sotto il campo appropriato
        if (errorData.error.includes('username') || errorData.error.includes('Nome utente')) {
          setErrors({ ...errors, username: errorData.error });
        } else {
          setErrors({ ...errors, fullName: errorData.error });
        }
        return;
      }

      setSuccessMessage('Informazioni aggiornate con successo!');
      setErrors({ username: '', fullName: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating personal info:', err);
      setErrors({
        username: '',
        fullName: 'Si è verificato un errore. Riprova più tardi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Account personale" />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Username Field */}
        <FormField
          label="Nome utente"
          htmlFor="username"
          error={errors.username}
          helperText="Il nome utente può contenere solo lettere, numeri, punti e trattini bassi."
        >
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className={getInputClassName(!!errors.username)}
            maxLength={32}
            required
          />
        </FormField>

        {/* Full Name Field */}
        <FormField
          label="Nome"
          htmlFor="fullName"
          error={errors.fullName}
          helperText="Usa il tuo nome reale per aiutare gli amici a riconoscerti."
        >
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleFullNameChange(e.target.value)}
            className={getInputClassName(!!errors.fullName)}
            maxLength={64}
            placeholder="Nome completo"
          />
        </FormField>

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
