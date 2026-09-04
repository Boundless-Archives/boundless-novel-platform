export type OfflineChapter = {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
};

export type OfflineBook = {
  storyId: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  downloadedAt: string;
  chapters: OfflineChapter[];
};

const DB_NAME = "boundless-offline";
const DB_VERSION = 1;
const STORE_NAME = "books";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "storyId",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error(
            "Failed to open offline storage."
          )
      );
    };
  });
}

export async function saveOfflineBook(
  book: OfflineBook
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    store.put(book);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();

      reject(
        transaction.error ??
          new Error(
            "Failed to save offline book."
          )
      );
    };
  });
}

export async function getOfflineBook(
  storyId: string
): Promise<OfflineBook | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.get(storyId);

    request.onsuccess = () => {
      db.close();
      resolve(request.result ?? null);
    };

    request.onerror = () => {
      db.close();

      reject(
        request.error ??
          new Error(
            "Failed to load offline book."
          )
      );
    };
  });
}

export async function getAllOfflineBooks(): Promise<
  OfflineBook[]
> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      db.close();

      const books =
        (request.result as OfflineBook[]) ?? [];

      books.sort(
        (a, b) =>
          new Date(b.downloadedAt).getTime() -
          new Date(a.downloadedAt).getTime()
      );

      resolve(books);
    };

    request.onerror = () => {
      db.close();

      reject(
        request.error ??
          new Error(
            "Failed to load offline books."
          )
      );
    };
  });
}

export async function deleteOfflineBook(
  storyId: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    store.delete(storyId);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();

      reject(
        transaction.error ??
          new Error(
            "Failed to delete offline book."
          )
      );
    };
  });
}

export async function isBookDownloaded(
  storyId: string
): Promise<boolean> {
  const book = await getOfflineBook(storyId);

  return !!book;
}