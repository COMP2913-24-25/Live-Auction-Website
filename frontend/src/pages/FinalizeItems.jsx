import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import axios from "axios";
import Carousel from 'react-multi-carousel';
import { MessageCircle, ArrowLeft, ArrowRight } from "lucide-react";

const FinalizedItems = () => {
  const { user } = useAuth();
  const [finalizedItems, setFinalizedItems] = useState([]);
  const [modal, setModal] = useState({ open: false, images: [], index: 0 });

  useEffect(() => {
    // Fetch finalized items data
    axios.get(`/api/finalize-listing/${user.id}`)
      .then(response => {
        const request = response.data.map(item => ({
          ...item,
          item_images: item.item_images ? item.item_images.split(',') : [] // Ensure item_images is always an array
        }));
        setFinalizedItems(request);
      })
      .catch((err) => console.error("Error fetching finalized items:", err));
  }, [user?.id]);

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
  
  const handleFinalizeItem = (itemId, min_price, duration) => {
    axios
      .post(`/api/finalize-listing/${itemId}/finalize`, { min_price, duration })
      .then((response) => {
        alert(response.data.message); // Success message from the backend
      })
      .catch((error) => {
        console.error("Error finalizing item:", error);
        alert(error.response?.data?.error || "An error occurred while finalizing the item.");
      });
  };  

  const responsive = {
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 640 }, items: 1 },
    mobile: { breakpoint: { max: 640, min: 0 }, items: 1 }
  };

  return (
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

      {/* Full-Screen Modal for Images */}
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
    </div>
  );
};

export default FinalizedItems;
