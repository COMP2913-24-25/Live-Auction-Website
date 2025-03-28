import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import axios from "axios";
import Carousel from 'react-multi-carousel';
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const FinalizeItems = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.pathname === "/finalized-items" ? "finalized" : "past");
  const [finalizedItems, setFinalizedItems] = useState([]);
  const [pastItems, setPastItems] = useState([]);  // To store past items
  const [modal, setModal] = useState({ open: false, images: [], index: 0 });

  const fetchItems = () => {
    axios.get(`/api/finalize-listing/${user.id}`)
      .then(response => {
        setFinalizedItems(response.data.map(item => ({
          ...item,
          item_images: item.item_images ? item.item_images.split(',') : []
        })));
      })
      .catch(err => console.error("Error fetching finalized items:", err));
  
    axios.get(`/api/finalize-listing/${user.id}/past-items`)
      .then(response => {
        setPastItems(response.data.map(item => ({
          ...item,
          item_images: item.item_images ? item.item_images.split(',') : []
        })));
      })
      .catch(err => console.error("Error fetching past finalized items:", err));
  };
  
  useEffect(() => {
    fetchItems();  // Fetch items immediately on mount
  }, [user?.id]);
  
  useEffect(() => {
    fetchItems();  // Fetch items when switching tabs
  }, [activeTab]);  

  const openModal = (images, index) => setModal({ open: true, images, index });
  const closeModal = () => setModal({ open: false, images: [], index: 0 });
  const nextImage = () => setModal((prev) => ({ ...prev, index: (prev.index + 1) % prev.images.length }));
  const prevImage = () => setModal((prev) => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }));

  const handleInputChange = (e, itemId, field) => {
    let value = e.target.value;
  
    // If the field is duration, ensure the value is between 1 and 5
    if (field === "duration") {
      value = Math.max(1, Math.min(5, value));  // Ensure the value is between 1 and 5
    }
  
    setFinalizedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleFinalizeItem = (id, minPrice, duration) => {
    axios.post(`/api/finalize-listing/${id}/finalize`, { min_price: minPrice, duration: duration })
      .then(() => {
        // Filter out the newly listed item from finalizedItems
        setFinalizedItems(prevItems => prevItems.filter(item => item.id !== id));
        
        // Optionally, add the item to pastItems if needed
        axios.get(`/api/finalize-listing/${user.id}/past-items`).then(response => {
          setPastItems(response.data.map(item => ({
            ...item,
            item_images: item.item_images ? item.item_images.split(',') : []
          })));
        });
      })
      .catch(err => console.error("Error finalizing item:", err));
  };  

  const responsive = {
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 640 }, items: 1 },
    mobile: { breakpoint: { max: 640, min: 0 }, items: 1 }
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="flex space-x-4 p-4 -mt-16 mb-4">
        <button
          className={`px-4 py-2 rounded-md ${activeTab === "finalized" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setActiveTab("finalized")}
        >
          Finalized Items ({finalizedItems.length})
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === "past" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setActiveTab("past")}
        >
          Past Items ({pastItems.length})
        </button>
      </div>

      {/* Finalized Items */}
      {activeTab === "finalized" && (
        <div className="grid grid-cols-1 gap-6 p-4 max-w-5xl">
          {finalizedItems.length === 0 ? (
            <div className="text-center p-8">No finalized items</div>
          ) : (
            finalizedItems.map((item) => (
                <div key={item.id} className="border border-gray-300 border-b-4 border-b-gray-400 rounded-md p-4 shadow-md flex flex-col md:flex-row lg:flex-row gap-4 bg-gray-200">
                    {/* Left: Image Carousel */}
                    <div className="w-full md:w-1/3 h-fit">
                        <Carousel
                        responsive={responsive}
                        infinite={true}
                        autoPlay={false}
                        showDots={true}
                        itemClass="w-full h-60 flex items-center justify-center bg-black"
                        containerClass="relative"
                        >
                        {item.item_images.map((url, index) => (
                            <div key={index} className="flex justify-center">
                            <img
                                src={url}
                                alt={`${item.item_title} image ${index + 1}`}
                                className="object-contain w-full"
                                onClick={() => openModal(item.item_images, index)}
                            />
                            </div>
                        ))}
                        </Carousel>
                    </div>
    
                    {/* Middle: Item Details with Duration and Min Price */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h2 className="text-3xl font-semibold">{item.item_title}</h2>
                            <p className="text-gray-600 pb-5">{item.item_description}</p>
                            <span className="text-sm text-gray-500 font-semibold">Category: {item.category}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 w-full">
                            <div className="flex gap-4 w-full lg:flex-col md:flex-row">
                            <input
                                type="number"
                                placeholder="Duration (1-5 days)"
                                min="1"
                                max="5"
                                className="w-full p-2 border border-gray-600 rounded-md"
                                value={item.duration || ""}
                                onChange={(e) => handleInputChange(e, item.id, "duration")}
                            />
                            <input
                                type="number"
                                placeholder="Min Price"
                                className="w-full p-2 border border-gray-600 rounded-md"
                                value={item.min_price || ""}
                                onChange={(e) => handleInputChange(e, item.id, "min_price")}
                            />
                            </div>
                        </div>
                    </div>
    
                    {/* Right: Expert's Comment and 'List Item' Button */}
                    <div className="w-full md:w-1/3 flex flex-col gap-2 justify-between">
                    <div className="flex justify-between">
                        <h3 className="text-xl text-gray-500 font-semibold">Expert's Comment:</h3>
                    </div>
                    <div className={`p-3 rounded-md ${
                        item.authentication_status === 'Approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                        <p className="font-bold">{item.authentication_status}</p>
                        <p className="text-sm mt-2">Your comment:</p>
                        <p className="italic">{item.comments || "No comment provided"}</p>
                        <p className="text-sm mt-2">Review date:</p>
                        <p>{new Date(item.decision_timestamp).toLocaleDateString()}</p>
                    </div>
                    
                    {/* Ensure button is at the bottom */}
                    <div className="mt-auto">
                        <button
                            className="bg-navy text-white px-4 py-2 rounded hover:bg-navy/50 w-full mt-2 cursor-pointer"
                            onClick={() => handleFinalizeItem(item.id, item.min_price, item.duration)} // Trigger the finalize API
                        >
                        List Item
                        </button>
                    </div>
                    </div>
                </div>
            ))
          )}
        </div>
      )}

      {/* Past Items */}
      {activeTab === "past" && (
        <div className="grid grid-cols-1 gap-6 p-4 max-w-3xl">
          {pastItems.length === 0 ? (
            <div className="text-center p-8">No past items</div>
          ) : (
            pastItems.map((item) => (
              <div key={item.id} className="border border-gray-300 border-b-4 border-b-gray-400 rounded-md p-4 shadow-md flex flex-col md:flex-row lg:flex-row gap-4 bg-gray-200">
                {/* Left: Image Carousel */}
                <div className="w-full md:w-1/3 h-fit">
                  <Carousel
                    responsive={responsive}
                    infinite={true}
                    autoPlay={false}
                    showDots={true}
                    itemClass="w-full h-60 flex items-center justify-center bg-black"
                    containerClass="relative"
                  >
                    {item.item_images.map((url, index) => (
                      <div key={index} className="flex justify-center">
                        <img
                          src={url}
                          alt={`${item.item_title} image ${index + 1}`}
                          className="object-contain w-full"
                          onClick={() => openModal(item.item_images, index)}
                        />
                      </div>
                    ))}
                  </Carousel>
                </div>

                {/* Right: Item Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 
                        className="text-3xl font-semibold cursor-pointer" 
                        onClick={(e) => { navigate(`/auctions/${item.id}`); }}
                    >{item.item_title}</h2>
                    <p className="text-gray-600 pb-5">{item.item_description}</p>
                    <span className="text-sm text-gray-500 font-semibold">Category: {item.category}</span>
                  </div>

                    {/* Auction Status - Aligned to the bottom in its own bordered box */}
                    <div className="mt-auto border-2 rounded border-gray-400 p-1 text-center">
                        <h3 className="text-lg font-semibold">{item.auction_status}</h3>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Full-Screen Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
          <button className="absolute top-4 right-4 text-white text-2xl" onClick={closeModal}>
            <ArrowLeft size={32} />
          </button>
          <button className="absolute left-4 text-white text-2xl" onClick={prevImage}>
            <ArrowLeft size={40} />
          </button>
          <img src={modal.images[modal.index]} alt="Full view" className="max-h-[90vh] max-w-[90vw] object-contain" />
          <button className="absolute right-4 text-white text-2xl" onClick={nextImage}>
            <ArrowRight size={40} />
          </button>
        </div>
      )}
    </>
  );
};

export default FinalizeItems;
