import { useCallback } from 'react';
import { useGlobalLoading } from '../contexts/GlobalLoadingContext';
import { withGlobalLoading, apiPresets, handleFormSubmission } from '../utils/apiHandler';

// Custom hook để sử dụng API calls với global loading
export const useApiCall = () => {
  const globalLoading = useGlobalLoading();

  // Hàm để tạo API call với custom options
  const createCall = useCallback((apiFunction, options = {}) => {
    return withGlobalLoading(apiFunction, options);
  }, []);

  // Các preset sẵn có
  const call = {
    // Tải dữ liệu với auto retry
    loading: (apiFunction) => apiPresets.loading(apiFunction),
    
    // Lưu dữ liệu
    saving: (apiFunction) => apiPresets.saving(apiFunction),
    
    // Xóa dữ liệu
    deleting: (apiFunction) => apiPresets.deleting(apiFunction),
    
    // Upload file
    uploading: (apiFunction) => apiPresets.uploading(apiFunction),
    
    // Kết nối service
    connecting: (apiFunction) => apiPresets.connecting(apiFunction),
    
    // Custom call
    custom: createCall
  };

  // Hàm xử lý form submission
  const submitForm = useCallback(async (submitFunction, options = {}) => {
    return await handleFormSubmission(submitFunction, options);
  }, []);

  // Hàm thực hiện action với loading thủ công
  const executeWithLoading = useCallback(async (
    asyncFunction, 
    loadingText = 'Đang xử lý...', 
    type = 'default'
  ) => {
    try {
      globalLoading.showLoading(loadingText, type);
      const result = await asyncFunction();
      return result;
    } finally {
      globalLoading.hideLoading();
    }
  }, [globalLoading]);

  return {
    call,
    submitForm,
    executeWithLoading,
    // Expose global loading methods
    showLoading: globalLoading.showLoading,
    hideLoading: globalLoading.hideLoading,
    showErrorLoading: globalLoading.showErrorLoading,
    showWarningLoading: globalLoading.showWarningLoading
  };
};

export default useApiCall; 