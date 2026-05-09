import test from 'node:test';
import assert from 'node:assert/strict';
import { attemptLogin, parseLoginInput, sanitizeRedirect, type LoginDependencies } from '@/lib/auth-login';

const mockDeps: LoginDependencies = {
  findByCredentials: async () => null,
  comparePassword: async () => false,
  updateLastLogin: async () => undefined,
};

test('parseLoginInput usa identifier quando presente', () => {
  const parsed = parseLoginInput({
    identifier: 'TestUser',
    password: 'secret',
    redirect: '/reels',
  });

  assert.deepEqual(parsed, {
    identifier: 'TestUser',
    password: 'secret',
    redirectTo: '/reels',
  });
});

test('parseLoginInput supporta fallback legacy su email', () => {
  const parsed = parseLoginInput({
    email: 'legacy@example.com',
    password: 'secret',
  });

  assert.equal(parsed.identifier, 'legacy@example.com');
  assert.equal(parsed.password, 'secret');
  assert.equal(parsed.redirectTo, '/');
});

test('sanitizeRedirect blocca redirect esterni', () => {
  assert.equal(sanitizeRedirect('https://evil.example.com'), '/');
  assert.equal(sanitizeRedirect('//evil.example.com'), '/');
  assert.equal(sanitizeRedirect('/accounts/security'), '/accounts/security');
});

test('attemptLogin ritorna 400 con dati mancanti', async () => {
  const result = await attemptLogin(
    { identifier: '   ', password: '', redirectTo: '/' },
    mockDeps
  );

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    error: 'Identificatore e password sono obbligatori',
  });
});

test('attemptLogin ritorna 401 se utente non trovato', async () => {
  const result = await attemptLogin(
    { identifier: 'utente', password: 'secret', redirectTo: '/' },
    mockDeps
  );

  assert.deepEqual(result, {
    ok: false,
    status: 401,
    error: 'Credenziali non valide',
  });
});

test('attemptLogin ritorna 401 se password non valida', async () => {
  const deps: LoginDependencies = {
    findByCredentials: async () => ({
      id: 1,
      email: 'demo@example.com',
      username: 'demo',
      full_name: 'Demo User',
      password_hash: 'hashed',
    }),
    comparePassword: async () => false,
    updateLastLogin: async () => undefined,
  };

  const result = await attemptLogin(
    { identifier: 'demo', password: 'wrong', redirectTo: '/direct' },
    deps
  );

  assert.deepEqual(result, {
    ok: false,
    status: 401,
    error: 'Credenziali non valide',
  });
});

test('attemptLogin supporta login con telefono e successo', async () => {
  let updatedLoginUserId: number | null = null;
  const deps: LoginDependencies = {
    findByCredentials: async (identifier: string) => {
      assert.equal(identifier, '+393331234567');
      return {
        id: 22,
        email: null,
        username: 'phone.user',
        full_name: 'Phone User',
        password_hash: 'hashed',
      };
    },
    comparePassword: async (plain: string, hash: string) => {
      assert.equal(plain, 'pass123');
      assert.equal(hash, 'hashed');
      return true;
    },
    updateLastLogin: async (userId: number) => {
      updatedLoginUserId = userId;
    },
  };

  const result = await attemptLogin(
    { identifier: '+393331234567', password: 'pass123', redirectTo: '/direct' },
    deps
  );

  assert.equal(updatedLoginUserId, 22);
  assert.deepEqual(result, {
    ok: true,
    user: {
      id: 22,
      email: null,
      username: 'phone.user',
      full_name: 'Phone User',
    },
    redirectTo: '/direct',
  });
});
