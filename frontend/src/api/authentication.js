export const submitAuthRequest = async (itemId) => {
  try {
    const response = await fetch('/api/authentication/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId }),
    });
    return await response.json();
  } catch (error) {
    throw error;
  }
}; 