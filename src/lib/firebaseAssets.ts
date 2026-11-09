import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firebaseError';

const CHUNK_SIZE = 600000; // ~600KB per chunk to safely stay under Firestore's 1MB limit

/**
 * Saves a base64 string (PDF, image, logo) to Firestore as a unique, immutable versioned asset.
 * Never overwrites existing published asset documents or chunks.
 * Performs rigorous chunk verification and reconstructed length checks BEFORE committing header doc.
 * Returns reference key string (e.g., 'ref:pdf_report1_v_m5x2a_k91z').
 */
export async function saveAssetToFirestore(
  assetType: 'pdf' | 'img' | 'logo', 
  id: string, 
  dataUrl: string
): Promise<string> {
  if (!id || !dataUrl) return '';

  // If already a reference or external HTTP URL, return as-is
  if (!dataUrl.startsWith('data:')) {
    return dataUrl;
  }

  // Validate supported Base64 format
  if (!dataUrl.startsWith('data:application/pdf;') && !dataUrl.startsWith('data:image/') && !dataUrl.startsWith('data:font/')) {
    throw new Error(`Invalid asset encoding format for ${id}. Must be a valid Base64 data URL.`);
  }

  const cleanId = id.replace(/[\/\s#?\[\]]/gi, '_');
  // Generate immutable asset version tag: timestamp + random nonce
  const assetVersion = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const docKey = `${assetType}_${cleanId}_v_${assetVersion}`;
  const path = `cms/${docKey}`;

  try {
    if (dataUrl.length <= CHUNK_SIZE) {
      await setDoc(doc(db, 'cms', docKey), {
        id: docKey,
        originalId: cleanId,
        assetType,
        version: assetVersion,
        dataUrl,
        sizeBytes: dataUrl.length,
        chunksCount: 1,
        status: 'verified',
        updatedAt: Date.now()
      });
    } else {
      const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
      const chunkPromises = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunk = dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkRef = doc(db, 'cms', `${docKey}_chunk_${i}`);
        chunkPromises.push(
          setDoc(chunkRef, {
            chunk,
            index: i,
            totalChunks,
            id: docKey,
            originalId: cleanId
          })
        );
      }

      // Stage 2: Wait for all chunk writes to complete
      await Promise.all(chunkPromises);

      // Stage 3: Verification Read & Length Integrity Check
      const verifyPromises = [];
      for (let i = 0; i < totalChunks; i++) {
        verifyPromises.push(getDoc(doc(db, 'cms', `${docKey}_chunk_${i}`)));
      }
      const verifySnaps = await Promise.all(verifyPromises);

      let reconstructedLen = 0;
      for (let i = 0; i < totalChunks; i++) {
        const cSnap = verifySnaps[i];
        if (!cSnap.exists()) {
          throw new Error(`Verification failed: Chunk ${i} of ${totalChunks} missing for ${docKey}`);
        }
        reconstructedLen += (cSnap.data().chunk || '').length;
      }

      if (reconstructedLen !== dataUrl.length) {
        throw new Error(`Integrity check failed for ${docKey}: expected ${dataUrl.length} chars, reconstructed ${reconstructedLen}`);
      }

      // Stage 4: Commit verified asset header metadata
      await setDoc(doc(db, 'cms', docKey), {
        id: docKey,
        originalId: cleanId,
        assetType,
        version: assetVersion,
        sizeBytes: dataUrl.length,
        chunksCount: totalChunks,
        status: 'verified',
        updatedAt: Date.now()
      });
    }

    return `ref:${docKey}`;
  } catch (err) {
    console.error(`Error saving versioned ${assetType} asset for ${cleanId} to Firestore:`, err);
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

/**
 * Loads a chunked or single base64 asset from Firestore.
 * Ensures strict version resolution without silent fallback to older assets.
 */
export async function loadAssetFromFirestore(
  assetType: 'pdf' | 'img' | 'logo', 
  idOrRefKey: string
): Promise<string | null> {
  if (!idOrRefKey) return null;

  // Clean input key: strip 'ref:' prefix if present
  let cleanKey = idOrRefKey.startsWith('ref:') ? idOrRefKey.replace('ref:', '') : idOrRefKey;
  cleanKey = cleanKey.replace(/[\/\s#?\[\]]/gi, '_');

  // Determine doc ID in cms collection
  const docKey = cleanKey.startsWith(`${assetType}_`) ? cleanKey : `${assetType}_${cleanKey}`;
  const path = `cms/${docKey}`;

  // Retry up to 2 times for transient offline states during initial app initialization
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const mainRef = doc(db, 'cms', docKey);
      const snap = await getDoc(mainRef);

      if (!snap.exists()) {
        return null;
      }

      const data = snap.data();
      if (data.dataUrl) return data.dataUrl;
      if (data.logo) return data.logo;
      if (data.pdfUrl) return data.pdfUrl;

      if (data.chunksCount && data.chunksCount > 1) {
        const resolvedDocKey = snap.id;
        const chunkPromises = [];
        for (let i = 0; i < data.chunksCount; i++) {
          chunkPromises.push(getDoc(doc(db, 'cms', `${resolvedDocKey}_chunk_${i}`)));
        }
        const chunkSnaps = await Promise.all(chunkPromises);
        let fullStr = '';
        for (let i = 0; i < chunkSnaps.length; i++) {
          const cSnap = chunkSnaps[i];
          if (!cSnap.exists()) {
            console.warn(`Corrupted asset ${resolvedDocKey}: missing chunk index ${i}`);
            return null;
          }
          fullStr += cSnap.data().chunk || '';
        }

        // Verify reconstructed length matches declared metadata if available
        if (data.sizeBytes && fullStr.length !== data.sizeBytes) {
          console.warn(`Asset integrity notice for ${resolvedDocKey}: expected ${data.sizeBytes} chars, got ${fullStr.length}`);
          return null;
        }

        return fullStr || null;
      }

      return null;
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      const isOffline = msg.includes('client is offline') || msg.includes('offline');
      const isPermissionDenied = err?.code === 'permission-denied' || msg.toLowerCase().includes('permission');

      if (isPermissionDenied) {
        handleFirestoreError(err, OperationType.GET, path);
        return null;
      }

      if (isOffline && attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }

      console.warn(`Could not load asset ${docKey}:`, msg);
      return null;
    }
  }
  return null;
}

/**
 * Recursively removes any undefined values from objects/arrays to prevent Firestore errors.
 */
export function removeUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      clean[key] = removeUndefined(obj[key]);
    }
  }
  return clean;
}

/**
 * Protected collections that must never be wiped by an empty array write.
 */
const PROTECTED_ARRAY_DOCS = new Set([
  'reports', 'weekly', 'announcements', 'dcm_publications',
  'diary_nat', 'diary_loc', 'diary_afr', 'diary_oth', 'events', 'team'
]);

/**
 * Sanitizes an array of CMS items before saving to main Firestore array doc.
 * Heavy base64 fields are saved to versioned asset docs and replaced with reference keys.
 * Protected against accidental empty-array wipes.
 */
export async function sanitizeAndSyncItems(docName: string, items: any[]): Promise<void> {
  if (!Array.isArray(items)) return;

  // SAFETY GUARD: Prevent overwriting populated production collections with empty arrays
  if (PROTECTED_ARRAY_DOCS.has(docName) && items.length === 0) {
    console.warn(`[Safety Guard] Blocked attempt to overwrite cms/${docName} with an empty array.`);
    return;
  }

  const sanitizedItems = [];
  for (const item of items) {
    if (!item || !item.id) continue;
    const itemCopy = { ...item };

    // Heavy PDF
    if (itemCopy.pdfUrl && itemCopy.pdfUrl.startsWith('data:')) {
      const refKey = await saveAssetToFirestore('pdf', itemCopy.id, itemCopy.pdfUrl);
      itemCopy.pdfUrl = refKey;
    }

    // Heavy Image
    if (itemCopy.image && itemCopy.image.startsWith('data:')) {
      const refKey = await saveAssetToFirestore('img', itemCopy.id, itemCopy.image);
      itemCopy.image = refKey;
    }

    sanitizedItems.push(removeUndefined(itemCopy));
  }

  const path = `cms/${docName}`;
  try {
    const payload = removeUndefined({ items: sanitizedItems, updatedAt: Date.now() });
    await setDoc(doc(db, 'cms', docName), payload);
  } catch (err) {
    console.error(`Error syncing ${docName} to Firestore:`, err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Compresses an image file before reading to Base64 to keep file size optimal.
 */
export function compressImageFile(file: File, maxWidth = 800, maxHeight = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(mimeType, quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
