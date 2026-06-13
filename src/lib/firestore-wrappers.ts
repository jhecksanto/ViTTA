import { 
  addDoc as firestoreAddDoc, 
  setDoc as firestoreSetDoc, 
  updateDoc as firestoreUpdateDoc,
  Timestamp 
} from 'firebase/firestore';

/**
 * Sanitiza dados recursivamente para evitar erros de serialização no Firestore
 * Remove campos 'undefined'
 */
export const sanitizeData = (data: any): any => {
  if (data === undefined) return null;
  if (data === null) return null;
  if (data instanceof Date) return data;
  if (data instanceof Timestamp) return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeData).filter(item => item !== undefined);
  }
  if (typeof data === 'object') {
    // Check if it's a plain object
    if (data.constructor !== Object && !(data instanceof Timestamp) && !(data instanceof Date)) {
       return data;
    }
    const sanitized: any = {};
    for (const key in data) {
      if (data[key] !== undefined) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }
  return data;
};

/**
 * Wrapper para addDoc com saneamento automático
 */
export const addDoc = (collectionRef: any, data: any) => {
  return firestoreAddDoc(collectionRef, sanitizeData(data));
};

/**
 * Wrapper para setDoc com saneamento automático
 */
export const setDoc = (docRef: any, data: any, options?: any) => {
  if (options && options.merge) {
    return firestoreSetDoc(docRef, sanitizeData(data), options);
  }
  return firestoreSetDoc(docRef, sanitizeData(data));
};

/**
 * Wrapper para updateDoc com saneamento automático
 */
export const updateDoc = (docRef: any, data: any) => {
  return firestoreUpdateDoc(docRef, sanitizeData(data));
};
