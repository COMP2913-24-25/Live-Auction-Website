import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Carousel from 'react-multi-carousel';
import { MessageCircle, X, ArrowLeft, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";

const ExpertDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname === "/reviewed" ? "reviewed" : "pending"
  );
  const [requests, setRequests] = useState([]);
  const [reviewedItems, setReviewedItems] = useState([]); // 添加已审核项目状态
  const [comments, setComments] = useState({});
  const [modal, setModal] = useState({ open: false, images: [], index: 0 });
  const [reallocateModal, setShowModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    // 获取待审核请求
    if (activeTab === "pending") {
      axios.get(`/api/expert/pending/${user.id}`)
        .then(response => {
          const data = Array.isArray(response.data) ? response.data.map(request => ({
            ...request,
            imageUrls: request.image_urls ? request.image_urls.split(",") : []
          })) : [];
          setRequests(data);
        })
        .catch((err) => console.error("Error fetching requests:", err));
    }
    
    // 获取已审核项目
    if (activeTab === "reviewed") {
      axios.get(`/api/expert/reviewed/${user.id}`)
        .then(response => {
          const data = Array.isArray(response.data) ? response.data.map(item => ({
            ...item,
            imageUrls: item.image_urls ? item.image_urls.split(",") : []
          })) : [];
          setReviewedItems(data);
        })
        .catch((err) => console.error("Error fetching reviewed items:", err));
    }
  }, [user?.id, activeTab]);

  const handleCommentChange = (id, value) => {
    setComments({ ...comments, [id]: value });
  };

  const handleReallocate = () => {
    if (selectedRequestId) {
      axios.post(`/api/expert/request-reallocation/${selectedRequestId}`)
        .then(() => {
          setRequests(requests.filter(req => req.id !== selectedRequestId));
          setShowModal(false);
        })
        .catch((err) => console.error("Error reallocating request:", err));
    }
  };

  const handleAction = (id, action) => {
    axios.post(`/api/expert/authenticate/${id}`, { action, comment: comments[id] })
      .then(() => setRequests(requests.filter(req => req.id !== id)))
      .catch((err) => console.error("Error updating status:", err));
  };

  const openModal = (images, index) => setModal({ open: true, images, index });
  const closeModal = () => setModal({ open: false, images: [], index: 0 });
  const nextImage = () => setModal((prev) => ({ ...prev, index: (prev.index + 1) % prev.images.length }));
  const prevImage = () => setModal((prev) => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }));

  const responsive = {
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 640 }, items: 1 },
    mobile: { breakpoint: { max: 640, min: 0 }, items: 1 }
  };

  return (
    <>
      {/* 添加标签切换 */}
      <div className="flex space-x-4 p-4 -mt-16 mb-4">
        <button
          className={`px-4 py-2 rounded-md ${activeTab === "pending" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Requests ({requests.length})
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === "reviewed" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setActiveTab("reviewed")}
        >
          Reviewed Items
        </button>
      </div>

      {/* 待审核请求 */}
      {activeTab === "pending" && (
        <div className="grid grid-cols-1 gap-6 p-4 max-w-5xl">
          {requests.length === 0 ? (
            <div className="text-center p-8">No pending requests</div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="border border-gray-300 border-b-4 border-b-gray-400 rounded-md p-4 shadow-md flex flex-col md:flex-row lg:flex-row gap-4 bg-gray-200">
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
                    {request.imageUrls.map((url, index) => (
                      <div key={index} className="flex justify-center">
                        <img
                          src={url}
                          alt={`${request.item_title} image ${index + 1}`}
                          className="object-contain w-full"
                          onClick={() => openModal(request.imageUrls, index)}
                        />
                      </div>
                    ))}
                  </Carousel>
                </div>
                
                {/* Middle: Item Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-semibold">{request.item_title}</h2>
                    <p className="text-gray-600 pb-5">{request.item_description}</p>
                    <span className="text-sm text-gray-500 font-semibold">Category: {request.category}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xl text-charcoal italic underline">Seller: {request.seller_id}</span>
                    <MessageCircle className="cursor-pointer text-black hover:text-gray-600" size={25} />
                  </div>
                </div>

                {/* Right: Comment Box & Actions */}
                <div className="w-full md:w-1/3 flex flex-col gap-2">
                  <div className="justify-between flex">
                    <h3 className="text-xl text-gray-500 font-semibold">Comments</h3>
                    <button 
                      className="w-fit text-off-white bg-gray-700 py-1 px-2 cursor-pointer hover:bg-gray-600 rounded"
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        setShowModal(true);
                      }}
                    >
                      Request 2nd Opinion
                    </button>
                  </div>
                  <textarea
                    className="w-full h-full p-2 bg-gray-300"
                    placeholder="Please enter any feedback..."
                    value={comments[request.id] || ""}
                    onChange={(e) => handleCommentChange(request.id, e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800 w-full"
                      onClick={() => handleAction(request.id, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800 w-full"
                      onClick={() => handleAction(request.id, "Rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 已审核项目 */}
      {activeTab === "reviewed" && (
        <div className="grid grid-cols-1 gap-6 p-4 max-w-5xl">
          {reviewedItems.length === 0 ? (
            <div className="text-center p-8">No reviewed items</div>
          ) : (
            reviewedItems.map((item) => (
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
                    {item.imageUrls.map((url, index) => (
                      <div key={index} className="flex justify-center">
                        <img
                          src={url}
                          alt={`${item.item_title} image ${index + 1}`}
                          className="object-contain w-full"
                          onClick={() => openModal(item.imageUrls, index)}
                        />
                      </div>
                    ))}
                  </Carousel>
                </div>
                
                {/* Middle: Item Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-semibold">{item.item_title}</h2>
                    <p className="text-gray-600 pb-5">{item.item_description}</p>
                    <span className="text-sm text-gray-500 font-semibold">Category: {item.category}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xl text-charcoal italic underline">Seller: {item.seller_id}</span>
                  </div>
                </div>

                {/* Right: Review Status */}
                <div className="w-full md:w-1/3 flex flex-col gap-2">
                  <h3 className="text-xl text-gray-500 font-semibold">Review Status</h3>
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
            <X size={32} />
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

      {/* Reallocate Confirmation Modal */}
      {reallocateModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
            <h3 className="text-xl font-semibold text-charcoal">Reallocation Confirmation</h3>
            <p className="mt-2 text-charcoal">The item's authentication will be reassigned to another expert. Would you like to proceed?</p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                className="bg-gray-300 text-charcoal px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-gray-800 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700"
                onClick={handleReallocate}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpertDashboard;
