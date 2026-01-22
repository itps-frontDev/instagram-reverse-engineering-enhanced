/**
 * @fileoverview Form data di nascita.
 * 
 * Form per modificare la data di nascita dell'utente.
 * 
 * FUNZIONALITÀ:
 * - 3 dropdown per giorno, mese, anno (stile Instagram)
 * - Conversione automatica da datetime
 * - Salvataggio via API
 * - Spinner durante invio
 * - Messaggio successo temporaneo
 * 
 * @module components/settings/BirthdayForm
 */

'use client';

import { useState } from 'react';
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
  user: {
    id: number;
    date_of_birth: string;
  };
}

export default function BirthdayForm({ user }: BirthdayFormProps) {
  // Parse della data esistente (formato YYYY-MM-DD o datetime)
  const datePart = user.date_of_birth.split('T')[0] || user.date_of_birth.split(' ')[0];
  const initialDate = isoToDatePicker(datePart);
  
  const [birthday, setBirthday] = useState<DatePickerValue>(initialDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    const dateOfBirth = datePickerToISO(birthday);
    
    if (!dateOfBirth) {
      alert('Seleziona una data valida');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/profiles/birthday', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_of_birth: dateOfBirth,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update birthday');
      }

      setSuccessMessage('Data di nascita aggiornata!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating birthday:', err);
      alert(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento');
    } finally {
      setIsSubmitting(false);
    }
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
