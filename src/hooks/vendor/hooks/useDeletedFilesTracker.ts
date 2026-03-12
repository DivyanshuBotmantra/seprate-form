/**
 * Custom hook for tracking deleted files
 * Manages a list of files that have been marked for deletion but not yet deleted from storage
 */

import { useState, useCallback } from 'react';

export interface DeletedFileInfo {
  fieldKey: string;        // Form field key (e.g., "pan_attachment")
  fileName: string;        // File name
  fileType: string;        // File MIME type
  fileUrl: string;         // File URL
  formFieldName?: string;  // Form field name for mapping (e.g., "panNumberFile")
}

export const useDeletedFilesTracker = () => {
  const [deletedFilesList, setDeletedFilesList] = useState<DeletedFileInfo[]>([]);

  /**
   * Add a file to the deleted files list
   */
  const addDeletedFile = useCallback((fileInfo: DeletedFileInfo) => {
    console.log('🗑️ Adding file to deleted list:', fileInfo);
    setDeletedFilesList(prev => {
      // Check if file is already in the list to avoid duplicates
      const exists = prev.some(file => 
        file.fieldKey === fileInfo.fieldKey && file.fileUrl === fileInfo.fileUrl
      );
      
      if (exists) {
        console.log('⚠️ File already in deleted list, skipping:', fileInfo.fieldKey);
        return prev;
      }
      
      const newList = [...prev, fileInfo];
      console.log('📝 Updated deleted files list:', newList);
      return newList;
    });
  }, []);

  /**
   * Remove a file from the deleted files list
   */
  const removeDeletedFile = useCallback((fieldKey: string) => {
    console.log('🔄 Removing file from deleted list:', fieldKey);
    setDeletedFilesList(prev => {
      const newList = prev.filter(file => file.fieldKey !== fieldKey);
      console.log('📝 Updated deleted files list after removal:', newList);
      return newList;
    });
  }, []);

  /**
   * Clear all deleted files from the list
   */
  const clearDeletedFiles = useCallback(() => {
    console.log('🧹 Clearing all deleted files from list');
    setDeletedFilesList([]);
  }, []);

  /**
   * Check if a file is in the deleted list
   */
  const isFileDeleted = useCallback((fieldKey: string): boolean => {
    return deletedFilesList.some(file => file.fieldKey === fieldKey);
  }, [deletedFilesList]);

  /**
   * Get deleted files count
   */
  const getDeletedFilesCount = useCallback((): number => {
    return deletedFilesList.length;
  }, [deletedFilesList]);

  /**
   * Get all deleted files
   */
  const getDeletedFiles = useCallback((): DeletedFileInfo[] => {
    return [...deletedFilesList];
  }, [deletedFilesList]);

  /**
   * Get deleted files by form field name
   */
  const getDeletedFilesByFormField = useCallback((formFieldName: string): DeletedFileInfo[] => {
    return deletedFilesList.filter(file => file.formFieldName === formFieldName);
  }, [deletedFilesList]);

  return {
    deletedFilesList,
    addDeletedFile,
    removeDeletedFile,
    clearDeletedFiles,
    isFileDeleted,
    getDeletedFilesCount,
    getDeletedFiles,
    getDeletedFilesByFormField,
  };
};
