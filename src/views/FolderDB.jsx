export const saveFolderHandle = async (dirHandle) => {
    const db = await window.indexedDB.open("FolderDB", 1);
  
    db.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("folders")) {
        db.createObjectStore("folders");
      }
    };
  
    db.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction("folders", "readwrite");
      const store = tx.objectStore("folders");
      store.put(dirHandle, "mainFolder");
      tx.oncomplete = () => {
        db.close();
      };
    };
  };
  
  export const getFolderHandle = () => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open("FolderDB", 1);
  
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("folders", "readonly");
        const store = tx.objectStore("folders");
        const getRequest = store.get("mainFolder");
  
        getRequest.onsuccess = () => {
          resolve(getRequest.result);
          db.close();
        };
  
        getRequest.onerror = () => {
          reject("Failed to retrieve folder handle");
          db.close();
        };
      };
  
      request.onerror = () => {
        reject("IndexedDB open failed");
      };
    });
  };
  
  