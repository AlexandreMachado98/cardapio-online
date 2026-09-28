import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'cardapio-super-secret-key-change-in-prod';
  return new TextEncoder().encode(secret);
};

export async function signAdminToken(payload: { user: string; role: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());
  return token;
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { user: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('saborespeto_admin_token')?.value;
  
  if (!token) return null;
  
  return await verifyAdminToken(token);
}

// Helper to check authorization and return 401/403 if unauthorized
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session || session.role !== 'admin') {
    return false;
  }
  return true;
}
