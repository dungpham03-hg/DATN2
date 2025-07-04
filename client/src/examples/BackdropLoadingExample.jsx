import React from 'react';
import useApiCall from '../hooks/useApiCall';

const BackdropLoadingExample = () => {
  const { call, submitForm, executeWithLoading } = useApiCall();

  // Demo: API call thành công
  const handleSuccessCall = async () => {
    const apiCall = call.loading(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { data: 'Success!' };
    });

    try {
      const result = await apiCall();
      console.log('Result:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Demo: API call lỗi server
  const handleServerErrorCall = async () => {
    const apiCall = call.loading(async () => {
      throw {
        response: { status: 500 },
        message: 'Server Error'
      };
    });

    try {
      await apiCall();
    } catch (error) {
      console.error('Server error handled:', error);
    }
  };

  // Demo: Form submission
  const handleFormSubmit = async () => {
    try {
      await submitForm(async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: true };
      }, {
        loadingText: 'Đang lưu thông tin...',
        successMessage: 'Lưu thành công!'
      });
    } catch (error) {
      console.error('Form error:', error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Demo Hệ Thống Backdrop Loading</h1>
      
      <button onClick={handleSuccessCall} style={{ margin: '10px', padding: '10px' }}>
        API Call Thành Công
      </button>
      
      <button onClick={handleServerErrorCall} style={{ margin: '10px', padding: '10px' }}>
        API Call Lỗi Server
      </button>
      
      <button onClick={handleFormSubmit} style={{ margin: '10px', padding: '10px' }}>
        Form Submission
      </button>
    </div>
  );
};

export default BackdropLoadingExample; 