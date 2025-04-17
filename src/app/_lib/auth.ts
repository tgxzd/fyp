import { verify, sign } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Cookie and JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_NAME = 'session_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 days
};

// Types
export type User = {
  id: string;
  name: string | null;
  email: string;
};

export type AuthResult = {
  success: boolean;
  message?: string;
  user?: User;
};

/**
 * JWT token utilities
 */
export async function generateToken(user: User): Promise<string> {
  const { id, email, name } = user;
  return sign({ id, email, name }, JWT_SECRET, { expiresIn: '30d' });
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    return verify(token, JWT_SECRET) as User;
  } catch {
    return null;
  }
}

/**
 * Password utilities
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Session utilities
 */
export async function getSession(): Promise<{ user: User | null; isAuthenticated: boolean }> {
  // Get the session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return { user: null, isAuthenticated: false };
  }
  
  // Verify the token
  const user = await verifyToken(token);
  return {
    user,
    isAuthenticated: !!user,
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const { user } = await getSession();
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/**
 * Authentication action handlers (for use in API routes and Server Actions)
 */

// Login action for use in Route Handlers
export async function loginHandler(email: string, password: string): Promise<NextResponse> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const isMatch = await comparePassword(password, user.password);
    
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const token = await generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    
    // Create a success response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
    
    // Set the cookie on the response
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      ...COOKIE_OPTIONS,
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

// Register action for use in Route Handlers
export async function registerHandler(name: string, email: string, password: string): Promise<NextResponse> {
  try {
    console.log('registerHandler called with:', { name, email });
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 409 }
      );
    }
    
    const hashedPassword = await hashPassword(password);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    
    const token = await generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });
    
    // Create a success response
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      }
    });
    
    // Set the cookie on the response
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      ...COOKIE_OPTIONS,
    });
    
    return response;
  } catch (error) {
    console.error('Registration error details in handler:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

// Logout action for use in Route Handlers
export function logoutHandler(): NextResponse {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}

/**
 * Server Action (form-based) authentication
 */

// Login action for use in Server Components
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    const isMatch = await comparePassword(password, user.password);
    
    if (!isMatch) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    const token = await generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    
    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: COOKIE_NAME,
      value: token,
      ...COOKIE_OPTIONS
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during login' };
  }
}

// Register action for use in Server Components
export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      return { success: false, message: 'User already exists' };
    }
    
    const hashedPassword = await hashPassword(password);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    
    const token = await generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });
    
    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: COOKIE_NAME,
      value: token,
      ...COOKIE_OPTIONS
    });
    
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'An error occurred during registration' };
  }
}

// Logout action for use in Server Components
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Form handlers for Server Actions
 */
export async function handleLogin(formData: FormData) {
  'use server';
  
  // Extract form data
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate inputs
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  if (!isValidEmail(email)) {
    return { error: 'Please enter a valid email address' };
  }

  // Authenticate user
  try {
    const result = await login(email, password);
    
    if (!result.success) {
      return { error: result.message || 'Invalid credentials' };
    }
    
    // Login successful
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function handleRegister(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  'use server';
  
  // Extract form data
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validate inputs
  if (!name || !email || !password || !confirmPassword) {
    return {
      error: 'All fields are required',
    };
  }

  if (!isValidEmail(email)) {
    return {
      error: 'Please enter a valid email address',
    };
  }

  if (password !== confirmPassword) {
    return {
      error: 'Passwords do not match',
    };
  }

  if (password.length < 8) {
    return {
      error: 'Password must be at least 8 characters long',
    };
  }

  // Register user
  try {
    const result = await register(name, email, password);
    
    if (!result.success) {
      return {
        error: result.message || 'Failed to register',
      };
    }
    
    // Registration successful
    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
