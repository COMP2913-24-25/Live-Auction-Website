import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function ItemAuthenticationForm() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    user_id: user?.id, // Attach current user ID to the form data
    title: '',
    description: '',
    category: ''
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [fileNames, setFileNames] = useState('No files chosen');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false); // Modal visibiility state

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
        const data = await response.json();
        setCategories(data); // Assuming API returns an array of { id, name }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
  
    if (imageFiles.length >= 6) {
      alert("You can only upload up to 6 images.");
      return;
    }
  
    const validFiles = files.filter(file => file.type.match('image.*') && file.size <= 5 * 1024 * 1024);
  
    if (validFiles.length !== files.length) {
      alert("Some files were invalid (wrong format or size > 5MB). Only valid images were selected.");
    }
  
    const newFiles = validFiles.filter(
      newFile => !imageFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
    );
  
    if (newFiles.length === 0) {
      alert("No new images selected.");
      return;
    }
  
    const totalImages = imageFiles.length + newFiles.length;
    if (totalImages > 6) {
      alert(`You can only upload 6 images. You selected ${totalImages - 6} too many.`);
      newFiles.splice(6 - imageFiles.length); // Keep only enough files to reach 6
    }
  
    setImageFiles(prevFiles => [...prevFiles, ...newFiles]);
    setFileNames(prevNames => {
      const newFileNames = newFiles.map(file => file.name).join(', ');
      return prevNames === 'No files chosen' ? newFileNames : `${prevNames}, ${newFileNames}`;
    });
  
    // Generate image previews
    const previews = newFiles.map(file => {
      const reader = new FileReader();
      return new Promise(resolve => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });
  
    Promise.all(previews).then(newPreviews => {
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    });
  };   

  const removeImage = (index) => {
    setImageFiles(prevFiles => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index);
      setFileNames(updatedFiles.length > 0 ? updatedFiles.map(file => file.name).join(', ') : 'No files chosen');
      return updatedFiles;
    });
  
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));

    // Reset file input field
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = ''; // Reset input so the same file can be reselected
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`User ID: ${user.id}`); // Debugging log
    setShowModal(true); // Show modal on form submission
  };

  const confirmSubmission = async () => {
    setShowModal(false); // Hide modal before submitting

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      imageFiles.forEach(file => submitData.append('images', file));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/authenticate-item`, {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();
      if (response.ok) {
        alert('Auction item created successfully!');
        setFormData({ title: '', description: '', category: '' });
        setImageFiles([]);
        setImagePreviews([]);
        setFileNames('No files chosen');
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className='px-4'>
      <div className="max-w-3xl mx-auto bg-off-white rounded-3xl shadow-lg p-12 mt-8 mb-8">
        <h2 className="text-3xl font-bold text-navy text-center mb-12 relative">
          Item Authentication
          <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-16 h-1 bg-teal"></div>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-charcoal font-medium">Item Name:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 bg-white text-charcoal"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-charcoal font-medium">Item Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 bg-white text-charcoal"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-charcoal font-medium">Category:</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 bg-white text-charcoal"
            >
              <option value="" disabled>Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-charcoal font-medium">Item Images:</label>
            <div className="border-2 border-dashed border-teal/30 rounded-lg p-6 bg-white">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="flex flex-col items-center cursor-pointer">
                <span className="text-teal font-medium">Choose Files</span>
                <span className="text-charcoal/60 text-sm mt-2">{fileNames}</span>
              </label>
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto pb-2">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="relative w-24 h-24 min-h-[100px] overflow-visible">
                    <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg shadow-md" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs flex items-center justify-center w-6 h-6"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <button type="submit" className="cursor-pointer bg-teal text-white px-8 py-3 rounded-full hover:bg-gold transition-colors duration-300 font-semibold shadow-lg hover:shadow-xl">
              REQUEST
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
            <h3 className="text-xl font-semibold text-charcoal">Fee Confirmation</h3>
            <p className="mt-2 text-charcoal">If your request is approved, a fee of 5% of the winning bid will be charged.</p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                className="bg-gray-300 text-charcoal px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-800"
                onClick={confirmSubmission}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemAuthenticationForm;
