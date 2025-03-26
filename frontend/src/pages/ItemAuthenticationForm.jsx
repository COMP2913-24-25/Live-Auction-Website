import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// 专家分类标签映射
const CATEGORY_LABELS = {
  1: 'Art',
  2: 'Antiques',
  3: 'Jewelry',
  4: 'Clothing',
  5: 'Collectibles',
  6: 'Electronics',
  7: 'Home & Garden',
  8: 'Sports Equipment',
  9: 'Toys & Games',
  10: 'Vehicles',
  11: 'Books',
  12: 'Other'
};

// 专家状态映射
const EXPERT_STATUS = {
  AVAILABLE: 'Available',
  BUSY: 'Busy',
  AWAY: 'Away'
};

function ItemAuthenticationForm() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user_id: user?.id, // Attach current user ID to the form data
    title: '',
    description: '',
    category: '',
    images: []
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [fileNames, setFileNames] = useState('No files chosen');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false); // Modal visibiility state
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [recommendedExperts, setRecommendedExperts] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [isLoadingExperts, setIsLoadingExperts] = useState(false);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("开始获取分类列表...");
        const response = await axios.get('/api/categories');
        console.log("分类API响应:", response.data);
        
        if (response.data && response.data.categories) {
          console.log("获取到分类列表:", response.data.categories);
          setCategories(response.data.categories);
        } else {
          console.error("分类API返回格式不正确:", response.data);
        }
      } catch (error) {
        console.error("获取分类列表失败:", error);
      }
    };

    fetchCategories();
  }, []);

  // 在组件挂载时从URL参数读取数据
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const itemId = params.get('itemId');
    const title = params.get('title');
    const description = params.get('description');
    const categoryId = params.get('category');
    
    if (itemId) {
      setFormData(prev => ({
        ...prev,
        itemId,
        title: title || '',
        description: description || '',
        category: categoryId || ''
      }));
      
      // 直接通过JavaScript设置select元素的值
      setTimeout(() => {
        const selectElement = document.getElementById('category');
        if (selectElement && categoryId) {
          selectElement.value = categoryId;
          console.log('直接设置select值为:', categoryId);
          
          // 如果有categories数据，也设置分类名称显示
          if (categories.length > 0) {
            const foundCategory = categories.find(c => c.id.toString() === categoryId);
            if (foundCategory) {
              setCategoryName(foundCategory.name);
            }
          }
        }
      }, 500);  // 给一点延迟，确保DOM已更新
      
      // 加载商品的完整信息，包括分类
      const fetchItemDetails = async () => {
        setLoading(true);
        try {
          // 获取商品详情
          const itemResponse = await axios.get(`/api/auctions/${itemId}`);
          if (itemResponse.data) {
            const item = itemResponse.data;
            
            console.log("加载到商品详情:", item);
            console.log("当前分类列表:", categories);
            
            // 设置分类信息
            if (item.category_id) {
              // 确保转换为字符串以匹配select选择框的值格式
              const categoryIdStr = item.category_id.toString();
              console.log("商品分类ID:", categoryIdStr);
              
              setFormData(prev => ({
                ...prev, 
                category: categoryIdStr
              }));
              
              // 查找分类名称
              if (categories.length > 0) {
                // 尝试不同格式的匹配
                const foundCategory = categories.find(c => 
                  c.id.toString() === categoryIdStr || 
                  c.id === parseInt(categoryIdStr)
                );
                if (foundCategory) {
                  setCategoryName(foundCategory.name);
                  console.log("找到分类:", foundCategory.name);
                } else {
                  console.log("未找到匹配的分类，有效的分类ID:", categories.map(c => c.id));
                }
              }
            }
          }
        } catch (error) {
          console.error("获取商品详情失败:", error);
        } finally {
          setLoading(false);
        }
      };
      
      if (categories.length > 0) {
        fetchItemDetails();
      }
    }
  }, [location, categories]);

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
    console.log(`User ID: ${user.id}`);
    await fetchRecommendedExperts();
    setShowExpertModal(true);
  };

  const fetchRecommendedExperts = async () => {
    setIsLoadingExperts(true);
    try {
      // 使用固定数据代替API调用
      const mockExperts = [
        {
          id: 2,
          username: "expert1",
          display_name: "expert1",
          specializations: [1, 5, 9], // Art, Collectibles, Toys & Games
          specializationNames: ["艺术品", "收藏品", "玩具与游戏"],
          status: "Available"
        },
        {
          id: 3, 
          username: "expert2",
          display_name: "expert2",
          specializations: [2, 3, 7], // Antiques, Jewelry, Home & Garden
          specializationNames: ["古董", "珠宝", "家居园艺"],
          status: "Busy"
        }
      ];
      
      console.log("模拟专家数据:", mockExperts);
      
      // 找出与当前分类匹配的专家
      let filteredExperts = mockExperts;
      
      // 获取当前选择的分类名称以显示在模态框中
      if (formData.category) {
        const categoryId = parseInt(formData.category);
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          setCategoryName(category.name);
        }
        
        // 按照原来的逻辑筛选专家
        filteredExperts = mockExperts
          .filter(expert => expert.specializations && expert.specializations.includes(categoryId))
          .sort((a, b) => {
            // 首先按状态排序
            if (a.status === EXPERT_STATUS.AVAILABLE && b.status !== EXPERT_STATUS.AVAILABLE) return -1;
            if (a.status !== EXPERT_STATUS.AVAILABLE && b.status === EXPERT_STATUS.AVAILABLE) return 1;
            if (a.status === EXPERT_STATUS.BUSY && b.status === EXPERT_STATUS.AWAY) return -1;
            if (a.status === EXPERT_STATUS.AWAY && b.status === EXPERT_STATUS.BUSY) return 1;
            
            // 状态相同的情况下，按标签匹配数量排序
            const aMatchCount = a.specializations.filter(s => s === categoryId).length;
            const bMatchCount = b.specializations.filter(s => s === categoryId).length;
            return bMatchCount - aMatchCount;
          });
        
        // 如果没有匹配的专家，显示所有专家并按状态排序
        if (filteredExperts.length === 0) {
          console.log("没有找到完全匹配的专家，显示所有专家");
          filteredExperts = mockExperts.sort((a, b) => {
            if (a.status === EXPERT_STATUS.AVAILABLE && b.status !== EXPERT_STATUS.AVAILABLE) return -1;
            if (a.status !== EXPERT_STATUS.AVAILABLE && b.status === EXPERT_STATUS.AVAILABLE) return 1;
            if (a.status === EXPERT_STATUS.BUSY && b.status === EXPERT_STATUS.AWAY) return -1;
            if (a.status === EXPERT_STATUS.AWAY && b.status === EXPERT_STATUS.BUSY) return 1;
            return 0;
          });
        }
      }
      
      // 只选择前3名专家
      setRecommendedExperts(filteredExperts.slice(0, 3));
      
      // 默认选择第一个专家
      if (filteredExperts.length > 0) {
        setSelectedExpert(filteredExperts[0].id);
      }
    } catch (error) {
      console.error("处理专家数据失败:", error);
      alert("无法获取专家列表，请重试");
    } finally {
      setIsLoadingExperts(false);
    }
  };

  const confirmSubmission = async () => {
    setShowModal(false);
    setShowExpertModal(false);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      imageFiles.forEach(file => submitData.append('images', file));

      // 确保用户ID正确添加到请求中
      if (user && user.id) {
        submitData.append('user_id', user.id);
      }
      
      // 添加选中的专家ID
      if (selectedExpert) {
        submitData.append('expert_id', selectedExpert);
      }
      
      // 添加令牌用于认证
      let token = null;
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        token = userData?.token;
      } catch (e) {
        console.error('解析用户数据失败:', e);
      }

      const response = await fetch(
        `/api/authentication/request`,
        {
          method: 'POST',
          body: submitData,
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert('Authentication request submitted successfully!');
        setFormData({ title: '', description: '', category: '' });
        setImageFiles([]);
        setImagePreviews([]);
        setFileNames('No files chosen');
        navigate('/');  // 成功后跳转到首页
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

  const handleExpertSelect = (expertId) => {
    setSelectedExpert(expertId);
  };

  const confirmExpertSelection = () => {
    setShowExpertModal(false);
    setShowModal(true); // 显示最终的确认模态窗口
  };

  return (
    <div className='px-4'>
      {loading ? (
        <div className="flex justify-center items-center h-16">
          <p>正在加载商品信息...</p>
        </div>
      ) : null}
      
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
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-charcoal font-medium">Item Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded h-40"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-charcoal font-medium">Category:</label>
            <select
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option 
                  key={cat.id} 
                  value={cat.id.toString()}
                  selected={formData.category === cat.id.toString()}
                >
                  {cat.name}
                </option>
              ))}
            </select>
            {categoryName && (
              <p className="text-sm text-teal-600 mt-1">Selected category: {categoryName}</p>
            )}
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

      {/* Expert Recommendation Modal */}
      {showExpertModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-center mb-4">AI Recommended Experts</h3>
            <p className="text-gray-600 mb-4">
              Based on your item's category "{categoryName}", we recommend these authentication experts:
            </p>
            
            {isLoadingExperts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {recommendedExperts.map(expert => (
                  <div 
                    key={expert.id}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedExpert === expert.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
                    }`}
                    onClick={() => handleExpertSelect(expert.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center mr-3">
                        {expert.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium">{expert.username}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {expert.specializations && expert.specializations.map((specId, index) => (
                            <span 
                              key={specId} 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {expert.specializationNames ? expert.specializationNames[index] : CATEGORY_LABELS[specId]}
                            </span>
                          ))}
                        </div>
                        <p className={`text-xs mt-1 font-medium ${
                          expert.status === EXPERT_STATUS.AVAILABLE 
                            ? 'text-green-600' 
                            : expert.status === EXPERT_STATUS.BUSY 
                              ? 'text-orange-500' 
                              : 'text-red-500'
                        }`}>
                          {expert.status}
                        </p>
                      </div>
                      {selectedExpert === expert.id && (
                        <div className="ml-auto">
                          <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                onClick={() => setShowExpertModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-300"
                onClick={confirmExpertSelection}
                disabled={!selectedExpert || isLoadingExperts}
              >
                Continue with Selected Expert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemAuthenticationForm;
