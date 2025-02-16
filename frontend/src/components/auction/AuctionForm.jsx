import { useState } from 'react';

function AuctionForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starting_price: '',
    min_increment: '',
    start_time: '',
    end_time: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.match('image.*')) {
        alert('Please select an image file (jpg, png, gif)');
        return;
      }
      // 验证文件大小 (最大 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setFileName(file.name);
      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 创建FormData对象来发送文件
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const response = await fetch('http://localhost:5001/api/auctions', {
        method: 'POST',
        body: submitData // 不需要设置 Content-Type，浏览器会自动设置
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Auction item created successfully!');
        setFormData({
          title: '',
          description: '',
          starting_price: '',
          min_increment: '',
          start_time: '',
          end_time: ''
        });
        setImageFile(null);
        setImagePreview(null);
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
        Create a new auction
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
          <label className="block text-charcoal font-medium">Item Image:</label>
          <div className="border-2 border-dashed border-teal/30 rounded-lg p-6 bg-white">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
              className="hidden"
              id="image-upload"
            />
            <label 
              htmlFor="image-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="text-teal font-medium">Choose File</span>
              <span className="text-charcoal/60 text-sm mt-2">{fileName}</span>
            </label>
          </div>
          {imagePreview && (
            <div className="mt-4">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-lg mx-auto shadow-md"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-charcoal font-medium">Upset Price:</label>
            <input
              type="number"
              name="starting_price"
              value={formData.starting_price}
              onChange={handleChange}
              min="0"
              step="1000"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 bg-white text-charcoal"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-charcoal font-medium">Minimum Price Increase:</label>
            <input
              type="number"
              name="min_increment"
              value={formData.min_increment}
              onChange={handleChange}
              min="0"
              step="100"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 bg-white text-charcoal"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-charcoal font-medium">Start Time:</label>
            <div className="relative">
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 bg-white text-charcoal [color-scheme:light]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-teal">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-charcoal font-medium">End Time:</label>
            <div className="relative">
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 bg-white text-charcoal [color-scheme:light]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-teal">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button 
            type="submit" 
            className="bg-teal text-white px-8 py-3 rounded-full hover:bg-gold transition-colors duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Create auction
          </button>
        </div>
      </form>
    </div>
  );
}

export default AuctionForm; 