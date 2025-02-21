import { useState } from 'react';

function AuthenticationForm() {
  const [formData, setFormData] = useState({
    item_id: '',
    description: '',
    supporting_documents: null
  });
  
  const [fileName, setFileName] = useState('No file chosen');
  const [filePreview, setFilePreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        supporting_documents: file
      }));
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      const response = await fetch('http://localhost:5001/api/authentication-requests', {
        method: 'POST',
        body: submitData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Authentication request submitted successfully!');
        setFormData({
          item_id: '',
          description: '',
          supporting_documents: null
        });
        setFileName('No file chosen');
      } else {
        throw new Error(data.error || `Submission failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-3xl mx-auto bg-off-white rounded-3xl shadow-lg p-12 mt-8">
      <h2 className="text-3xl font-bold text-navy text-center mb-12 relative">
        Request Authentication
        <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-16 h-1 bg-teal"></div>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-charcoal font-medium">Item ID:</label>
          <input
            type="text"
            name="item_id"
            value={formData.item_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 bg-white text-charcoal"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-charcoal font-medium">Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 bg-white text-charcoal"
            placeholder="Please describe why you need authentication for this item..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-charcoal font-medium">Supporting Documents:</label>
          <div className="border-2 border-dashed border-teal/30 rounded-lg p-6 bg-white">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
              className="hidden"
              id="document-upload"
            />
            <label 
              htmlFor="document-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="text-teal font-medium">Choose File</span>
              <span className="text-charcoal/60 text-sm mt-2">{fileName}</span>
            </label>
          </div>
        </div>

        <div className="text-center mt-8">
          <button 
            type="submit" 
            className="bg-teal text-white px-8 py-3 rounded-full hover:bg-gold transition-colors duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}

export default AuthenticationForm; 