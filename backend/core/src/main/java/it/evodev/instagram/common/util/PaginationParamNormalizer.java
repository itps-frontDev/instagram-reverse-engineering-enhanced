package it.evodev.instagram.common.util;

import java.util.function.Supplier;

public final class PaginationParamNormalizer {

    private PaginationParamNormalizer() {
    }

    public static int normalizeLimit(
            Integer limit,
            int defaultLimit,
            int maxLimit,
            Supplier<? extends RuntimeException> validationExceptionSupplier
    ) {
        if (limit == null) {
            return defaultLimit;
        }
        if (limit < 1 || limit > maxLimit) {
            throw validationExceptionSupplier.get();
        }
        return limit;
    }

    public static int normalizeOffset(
            Integer offset,
            Supplier<? extends RuntimeException> validationExceptionSupplier
    ) {
        if (offset == null) {
            return 0;
        }
        if (offset < 0) {
            throw validationExceptionSupplier.get();
        }
        return offset;
    }
}
