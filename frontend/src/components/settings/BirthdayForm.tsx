/**
 * @fileoverview Form data di nascita.
 * 
 * Form per modificare la data di nascita dell'utente.
 * 
 * FUNZIONALITÀ:
 * - 3 dropdown per giorno, mese, anno (stile Instagram)
 * - Conversione automatica da ISO string
 * - Salvataggio via server action (Spring Boot)
 * - Spinner durante invio
 * - Messaggio successo temporaneo
 * 
 * @module components/settings/BirthdayForm
 */

'use client';

import { useState } from 'react';
import { updateBirthdayAction } from '@/features/profile';
import { 
  PageHeader, 
  FormField, 
  DatePicker, 
  SuccessMessage, 
  SubmitButton,
  datePickerToISO,
  isoToDatePicker,
  type DatePickerValue 
} from '@/components/ui';

interface BirthdayFormProps {
  initialBirthday: string | null; // ISO date YYYY-MM-DD from server action
}

export default function BirthdayForm({ initialBirthday }: BirthdayFormProps) {
  const initialDate = isoToDatePicker(initialBirthday || '');
  
  const [birthday, setBirthday] = useState<DatePickerValue>(initialDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    const dateOfBirth = datePickerToISO(birthday);
    
    if (!dateOfBirth) {
      setErrorMessage('Seleziona una data valida');
      setIsSubmitting(false);
      return;
    }

    // Call server action
    const result = await updateBirthdayAction(dateOfBirth);

    if (!result.success) {
      setErrorMessage(result.error);
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage('Data di nascita aggiornata!');
    // Reset form with new birthday
    setBirthday(isoToDatePicker(result.data.birthday));
    setTimeout(() => setSuccessMessage(''), 3000);
    setIsSubmitting(false);
  };

  return (
    <div>
      <PageHeader title="Compleanno" />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <FormField
          label="Data di nascita"
          helperText="Questa informazione non farà parte del tuo profilo pubblico."
        >
          <DatePicker
            value={birthday}
            onChange={setBirthday}
          />
        </FormField>

        <SuccessMessage message={successMessage} variant="rounded-xl" />

        {/* Error Message */}
        {errorMessage && (
          <div 
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            role="alert"
          >
            <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <SubmitButton
            isSubmitting={isSubmitting}
            label="Salva"
          />
        </div>
      </form>
    </div>
  );
}
