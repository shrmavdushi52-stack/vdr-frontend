const DB_NAME = "securevault-vdr";
const STORE_NAME = "uploads";
const DB_VERSION = 1;

export type StoredUpload = {
  id: string;
  document: Record<string, unknown>;
  blob: Blob;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open document storage."));
  });
}

export async function loadUploads(): Promise<StoredUpload[]> {
  const db = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).getAll();

      request.onsuccess = () => resolve(request.result as StoredUpload[]);
      request.onerror = () =>
        reject(request.error ?? new Error("Could not load saved documents."));
    });
  } finally {
    db.close();
  }
}

export async function saveUpload(
  id: string,
  document: Record<string, unknown>,
  file: Blob,
): Promise<void> {
  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      transaction.objectStore(STORE_NAME).put({
        id,
        document,
        blob: file,
      } satisfies StoredUpload);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not save document."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Document save was cancelled."));
    });
  } finally {
    db.close();
  }
}

export async function updateUploadMetadata(
  id: string,
  document: Record<string, unknown>,
): Promise<void> {
  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const existing = request.result as StoredUpload | undefined;

        // Built-in sample documents aren't stored in this database.
        if (!existing) {
          resolve();
          return;
        }

        store.put({
          ...existing,
          document,
        });
      };

      request.onerror = () =>
        reject(request.error ?? new Error("Could not update document."));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not update document."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Document update was cancelled."));
    });
  } finally {
    db.close();
  }
}

export async function deleteUpload(id: string): Promise<void> {
  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      transaction.objectStore(STORE_NAME).delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not delete document."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Document deletion was cancelled."));
    });
  } finally {
    db.close();
  }
}