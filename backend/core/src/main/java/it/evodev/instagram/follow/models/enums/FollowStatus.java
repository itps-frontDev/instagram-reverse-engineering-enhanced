package it.evodev.instagram.follow.models.enums;

/**
 * Stati possibili di un follow.
 *
 * Valori persistiti nel DB (colonna follows.status):
 *   PENDING  — richiesta inviata a un profilo privato, in attesa di approvazione
 *   ACCEPTED — follow attivo (profilo pubblico o richiesta accettata)
 *   REJECTED — richiesta rifiutata dal destinatario
 *
 * Valori virtuali (non persistiti, usati solo nelle risposte al client):
 *   NONE — nessuna relazione di follow tra i due profili
 *   SELF — il viewer è il proprietario del profilo
 */
public enum FollowStatus {

    PENDING("pending"),
    ACCEPTED("accepted"),
    REJECTED("rejected"),
    NONE("none"),
    SELF("self");

    private final String value;

    FollowStatus(String value) {
        this.value = value;
    }

    /** Restituisce la stringa lowercase da usare nel DB o nel JSON. */
    public String value() {
        return value;
    }

    /** Verifica se questa stringa corrisponde al valore dell'enum, case-insensitive. */
    public boolean equalsValue(String other) {
        return value.equalsIgnoreCase(other);
    }
}
