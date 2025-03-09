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

  const handleAction = (id, action) => {
    axios.post(`/api/authenticate/${id}`, { action, comment: comments[id] })
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
        <div key={requests.id} className="border rounded-xl p-4 shadow-md flex flex-col md:flex-row lg:flex-row gap-4">
            {/* Left: Image Carousel */}
            <div className="w-full md:w-1/3">
                <Carousel
                    responsive={responsive}
                    infinite={true}
                    autoPlay={false}
                    showDots={true}
                    itemClass="w-full h-fit"
                    containerClass="relative"
                >
                    {requests.imageUrls.map((url, index) => (
                    <div key={index} className="flex justify-center">
                        <img
                        src={url}
                        alt={`${requests.item_title} image ${index + 1}`}
                        className="object-cover h-96 w-full"
                        onClick={() => openModal(requests.imageUrls, index)}
                        />
                    </div>
                    ))}
                </Carousel>
            </div>
          
          {/* Middle: Item Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold">{requests.item_title}</h2>
              <p className="text-gray-700">{requests.item_description}</p>
              <span className="text-sm text-gray-500">Category: {requests.category}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">Seller: {requests.seller_id}</span>
              <MessageCircle className="cursor-pointer text-blue-600 hover:text-blue-800" size={20} />
            </div>
          </div>

          {/* Right: Comment Box & Actions */}
          <div className="w-full md:w-1/3 flex flex-col gap-2">
            <div className="justify-between flex">
                <h3 className="text-lg font-semibold">Comments</h3>
                <button className="w-fit text-off-white bg-gray-700 py-1 px-2 cursor-pointer hover:bg-gray-600 rounded">Request 2nd Opinion</button>
            </div>
            <textarea
              className="w-full h-full border rounded p-2"
              placeholder="Add comments..."
              value={comments[requests.id] || ""}
              onChange={(e) => handleCommentChange(requests.id, e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800 w-50"
                onClick={() => handleAction(requests.id, "approve")}
              >Approve</button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800 w-50"
                onClick={() => handleAction(requests.id, "reject")}
              >Reject</button>
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
    </>
  );
};

export default ExpertPendingRequests;
