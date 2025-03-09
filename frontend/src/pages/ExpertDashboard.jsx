import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Carousel from 'react-multi-carousel';
import { MessageCircle, X, ArrowLeft, ArrowRight } from "lucide-react";

const ExpertPendingRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [comments, setComments] = useState({});
  const [modal, setModal] = useState({ open: false, images: [], index: 0 });
  const [reallocateModal, setShowModal] = useState(false); // Modal visibiility state
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
      axios.get(`/api/expert/pending/${user.id}`)
        .then(response => {
            const data = Array.isArray(response.data) ? response.data.map(requests => ({
                ...requests,
                imageUrls: requests.image_urls.split(",")
            })) : [];
        setRequests(data);
        })
        .catch((err) => console.error("Error fetching requests:", err));
  }, [user?.id]);

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
    <div className="text-3xl p-4">Pending Requests ({requests.length})</div>
    <div className="grid grid-cols-1 gap-6 p-4 max-w-5xl">
      {requests.map((requests) => (
        <div key={requests.id} className="border border-gray-300 border-b-4 border-b-gray-400 rounded-md p-4 shadow-md flex flex-col md:flex-row lg:flex-row gap-4 bg-gray-200">
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
                    {requests.imageUrls.map((url, index) => (
                        <div key={index} className="flex justify-center">
                            <img
                                src={url}
                                alt={`${requests.item_title} image ${index + 1}`}
                                className="object-contain w-full"
                                onClick={() => openModal(requests.imageUrls, index)}
                            />
                        </div>
                    ))}
                </Carousel>
            </div>
          
          {/* Middle: Item Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-semibold">{requests.item_title}</h2>
              <p className="text-gray-600 pb-5">{requests.item_description}</p>
              <span className="text-sm text-gray-500 font-semibold">Category: {requests.category}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xl text-charcoal italic underline">Seller: {requests.seller_id}</span>
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
                    setSelectedRequestId(requests.id);
                    setShowModal(true);
                  }}
                >
                    Request 2nd Opinion
                </button>
            </div>
            <textarea
              className="w-full h-full p-2 bg-gray-300"
              placeholder="Please enter any feedback..."
              value={comments[requests.id] || ""}
              onChange={(e) => handleCommentChange(requests.id, e.target.value)}
            />
            <div className="flex gap-2">
                <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800 w-full"
                    onClick={() => handleAction(requests.id, "Approved")}
                >
                    Approve
                </button>
                <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800 w-full"
                    onClick={() => handleAction(requests.id, "Rejected")}
                >
                    Reject
                </button>
            </div>
          </div>
        </div>
      ))}
    </div>

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

export default ExpertPendingRequests;
