/**
 * Google Drive & Firebase Auth service
 * In-memory token management as per Google Workspace Integration guidelines
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';

// Read config from firebase-applet-config.json
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline'
});

// CRITICAL: In-memory token cache (NEVER stored in localStorage or sessionStorage)
let inMemoryAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface GoogleDriveUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
  webViewLink?: string;
}

/**
 * Sign in with Google Popup and cache access token in memory
 */
export async function signInWithGoogle(): Promise<{ user: GoogleDriveUser; token: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Không nhận được Google Access Token từ quá trình đăng nhập.');
    }

    // Cache in memory only
    inMemoryAccessToken = token;
    tokenExpiresAt = Date.now() + 3500 * 1000; // ~1 hour validity

    return {
      user: {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      },
      token,
    };
  } catch (error: any) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

/**
 * Get active in-memory Google Access Token
 */
export function getAccessToken(): string | null {
  if (inMemoryAccessToken && Date.now() < tokenExpiresAt) {
    return inMemoryAccessToken;
  }
  return null;
}

/**
 * Sign out and clear in-memory token
 */
export async function logoutGoogle(): Promise<void> {
  inMemoryAccessToken = null;
  tokenExpiresAt = 0;
  await signOut(auth);
}

/**
 * Listen to auth state changes
 */
export function subscribeToAuth(callback: (user: GoogleDriveUser | null) => void) {
  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      });
    } else {
      inMemoryAccessToken = null;
      tokenExpiresAt = 0;
      callback(null);
    }
  });
}

/**
 * Search/List PDF files from user's Google Drive
 */
export async function listGoogleDrivePdfFiles(searchTerm?: string): Promise<GoogleDriveFile[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Vui lòng đăng nhập Google Drive để tải danh sách file.');
  }

  let query = "mimeType = 'application/pdf' and trashed = false";
  if (searchTerm && searchTerm.trim()) {
    const safeTerm = searchTerm.replace(/'/g, "\\'");
    query += ` and name contains '${safeTerm}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.append('q', query);
  url.searchParams.append('pageSize', '30');
  url.searchParams.append('fields', 'files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink)');
  url.searchParams.append('orderBy', 'modifiedTime desc');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      inMemoryAccessToken = null;
      throw new Error('Phiên đăng nhập Google Drive đã hết hạn. Vui lòng kết nối lại tài khoản.');
    }
    const errText = await res.text();
    throw new Error(`Lỗi tải danh mục Google Drive: ${errText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Download a PDF file from Google Drive as a File/Blob
 */
export async function downloadGoogleDriveFile(fileId: string, fileName: string): Promise<File> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Chưa có quyền truy cập Google Drive. Vui lòng đăng nhập lại.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Không thể tải tệp từ Google Drive (mã lỗi ${res.status})`);
  }

  const blob = await res.blob();
  return new File([blob], fileName, { type: 'application/pdf' });
}

/**
 * Upload an Excel Audit Report back to Google Drive
 * Must be called only after user confirmation
 */
export async function uploadExcelReportToGoogleDrive(
  excelBlob: Blob, 
  fileName: string = `Bao_Cao_Kiem_Soat_Cong_Nhat_${new Date().toISOString().slice(0, 10)}.xlsx`
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Chưa có quyền truy cập Google Drive để lưu tệp.');
  }

  const metadata = {
    name: fileName,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', excelBlob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Không thể lưu báo cáo lên Google Drive: ${errorText}`);
  }

  return await res.json();
}
